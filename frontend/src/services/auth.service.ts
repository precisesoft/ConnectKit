import { ApiClient } from './api.client';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ApiResponse,
} from './types';

/**
 * Authentication service for handling all auth-related API calls
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await ApiClient.post<AuthResponse>('/auth/login', credentials);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user account
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await ApiClient.post<AuthResponse>('/auth/register', userData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user (invalidate tokens on server)
   */
  static async logout(): Promise<void> {
    try {
      await ApiClient.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Logout error:', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await ApiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Send forgot password email
   */
  static async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/forgot-password', request);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password using token from email
   */
  static async resetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/reset-password', request);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change user password (requires current password)
   */
  static async changePassword(request: ChangePasswordRequest): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/change-password', request);
      
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Verify email address using token from email
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/verify-email', { token });
      
      if (!response.success) {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  static async resendVerificationEmail(): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/resend-verification');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile from token
   */
  static async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const response = await ApiClient.get<AuthResponse['user']>('/auth/me');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get user profile');
      }

      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Check if email is available for registration
   */
  static async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response = await ApiClient.post<{ available: boolean }>('/auth/check-email', {
        email,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Email availability check failed');
      }

      return response.data.available;
    } catch (error) {
      console.error('Email availability check error:', error);
      // Return false if check fails to be safe
      return false;
    }
  }

  /**
   * Enable two-factor authentication
   */
  static async enableTwoFactor(): Promise<{ qrCode: string; backupCodes: string[] }> {
    try {
      const response = await ApiClient.post<{ qrCode: string; backupCodes: string[] }>(
        '/auth/2fa/enable'
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to enable two-factor authentication');
      }

      return response.data;
    } catch (error) {
      console.error('Enable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Verify and confirm two-factor authentication setup
   */
  static async confirmTwoFactor(token: string): Promise<{ backupCodes: string[] }> {
    try {
      const response = await ApiClient.post<{ backupCodes: string[] }>(
        '/auth/2fa/confirm',
        { token }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Two-factor authentication confirmation failed');
      }

      return response.data;
    } catch (error) {
      console.error('Confirm 2FA error:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  static async disableTwoFactor(password: string): Promise<void> {
    try {
      const response = await ApiClient.post<void>('/auth/2fa/disable', { password });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to disable two-factor authentication');
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes for 2FA
   */
  static async generateBackupCodes(password: string): Promise<string[]> {
    try {
      const response = await ApiClient.post<{ backupCodes: string[] }>(
        '/auth/2fa/backup-codes',
        { password }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate backup codes');
      }

      return response.data.backupCodes;
    } catch (error) {
      console.error('Generate backup codes error:', error);
      throw error;
    }
  }

  /**
   * Get list of active sessions
   */
  static async getActiveSessions(): Promise<Array<{
    id: string;
    deviceInfo: string;
    location?: string;
    ipAddress: string;
    lastActivity: string;
    current: boolean;
  }>> {
    try {
      const response = await ApiClient.get<Array<{
        id: string;
        deviceInfo: string;
        location?: string;
        ipAddress: string;
        lastActivity: string;
        current: boolean;
      }>>('/auth/sessions');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get active sessions');
      }

      return response.data;
    } catch (error) {
      console.error('Get active sessions error:', error);
      throw error;
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    try {
      const response = await ApiClient.delete<void>(`/auth/sessions/${sessionId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  }

  /**
   * Revoke all sessions except current
   */
  static async revokeAllSessions(): Promise<void> {
    try {
      const response = await ApiClient.delete<void>('/auth/sessions');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      throw error;
    }
  }
}