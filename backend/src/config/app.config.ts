import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

export interface AppConfig {
  // Server configuration
  port: number;
  host: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // API configuration
  apiPrefix: string;
  apiVersion: string;
  corsOrigins: string[];

  // Security configuration
  trustProxy: boolean;
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
  };

  // Rate limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };

  // Request limits
  bodyLimit: string;
  parameterLimit: number;

  // Logging
  logLevel: string;
  logFormat: string;

  // Health check
  healthCheck: {
    endpoint: string;
    interval: number;
  };

  // Graceful shutdown
  gracefulShutdown: {
    timeout: number;
    killTimeout: number;
  };

  // Feature flags
  features: {
    swagger: boolean;
    metrics: boolean;
    tracing: boolean;
  };
}

class AppConfiguration {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
      // Server configuration
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      nodeEnv,
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',

      // API configuration
      apiPrefix: process.env.API_PREFIX || '/api',
      apiVersion: process.env.API_VERSION || 'v1',
      corsOrigins: this.parseCorsOrigins(),

      // Security configuration
      trustProxy: process.env.TRUST_PROXY === 'true',
      helmet: {
        contentSecurityPolicy: process.env.HELMET_CSP !== 'false',
        crossOriginEmbedderPolicy: process.env.HELMET_COEP !== 'false',
      },

      // Rate limiting
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
      },

      // Request limits
      bodyLimit: process.env.BODY_LIMIT || '10mb',
      parameterLimit: parseInt(process.env.PARAMETER_LIMIT || '1000', 10),

      // Logging
      logLevel:
        process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
      logFormat:
        process.env.LOG_FORMAT ||
        (nodeEnv === 'production' ? 'json' : 'combined'),

      // Health check
      healthCheck: {
        endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
      },

      // Graceful shutdown
      gracefulShutdown: {
        timeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '10000', 10),
        killTimeout: parseInt(process.env.GRACEFUL_KILL_TIMEOUT || '5000', 10),
      },

      // Feature flags
      features: {
        swagger: process.env.FEATURE_SWAGGER !== 'false',
        metrics: process.env.FEATURE_METRICS !== 'false',
        tracing: process.env.FEATURE_TRACING !== 'false',
      },
    };
  }

  private parseCorsOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || '';

    if (!origins) {
      return this.config?.isDevelopment
        ? ['http://localhost:3000', 'http://localhost:5173']
        : [];
    }

    return origins
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('Invalid port number. Must be between 1 and 65535.');
    }

    // Validate required environment variables for production
    if (this.config.isProduction) {
      const requiredProdVars = [
        'JWT_SECRET',
        'DB_HOST',
        'DB_NAME',
        'DB_USERNAME',
        'DB_PASSWORD',
        'REDIS_HOST',
      ];

      for (const envVar of requiredProdVars) {
        if (!process.env[envVar]) {
          errors.push(`Missing required environment variable: ${envVar}`);
        }
      }
    }

    // Validate log level
    const validLogLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
    if (!validLogLevels.includes(this.config.logLevel)) {
      errors.push(
        `Invalid log level: ${this.config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`
      );
    }

    // Validate rate limit settings
    if (this.config.rateLimit.windowMs < 1000) {
      errors.push('Rate limit window must be at least 1000ms');
    }

    if (this.config.rateLimit.maxRequests < 1) {
      errors.push('Rate limit max requests must be at least 1');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed:', { errors });
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Configuration loaded successfully', {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      host: this.config.host,
      apiPrefix: this.config.apiPrefix,
      apiVersion: this.config.apiVersion,
      logLevel: this.config.logLevel,
    });
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  isProduction(): boolean {
    return this.config.isProduction;
  }

  isTest(): boolean {
    return this.config.isTest;
  }

  getApiUrl(): string {
    return `${this.config.apiPrefix}/${this.config.apiVersion}`;
  }

  getCorsOrigins(): string[] {
    return [...this.config.corsOrigins];
  }
}

export const appConfig = new AppConfiguration();
export default appConfig;
