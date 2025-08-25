import Redis, { RedisOptions } from 'ioredis';
import logger from '../utils/logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  connectTimeout: number;
  commandTimeout: number;
}

class RedisConnection {
  private client: Redis | null = null;
  private config: RedisConfig;

  constructor() {
    this.config = this.getConfig();
  }

  private getConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'connectkit:',
      retryDelayOnFailover: parseInt(
        process.env.REDIS_RETRY_DELAY || '100',
        10
      ),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      lazyConnect: true,
      connectTimeout: parseInt(
        process.env.REDIS_CONNECT_TIMEOUT || '10000',
        10
      ),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
    };
  }

  private createRedisOptions(): RedisOptions {
    const options: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      // retryDelayOnFailover: this.config.retryDelayOnFailover, // Not a valid ioredis option
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      lazyConnect: this.config.lazyConnect,
      connectTimeout: this.config.connectTimeout,
      commandTimeout: this.config.commandTimeout,
    };

    if (this.config.password) {
      options.password = this.config.password;
    }

    return options;
  }

  async connect(): Promise<Redis> {
    if (this.client && this.client.status === 'ready') {
      return this.client;
    }

    try {
      const options = this.createRedisOptions();
      this.client = new Redis(options);

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis connection established', {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
        });
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', error => {
        logger.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', time => {
        logger.info(`Redis reconnecting in ${time}ms`);
      });

      // Test the connection
      await this.client.ping();
      logger.info('Redis connection test successful');

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
        throw error;
      }
    }
  }

  getClient(): Redis {
    if (!this.client || this.client.status !== 'ready') {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  // Cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const client = this.getClient();
    const serializedValue = JSON.stringify(value);

    if (ttl) {
      await client.setex(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const client = this.getClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Error parsing Redis value:', { key, error });
      return null;
    }
  }

  async del(key: string): Promise<number> {
    const client = this.getClient();
    return await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const client = this.getClient();
    const result = await client.expire(key, ttl);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const client = this.getClient();
    return await client.keys(pattern);
  }

  async flushdb(): Promise<void> {
    const client = this.getClient();
    await client.flushdb();
  }

  // Session operations
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 3600
  ): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Rate limiting operations
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const client = this.getClient();
    const multi = client.multi();
    multi.incr(`ratelimit:${key}`);
    multi.expire(`ratelimit:${key}`, ttl);
    const results = await multi.exec();

    if (!results || !results[0] || results[0][0]) {
      throw new Error('Failed to increment rate limit');
    }

    return results[0][1] as number;
  }

  async getRateLimit(key: string): Promise<number> {
    const client = this.getClient();
    const count = await client.get(`ratelimit:${key}`);
    return count ? parseInt(count, 10) : 0;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.getClient().ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

export const redisConnection = new RedisConnection();
export { RedisConfig };
