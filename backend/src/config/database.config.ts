import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

class DatabaseConnection {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.getConfig();
  }

  private getConfig(): DatabaseConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'connectkit',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '10000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10),
    };
  }

  private createPoolConfig(): PoolConfig {
    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      application_name: 'ConnectKit-API',
    };

    if (this.config.ssl) {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }

    return poolConfig;
  }

  async connect(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    try {
      const poolConfig = this.createPoolConfig();
      this.pool = new Pool(poolConfig);

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('Database connection established successfully', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        maxConnections: this.config.maxConnections,
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Database pool error:', err);
      });

      this.pool.on('connect', () => {
        logger.debug('New database client connected');
      });

      this.pool.on('remove', () => {
        logger.debug('Database client removed from pool');
      });

      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw new Error('Database connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        logger.info('Database connection closed');
      } catch (error) {
        logger.error('Error closing database connection:', error);
        throw error;
      }
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text,
        params: params?.length || 0,
        rows: result.rowCount,
        duration,
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed', {
        query: text,
        params: params?.length || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    
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

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows.length > 0 && result.rows[0].health === 1;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const databaseConnection = new DatabaseConnection();
export { DatabaseConfig };