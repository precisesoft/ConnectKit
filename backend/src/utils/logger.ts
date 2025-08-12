import winston from 'winston';
import path from 'path';

// Custom log levels
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    verbose: 'gray',
  },
};

// Add colors to winston
winston.addColors(logLevels.colors);

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Ensure consistent structure for production logs
    const logObject = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'connectkit-api',
      ...info,
    };
    
    // Remove duplicate fields
    delete logObject.timestamp;
    delete logObject.level;
    delete logObject.message;
    
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'connectkit-api',
      ...logObject,
    });
  })
);

// Determine log level and format based on environment
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'warn';
    default:
      return 'debug';
  }
};

const getLogFormat = () => {
  return process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Winston transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: getLogLevel(),
    format: getLogFormat(),
    handleExceptions: true,
    handleRejections: true,
  }),
];

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: productionFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  levels: logLevels.levels,
  level: getLogLevel(),
  format: getLogFormat(),
  transports,
  exitOnError: false,
});

// Add custom methods for structured logging
interface LoggerMethods {
  logRequest: (req: any, res: any, responseTime?: number) => void;
  logError: (error: Error, context?: any) => void;
  logAuth: (action: string, userId: string, details?: any) => void;
  logDatabase: (query: string, duration: number, error?: Error) => void;
  logSecurity: (event: string, details: any) => void;
  logPerformance: (operation: string, duration: number, details?: any) => void;
}

const loggerMethods: LoggerMethods = {
  logRequest: (req: any, res: any, responseTime?: number) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection?.remoteAddress,
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  },

  logError: (error: Error, context?: any) => {
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  },

  logAuth: (action: string, userId: string, details?: any) => {
    logger.info('Authentication event', {
      action,
      userId,
      ...details,
    });
  },

  logDatabase: (query: string, duration: number, error?: Error) => {
    if (error) {
      logger.error('Database query failed', {
        query: query.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
        error: error.message,
      });
    } else {
      logger.debug('Database query executed', {
        query: query.substring(0, 100),
        duration: `${duration}ms`,
      });
    }
  },

  logSecurity: (event: string, details: any) => {
    logger.warn('Security event', {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  logPerformance: (operation: string, duration: number, details?: any) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    logger.log(level, 'Performance measurement', {
      operation,
      duration: `${duration}ms`,
      ...details,
    });
  },
};

// Extend logger with custom methods
Object.assign(logger, loggerMethods);

// Type assertion to include custom methods
export default logger as winston.Logger & LoggerMethods;

// Stream for Morgan HTTP request logging
export const morganStream = {
  write: (message: string) => {
    // Remove trailing newline
    logger.info(message.trim());
  },
};

// Error handling for logger itself
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Graceful handling of uncaught exceptions and rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise: promise.toString(),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Give logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});