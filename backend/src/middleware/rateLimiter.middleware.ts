import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redisConnection } from '../config/redis.config';
import { RateLimitExceededError } from '../utils/errors';
import { RATE_LIMIT_CONSTANTS } from '../utils/constants';
import { logger } from '../utils/logger';
import appConfig from '../config/app.config';

// Rate limit store using Redis
class RedisRateLimitStore implements rateLimit.Store {
  private prefix: string;
  
  constructor(prefix: string = 'ratelimit:') {
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; timeToExpire: number | undefined }> {
    try {
      const redis = redisConnection.getClient();
      const fullKey = `${this.prefix}${key}`;
      
      const multi = redis.multi();
      multi.incr(fullKey);
      multi.ttl(fullKey);
      
      const results = await multi.exec();
      
      if (!results || results.some(result => result[0])) {
        throw new Error('Redis rate limit operation failed');
      }
      
      const totalHits = results[0][1] as number;
      const ttl = results[1][1] as number;
      
      // Set expiration if this is the first hit
      if (totalHits === 1) {
        await redis.expire(fullKey, Math.ceil(RATE_LIMIT_CONSTANTS.GENERAL.WINDOW_MS / 1000));
      }
      
      return {
        totalHits,
        timeToExpire: ttl > 0 ? ttl * 1000 : undefined,
      };
    } catch (error) {
      logger.error('Redis rate limit store error:', error);
      // Fallback to allowing the request if Redis fails
      return { totalHits: 0, timeToExpire: undefined };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      const redis = redisConnection.getClient();
      const fullKey = `${this.prefix}${key}`;
      await redis.decr(fullKey);
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      const redis = redisConnection.getClient();
      const fullKey = `${this.prefix}${key}`;
      await redis.del(fullKey);
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
  }

  async resetAll(): Promise<void> {
    try {
      const redis = redisConnection.getClient();
      const keys = await redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis rate limit reset all error:', error);
    }
  }
}

// Custom key generator that considers user ID if authenticated
const createKeyGenerator = (prefix: string) => {
  return (req: Request): string => {
    const userId = (req as any).user?.id;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    
    if (userId) {
      return `${prefix}:user:${userId}`;
    }
    
    return `${prefix}:ip:${ip}`;
  };
};

// Rate limit handler
const rateLimitHandler = (req: Request, res: Response) => {
  const retryAfter = Math.ceil(RATE_LIMIT_CONSTANTS.GENERAL.WINDOW_MS / 1000);
  
  logger.logSecurity('rate_limit_exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });
  
  throw new RateLimitExceededError(
    RATE_LIMIT_CONSTANTS.GENERAL.MAX_REQUESTS,
    '15 minutes',
    retryAfter
  );
};

// Skip rate limiting function
const skipRateLimit = (req: Request): boolean => {
  // Skip rate limiting in test environment
  if (appConfig.isTest()) {
    return true;
  }
  
  // Skip for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }
  
  // Skip for admins (optional)
  const user = (req as any).user;
  if (user && user.role === 'admin') {
    return true;
  }
  
  return false;
};

// General rate limiter
export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.GENERAL.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.GENERAL.MAX_REQUESTS,
  message: {
    error: {
      type: 'RateLimitError',
      message: `Too many requests from this IP, please try again after ${Math.ceil(RATE_LIMIT_CONSTANTS.GENERAL.WINDOW_MS / 60000)} minutes.`,
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore('general'),
  keyGenerator: createKeyGenerator('general'),
  handler: rateLimitHandler,
  skip: skipRateLimit,
});

// Authentication rate limiter (more restrictive)
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.AUTH.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.AUTH.MAX_REQUESTS,
  message: {
    error: {
      type: 'AuthRateLimitError',
      message: `Too many authentication attempts from this IP, please try again after ${Math.ceil(RATE_LIMIT_CONSTANTS.AUTH.WINDOW_MS / 60000)} minutes.`,
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore('auth'),
  keyGenerator: createKeyGenerator('auth'),
  handler: rateLimitHandler,
  skip: skipRateLimit,
  skipSuccessfulRequests: true, // Don't count successful auth requests
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.PASSWORD_RESET.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.PASSWORD_RESET.MAX_REQUESTS,
  message: {
    error: {
      type: 'PasswordResetRateLimitError',
      message: `Too many password reset attempts from this IP, please try again after ${Math.ceil(RATE_LIMIT_CONSTANTS.PASSWORD_RESET.WINDOW_MS / 60000)} minutes.`,
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore('password_reset'),
  keyGenerator: createKeyGenerator('password_reset'),
  handler: rateLimitHandler,
  skip: skipRateLimit,
});

// Email verification rate limiter
export const emailVerificationRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONSTANTS.EMAIL_VERIFICATION.WINDOW_MS,
  max: RATE_LIMIT_CONSTANTS.EMAIL_VERIFICATION.MAX_REQUESTS,
  message: {
    error: {
      type: 'EmailVerificationRateLimitError',
      message: `Too many email verification attempts from this IP, please try again after ${Math.ceil(RATE_LIMIT_CONSTANTS.EMAIL_VERIFICATION.WINDOW_MS / 60000)} minutes.`,
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisRateLimitStore('email_verification'),
  keyGenerator: createKeyGenerator('email_verification'),
  handler: rateLimitHandler,
  skip: skipRateLimit,
});

// Custom rate limiter factory
export const createRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  prefix: string;
  skipSuccessfulRequests?: boolean;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.maxRequests,
    message: {
      error: {
        type: 'CustomRateLimitError',
        message: options.message || `Too many requests, please try again later.`,
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisRateLimitStore(options.prefix),
    keyGenerator: createKeyGenerator(options.prefix),
    handler: rateLimitHandler,
    skip: skipRateLimit,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  });
};

// Rate limit info middleware - adds rate limit headers
export const rateLimitInfo = (req: Request, res: Response, next: NextFunction): void => {
  // Add custom rate limit headers
  res.set({
    'X-RateLimit-Policy': 'ConnectKit-Standard',
    'X-RateLimit-Service': 'ConnectKit-API',
  });
  
  next();
};

// Dynamic rate limiter based on user tier
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  let maxRequests = RATE_LIMIT_CONSTANTS.GENERAL.MAX_REQUESTS;
  
  // Adjust limits based on user role
  if (user) {
    switch (user.role) {
      case 'admin':
        maxRequests = maxRequests * 5;
        break;
      case 'manager':
        maxRequests = maxRequests * 2;
        break;
      default:
        // Standard user limits
        break;
    }
  }
  
  // Apply dynamic rate limit
  const dynamicLimiter = rateLimit({
    windowMs: RATE_LIMIT_CONSTANTS.GENERAL.WINDOW_MS,
    max: maxRequests,
    store: new RedisRateLimitStore('dynamic'),
    keyGenerator: createKeyGenerator('dynamic'),
    handler: rateLimitHandler,
    skip: skipRateLimit,
  });
  
  dynamicLimiter(req, res, next);
};

// Burst rate limiter for specific endpoints
export const burstRateLimit = createRateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  prefix: 'burst',
  message: 'Too many requests in a short time, please slow down.',
});

// Export rate limit store for testing
export { RedisRateLimitStore };