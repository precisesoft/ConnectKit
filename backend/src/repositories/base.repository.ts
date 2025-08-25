import { Pool, PoolClient } from 'pg';
import { databaseConnection } from '../config/database.config';
import { logger } from '../utils/logger';
import { DatabaseError, NotFoundError } from '../utils/errors';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export abstract class BaseRepository<T> {
  protected pool: Pool;
  protected tableName: string;
  protected primaryKey: string;

  constructor(tableName: string, primaryKey: string = 'id') {
    this.pool = databaseConnection.getPool();
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Execute a query with error handling and logging
   */
  protected async executeQuery(
    query: string,
    params: any[] = [],
    client?: PoolClient
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const executor = client || this.pool;
      const result = await executor.query(query, params);

      const duration = Date.now() - startTime;
      logger.logDatabase(query, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabase(query, duration, error as Error);
      throw new DatabaseError('Database query failed', {
        query: query.substring(0, 200),
        error: (error as Error).message,
      });
    }
  }

  /**
   * Execute a transaction
   */
  protected async executeTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Build WHERE clause from filters
   */
  protected buildWhereClause(
    filters: Record<string, any>,
    paramOffset: number = 0
  ): { whereClause: string; params: any[]; paramCount: number } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = paramOffset;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        paramCount++;

        if (Array.isArray(value)) {
          // Handle IN clauses
          const placeholders = value
            .map((_, index) => `$${paramCount + index}`)
            .join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
          paramCount += value.length - 1;
        } else if (typeof value === 'string' && value.includes('%')) {
          // Handle LIKE queries
          conditions.push(`${key} ILIKE $${paramCount}`);
          params.push(value);
        } else {
          // Handle exact matches
          conditions.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params, paramCount };
  }

  /**
   * Build ORDER BY clause
   */
  protected buildOrderByClause(
    sort?: string,
    order: 'ASC' | 'DESC' = 'DESC'
  ): string {
    if (!sort) {
      return `ORDER BY created_at ${order}`;
    }

    // Validate sort field to prevent SQL injection
    const allowedSortFields = this.getAllowedSortFields();
    if (!allowedSortFields.includes(sort)) {
      throw new Error(`Invalid sort field: ${sort}`);
    }

    return `ORDER BY ${sort} ${order}`;
  }

  /**
   * Get allowed sort fields (to be overridden by child classes)
   */
  protected abstract getAllowedSortFields(): string[];

  /**
   * Map database row to entity (to be implemented by child classes)
   */
  protected abstract mapRowToEntity(row: any): T;

  /**
   * Map entity to database row (to be implemented by child classes)
   */
  protected abstract mapEntityToRow(entity: T): any;

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE ${this.primaryKey} = $1 AND deleted_at IS NULL
    `;

    const result = await this.executeQuery(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Find by ID or throw error if not found
   */
  async findByIdOrFail(id: string): Promise<T> {
    const entity = await this.findById(id);

    if (!entity) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }

    return entity;
  }

  /**
   * Find all with optional filters and pagination
   */
  async findAll(options: QueryOptions = {}): Promise<PaginationResult<T>> {
    const {
      limit = 10,
      offset = 0,
      sort,
      order = 'DESC',
      filters = {},
    } = options;

    // Add deleted_at filter
    const allFilters = { ...filters, deleted_at: null };

    const { whereClause, params } = this.buildWhereClause(allFilters);
    const orderByClause = this.buildOrderByClause(sort, order);

    // Count query
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await this.executeQuery(dataQuery, [
      ...params,
      limit,
      offset,
    ]);
    const items = dataResult.rows.map((row: any) => this.mapRowToEntity(row));

    // Calculate pagination metadata
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Find one by filters
   */
  async findOne(filters: Record<string, any>): Promise<T | null> {
    const allFilters = { ...filters, deleted_at: null };
    const { whereClause, params } = this.buildWhereClause(allFilters);

    const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
    const result = await this.executeQuery(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Check if entity exists
   */
  async exists(filters: Record<string, any>): Promise<boolean> {
    const allFilters = { ...filters, deleted_at: null };
    const { whereClause, params } = this.buildWhereClause(allFilters);

    const query = `SELECT 1 FROM ${this.tableName} ${whereClause} LIMIT 1`;
    const result = await this.executeQuery(query, params);

    return result.rows.length > 0;
  }

  /**
   * Create new entity
   */
  async create(entity: T): Promise<T> {
    const row = this.mapEntityToRow(entity);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Update entity by ID
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const row = this.mapEntityToRow(updates as T);
    const entries = Object.entries(row).filter(
      ([key, value]) => value !== undefined
    );

    if (entries.length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = entries.map(([, value]) => value);
    values.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE ${this.primaryKey} = $${values.length} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Soft delete entity by ID
   */
  async softDelete(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE ${this.primaryKey} = $1 AND deleted_at IS NULL
    `;

    const result = await this.executeQuery(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
  }

  /**
   * Restore soft deleted entity
   */
  async restore(id: string): Promise<T> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NULL, updated_at = NOW()
      WHERE ${this.primaryKey} = $1 AND deleted_at IS NOT NULL
      RETURNING *
    `;

    const result = await this.executeQuery(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError(
        `Deleted ${this.tableName} with id ${id} not found`
      );
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * Hard delete entity by ID
   */
  async hardDelete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await this.executeQuery(query, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
  }

  /**
   * Count entities with optional filters
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    const allFilters = { ...filters, deleted_at: null };
    const { whereClause, params } = this.buildWhereClause(allFilters);

    const query = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const result = await this.executeQuery(query, params);

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(entities: T[]): Promise<T[]> {
    if (entities.length === 0) {
      return [];
    }

    return await this.executeTransaction(async client => {
      const results: T[] = [];

      for (const entity of entities) {
        const row = this.mapEntityToRow(entity);
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values
          .map((_, index) => `$${index + 1}`)
          .join(', ');

        const query = `
          INSERT INTO ${this.tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;

        const result = await this.executeQuery(query, values, client);
        results.push(this.mapRowToEntity(result.rows[0]));
      }

      return results;
    });
  }

  /**
   * Bulk update entities
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<T[]> {
    if (updates.length === 0) {
      return [];
    }

    return await this.executeTransaction(async client => {
      const results: T[] = [];

      for (const { id, data } of updates) {
        const row = this.mapEntityToRow(data as T);
        const entries = Object.entries(row).filter(
          ([key, value]) => value !== undefined
        );

        if (entries.length > 0) {
          const setClause = entries
            .map(([key], index) => `${key} = $${index + 1}`)
            .join(', ');

          const values = entries.map(([, value]) => value);
          values.push(id);

          const query = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = NOW()
            WHERE ${this.primaryKey} = $${values.length} AND deleted_at IS NULL
            RETURNING *
          `;

          const result = await this.executeQuery(query, values, client);

          if (result.rows.length > 0) {
            results.push(this.mapRowToEntity(result.rows[0]));
          }
        }
      }

      return results;
    });
  }

  /**
   * Search entities by text
   */
  async search(
    searchTerm: string,
    searchFields: string[],
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const {
      limit = 10,
      offset = 0,
      sort,
      order = 'DESC',
      filters = {},
    } = options;

    // Build search conditions
    const searchConditions = searchFields
      .map((field, index) => `${field} ILIKE $${index + 1}`)
      .join(' OR ');

    const searchParams = searchFields.map(() => `%${searchTerm}%`);

    // Add additional filters
    const { whereClause: filterClause, params: filterParams } =
      this.buildWhereClause(
        { ...filters, deleted_at: null },
        searchParams.length
      );

    const whereClause = filterClause
      ? `WHERE (${searchConditions}) AND ${filterClause.substring(6)}` // Remove 'WHERE '
      : `WHERE (${searchConditions})`;

    const allParams = [...searchParams, ...filterParams];
    const orderByClause = this.buildOrderByClause(sort, order);

    // Count query
    const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, allParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderByClause}
      LIMIT $${allParams.length + 1} OFFSET $${allParams.length + 2}
    `;

    const dataResult = await this.executeQuery(dataQuery, [
      ...allParams,
      limit,
      offset,
    ]);
    const items = dataResult.rows.map((row: any) => this.mapRowToEntity(row));

    // Calculate pagination metadata
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
