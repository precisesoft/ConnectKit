import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthController, authController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import {
  InvalidCredentialsError,
  AccountLockedError,
  EmailNotVerifiedError,
  ValidationError,
} from '../../utils/errors';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockAuthService,
} from '../../tests/utils/mocks';
import {
  createLoginCredentials,
  createRegistrationData,
  createPasswordChangeData,
  createResetPasswordData,
  createUser,
  createApiSuccess,
} from '../../tests/utils/fixtures';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../services/auth.service');
jest.mock('../../utils/logger');

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockAuthService = createMockAuthService() as jest.Mocked<AuthService>;
    mockRequest = createMockRequest() as Request;
    mockResponse = createMockResponse() as Response;
    mockNext = createMockNext();

    // Mock the constructor dependencies
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

    controller = new AuthController();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const registrationData = createRegistrationData();
      const mockUser = createUser(registrationData);
      const mockResult = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        },
        message: 'Registration successful. Please check your email to verify your account.',
      };

      mockRequest.body = registrationData;
      mockAuthService.register.mockResolvedValue(mockResult);

      // Act
      await controller.register(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
        data: {
          user: mockResult.user,
        },
      });
    });

    it('should handle registration errors', async () => {
      // Arrange
      const registrationData = createRegistrationData();
      const error = new Error('Registration failed');

      mockRequest.body = registrationData;
      mockAuthService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(mockRequest, mockResponse)).rejects.toThrow(error);
      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginData = createLoginCredentials();
      const mockUser = createUser();
      const mockResult = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isVerified: mockUser.isVerified,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRequest.body = loginData;
      mockRequest.ip = '127.0.0.1';
      mockRequest.get = jest.fn().mockReturnValue('test-user-agent');
      mockAuthService.login.mockResolvedValue(mockResult);

      // Act
      await controller.login(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
          refreshToken: mockResult.refreshToken,
        },
      });
    });

    it('should set refresh token cookie when configured', async () => {
      // Arrange
      process.env.USE_REFRESH_COOKIE = 'true';
      
      const loginData = createLoginCredentials();
      const mockUser = createUser();
      const mockResult = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          isVerified: mockUser.isVerified,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResult);

      // Act
      await controller.login(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
          refreshToken: undefined,
        },
      });

      // Cleanup
      delete process.env.USE_REFRESH_COOKIE;
    });

    it('should handle invalid credentials error', async () => {
      // Arrange
      const loginData = createLoginCredentials();
      const error = new InvalidCredentialsError();

      mockRequest.body = loginData;
      mockRequest.ip = '127.0.0.1';
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(mockRequest, mockResponse)).rejects.toThrow(error);
    });

    it('should handle account locked error', async () => {
      // Arrange
      const loginData = createLoginCredentials();
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      const error = new AccountLockedError(lockedUntil);

      mockRequest.body = loginData;
      mockRequest.ip = '127.0.0.1';
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(mockRequest, mockResponse)).rejects.toThrow(error);
    });

    it('should handle email not verified error', async () => {
      // Arrange
      const loginData = createLoginCredentials();
      const error = new EmailNotVerifiedError();

      mockRequest.body = loginData;
      mockRequest.ip = '127.0.0.1';
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(mockRequest, mockResponse)).rejects.toThrow(error);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with request body', async () => {
      // Arrange
      process.env.USE_REFRESH_COOKIE = 'false';
      
      const refreshToken = 'refresh-token';
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRequest.body = { refreshToken };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      // Act
      await controller.refreshToken(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({ refreshToken });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: mockResult.accessToken,
          refreshToken: mockResult.refreshToken,
        },
      });

      // Cleanup
      delete process.env.USE_REFRESH_COOKIE;
    });

    it('should refresh token successfully with cookie', async () => {
      // Arrange
      process.env.USE_REFRESH_COOKIE = 'true';
      
      const refreshToken = 'refresh-token';
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRequest.cookies = { refreshToken };
      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      // Act
      await controller.refreshToken(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({ refreshToken });
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Cleanup
      delete process.env.USE_REFRESH_COOKIE;
    });

    it('should throw ValidationError when refresh token is missing', async () => {
      // Arrange
      process.env.USE_REFRESH_COOKIE = 'false';
      mockRequest.body = {};

      // Act & Assert
      await expect(controller.refreshToken(mockRequest, mockResponse)).rejects.toThrow(ValidationError);

      // Cleanup
      delete process.env.USE_REFRESH_COOKIE;
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const user = createUser();
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      (mockRequest as any).user = user;
      mockRequest.headers = { authorization: `Bearer ${accessToken}` };
      mockRequest.body = { refreshToken };
      mockAuthService.logout.mockResolvedValue(undefined);

      // Act
      await controller.logout(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith(user.id, accessToken, refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should logout user with cookie refresh token', async () => {
      // Arrange
      process.env.USE_REFRESH_COOKIE = 'true';
      
      const user = createUser();
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      (mockRequest as any).user = user;
      mockRequest.headers = { authorization: `Bearer ${accessToken}` };
      mockRequest.cookies = { refreshToken };
      mockAuthService.logout.mockResolvedValue(undefined);

      // Act
      await controller.logout(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith(user.id, accessToken, refreshToken);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');

      // Cleanup
      delete process.env.USE_REFRESH_COOKIE;
    });

    it('should throw ValidationError when access token is missing', async () => {
      // Arrange
      const user = createUser();
      (mockRequest as any).user = user;
      mockRequest.headers = {};

      // Act & Assert
      await expect(controller.logout(mockRequest, mockResponse)).rejects.toThrow(ValidationError);
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password request', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockResult = {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };

      mockRequest.body = { email };
      mockRequest.ip = '127.0.0.1';
      mockAuthService.forgotPassword.mockResolvedValue(mockResult);

      // Act
      await controller.forgotPassword(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({ email });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // Arrange
      const resetData = createResetPasswordData();
      const mockResult = {
        message: 'Password reset successful',
      };

      mockRequest.body = resetData;
      mockAuthService.resetPassword.mockResolvedValue(mockResult);

      // Act
      await controller.resetPassword(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const user = createUser();
      const changeData = createPasswordChangeData();
      const mockResult = {
        message: 'Password changed successfully',
      };

      (mockRequest as any).user = user;
      mockRequest.body = changeData;
      mockRequest.ip = '127.0.0.1';
      mockAuthService.changePassword.mockResolvedValue(mockResult);

      // Act
      await controller.changePassword(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(user.id, changeData);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const token = 'verification-token';
      const mockResult = {
        message: 'Email verified successfully',
      };

      mockRequest.body = { token };
      mockAuthService.verifyEmail.mockResolvedValue(mockResult);

      // Act
      await controller.verifyEmail(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith({ token });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend email verification successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockResult = {
        message: 'Verification email sent',
      };

      mockRequest.body = { email };
      mockRequest.ip = '127.0.0.1';
      mockAuthService.resendEmailVerification.mockResolvedValue(mockResult);

      // Act
      await controller.resendEmailVerification(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.resendEmailVerification).toHaveBeenCalledWith(email);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act & Assert
      await expect(controller.resendEmailVerification(mockRequest, mockResponse)).rejects.toThrow(ValidationError);
    });
  });

  describe('profile', () => {
    it('should return current user profile', async () => {
      // Arrange
      const user = createUser();
      (mockRequest as any).user = user;

      // Act
      await controller.profile(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const user = createUser();
      const mockResult = {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        },
      };

      mockRequest.body = { token };
      mockAuthService.validateToken.mockResolvedValue(mockResult);

      // Act
      await controller.validateToken(mockRequest, mockResponse);

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(token);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: mockResult.valid,
          user: mockResult.user,
        },
      });
    });

    it('should throw ValidationError when token is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act & Assert
      await expect(controller.validateToken(mockRequest, mockResponse)).rejects.toThrow(ValidationError);
    });
  });

  describe('status', () => {
    it('should return authenticated status', async () => {
      // Arrange
      const user = createUser();
      (mockRequest as any).user = user;

      // Act
      await controller.status(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      });
    });

    it('should return unauthenticated status', async () => {
      // Arrange
      (mockRequest as any).user = null;

      // Act
      await controller.status(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          authenticated: false,
          user: null,
        },
      });
    });
  });

  describe('passwordRequirements', () => {
    it('should return password requirements', async () => {
      // Act
      await controller.passwordRequirements(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          requirements: {
            minLength: 8,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            allowedSpecialChars: '@$!%*?&',
          },
          patterns: {
            uppercase: /[A-Z]/,
            lowercase: /[a-z]/,
            numbers: /\d/,
            specialChars: /[@$!%*?&]/,
          },
        },
      });
    });
  });

  describe('sessions', () => {
    it('should return user sessions', async () => {
      // Arrange
      const user = createUser();
      (mockRequest as any).user = user;
      mockRequest.get = jest.fn().mockReturnValue('test-user-agent');
      mockRequest.ip = '127.0.0.1';

      // Act
      await controller.sessions(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sessions: [
            {
              id: 'current',
              device: 'test-user-agent',
              ip: '127.0.0.1',
              lastActive: expect.any(String),
              current: true,
            },
          ],
          total: 1,
        },
      });
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      // Arrange
      const user = createUser();
      const sessionId = 'session-123';

      (mockRequest as any).user = user;
      mockRequest.params = { sessionId };
      mockRequest.ip = '127.0.0.1';

      // Act
      await controller.revokeSession(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session revoked successfully',
      });
    });

    it('should throw ValidationError when sessionId is missing', async () => {
      // Arrange
      const user = createUser();
      (mockRequest as any).user = user;
      mockRequest.params = {};

      // Act & Assert
      await expect(controller.revokeSession(mockRequest, mockResponse)).rejects.toThrow(ValidationError);
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(authController).toBeInstanceOf(AuthController);
    });

    it('should use the same instance across imports', () => {
      const { authController: controller2 } = require('../auth.controller');
      expect(authController).toBe(controller2);
    });
  });
});