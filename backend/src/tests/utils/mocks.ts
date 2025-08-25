import { jest } from '@jest/globals';
import { createMock, DeepMockProxy } from 'jest-mock-extended';
import { Pool, PoolClient } from 'pg';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserRepository } from '../../repositories/user.repository';
import { ContactRepository } from '../../repositories/contact.repository';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ContactService } from '../../services/contact.service';
import { logger } from '../../utils/logger';

/**
 * Mock implementations for external dependencies and services
 */
export class TestMocks {
  /**
   * Mock PostgreSQL Pool
   */
  static createMockPool(): DeepMockProxy<Pool> {
    const mockPool = createMock<Pool>();
    const mockClient = createMock<PoolClient>();

    mockPool.connect.mockResolvedValue(mockClient);
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
    mockPool.end.mockResolvedValue();

    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
    mockClient.release.mockResolvedValue();

    return mockPool;
  }

  /**
   * Mock Redis client
   */
  static createMockRedis(): DeepMockProxy<Redis> {
    const mockRedis = createMock<Redis>();

    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.exists.mockResolvedValue(0);
    mockRedis.flushdb.mockResolvedValue('OK');
    mockRedis.disconnect.mockResolvedValue();

    return mockRedis;
  }

  /**
   * Mock User Repository
   */
  static createMockUserRepository(): DeepMockProxy<UserRepository> {
    return createMock<UserRepository>();
  }

  /**
   * Mock Contact Repository
   */
  static createMockContactRepository(): DeepMockProxy<ContactRepository> {
    return createMock<ContactRepository>();
  }

  /**
   * Mock Auth Service
   */
  static createMockAuthService(): DeepMockProxy<AuthService> {
    return createMock<AuthService>();
  }

  /**
   * Mock User Service
   */
  static createMockUserService(): DeepMockProxy<UserService> {
    return createMock<UserService>();
  }

  /**
   * Mock Contact Service
   */
  static createMockContactService(): DeepMockProxy<ContactService> {
    return createMock<ContactService>();
  }

  /**
   * Mock Express Request
   */
  static createMockRequest(overrides: any = {}): any {
    return {
      body: {},
      params: {},
      query: {},
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
      get: jest.fn(header => {
        const headers: Record<string, string> = {
          'user-agent': 'test-agent',
          'content-type': 'application/json',
          ...overrides.headers,
        };
        return headers[header.toLowerCase()];
      }),
      cookies: {},
      user: null,
      ...overrides,
    };
  }

  /**
   * Mock Express Response
   */
  static createMockResponse(): any {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      get: jest.fn(),
      locals: {},
    };

