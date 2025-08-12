import { useState, useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { AuthService } from '@services/auth.service';
import { 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse 
} from '@services/types';
import { showErrorNotification, showSuccessNotification } from '@store/uiStore';

/**
 * Custom hook for authentication operations
 * Provides methods for login, register, logout, and other auth operations
 */
export const useAuth = () => {
  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    setUser,
    setTokens,
    clearAuth,
    setLoading,
    getAuthHeader,
    isTokenExpired,
  } = useAuthStore();

  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize authentication state from stored tokens
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Check if we have a valid token
      if (token && !isTokenExpired()) {
        try {
          // Verify token and get current user data
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Token verification failed:', error);
          // If token verification fails, try to refresh
          if (refreshToken) {
            try {
              const refreshResponse = await AuthService.refreshToken(refreshToken);
              setTokens(refreshResponse.token, refreshResponse.refreshToken);
              
              // Get user data with new token
              const userData = await AuthService.getCurrentUser();
              setUser(userData);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              clearAuth();
            }
          } else {
            clearAuth();
          }
        }
      } else if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResponse = await AuthService.refreshToken(refreshToken);
          setTokens(refreshResponse.token, refreshResponse.refreshToken);
          
          // Get user data with new token
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearAuth();
        }
      } else {
        // No valid tokens, ensure auth is cleared
        clearAuth();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuth();
    } finally {
      setIsInitializing(false);
    }
  }, [token, refreshToken, isTokenExpired, setUser, setTokens, clearAuth]);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      const response = await AuthService.login(credentials);
      
      // Store tokens and user data
      setTokens(response.token, response.refreshToken);
      setUser(response.user);
      
      showSuccessNotification(
        `Welcome back, ${response.user.firstName}!`,
        'Login Successful'
      );
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setTokens, setUser]);

  /**
   * Register new user account
   */
  const register = useCallback(async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      const response = await AuthService.register(userData);
      
      // Store tokens and user data
      setTokens(response.token, response.refreshToken);
      setUser(response.user);
      
      showSuccessNotification(
        `Welcome to ConnectKit, ${response.user.firstName}!`,
        'Registration Successful'
      );
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setTokens, setUser]);

  /**
   * Logout user and clear auth state
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call logout API to invalidate token on server
      await AuthService.logout();
      
      showSuccessNotification('You have been signed out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error - logout should always succeed locally
    } finally {
      // Always clear auth state
      clearAuth();
      setLoading(false);
    }
  }, [setLoading, clearAuth]);

  /**
   * Send forgot password email
   */
  const forgotPassword = useCallback(async (request: ForgotPasswordRequest): Promise<void> => {
    try {
      setLoading(true);
      
      await AuthService.forgotPassword(request);
      
      showSuccessNotification(
        'Password reset instructions have been sent to your email.',
        'Email Sent'
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * Reset password using token from email
   */
  const resetPassword = useCallback(async (request: ResetPasswordRequest): Promise<void> => {
    try {
      setLoading(true);
      
      await AuthService.resetPassword(request);
      
      showSuccessNotification(
        'Your password has been reset successfully. Please sign in with your new password.',
        'Password Reset'
      );
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * Change user password (requires current password)
   */
  const changePassword = useCallback(async (request: ChangePasswordRequest): Promise<void> => {
    try {
      setLoading(true);
      
      await AuthService.changePassword(request);
      
      showSuccessNotification(
        'Your password has been changed successfully.',
        'Password Changed'
      );
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * Verify email address using token
   */
  const verifyEmail = useCallback(async (token: string): Promise<void> => {
    try {
      setLoading(true);
      
      await AuthService.verifyEmail(token);
      
      // Refresh user data to reflect verified status
      if (isAuthenticated) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      }
      
      showSuccessNotification(
        'Your email has been verified successfully!',
        'Email Verified'
      );
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, isAuthenticated, setUser]);

  /**
   * Resend email verification
   */
  const resendVerificationEmail = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      await AuthService.resendVerificationEmail();
      
      showSuccessNotification(
        'Verification email has been sent to your email address.',
        'Email Sent'
      );
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * Refresh authentication token
   */
  const refreshAuthToken = useCallback(async (): Promise<void> => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      setLoading(true);
      
      const response = await AuthService.refreshToken(refreshToken);
      setTokens(response.token, response.refreshToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [refreshToken, setLoading, setTokens, clearAuth]);

  /**
   * Check if current user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    // Add your permission logic here
    // This would typically check against user permissions/roles
    return true; // Placeholder - implement based on your auth system
  }, [user]);

  /**
   * Check if user email is verified
   */
  const isEmailVerified = useCallback((): boolean => {
    return user?.emailVerified ?? false;
  }, [user]);

  /**
   * Get user display name
   */
  const getUserDisplayName = useCallback((): string => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  return {
    // State
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    isInitializing,
    
    // Actions
    initializeAuth,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    refreshAuthToken,
    
    // Utilities
    hasPermission,
    isEmailVerified,
    getUserDisplayName,
    getAuthHeader,
    isTokenExpired,
  };
};