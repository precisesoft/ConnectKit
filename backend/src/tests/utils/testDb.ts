import { Pool } from 'pg';
import logger from '../../utils/logger';

/**
 * Test database utilities for managing test database connections and data
 */
export class TestDatabase {
  private static pool: Pool | null = null;
  private static isInitialized = false;

  /**
   * Initialize test database connection
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const dbConfig = {
        host: process.env.DB_HOST || process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(
          process.env.DB_PORT || process.env.TEST_DB_PORT || '5432',
          10
        ),
        database:
          process.env.DB_NAME || process.env.TEST_DB_NAME || 'connectkit_test',
        user: process.env.DB_USER || process.env.TEST_DB_USER || 'postgres',
        password:
          process.env.DB_PASSWORD || process.env.TEST_DB_PASSWORD || 'postgres',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      this.pool = new Pool(dbConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      logger.info('Test database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize test database:', error);
      throw new Error('Test database initialization failed');
    }
  }

  /**
   * Get database pool instance
   */
  static getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query with parameters
   */
  static async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      logger.error('Database query error:', { error, text, params });
      throw error;
    }
  }

  /**
   * Start a database transaction
   */
  static async beginTransaction() {
    const client = await this.getPool().connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a transaction
   */
  static async commitTransaction(client: any) {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a transaction
   */
  static async rollbackTransaction(client: any) {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  /**
   * Clean all test data from database
   */
  static async cleanup(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Disable foreign key constraints temporarily
        await client.query('SET session_replication_role = replica');

        // Clean tables in order (reverse of dependency)
        const tables = [
          'contacts',
          'user_sessions',
          'password_reset_tokens',
          'email_verification_tokens',
          'users',
        ];

        for (const table of tables) {
          await client.query(
            `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`
          );
        }

        // Re-enable foreign key constraints
        await client.query('SET session_replication_role = DEFAULT');

        await client.query('COMMIT');
        logger.info('Test database cleaned successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to clean test database:', error);
      throw error;
    }
  }

  /**
   * Seed database with test data
   */
  static async seed(seedData: any = {}): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    try {
      // Clean before seeding
      await this.cleanup();

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Seed users if provided
        if (seedData.users) {
          for (const user of seedData.users) {
            await client.query(
              `
              INSERT INTO users (
                id, username, email, password_hash, first_name, last_name, 
                role, is_active, is_verified, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `,
              [
                user.id,
                user.username,
                user.email,
                user.passwordHash,
                user.firstName,
                user.lastName,
                user.role || 'user',
                user.isActive !== false,
                user.isVerified !== false,
                user.createdAt || new Date(),
                user.updatedAt || new Date(),
              ]
            );
          }
        }

        // Seed contacts if provided
        if (seedData.contacts) {
          for (const contact of seedData.contacts) {
            await client.query(
              `
              INSERT INTO contacts (
                id, user_id, first_name, last_name, email, phone, 
                company, notes, is_favorite, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `,
              [
                contact.id,
                contact.userId,
                contact.firstName,
                contact.lastName,
                contact.email,
                contact.phone,
                contact.company,
                contact.notes,
                contact.isFavorite || false,
                contact.createdAt || new Date(),
                contact.updatedAt || new Date(),
              ]
            );
          }
        }

        await client.query('COMMIT');
        logger.info('Test database seeded successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to seed test database:', error);
      throw error;
    }
  }

  /**
   * Get record count for a table
   */
  static async getCount(
    table: string,
    condition?: string,
    params?: any[]
  ): Promise<number> {
    const query = condition
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${condition}`
      : `SELECT COUNT(*) as count FROM ${table}`;

    const result = await this.query(query, params);
    return parseInt(result[0].count, 10);
  }

  /**
   * Check if a record exists
   */
  static async exists(
    table: string,
    condition: string,
    params: any[]
  ): Promise<boolean> {
    const count = await this.getCount(table, condition, params);
    return count > 0;
  }

  /**
   * Get a single record
   */
  static async getRecord<T = any>(
    table: string,
    condition: string,
    params: any[]
  ): Promise<T | null> {
    const query = `SELECT * FROM ${table} WHERE ${condition} LIMIT 1`;
    const result = await this.query<T>(query, params);
    return result.length > 0 ? result[0] || null : null;
  }

  /**
   * Close database connections
   */
  static async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.isInitialized = false;
        logger.info('Test database connections closed');
      } catch (error) {
        logger.error('Error closing test database:', error);
      }
    }
  }

  /**
   * Reset database to initial state
   */
  static async reset(): Promise<void> {
    try {
      await this.cleanup();
      logger.info('Test database reset completed');
    } catch (error) {
      logger.error('Failed to reset test database:', error);
      throw error;
    }
  }

  /**
   * Create a test transaction that automatically rolls back
   */
  static async withTransaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.beginTransaction();

    try {
      const result = await callback(client);
      // Always rollback test transactions
      await this.rollbackTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Helper function to create test database configuration
export const createTestDbConfig = () => ({
  host: process.env.DB_HOST || process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.TEST_DB_PORT || '5432', 10),
  database:
    process.env.DB_NAME || process.env.TEST_DB_NAME || 'connectkit_test',
  user: process.env.DB_USER || process.env.TEST_DB_USER || 'postgres',
  password:
    process.env.DB_PASSWORD || process.env.TEST_DB_PASSWORD || 'postgres',
  ssl: process.env.TEST_DB_SSL === 'true',
});

// Export singleton instance
export const testDb = TestDatabase;