    return mockResponse;
  }

  /**
   * Mock Express Next function
   */
  static createMockNext(): jest.Mock {
    return jest.fn();
  }

  /**
   * Mock JWT functions
   */
  static mockJWT(): {
    sign: jest.Mock;
    verify: jest.Mock;
    decode: jest.Mock;
  } {
    const mockSign = jest.fn().mockReturnValue('mock.jwt.token');
    const mockVerify = jest.fn().mockReturnValue({
      sub: 'user-id',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const mockDecode = jest.fn().mockReturnValue({
      sub: 'user-id',
      email: 'test@example.com',
      role: 'user',
    });

    // Mock the jwt module
    jest.mock('jsonwebtoken', () => ({
      sign: mockSign,
      verify: mockVerify,
      decode: mockDecode,
    }));

    return {
      sign: mockSign,
      verify: mockVerify,
      decode: mockDecode,
    };
  }

  /**
   * Mock bcrypt functions
   */
  static mockBcrypt(): {
    hash: jest.Mock;
    compare: jest.Mock;
    genSalt: jest.Mock;
  } {
    const mockHash = jest.fn().mockResolvedValue('$2b$10$hashedpassword');
    const mockCompare = jest.fn().mockResolvedValue(true);
    const mockGenSalt = jest.fn().mockResolvedValue('$2b$10$salt');

    jest.mock('bcrypt', () => ({
      hash: mockHash,
      compare: mockCompare,
      genSalt: mockGenSalt,
    }));

    return {
      hash: mockHash,
      compare: mockCompare,
      genSalt: mockGenSalt,
    };
  }

  /**
   * Mock logger
   */
  static mockLogger(): any {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logAuth: jest.fn(),
      logSecurity: jest.fn(),
      logActivity: jest.fn(),
    };

    jest.mock('../../utils/logger', () => ({
      logger: mockLogger,
    }));

    return mockLogger;
  }

  /**
   * Mock email service
   */
  static mockEmailService(): any {
    return {
      sendEmail: jest.fn().mockResolvedValue(true),
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Mock rate limiter
   */
  static mockRateLimiter(): any {
    return jest.fn((req, res, next) => next());
  }

  /**
   * Mock validation middleware
   */
  static mockValidationMiddleware(): any {
    return {
      validateAuth: jest.fn((req, res, next) => next()),
      validateUser: jest.fn((req, res, next) => next()),
      validateContact: jest.fn((req, res, next) => next()),
    };
  }

  /**
   * Mock encryption service
   */
  static mockEncryptionService(): any {
    return {
      encrypt: jest.fn().mockReturnValue('encrypted-data'),
      decrypt: jest.fn().mockReturnValue('decrypted-data'),
      generateToken: jest.fn().mockReturnValue('generated-token'),
      hash: jest.fn().mockReturnValue('hashed-value'),
    };
  }
}

/**
 * Helper functions to set up common mock scenarios
 */
export class MockScenarios {
  /**
   * Set up successful authentication scenario
   */
  static setupSuccessfulAuth(): {
    mockAuthService: DeepMockProxy<AuthService>;
    mockUserRepository: DeepMockProxy<UserRepository>;
    testUser: any;
  } {
    const mockAuthService = TestMocks.createMockAuthService();
    const mockUserRepository = TestMocks.createMockUserRepository();

    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      isVerified: true,
      isActive: true,
    };

    mockAuthService.login.mockResolvedValue({
      user: testUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    mockUserRepository.findByEmail.mockResolvedValue(testUser);
    mockUserRepository.findByIdOrFail.mockResolvedValue(testUser);

    return {
      mockAuthService,
      mockUserRepository,
      testUser,
    };
  }

  /**
   * Set up failed authentication scenario
   */
  static setupFailedAuth(): {
    mockAuthService: DeepMockProxy<AuthService>;
    mockUserRepository: DeepMockProxy<UserRepository>;
  } {
    const mockAuthService = TestMocks.createMockAuthService();
    const mockUserRepository = TestMocks.createMockUserRepository();

    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
    mockUserRepository.findByEmail.mockResolvedValue(null);

    return {
      mockAuthService,
      mockUserRepository,
    };
  }

  /**
   * Set up database error scenario
   */
  static setupDatabaseError(): {
    mockPool: DeepMockProxy<Pool>;
    mockUserRepository: DeepMockProxy<UserRepository>;
  } {
    const mockPool = TestMocks.createMockPool();
    const mockUserRepository = TestMocks.createMockUserRepository();

    const dbError = new Error('Database connection failed');
    mockPool.query.mockRejectedValue(dbError);
    mockUserRepository.findByEmail.mockRejectedValue(dbError);

    return {
      mockPool,
      mockUserRepository,
    };
  }

  /**
   * Set up Redis error scenario
   */
  static setupRedisError(): {
    mockRedis: DeepMockProxy<Redis>;
  } {
    const mockRedis = TestMocks.createMockRedis();

    const redisError = new Error('Redis connection failed');
    mockRedis.get.mockRejectedValue(redisError);
    mockRedis.set.mockRejectedValue(redisError);

    return {
      mockRedis,
    };
  }
}

/**
 * Test data builders for creating mock responses
 */
export class MockResponseBuilder {
  /**
   * Build successful API response
   */
  static success<T>(data: T, message: string = 'Success'): any {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build error API response
   */
  static error(message: string, status: number = 400, details?: any): any {
    return {
      success: false,
      message,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build validation error response
   */
  static validationError(errors: Record<string, string[]>): any {
    return this.error('Validation failed', 422, { errors });
  }

  /**
   * Build authentication error response
   */
  static authError(message: string = 'Authentication required'): any {
    return this.error(message, 401);
  }

  /**
   * Build authorization error response
   */
  static authzError(message: string = 'Insufficient permissions'): any {
    return this.error(message, 403);
  }

  /**
   * Build not found error response
   */
  static notFoundError(resource: string = 'Resource'): any {
    return this.error(`${resource} not found`, 404);
  }

  /**
   * Build rate limit error response
   */
  static rateLimitError(): any {
    return this.error('Too many requests', 429);
  }

  /**
   * Build server error response
   */
  static serverError(message: string = 'Internal server error'): any {
    return this.error(message, 500);
  }
}

// Export convenience functions
export const {
  createMockPool,
  createMockRedis,
  createMockUserRepository,
  createMockContactRepository,
  createMockAuthService,
  createMockUserService,
  createMockContactService,
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockJWT,
  mockBcrypt,
  mockLogger,
  mockEmailService,
  mockRateLimiter,
  mockValidationMiddleware,
  mockEncryptionService,
} = TestMocks;

export const {
  setupSuccessfulAuth,
  setupFailedAuth,
  setupDatabaseError,
  setupRedisError,
} = MockScenarios;
