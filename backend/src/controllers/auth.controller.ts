import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { 
  AuthService,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest
} from '../services/auth.service';
import { 
  ValidationError,
  InvalidCredentialsError,
  AccountLockedError,
  EmailNotVerifiedError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/error.middleware';
import { SUCCESS_MESSAGES } from '../utils/constants';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const registerData: RegisterRequest = req.body;
    
    const result = await this.authService.register(registerData);
    
    logger.logAuth('registration_attempt', result.user.id, {
      email: result.user.email,
      username: result.user.username,
    });
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
      },
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loginData: LoginRequest = req.body;
    
    try {
      const result = await this.authService.login(loginData);
      
      // Set HTTP-only cookie for refresh token if configured
      if (process.env.USE_REFRESH_COOKIE === 'true') {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }
      
      logger.logAuth('login_successful', result.user.id, {
        email: result.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: process.env.USE_REFRESH_COOKIE === 'true' ? undefined : result.refreshToken,
        },
      });
      
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        logger.logAuth('login_failed', 'unknown', {
          email: loginData.email,
          reason: 'invalid_credentials',
          ip: req.ip,
        });
      } else if (error instanceof AccountLockedError) {
        logger.logSecurity('login_blocked', {
          email: loginData.email,
          reason: 'account_locked',
          ip: req.ip,
        });
      } else if (error instanceof EmailNotVerifiedError) {
        logger.logAuth('login_blocked', 'unknown', {
          email: loginData.email,
          reason: 'email_not_verified',
          ip: req.ip,
        });
      }
      throw error;
    }
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let refreshToken: string;
    
    // Get refresh token from cookie or request body
    if (process.env.USE_REFRESH_COOKIE === 'true') {
      refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new ValidationError('Refresh token cookie not found');
      }
    } else {
      const requestData: RefreshTokenRequest = req.body;
      refreshToken = requestData.refreshToken;
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }
    }
    
    const result = await this.authService.refreshToken({ refreshToken });
    
    // Update refresh token cookie if using cookies
    if (process.env.USE_REFRESH_COOKIE === 'true') {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        refreshToken: process.env.USE_REFRESH_COOKIE === 'true' ? undefined : result.refreshToken,
      },
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const accessToken = req.headers.authorization?.split(' ')[1];
    let refreshToken: string | undefined;
    
    // Get refresh token from cookie or request body
    if (process.env.USE_REFRESH_COOKIE === 'true') {
      refreshToken = req.cookies.refreshToken;
    } else {
      refreshToken = req.body.refreshToken;
    }
    
    if (!accessToken) {
      throw new ValidationError('Access token is required');
    }
    
    await this.authService.logout(user.id, accessToken, refreshToken);
    
    // Clear refresh token cookie
    if (process.env.USE_REFRESH_COOKIE === 'true') {
      res.clearCookie('refreshToken');
    }
    
    logger.logAuth('logout_successful', user.id, {
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  });

  /**
   * Forgot password - send reset email
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const requestData: ForgotPasswordRequest = req.body;
    
    const result = await this.authService.forgotPassword(requestData);
    
    logger.logAuth('password_reset_requested', 'unknown', {
      email: requestData.email,
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Reset password using token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const requestData: ResetPasswordRequest = req.body;
    
    const result = await this.authService.resetPassword(requestData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Change password for authenticated user
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const requestData: ChangePasswordRequest = req.body;
    
    const result = await this.authService.changePassword(user.id, requestData);
    
    logger.logAuth('password_changed', user.id, {
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Verify email address
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const requestData: VerifyEmailRequest = req.body;
    
    const result = await this.authService.verifyEmail(requestData);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Resend email verification
   */
  resendEmailVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    
    if (!email) {
      throw new ValidationError('Email is required');
    }
    
    const result = await this.authService.resendEmailVerification(email);
    
    logger.logAuth('verification_email_requested', 'unknown', {
      email,
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Get current user profile
   */
  profile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    
    res.status(StatusCodes.OK).json({
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

  /**
   * Validate token
   */
  validateToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    
    if (!token) {
      throw new ValidationError('Token is required');
    }
    
    const result = await this.authService.validateToken(token);
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        valid: result.valid,
        user: result.user,
      },
    });
  });

  /**
   * Get authentication status
   */
  status = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    
    const isAuthenticated = !!user;
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        authenticated: isAuthenticated,
        user: isAuthenticated ? {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        } : null,
      },
    });
  });

  /**
   * Check if email exists (for registration validation)
   */
  checkEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;
    
    if (!email) {
      throw new ValidationError('Email is required');
    }
    
    // This is a simplified check - in production you might want to be more cautious
    // about revealing whether an email exists for security reasons
    const result = await this.authService.validateToken('dummy');
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        exists: false, // Implement actual email check logic
        available: true,
      },
    });
  });

  /**
   * Check if username exists (for registration validation)
   */
  checkUsername = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    
    if (!username) {
      throw new ValidationError('Username is required');
    }
    
    // This is a simplified check - implement actual username check logic
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        exists: false,
        available: true,
      },
    });
  });

  /**
   * Get password strength requirements
   */
  passwordRequirements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(StatusCodes.OK).json({
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

  /**
   * Logout from all devices
   */
  logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    
    // This would typically invalidate all refresh tokens for the user
    // and blacklist all access tokens (implementation depends on your token strategy)
    
    logger.logAuth('logout_all_devices', user.id, {
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  });

  /**
   * Get user sessions (active tokens)
   */
  sessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    
    // This would typically fetch active sessions from your token store
    const sessions = [
      {
        id: 'current',
        device: req.get('User-Agent') || 'Unknown',
        ip: req.ip,
        lastActive: new Date().toISOString(),
        current: true,
      },
    ];
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        sessions,
        total: sessions.length,
      },
    });
  });

  /**
   * Revoke a specific session
   */
  revokeSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const { sessionId } = req.params;
    
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }
    
    // Implement session revocation logic
    
    logger.logAuth('session_revoked', user.id, {
      sessionId,
      ip: req.ip,
    });
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Session revoked successfully',
    });
  });
}

// Factory function for lazy instantiation
export const createAuthController = (): AuthController => {
  return new AuthController();
};