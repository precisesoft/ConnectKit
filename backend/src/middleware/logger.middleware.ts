import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger, morganStream } from '../utils/logger';
import appConfig from '../config/app.config';

// Custom token definitions for Morgan
morgan.token('id', (req: Request) => {
  return (req as any).id || 'unknown';
});

morgan.token('user', (req: Request) => {
  const user = (req as any).user;
  return user ? `${user.id}(${user.role})` : 'anonymous';
});

morgan.token('real-ip', (req: Request) => {
  return req.ip || req.connection?.remoteAddress || 'unknown';
});

morgan.token('body', (req: Request) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return JSON.stringify(maskSensitiveFields(req.body));
  }
  return '';
});

/**
 * Mask sensitive fields in request body for logging
 */
function maskSensitiveFields(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password', 
    'token', 
    'secret', 
    'key', 
    'authorization',
    'currentPassword',
    'newPassword',
    'confirmPassword'
  ];
  
  const masked = { ...body };
  
  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveFields(masked[key]);
    }
  }
  
  return masked;
}

/**
 * Generate unique request ID
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.headers['x-request-id'] as string || 
             `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).id = id;
  res.set('X-Request-ID', id);
  
  next();
};

/**
 * Development logging format
 */
const developmentFormat = ':real-ip - :user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms [:id]';

/**
 * Production logging format (JSON structured)
 */
const productionFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  httpVersion: ':http-version',
  statusCode: ':status',
  contentLength: ':res[content-length]',
  responseTime: ':response-time',
  ip: ':real-ip',
  userAgent: ':user-agent',
  referrer: ':referrer',
  user: ':user',
  requestId: ':id',
});

/**
 * Request logging middleware
 */
export const requestLogger = morgan(
  appConfig.isProduction() ? productionFormat : developmentFormat,
  {
    stream: morganStream,
    skip: (req: Request, res: Response) => {
      // Skip logging for health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }
      
      // Skip static files in development
      if (appConfig.isDevelopment() && req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return true;
      }
      
      return false;
    },
  }
);

/**
 * Custom request logger with additional context
 */
export const detailedRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request details
  logger.info('Request started', {
    requestId: (req as any).id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    user: (req as any).user ? {
      id: (req as any).user.id,
      role: (req as any).user.role,
    } : null,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? maskSensitiveFields(req.body) : undefined,
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    logger.info('Request completed', {
      requestId: (req as any).id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('Content-Length'),
      user: (req as any).user ? {
        id: (req as any).user.id,
        role: (req as any).user.role,
      } : null,
    });
    
    // Performance warning for slow requests
    if (responseTime > 5000) {
      logger.warn('Slow request detected', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request error', {
    requestId: (req as any).id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: (req as any).user ? {
      id: (req as any).user.id,
      role: (req as any).user.role,
    } : null,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    query: req.query,
    body: maskSensitiveFields(req.body),
  });
  
  next(error);
};

/**
 * API audit logging for sensitive operations
 */
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logger.info('Audit log', {
          action,
          requestId: (req as any).id,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          user: (req as any).user ? {
            id: (req as any).user.id,
            role: (req as any).user.role,
            email: (req as any).user.email,
          } : null,
          timestamp: new Date().toISOString(),
          resource: {
            params: req.params,
            query: req.query,
            body: maskSensitiveFields(req.body),
          },
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Security event logger
 */
export const securityLogger = (eventType: string, details?: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    logger.warn('Security event', {
      eventType,
      requestId: (req as any).id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: (req as any).user ? {
        id: (req as any).user.id,
        role: (req as any).user.role,
      } : null,
      timestamp: new Date().toISOString(),
      details,
    });
    
    next();
  };
};

/**
 * Database operation logger
 */
export const dbLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).dbOperation = operation;
    (req as any).dbStartTime = Date.now();
    
    next();
  };
};

/**
 * Performance monitoring middleware
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime();
  const startUsage = process.cpuUsage();
  
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const diff = process.hrtime(startTime);
    const cpuUsage = process.cpuUsage(startUsage);
    const responseTime = (diff[0] * 1000) + (diff[1] / 1000000); // Convert to milliseconds
    
    // Log performance metrics
    logger.debug('Performance metrics', {
      requestId: (req as any).id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      cpuUsage: {
        user: cpuUsage.user / 1000, // Convert to milliseconds
        system: cpuUsage.system / 1000,
      },
      memoryUsage: process.memoryUsage(),
    });
    
    // Warn about high resource usage
    if (responseTime > 1000 || cpuUsage.user > 100000) {
      logger.warn('High resource usage detected', {
        requestId: (req as any).id,
        method: req.method,
        url: req.originalUrl,
        responseTime,
        cpuUsage,
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};