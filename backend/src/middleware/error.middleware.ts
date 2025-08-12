import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  AppError, 
  isAppError, 
  isOperationalError,
  createErrorResponse,
  ValidationError,
  InternalServerError 
} from '../utils/errors';
import { logger } from '../utils/logger';
import appConfig from '../config/app.config';

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    context?: any;
    stack?: string;
  };
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Log the error
  logError(error, req, requestId);
  
  // Handle different types of errors
  let appError: AppError;
  
  if (isAppError(error)) {
    appError = error;
  } else {
    // Convert unknown errors to AppError
    appError = convertToAppError(error);
  }
  
  // Create error response
  const errorResponse = createErrorResponseObject(appError, requestId);
  
  // Send response
  res.status(appError.statusCode).json(errorResponse);
};

/**
 * Convert unknown errors to AppError
 */
function convertToAppError(error: Error): AppError {
  // Handle validation errors from express-validator or joi
  if (error.name === 'ValidationError') {
    return new ValidationError('Validation failed', (error as any).details || []);
  }
  
  // Handle database errors
  if (error.message.includes('database') || error.message.includes('connection')) {
    return new InternalServerError('Database error occurred');
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token') {
      readonly statusCode = StatusCodes.UNAUTHORIZED;
      readonly isOperational = true;
      toJSON() {
        return {
          type: 'InvalidTokenError',
          message: this.message,
          statusCode: this.statusCode,
          timestamp: this.timestamp,
        };
      }
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token has expired') {
      readonly statusCode = StatusCodes.UNAUTHORIZED;
      readonly isOperational = true;
      toJSON() {
        return {
          type: 'ExpiredTokenError',
          message: this.message,
          statusCode: this.statusCode,
          timestamp: this.timestamp,
        };
      }
    };
  }
  
  // Handle syntax errors in JSON
  if (error instanceof SyntaxError && (error as any).type === 'entity.parse.failed') {
    return new AppError('Invalid JSON format') {
      readonly statusCode = StatusCodes.BAD_REQUEST;
      readonly isOperational = true;
      toJSON() {
        return {
          type: 'SyntaxError',
          message: this.message,
          statusCode: this.statusCode,
          timestamp: this.timestamp,
        };
      }
    };
  }
  
  // Default to internal server error
  return new InternalServerError(
    appConfig.isProduction() ? 'Internal server error' : error.message,
    { originalError: error.message }
  );
}

/**
 * Create standardized error response
 */
function createErrorResponseObject(error: AppError, requestId: string): ErrorResponse {
  const errorData = createErrorResponse(error);
  
  const response: ErrorResponse = {
    success: false,
    error: {
      ...errorData,
      requestId,
    },
  };
  
  // Include stack trace in development
  if (!appConfig.isProduction() && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
}

/**
 * Log error with context
 */
function logError(error: Error | AppError, req: Request, requestId: string): void {
  const errorContext = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection?.remoteAddress,
    userId: (req as any).user?.id,
    body: maskSensitiveFields(req.body),
    query: req.query,
    params: req.params,
  };
  
  if (isAppError(error)) {
    const level = error.statusCode >= 500 ? 'error' : 'warn';
    logger.log(level, `${error.constructor.name}: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        context: error.context,
      },
      request: errorContext,
    });
  } else {
    logger.error(`Unhandled error: ${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: errorContext,
    });
  }
}

/**
 * Mask sensitive fields in request body
 */
function maskSensitiveFields(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const masked = { ...body };
  
  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware to catch async errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.method} ${req.originalUrl} not found`) {
    readonly statusCode = StatusCodes.NOT_FOUND;
    readonly isOperational = true;
    toJSON() {
      return {
        type: 'NotFoundError',
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
      };
    }
  };
  
  next(error);
};

/**
 * Validation error handler for express-validator
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = new ValidationError(
      'Request validation failed',
      errors.array().map((error: any) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location,
      }))
    );
    
    next(validationError);
    return;
  }
  
  next();
};

/**
 * Graceful shutdown error handler
 */
export const gracefulShutdownHandler = (server: any) => {
  return (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    const timeout = appConfig.get('gracefulShutdown').timeout;
    const killTimeout = appConfig.get('gracefulShutdown').killTimeout;
    
    // Set a timeout to force shutdown if graceful shutdown takes too long
    const forceShutdown = setTimeout(() => {
      logger.error('Graceful shutdown timeout. Forcing shutdown...');
      process.exit(1);
    }, killTimeout);
    
    server.close((error: Error) => {
      clearTimeout(forceShutdown);
      
      if (error) {
        logger.error('Error during server shutdown:', error);
        process.exit(1);
      } else {
        logger.info('Server closed successfully');
        process.exit(0);
      }
    });
  };
};

/**
 * Process event handlers for uncaught errors
 */
export const setupProcessErrorHandlers = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    
    if (!isOperationalError(error)) {
      process.exit(1);
    }
  });
  
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });
    
    if (reason instanceof Error && !isOperationalError(reason)) {
      process.exit(1);
    }
  });
  
  // Graceful shutdown handlers
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      process.exit(0);
    });
  });
};