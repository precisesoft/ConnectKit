import { Request, Response, NextFunction } from 'express';
import '../types/express'; // Import extended types
import jwt, { Algorithm } from 'jsonwebtoken';
import {
  UnauthorizedError,
  ForbiddenError,
  InvalidTokenError,
  ExpiredTokenError,
  AuthenticationError,
} from '../utils/errors';
import { UserRole } from '../models/user.model';
import { authConfig } from '../config/auth.config';
import { redisConnection } from '../config/redis.config';
import logger from '../utils/logger';
import { asyncHandler } from './error.middleware';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
        isActive: boolean;
        isVerified: boolean;
      };
    }
  }
}

interface JWTPayload {
  sub: string; // user id
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

interface TokenBlacklistEntry {
  jti: string;
  exp: number;
  userId: string;
  reason: string;
}

/**
 * Extract JWT token from request headers
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<JWTPayload> {
  const jwtConfig = authConfig.getJWTConfig();

  try {
    const payload = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm as jwt.Algorithm],
    }) as JWTPayload;

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredTokenError('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError('Invalid access token');
    } else {
      throw new AuthenticationError('Token verification failed');
    }
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const redis = redisConnection.getClient();
    const blacklistKey = `token_blacklist:${jti}`;
    const exists = await redis.exists(blacklistKey);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    // In case of Redis error, don't block the request
    return false;
  }
}

/**
 * Add token to blacklist
 */
export async function blacklistToken(
  jti: string,
  exp: number,
  userId: string,
  reason: string = 'logout'
): Promise<void> {
  try {
    const redis = redisConnection.getClient();
    const blacklistKey = `token_blacklist:${jti}`;
    const ttl = Math.max(0, exp - Math.floor(Date.now() / 1000));

    const entry: TokenBlacklistEntry = {
      jti,
      exp,
      userId,
      reason,
    };

    await redis.setex(blacklistKey, ttl, JSON.stringify(entry));

    logger.info('Token blacklisted', {
      jti,
      userId,
      reason,
      ttl,
    });
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    throw new Error('Failed to blacklist token');
  }
}

/**
 * Main authentication middleware
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    // Verify token
    const payload = await verifyToken(token);

    // Check if token is blacklisted
    const jti = (jwt.decode(token) as any)?.jti;
    if (jti && (await isTokenBlacklisted(jti))) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Check if user is active
    if (!payload.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Attach user to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      isActive: payload.isActive,
      isVerified: payload.isVerified,
    };

    // Log authentication success
    logger.logAuth('token_verified', payload.sub, {
      username: payload.username,
      role: payload.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  }
);

/**
 * Optional authentication middleware (doesn't throw if no token)
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    try {
      const payload = await verifyToken(token);

      // Check if token is blacklisted
      const jti = (jwt.decode(token) as any)?.jti;
      if (jti && (await isTokenBlacklisted(jti))) {
        return next();
      }

      // Attach user to request if active
      if (payload.isActive) {
        req.user = {
          id: payload.sub,
          email: payload.email,
          username: payload.username,
          role: payload.role,
          isActive: payload.isActive,
          isVerified: payload.isVerified,
        };
      }
    } catch (error) {
      // Ignore authentication errors in optional middleware
      logger.debug('Optional authentication failed:', error);
    }

    next();
  }
);

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.logSecurity('unauthorized_access_attempt', {
        userId: req.user.id,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Resource ownership authorization
 */
export const authorizeOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Admins can access any resource
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Check ownership (this is a simple check, actual implementation would query database)
    if (resourceId !== userId) {
      // For contacts, we need to check if the contact belongs to the user
      // This would typically be done in the service layer
      if (req.baseUrl.includes('/contacts')) {
        // Let the service layer handle ownership validation
        return next();
      }

      throw new ForbiddenError('Access denied');
    }

    next();
  };
};

/**
 * Email verification required middleware
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.isVerified) {
    throw new ForbiddenError('Email verification required');
  }

  next();
};

/**
 * Admin only middleware
 */
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Manager or Admin middleware
 */
export const managerOrAdmin = authorize(UserRole.MANAGER, UserRole.ADMIN);

/**
 * Generate JWT token
 */
export function generateAccessToken(user: {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}): string {
  const jwtConfig = authConfig.getJWTConfig();

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    iss: jwtConfig.issuer,
    aud: jwtConfig.audience,
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm as Algorithm,
    jwtid: generateJTI(), // JWT ID for blacklisting
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  const jwtConfig = authConfig.getJWTConfig();

  const payload = {
    sub: userId,
    type: 'refresh',
    iss: jwtConfig.issuer,
    aud: jwtConfig.audience,
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiresIn,
    algorithm: jwtConfig.algorithm as Algorithm,
    jwtid: generateJTI(),
  });
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string; jti: string }> {
  const jwtConfig = authConfig.getJWTConfig();

  try {
    const payload = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm as Algorithm],
    }) as any;

    if (payload.type !== 'refresh') {
      throw new InvalidTokenError('Invalid token type');
    }

    // Check if token is blacklisted
    if (payload.jti && (await isTokenBlacklisted(payload.jti))) {
      throw new InvalidTokenError('Refresh token has been revoked');
    }

    return {
      userId: payload.sub,
      jti: payload.jti,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ExpiredTokenError('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError('Invalid refresh token');
    } else {
      throw error;
    }
  }
}

/**
 * Generate JWT ID for token tracking
 */
function generateJTI(): string {
  return `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user ID from token (without verification)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = jwt.decode(token) as any;
    return payload?.sub || null;
  } catch {
    return null;
  }
}
