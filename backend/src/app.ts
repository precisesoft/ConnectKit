import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import 'express-async-errors';

// Configuration
import appConfig from './config/app.config';

// Middleware
import { getSecurityMiddleware } from './middleware/security.middleware';
import {
  generalRateLimit,
  rateLimitInfo,
} from './middleware/rateLimiter.middleware';
import { requestId, requestLogger } from './middleware/logger.middleware';
import { sanitize } from './middleware/validation.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Routes
import routes from './routes';

// Logger
import { logger } from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
  const app = express();

  // Trust proxy if configured
  if (appConfig.get('trustProxy')) {
    app.set('trust proxy', 1);
  }

  // Request ID and basic logging
  app.use(requestId);
  app.use(requestLogger);

  // Security middleware
  app.use(getSecurityMiddleware());

  // Rate limiting info headers
  app.use(rateLimitInfo);

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = appConfig.getCorsOrigins();

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allow all origins in development
        if (appConfig.isDevelopment()) {
          return callback(null, true);
        }

        // Check if origin is allowed
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Reject origin
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-Forwarded-For',
        'User-Agent',
      ],
      exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
    })
  );

  // Body parsing middleware
  app.use(
    express.json({
      limit: appConfig.get('bodyLimit'),
      strict: false,
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: appConfig.get('bodyLimit'),
      parameterLimit: appConfig.get('parameterLimit'),
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Compression
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress if the request includes a cache-control no-transform directive
        if (
          req.headers['cache-control'] &&
          req.headers['cache-control'].includes('no-transform')
        ) {
          return false;
        }
        // Use compression filter function
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses over 1KB
    })
  );

  // Request sanitization
  app.use(sanitize);

  // General rate limiting
  app.use(generalRateLimit);

  // API routes
  app.use(routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Initialize the application
 */
export async function initializeApp(): Promise<express.Application> {
  try {
    logger.info('Initializing ConnectKit API application...');

    // Create Express app
    const app = createApp();

    // Initialize database connection
    const { databaseConnection } = await import('./config/database.config');
    await databaseConnection.connect();
    logger.info('Database connected successfully');

    // Initialize Redis connection
    const { redisConnection } = await import('./config/redis.config');
    await redisConnection.connect();
    logger.info('Redis connected successfully');

    // Schedule cleanup tasks
    scheduleCleanupTasks();

    logger.info('ConnectKit API application initialized successfully');

    return app;
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    throw error;
  }
}

/**
 * Schedule periodic cleanup tasks
 */
function scheduleCleanupTasks(): void {
  // Clean up expired tokens and unlock accounts every 5 minutes
  setInterval(
    async () => {
      try {
        const { AuthService } = await import('./services/auth.service');
        const authService = new AuthService();
        await authService.cleanup();
      } catch (error) {
        logger.error('Cleanup task failed:', error);
      }
    },
    5 * 60 * 1000
  );

  logger.info('Cleanup tasks scheduled');
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connection
    const { databaseConnection } = await import('./config/database.config');
    await databaseConnection.disconnect();
    logger.info('Database disconnected');

    // Close Redis connection
    const { redisConnection } = await import('./config/redis.config');
    await redisConnection.disconnect();
    logger.info('Redis disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default createApp;
