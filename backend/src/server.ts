import { Server } from 'http';
import { initializeApp, gracefulShutdown } from './app';
import appConfig from './config/app.config';
import { logger } from './utils/logger';
import { setupProcessErrorHandlers } from './middleware/error.middleware';

/**
 * Start the HTTP server
 */
export async function startServer(): Promise<Server> {
  try {
    // Setup process error handlers
    setupProcessErrorHandlers();

    // Initialize the application
    const app = await initializeApp();

    // Get server configuration
    const port = appConfig.get('port');
    const host = appConfig.get('host');
    const environment = appConfig.get('nodeEnv');

    // Create HTTP server
    const server = app.listen(port, host, () => {
      logger.info('🚀 ConnectKit API Server started', {
        port,
        host,
        environment,
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        pid: process.pid,
        endpoints: {
          health: '/health',
          api: appConfig.getApiUrl(),
          docs: appConfig.get('features').swagger ? `${appConfig.getApiUrl()}/docs` : null,
        },
      });

      // Log additional startup information
      if (appConfig.isDevelopment()) {
        logger.info('Development mode enabled', {
          cors: 'permissive',
          logging: 'verbose',
          swagger: appConfig.get('features').swagger,
        });
      }

      if (appConfig.isProduction()) {
        logger.info('Production mode enabled', {
          security: 'enhanced',
          logging: 'structured',
          performance: 'optimized',
        });
      }
    });

    // Configure server settings
    server.keepAliveTimeout = 65000; // Slightly higher than ALB idle timeout
    server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close((error) => {
        if (error) {
          logger.error('Error closing server:', error);
        } else {
          logger.info('Server closed');
        }

        // Perform cleanup
        gracefulShutdown(signal);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Graceful shutdown timeout. Forcing shutdown...');
        process.exit(1);
      }, appConfig.get('gracefulShutdown').killTimeout);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
      });
      
      // Give logger time to write before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection:', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
      });
      
      // Don't exit for unhandled rejections in production
      if (!appConfig.isProduction()) {
        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    });

    return server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Get server health information
 */
export function getServerHealth() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    environment: appConfig.get('nodeEnv'),
  };
}

/**
 * Check if server is ready to serve traffic
 */
export async function checkReadiness(): Promise<boolean> {
  try {
    // Check database connection
    const { databaseConnection } = await import('./config/database.config');
    const dbHealthy = await databaseConnection.healthCheck();
    
    // Check Redis connection
    const { redisConnection } = await import('./config/redis.config');
    const redisHealthy = await redisConnection.healthCheck();
    
    return dbHealthy && redisHealthy;
    
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return false;
  }
}

// Only start server if this file is executed directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default startServer;