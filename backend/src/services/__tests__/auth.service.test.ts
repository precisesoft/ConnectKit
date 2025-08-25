import { AuthService } from '../auth.service';
import { UserRepository } from '../../repositories/user.repository';
import {
  InvalidCredentialsError,
  AccountLockedError,
  EmailNotVerifiedError,
  InvalidTokenError,
} from '../../utils/errors';
import {
  createMockUserRepository,
  createMockRedis,
  setupSuccessfulAuth,
} from '../../tests/utils/mocks';
import {
  createUser,
  createLoginCredentials,
  createRegistrationData,
  createPasswordChangeData,
  createResetPasswordData,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../config/redis.config');
jest.mock('../../utils/logger');
jest.mock('../../middleware/auth.middleware');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockUserRepository =
      createMockUserRepository() as unknown as jest.Mocked<UserRepository>;
    mockRedis = createMockRedis();

    // Mock the constructor dependencies
    (
      UserRepository as jest.MockedClass<typeof UserRepository>
    ).mockImplementation(() => mockUserRepository);

    // Mock Redis connection
    jest.mock('../../config/redis.config', () => ({
      redisConnection: {
        getClient: () => mockRedis,
      },
    }));

    authService = new AuthService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registrationData = createRegistrationData();
      const newUser = createUser({
        ...registrationData,
        id: 'new-user-id',
      });

      mockUserRepository.createUser.mockResolvedValue(newUser);
      mockUserRepository.setVerificationToken.mockResolvedValue(undefined);
      mockRedis.setex.mockResolvedValue('OK');

      // Mock user methods
      const mockGenerateVerificationToken = jest
        .fn()
        .mockReturnValue('verification-token');
      newUser.generateVerificationToken = mockGenerateVerificationToken;

      // Act
      const result = await authService.register(registrationData);

      // Assert
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        registrationData
      );
      expect(mockGenerateVerificationToken).toHaveBeenCalled();
      expect(mockUserRepository.setVerificationToken).toHaveBeenCalledWith(
        newUser.id,
        'verification-token'
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'email_verification:verification-token',
        24 * 60 * 60,
        expect.stringContaining(newUser.id)
      );
      expect(result).toEqual({
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
        message:
          'Registration successful. Please check your email to verify your account.',
      });
    });

    it('should handle database errors during registration', async () => {
      // Arrange
      const registrationData = createRegistrationData();
      const dbError = new Error('Database connection failed');

      mockUserRepository.createUser.mockRejectedValue(dbError);

      // Act & Assert
      await expect(authService.register(registrationData)).rejects.toThrow(
        dbError
      );
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        registrationData
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const { testUser } = setupSuccessfulAuth();
      const loginCredentials = createLoginCredentials(testUser);

      const mockUser = createUser(testUser);
      mockUser.verifyPassword = jest.fn().mockResolvedValue(true);
      mockUser.isLocked = jest.fn().mockReturnValue(false);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.updateLoginInfo.mockResolvedValue(undefined);
      mockRedis.setex.mockResolvedValue('OK');

      // Mock token generation functions
      const mockGenerateAccessToken = jest.fn().mockReturnValue('access-token');
      const mockGenerateRefreshToken = jest
        .fn()
        .mockReturnValue('refresh-token');

      jest.mock('../../middleware/auth.middleware', () => ({
        generateAccessToken: mockGenerateAccessToken,
        generateRefreshToken: mockGenerateRefreshToken,
      }));

      // Act
      const result = await authService.login(loginCredentials);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginCredentials.email
      );
      expect(mockUser.verifyPassword).toHaveBeenCalledWith(
        loginCredentials.password
      );
      expect(mockUserRepository.updateLoginInfo).toHaveBeenCalledWith(
        mockUser.id,
        true
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
        7 * 24 * 60 * 60,
        'refresh-token'
      );
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw InvalidCredentialsError for non-existent user', async () => {
      // Arrange
      const loginCredentials = createLoginCredentials();
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow(
        InvalidCredentialsError
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginCredentials.email
      );
    });

    it('should throw AccountLockedError for locked account', async () => {
      // Arrange
      const loginCredentials = createLoginCredentials();
      const lockedUser = createUser({
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
      });

      lockedUser.isLocked = jest.fn().mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(lockedUser);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow(
        AccountLockedError
      );
      expect(lockedUser.isLocked).toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsError for invalid password', async () => {
      // Arrange
      const loginCredentials = createLoginCredentials();
      const mockUser = createUser();

      mockUser.isLocked = jest.fn().mockReturnValue(false);
      mockUser.verifyPassword = jest.fn().mockResolvedValue(false);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.updateLoginInfo.mockResolvedValue(undefined);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow(
        InvalidCredentialsError
      );
      expect(mockUser.verifyPassword).toHaveBeenCalledWith(
        loginCredentials.password
      );
      expect(mockUserRepository.updateLoginInfo).toHaveBeenCalledWith(
        mockUser.id,
        false
      );
    });

    it('should throw EmailNotVerifiedError for unverified email when required', async () => {
      // Arrange
      process.env.REQUIRE_EMAIL_VERIFICATION = 'true';

      const loginCredentials = createLoginCredentials();
      const unverifiedUser = createUser({ isVerified: false });

      unverifiedUser.isLocked = jest.fn().mockReturnValue(false);
      unverifiedUser.verifyPassword = jest.fn().mockResolvedValue(true);

      mockUserRepository.findByEmail.mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow(
        EmailNotVerifiedError
      );

      // Cleanup
      delete process.env.REQUIRE_EMAIL_VERIFICATION;
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-123';
      const mockUser = createUser({ id: userId });

      const mockVerifyRefreshToken = jest.fn().mockResolvedValue({
        userId,
        jti: 'token-jti',
      });

      jest.mock('../../middleware/auth.middleware', () => ({
        verifyRefreshToken: mockVerifyRefreshToken,
        blacklistToken: jest.fn().mockResolvedValue(undefined),
        generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
        generateRefreshToken: jest.fn().mockReturnValue('new-refresh-token'),
      }));

      mockRedis.get.mockResolvedValue(refreshToken);
      mockUserRepository.findByIdOrFail.mockResolvedValue(mockUser);
      mockRedis.setex.mockResolvedValue('OK');

      // Act
      const result = await authService.refreshToken({ refreshToken });

      // Assert
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockRedis.get).toHaveBeenCalledWith(`refresh_token:${userId}`);
      expect(mockUserRepository.findByIdOrFail).toHaveBeenCalledWith(userId);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw InvalidTokenError for non-existent token in Redis', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      const mockVerifyRefreshToken = jest.fn().mockResolvedValue({
        userId: 'user-123',
        jti: 'token-jti',
      });

      jest.mock('../../middleware/auth.middleware', () => ({
        verifyRefreshToken: mockVerifyRefreshToken,
      }));

      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken({ refreshToken })).rejects.toThrow(
        InvalidTokenError
      );
    });

    it('should throw InvalidTokenError for inactive user', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-123';
      const inactiveUser = createUser({ id: userId, isActive: false });

      const mockVerifyRefreshToken = jest.fn().mockResolvedValue({
        userId,
        jti: 'token-jti',
      });

      jest.mock('../../middleware/auth.middleware', () => ({
        verifyRefreshToken: mockVerifyRefreshToken,
      }));

      mockRedis.get.mockResolvedValue(refreshToken);
      mockUserRepository.findByIdOrFail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.refreshToken({ refreshToken })).rejects.toThrow(
        InvalidTokenError
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      const mockBlacklistToken = jest.fn().mockResolvedValue(undefined);
      const mockJwtDecode = jest.fn().mockReturnValue({
        jti: 'access-jti',
      });

      jest.mock('../../middleware/auth.middleware', () => ({
        blacklistToken: mockBlacklistToken,
      }));

      jest.mock('jsonwebtoken', () => ({
        decode: mockJwtDecode,
      }));

      mockRedis.del.mockResolvedValue(1);

      // Act
      await authService.logout(userId, accessToken, refreshToken);

      // Assert
      expect(mockJwtDecode).toHaveBeenCalledWith(accessToken);
      expect(mockRedis.del).toHaveBeenCalledWith(`refresh_token:${userId}`);
    });

    it('should handle logout errors gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const accessToken = 'access-token';

      const mockJwtDecode = jest.fn().mockReturnValue(null);
      jest.mock('jsonwebtoken', () => ({
        decode: mockJwtDecode,
      }));

      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(authService.logout(userId, accessToken)).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password request for existing user', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = createUser({ email });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.setPasswordResetToken.mockResolvedValue(undefined);
      mockRedis.setex.mockResolvedValue('OK');

      const mockGenerateToken = jest.fn().mockReturnValue('reset-token');
      jest.mock('../../utils/encryption', () => ({
        encryptionService: {
          generateToken: mockGenerateToken,
        },
      }));

      // Act
      const result = await authService.forgotPassword({ email });

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(mockUserRepository.setPasswordResetToken).toHaveBeenCalledWith(
        mockUser.id,
        'reset-token',
        expect.any(Date)
      );
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'password_reset:reset-token',
        60 * 60,
        expect.stringContaining(mockUser.id)
      );
      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.'
      );
    });

    it('should return generic message for non-existent user', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.forgotPassword({ email });

      // Assert
      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.'
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const resetData = createResetPasswordData('valid-token');
      const mockUser = createUser();

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          userId: mockUser.id,
          email: mockUser.email,
          createdAt: new Date().toISOString(),
        })
      );

      mockUserRepository.findByPasswordResetToken.mockResolvedValue(mockUser);
      mockUserRepository.resetPassword.mockResolvedValue(undefined);
      mockRedis.del.mockResolvedValue(1);

      // Mock blacklistAllUserTokens method
      const mockBlacklistAllUserTokens = jest.fn().mockResolvedValue(undefined);
      (authService as any).blacklistAllUserTokens = mockBlacklistAllUserTokens;

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(
        `password_reset:${resetData.token}`
      );
      expect(mockUserRepository.findByPasswordResetToken).toHaveBeenCalledWith(
        resetData.token
      );
      expect(mockUserRepository.resetPassword).toHaveBeenCalledWith(
        resetData.token,
        expect.any(String)
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        `password_reset:${resetData.token}`
      );
      expect(mockBlacklistAllUserTokens).toHaveBeenCalledWith(mockUser.id);
      expect(result.message).toContain('reset');
    });

    it('should throw InvalidTokenError for invalid token', async () => {
      // Arrange
      const resetData = createResetPasswordData('invalid-token');
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.resetPassword(resetData)).rejects.toThrow(
        InvalidTokenError
      );
    });

    it('should throw InvalidCredentialsError for password mismatch', async () => {
      // Arrange
      const resetData = createResetPasswordData('valid-token', {
        newPassword: 'password1',
        confirmPassword: 'password2',
      });

      // Act & Assert
      await expect(authService.resetPassword(resetData)).rejects.toThrow(
        InvalidCredentialsError
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      // Arrange
      const userId = 'user-123';
      const changeData = createPasswordChangeData();
      const mockUser = createUser({ id: userId });

      mockUser.verifyPassword = jest.fn().mockResolvedValue(true);
      mockUserRepository.findByIdOrFail.mockResolvedValue(mockUser);
      mockUserRepository.changePassword.mockResolvedValue(undefined);

      // Mock blacklistAllUserTokens method
      const mockBlacklistAllUserTokens = jest.fn().mockResolvedValue(undefined);
      (authService as any).blacklistAllUserTokens = mockBlacklistAllUserTokens;

      // Act
      const result = await authService.changePassword(userId, changeData);

      // Assert
      expect(mockUserRepository.findByIdOrFail).toHaveBeenCalledWith(userId);
      expect(mockUser.verifyPassword).toHaveBeenCalledWith(
        changeData.currentPassword
      );
      expect(mockUserRepository.changePassword).toHaveBeenCalledWith(
        userId,
        expect.any(String)
      );
      expect(mockBlacklistAllUserTokens).toHaveBeenCalledWith(userId);
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw InvalidCredentialsError for incorrect current password', async () => {
      // Arrange
      const userId = 'user-123';
      const changeData = createPasswordChangeData();
      const mockUser = createUser({ id: userId });

      mockUser.verifyPassword = jest.fn().mockResolvedValue(false);
      mockUserRepository.findByIdOrFail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.changePassword(userId, changeData)
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError for password mismatch', async () => {
      // Arrange
      const userId = 'user-123';
      const changeData = createPasswordChangeData({
        newPassword: 'password1',
        confirmPassword: 'password2',
      });

      // Act & Assert
      await expect(
        authService.changePassword(userId, changeData)
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = createUser();

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          userId: mockUser.id,
          email: mockUser.email,
          createdAt: new Date().toISOString(),
        })
      );

      mockUserRepository.verifyEmail.mockResolvedValue(mockUser);
      mockRedis.del.mockResolvedValue(1);

      // Act
      const result = await authService.verifyEmail({ token });

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`email_verification:${token}`);
      expect(mockUserRepository.verifyEmail).toHaveBeenCalledWith(token);
      expect(mockRedis.del).toHaveBeenCalledWith(`email_verification:${token}`);
      expect(result.message).toContain('verified');
    });

    it('should throw InvalidTokenError for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      mockRedis.get.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.verifyEmail({ token })).rejects.toThrow(
        InvalidTokenError
      );
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        jti: 'token-jti',
      };
      const mockUser = createUser({
        id: mockPayload.sub,
        email: mockPayload.email,
      });

      const mockJwtVerify = jest.fn().mockReturnValue(mockPayload);
      jest.mock('jsonwebtoken', () => ({
        verify: mockJwtVerify,
      }));

      mockRedis.exists.mockResolvedValue(0); // Not blacklisted
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        isVerified: mockUser.isVerified,
      });
    });

    it('should return invalid for blacklisted token', async () => {
      // Arrange
      const token = 'blacklisted-token';
      const mockPayload = {
        sub: 'user-123',
        jti: 'token-jti',
      };

      const mockJwtVerify = jest.fn().mockReturnValue(mockPayload);
      jest.mock('jsonwebtoken', () => ({
        verify: mockJwtVerify,
      }));

      mockRedis.exists.mockResolvedValue(1); // Blacklisted

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should return invalid for inactive user', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const mockPayload = {
        sub: 'user-123',
        jti: 'token-jti',
      };
      const inactiveUser = createUser({ id: mockPayload.sub, isActive: false });

      const mockJwtVerify = jest.fn().mockReturnValue(mockPayload);
      jest.mock('jsonwebtoken', () => ({
        verify: mockJwtVerify,
      }));

      mockRedis.exists.mockResolvedValue(0);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result.valid).toBe(false);
    });

    it('should return invalid for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';

      const mockJwtVerify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      jest.mock('jsonwebtoken', () => ({
        verify: mockJwtVerify,
      }));

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result.valid).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired tokens and accounts', async () => {
      // Arrange
      mockUserRepository.cleanupExpiredTokens.mockResolvedValue(undefined);
      mockUserRepository.unlockExpiredAccounts.mockResolvedValue(undefined);

      // Act
      await authService.cleanup();

      // Assert
      expect(mockUserRepository.cleanupExpiredTokens).toHaveBeenCalled();
      expect(mockUserRepository.unlockExpiredAccounts).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      const error = new Error('Cleanup failed');
      mockUserRepository.cleanupExpiredTokens.mockRejectedValue(error);

      // Act & Assert
      await expect(authService.cleanup()).resolves.toBeUndefined();
    });
  });
});
