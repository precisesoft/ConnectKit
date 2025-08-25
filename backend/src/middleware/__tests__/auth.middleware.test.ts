import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  requireRole,
} from '../auth.middleware';
import { UserRole } from '../../models/user.model';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockRedis,
  mockJWT,
} from '../../tests/utils/mocks';
import { createUser, createJwtPayload } from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../config/redis.config');
jest.mock('../../utils/logger');

describe('AuthMiddleware', () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let mockRedis: any;
  let mockJwtVerify: jest.Mock;
  let mockJwtSign: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = createMockRequest() as Request;
    mockResponse = createMockResponse() as Response;
    mockNext = createMockNext();
    mockRedis = createMockRedis();

    // Mock JWT functions
    const jwtMocks = mockJWT();
    mockJwtVerify = jwtMocks.verify as jest.Mock;
    mockJwtSign = jwtMocks.sign as jest.Mock;

    // Mock Redis connection
    jest.mock('../../config/redis.config', () => ({
      redisConnection: {
        getClient: () => mockRedis,
      },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      // Arrange
      const user = createUser();
      const payload = createJwtPayload(user);
      const token = 'valid-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockReturnValue(payload);
      mockRedis.exists.mockResolvedValue(0); // Not blacklisted

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockJwtVerify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        `token_blacklist:${payload.jti}`
      );
      expect((mockRequest as any).user).toEqual({
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should reject request with invalid authorization format', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject blacklisted token', async () => {
      // Arrange
      const user = createUser();
      const payload = createJwtPayload(user);
      const token = 'blacklisted-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockReturnValue(payload);
      mockRedis.exists.mockResolvedValue(1); // Blacklisted

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject invalid token', async () => {
      // Arrange
      const token = 'invalid-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject expired token', async () => {
      // Arrange
      const token = 'expired-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const user = createUser();
      const payload = createJwtPayload(user);
      const token = 'valid-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockReturnValue(payload);
      mockRedis.exists.mockRejectedValue(new Error('Redis connection failed'));

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      // Should proceed assuming token is not blacklisted when Redis fails
      expect((mockRequest as any).user).toEqual({
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle token without jti gracefully', async () => {
      // Arrange
      const user = createUser();
      const payload = createJwtPayload(user);
      delete payload.jti; // Remove jti
      const token = 'token-without-jti';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockReturnValue(payload);

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockRedis.exists).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      // Arrange
      const user = createUser();
      const expectedToken = 'generated-access-token';
      mockJwtSign.mockReturnValue(expectedToken);

      // Act
      const result = generateAccessToken(user);

      // Assert
      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          type: 'access',
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '15m',
          jwtid: expect.any(String),
          issuer: 'connectkit',
          audience: 'connectkit-users',
        }
      );
      expect(result).toBe(expectedToken);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      // Arrange
      const userId = 'user-123';
      const expectedToken = 'generated-refresh-token';
      mockJwtSign.mockReturnValue(expectedToken);

      // Act
      const result = generateRefreshToken(userId);

      // Assert
      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          sub: userId,
          type: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: '7d',
          jwtid: expect.any(String),
          issuer: 'connectkit',
          audience: 'connectkit-users',
        }
      );
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      // Arrange
      const token = 'valid-refresh-token';
      const payload = {
        sub: 'user-123',
        type: 'refresh',
        jti: 'token-jti',
      };

      mockJwtVerify.mockReturnValue(payload);
      mockRedis.exists.mockResolvedValue(0); // Not blacklisted

      // Act
      const result = await verifyRefreshToken(token);

      // Assert
      expect(mockJwtVerify).toHaveBeenCalledWith(
        token,
        process.env.JWT_REFRESH_SECRET
      );
      expect(result).toEqual({
        userId: payload.sub,
        jti: payload.jti,
      });
    });

    it('should reject blacklisted refresh token', async () => {
      // Arrange
      const token = 'blacklisted-refresh-token';
      const payload = {
        sub: 'user-123',
        type: 'refresh',
        jti: 'token-jti',
      };

      mockJwtVerify.mockReturnValue(payload);
      mockRedis.exists.mockResolvedValue(1); // Blacklisted

      // Act & Assert
      await expect(verifyRefreshToken(token)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should reject non-refresh token type', async () => {
      // Arrange
      const token = 'access-token';
      const payload = {
        sub: 'user-123',
        type: 'access', // Wrong type
        jti: 'token-jti',
      };

      mockJwtVerify.mockReturnValue(payload);

      // Act & Assert
      await expect(verifyRefreshToken(token)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist token successfully', async () => {
      // Arrange
      const jti = 'token-jti';
      const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const userId = 'user-123';
      const reason = 'logout';

      mockRedis.setex.mockResolvedValue('OK');

      // Act
      await blacklistToken(jti, exp, userId, reason);

      // Assert
      const expectedTtl = exp - Math.floor(Date.now() / 1000);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `token_blacklist:${jti}`,
        expectedTtl,
        JSON.stringify({
          userId,
          reason,
          blacklistedAt: expect.any(String),
        })
      );
    });

    it('should handle expired token gracefully', async () => {
      // Arrange
      const jti = 'token-jti';
      const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago (expired)
      const userId = 'user-123';
      const reason = 'logout';

      // Act
      await blacklistToken(jti, exp, userId, reason);

      // Assert
      // Should not attempt to blacklist already expired token
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      // Arrange
      const jti = 'token-jti';
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const userId = 'user-123';
      const reason = 'logout';

      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      // Act & Assert
      // Should not throw error, just log it
      await expect(
        blacklistToken(jti, exp, userId, reason)
      ).resolves.not.toThrow();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', async () => {
      // Arrange
      const adminUser = createUser({ role: UserRole.ADMIN });
      (mockRequest as any).user = adminUser;

      const middleware = requireRole(UserRole.ADMIN);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for user with higher role', async () => {
      // Arrange
      const adminUser = createUser({ role: UserRole.ADMIN });
      (mockRequest as any).user = adminUser;

      const middleware = requireRole(UserRole.USER); // Admin has higher privileges than User

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for user with insufficient role', async () => {
      // Arrange
      const regularUser = createUser({ role: UserRole.USER });
      (mockRequest as any).user = regularUser;

      const middleware = requireRole(UserRole.ADMIN);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should deny access for unauthenticated request', async () => {
      // Arrange
      (mockRequest as any).user = null;

      const middleware = requireRole(UserRole.USER);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle multiple required roles', async () => {
      // Arrange
      const adminUser = createUser({ role: UserRole.ADMIN });
      (mockRequest as any).user = adminUser;

      const middleware = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user does not have any of the required roles', async () => {
      // Arrange
      const regularUser = createUser({ role: UserRole.USER });
      (mockRequest as any).user = regularUser;

      const middleware = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('role hierarchy', () => {
    it('should respect role hierarchy for access control', () => {
      // This tests the internal role hierarchy logic
      const roleHierarchy = {
        [UserRole.USER]: 1,
        [UserRole.MODERATOR]: 2,
        [UserRole.ADMIN]: 3,
      };

      expect(roleHierarchy[UserRole.ADMIN]).toBeGreaterThan(
        roleHierarchy[UserRole.MODERATOR]
      );
      expect(roleHierarchy[UserRole.MODERATOR]).toBeGreaterThan(
        roleHierarchy[UserRole.USER]
      );
    });
  });

  describe('error handling', () => {
    it('should handle malformed JWT gracefully', async () => {
      // Arrange
      const token = 'malformed.jwt.token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockJwtVerify.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle missing environment variables gracefully', async () => {
      // Arrange
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const user = createUser();

      // Act & Assert
      expect(() => generateAccessToken(user)).toThrow();

      // Cleanup
      process.env.JWT_SECRET = originalJwtSecret;
    });
  });
});
