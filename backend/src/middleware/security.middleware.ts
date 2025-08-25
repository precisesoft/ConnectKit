import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';
import appConfig from '../config/app.config';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Expect-CT has been removed from helmet v7
  // expectCt: {
  //   enforce: true,
  //   maxAge: 86400, // 24 hours
  // },

  // Feature Policy / Permissions Policy
  permittedCrossDomainPolicies: false,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },

  // X-Frame-Options
  frameguard: { action: 'deny' },

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,

  // Additional security headers (crossOriginResourcePolicy already defined above)

  // Permissions Policy
  permissionsPolicy: {
    features: {
      accelerometer: ["'none'"],
      autoplay: ["'none'"],
      camera: ["'none'"],
      encryptedMedia: ["'none'"],
      fullscreen: ["'self'"],
      geolocation: ["'none'"],
      gyroscope: ["'none'"],
      magnetometer: ["'none'"],
      microphone: ["'none'"],
      midi: ["'none'"],
      payment: ["'none'"],
      pictureInPicture: ["'none'"],
      syncXhr: ["'none'"],
      usb: ["'none'"],
    },
  },
});

/**
 * NoSQL Injection Prevention
 */
export const noSQLInjectionProtection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    logger.logSecurity('nosql_injection_attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      sanitizedKey: key,
      userId: (req as any).user?.id,
    });
  },
});

/**
 * XSS Protection
 */
export const xssProtection = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Recursively sanitize an object for XSS
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    const sanitized = xss(obj, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });

    // Log if XSS was detected and sanitized
    if (sanitized !== obj) {
      logger.logSecurity('xss_attempt_blocked', {
        original: obj,
        sanitized: sanitized,
      });
    }

    return sanitized;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * HTTP Parameter Pollution Protection
 */
export const httpParameterPollution = hpp({
  whitelist: ['tags', 'fields'], // Allow arrays for these parameters
});

/**
 * Request size limiter
 */
export const requestSizeLimit = (maxSizeInMB: number = 10) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSizeInBytes) {
      logger.logSecurity('request_size_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        contentLength,
        maxAllowed: maxSizeInBytes,
        userId: (req as any).user?.id,
      });

      throw new BadRequestError(
        `Request body too large. Maximum size is ${maxSizeInMB}MB`
      );
    }

    next();
  };
};

/**
 * Suspicious activity detection
 */
export const suspiciousActivityDetection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)|(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,

    // Script injection patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,

    // Path traversal patterns
    /(\.\.[\/\\]){2,}/,

    // Command injection patterns
    /(;|\||&|`|\$\()/,

    // LDAP injection patterns
    /(\*|\(|\)|\\|\||&)/,
  ];

  const checkForSuspiciousContent = (content: any): boolean => {
    if (typeof content === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(content));
    }

    if (Array.isArray(content)) {
      return content.some(item => checkForSuspiciousContent(item));
    }

    if (content !== null && typeof content === 'object') {
      return Object.values(content).some(value =>
        checkForSuspiciousContent(value)
      );
    }

    return false;
  };

  // Check request body, query, and params
  const allContent = { ...req.body, ...req.query, ...req.params };

  if (checkForSuspiciousContent(allContent)) {
    logger.logSecurity('suspicious_activity_detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      content: JSON.stringify(allContent),
      userId: (req as any).user?.id,
    });

    throw new BadRequestError('Suspicious content detected in request');
  }

  next();
};

/**
 * IP whitelist/blacklist middleware
 */
export const ipFilter = (options: {
  whitelist?: string[];
  blacklist?: string[];
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection?.remoteAddress;

    if (!clientIP) {
      throw new BadRequestError('Unable to determine client IP address');
    }

    // Check blacklist first
    if (options.blacklist && options.blacklist.includes(clientIP)) {
      logger.logSecurity('blocked_ip_attempt', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      throw new BadRequestError('Access denied');
    }

    // Check whitelist if provided
    if (options.whitelist && !options.whitelist.includes(clientIP)) {
      logger.logSecurity('non_whitelisted_ip_attempt', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      throw new BadRequestError('Access denied');
    }

    next();
  };
};

/**
 * User agent validation
 */
export const userAgentValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get('User-Agent');

  // Block requests without user agent (potential bot/script)
  if (!userAgent) {
    logger.logSecurity('missing_user_agent', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    throw new BadRequestError('User agent is required');
  }

  // Block known malicious user agents
  const maliciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /masscan/i,
    /zap/i,
    /burp/i,
    /acunetix/i,
  ];

  if (maliciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.logSecurity('malicious_user_agent_blocked', {
      ip: req.ip,
      userAgent,
      path: req.path,
      method: req.method,
    });

    throw new BadRequestError('Access denied');
  }

  next();
};

/**
 * Content type validation
 */
export const contentTypeValidation = (
  allowedTypes: string[] = ['application/json']
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only check for requests with body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');

      if (!contentType) {
        throw new BadRequestError('Content-Type header is required');
      }

      const isAllowed = allowedTypes.some(type =>
        contentType.toLowerCase().startsWith(type.toLowerCase())
      );

      if (!isAllowed) {
        logger.logSecurity('invalid_content_type', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          contentType,
          allowedTypes,
          userId: (req as any).user?.id,
        });

        throw new BadRequestError(
          `Invalid content type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }
    }

    next();
  };
};

/**
 * Security middleware chain
 */
export const securityMiddleware = [
  securityHeaders,
  noSQLInjectionProtection,
  xssProtection,
  httpParameterPollution,
  requestSizeLimit(10), // 10MB limit
  suspiciousActivityDetection,
  userAgentValidation,
  contentTypeValidation(['application/json', 'multipart/form-data']),
];

/**
 * Development-specific security middleware (less strict but still secure)
 */
export const developmentSecurityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: false, // Disable HSTS in development
  }),
  noSQLInjectionProtection,
  xssProtection,
  httpParameterPollution,
  requestSizeLimit(50), // Larger limit for development
];

/**
 * Get appropriate security middleware based on environment
 */
export const getSecurityMiddleware = () => {
  return appConfig.isDevelopment()
    ? developmentSecurityMiddleware
    : securityMiddleware;
};
