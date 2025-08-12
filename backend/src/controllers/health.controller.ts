import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { databaseConnection } from '../config/database.config';
import { redisConnection } from '../config/redis.config';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import appConfig from '../config/app.config';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
      percentage: number;
    };
  };
}

export class HealthController {
  /**
   * Basic health check endpoint
   */
  health = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const healthCheck: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: appConfig.get('nodeEnv'),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
      },
    };

    // Determine overall status
    const serviceStatuses = Object.values(healthCheck.services).map(service => service.status);
    
    if (serviceStatuses.some(status => status === 'unhealthy')) {
      healthCheck.status = 'unhealthy';
      res.status(StatusCodes.SERVICE_UNAVAILABLE);
    } else if (serviceStatuses.some(status => status === 'degraded')) {
      healthCheck.status = 'degraded';
      res.status(StatusCodes.OK);
    } else {
      healthCheck.status = 'healthy';
      res.status(StatusCodes.OK);
    }

    res.json({
      success: true,
      data: healthCheck,
    });
  });

  /**
   * Liveness probe (simple check to see if the app is running)
   */
  liveness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Service is alive',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Readiness probe (check if the app is ready to serve traffic)
   */
  readiness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allHealthy = checks.every(
      check => check.status === 'fulfilled' && check.value.status === 'healthy'
    );

    if (allHealthy) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Service is ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
        checks: checks.map((check, index) => ({
          service: index === 0 ? 'database' : 'redis',
          status: check.status === 'fulfilled' ? check.value.status : 'unhealthy',
          error: check.status === 'rejected' ? check.reason?.message : undefined,
        })),
      });
    }
  });

  /**
   * Detailed system information
   */
  info = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const systemInfo = {
      application: {
        name: 'ConnectKit API',
        version: process.env.npm_package_version || '1.0.0',
        environment: appConfig.get('nodeEnv'),
        port: appConfig.get('port'),
        uptime: process.uptime(),
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      system: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: process.env.TZ || 'UTC',
        features: {
          mfa: process.env.FEATURE_MFA !== 'false',
          oauth: process.env.FEATURE_OAUTH !== 'false',
          email: process.env.FEATURE_EMAIL !== 'false',
        },
      },
    };

    res.json({
      success: true,
      data: systemInfo,
    });
  });

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await databaseConnection.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Database health check failed', { error });
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await redisConnection.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Redis health check failed', { error });
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): {
    status: 'healthy' | 'unhealthy';
    usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    percentage: number;
  } {
    const memUsage = process.memoryUsage();
    const totalSystemMemory = parseInt(process.env.MEMORY_LIMIT || '512') * 1024 * 1024; // Default 512MB
    const memoryPercentage = (memUsage.rss / totalSystemMemory) * 100;
    
    return {
      status: memoryPercentage > 90 ? 'unhealthy' : 'healthy',
      usage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
      percentage: Math.round(memoryPercentage),
    };
  }
}

// Export controller instance
export const healthController = new HealthController();