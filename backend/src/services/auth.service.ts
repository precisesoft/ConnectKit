import jwt from 'jsonwebtoken';
import { 
  User, 
  CreateUserDTO, 
  UserRole 
} from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { 
  InvalidCredentialsError,
  AccountLockedError,
  EmailNotVerifiedError,
  NotFoundError,
  ConflictError,
  InvalidTokenError,
  ExpiredTokenError
} from '../utils/errors';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  blacklistToken 
} from '../middleware/auth.middleware';
import { authConfig } from '../config/auth.config';
import { redisConnection } from '../config/redis.config';
import { logger } from '../utils/logger';
import { encryptionService } from '../utils/encryption';
import { EMAIL_CONSTANTS, SUCCESS_MESSAGES } from '../utils/constants';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest extends CreateUserDTO {}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private redis: any;

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisConnection.getClient();
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Create the user
      const user = await this.userRepository.createUser(request);
      
      // Generate email verification token
      const verificationToken = user.generateVerificationToken();
      await this.userRepository.setVerificationToken(user.id, verificationToken);
      
      // Store verification token in Redis with expiration
      const verificationKey = `email_verification:${verificationToken}`;
      await this.redis.setex(verificationKey, 24 * 60 * 60, JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      }));
      
      logger.logAuth('user_registered', user.id, {
        email: user.email,
        username: user.username,
        role: user.role,
      });
      
      // TODO: Send verification email (integrate with email service)
      
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        message: 'Registration successful. Please check your email to verify your account.',
      };
      
    } catch (error) {
      logger.error('Registration failed', { error, request: { email: request.email } });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(request.email);
      
      if (!user) {
        // Log failed login attempt
        logger.logAuth('login_failed', 'unknown', {
          email: request.email,
          reason: 'user_not_found',
        });
        throw new InvalidCredentialsError();
      }
      
      // Check if account is locked
      if (user.isLocked()) {
        logger.logAuth('login_blocked', user.id, {
          reason: 'account_locked',
          lockedUntil: user.lockedUntil,
        });
        throw new AccountLockedError(user.lockedUntil!);
      }
      
      // Verify password
      const isValidPassword = await user.verifyPassword(request.password);
      
      if (!isValidPassword) {
        // Update failed login attempts
        await this.userRepository.updateLoginInfo(user.id, false);
        
        logger.logAuth('login_failed', user.id, {
          email: user.email,
          reason: 'invalid_password',
          failedAttempts: user.failedLoginAttempts + 1,
        });
        
        throw new InvalidCredentialsError();
      }
      
      // Check if email is verified (optional based on configuration)
      if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        logger.logAuth('login_blocked', user.id, {
          reason: 'email_not_verified',
        });
        throw new EmailNotVerifiedError();
      }
      
      // Update successful login info
      await this.userRepository.updateLoginInfo(user.id, true);
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);
      
      // Store refresh token in Redis
      const refreshKey = `refresh_token:${user.id}`;
      await this.redis.setex(refreshKey, 7 * 24 * 60 * 60, refreshToken); // 7 days
      
      logger.logAuth('login_successful', user.id, {
        email: user.email,
        role: user.role,
      });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      };
      
    } catch (error) {
      if (!(error instanceof InvalidCredentialsError || 
            error instanceof AccountLockedError || 
            error instanceof EmailNotVerifiedError)) {
        logger.error('Login error', { error, request: { email: request.email } });
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const { userId, jti } = await verifyRefreshToken(request.refreshToken);
      
      // Check if refresh token exists in Redis
      const refreshKey = `refresh_token:${userId}`;
      const storedToken = await this.redis.get(refreshKey);
      
      if (!storedToken || storedToken !== request.refreshToken) {
        throw new InvalidTokenError('Invalid refresh token');
      }
      
      // Get user
      const user = await this.userRepository.findByIdOrFail(userId);
      
      if (!user.isActive) {
        throw new InvalidTokenError('User account is inactive');
      }
      
      // Blacklist old refresh token
      if (jti) {
        const decoded = jwt.decode(request.refreshToken) as any;
        await blacklistToken(jti, decoded.exp, userId, 'refresh');
      }
      
      // Generate new tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);
      
      // Store new refresh token
      await this.redis.setex(refreshKey, 7 * 24 * 60 * 60, refreshToken);
      
      logger.logAuth('token_refreshed', userId, {
        email: user.email,
      });
      
      return {
        accessToken,
        refreshToken,
      };
      
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Blacklist access token
      const decodedAccess = jwt.decode(accessToken) as any;
      if (decodedAccess?.jti) {
        await blacklistToken(decodedAccess.jti, decodedAccess.exp, userId, 'logout');
      }
      
      // Blacklist refresh token if provided
      if (refreshToken) {
        const decodedRefresh = jwt.decode(refreshToken) as any;
        if (decodedRefresh?.jti) {
          await blacklistToken(decodedRefresh.jti, decodedRefresh.exp, userId, 'logout');
        }
      }
      
      // Remove refresh token from Redis
      const refreshKey = `refresh_token:${userId}`;
      await this.redis.del(refreshKey);
      
      logger.logAuth('logout_successful', userId);
      
    } catch (error) {
      logger.error('Logout error', { error, userId });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findByEmail(request.email);
      
      // Don't reveal if user exists
      const message = 'If an account with that email exists, a password reset link has been sent.';
      
      if (!user) {
        logger.logAuth('password_reset_requested', 'unknown', {
          email: request.email,
          reason: 'user_not_found',
        });
        return { message };
      }
      
      // Generate reset token
      const resetToken = encryptionService.generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await this.userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);
      
      // Store reset token in Redis
      const resetKey = `password_reset:${resetToken}`;
      await this.redis.setex(resetKey, 60 * 60, JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      }));
      
      logger.logAuth('password_reset_requested', user.id, {
        email: user.email,
      });
      
      // TODO: Send password reset email
      
      return { message };
      
    } catch (error) {
      logger.error('Forgot password error', { error, email: request.email });
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        throw new InvalidCredentialsError('Passwords do not match');
      }
      
      // Verify token exists in Redis
      const resetKey = `password_reset:${request.token}`;
      const tokenData = await this.redis.get(resetKey);
      
      if (!tokenData) {
        throw new InvalidTokenError('Invalid or expired reset token');
      }
      
      // Find user with token
      const user = await this.userRepository.findByPasswordResetToken(request.token);
      
      if (!user) {
        throw new InvalidTokenError('Invalid or expired reset token');
      }
      
      // Reset password
      const tempUser = new User({
        email: user.email,
        username: user.username,
        password: request.newPassword,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      
      await tempUser.hashPassword();
      await this.userRepository.resetPassword(request.token, tempUser.passwordHash!);
      
      // Remove reset token from Redis
      await this.redis.del(resetKey);
      
      // Blacklist all user tokens
      await this.blacklistAllUserTokens(user.id);
      
      logger.logAuth('password_reset_successful', user.id, {
        email: user.email,
      });
      
      // TODO: Send password change confirmation email
      
      return { message: SUCCESS_MESSAGES.PASSWORD_RESET };
      
    } catch (error) {
      logger.error('Password reset error', { error });
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string, 
    request: ChangePasswordRequest
  ): Promise<{ message: string }> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        throw new InvalidCredentialsError('Passwords do not match');
      }
      
      const user = await this.userRepository.findByIdOrFail(userId);
      
      // Verify current password
      const isValidPassword = await user.verifyPassword(request.currentPassword);
      if (!isValidPassword) {
        throw new InvalidCredentialsError('Current password is incorrect');
      }
      
      // Hash new password
      const tempUser = new User({
        email: user.email,
        username: user.username,
        password: request.newPassword,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      
      await tempUser.hashPassword();
      await this.userRepository.changePassword(userId, tempUser.passwordHash!);
      
      // Blacklist all user tokens except current session
      await this.blacklistAllUserTokens(userId);
      
      logger.logAuth('password_changed', userId, {
        email: user.email,
      });
      
      // TODO: Send password change confirmation email
      
      return { message: 'Password changed successfully' };
      
    } catch (error) {
      logger.error('Change password error', { error, userId });
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<{ message: string }> {
    try {
      // Check token in Redis first
      const verificationKey = `email_verification:${request.token}`;
      const tokenData = await this.redis.get(verificationKey);
      
      if (!tokenData) {
        throw new InvalidTokenError('Invalid or expired verification token');
      }
      
      // Verify email
      const user = await this.userRepository.verifyEmail(request.token);
      
      // Remove token from Redis
      await this.redis.del(verificationKey);
      
      logger.logAuth('email_verified', user.id, {
        email: user.email,
      });
      
      return { message: SUCCESS_MESSAGES.EMAIL_VERIFIED };
      
    } catch (error) {
      logger.error('Email verification error', { error });
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists
        return { message: 'If an account with that email exists and is unverified, a verification email has been sent.' };
      }
      
      if (user.isVerified) {
        return { message: 'Email is already verified.' };
      }
      
      // Generate new verification token
      const verificationToken = user.generateVerificationToken();
      await this.userRepository.setVerificationToken(user.id, verificationToken);
      
      // Store in Redis
      const verificationKey = `email_verification:${verificationToken}`;
      await this.redis.setex(verificationKey, 24 * 60 * 60, JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      }));
      
      logger.logAuth('verification_email_resent', user.id, {
        email: user.email,
      });
      
      // TODO: Send verification email
      
      return { message: 'Verification email sent.' };
      
    } catch (error) {
      logger.error('Resend verification error', { error, email });
      throw error;
    }
  }

  /**
   * Validate token without authentication
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const jwtConfig = authConfig.getJWTConfig();
      const payload = jwt.verify(token, jwtConfig.secret) as any;
      
      // Check if token is blacklisted
      if (payload.jti) {
        const blacklistKey = `token_blacklist:${payload.jti}`;
        const isBlacklisted = await this.redis.exists(blacklistKey);
        if (isBlacklisted) {
          return { valid: false };
        }
      }
      
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        return { valid: false };
      }
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        },
      };
      
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Blacklist all tokens for a user
   */
  private async blacklistAllUserTokens(userId: string): Promise<void> {
    try {
      // Remove refresh token
      const refreshKey = `refresh_token:${userId}`;
      await this.redis.del(refreshKey);
      
      // TODO: Blacklist all access tokens for this user
      // This would require keeping track of issued tokens
      
    } catch (error) {
      logger.error('Error blacklisting user tokens', { error, userId });
    }
  }

  /**
   * Clean up expired tokens and verification data
   */
  async cleanup(): Promise<void> {
    try {
      // Clean up expired password reset tokens
      await this.userRepository.cleanupExpiredTokens();
      
      // Unlock expired accounts
      await this.userRepository.unlockExpiredAccounts();
      
      logger.info('Auth service cleanup completed');
      
    } catch (error) {
      logger.error('Auth service cleanup error', { error });
    }
  }
}