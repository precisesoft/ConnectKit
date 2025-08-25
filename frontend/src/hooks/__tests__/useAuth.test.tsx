import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAuth } from '../useAuth';
import { AuthService } from '../../services/auth.service';
import { createMockUser, createTestQueryClient } from '../../tests/utils';

// Mock the UI store functions
vi.mock('../../store/uiStore', () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));

// Mock the auth store
const mockAuthStore = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: vi.fn(),
  setTokens: vi.fn(),
  clearAuth: vi.fn(),
  setLoading: vi.fn(),
  getAuthHeader: vi.fn(),
  isTokenExpired: vi.fn(),
};

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  AuthService: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationEmail: vi.fn(),
  },
}));

describe('useAuth', () => {
  let queryClient: QueryClient;
  const mockUser = createMockUser();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();

    // Reset mock auth store to default state
    mockAuthStore.user = null;
    mockAuthStore.token = null;
    mockAuthStore.refreshToken = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
    mockAuthStore.isTokenExpired.mockReturnValue(false);
    mockAuthStore.getAuthHeader.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values from auth store', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isInitializing).toBe(true);
    });

    it('should return authenticated state when user exists in store', () => {
      mockAuthStore.user = mockUser;
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.token = 'mock-token';

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('mock-token');
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.login as vi.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });

      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'mock-access-token',
        'mock-refresh-token'
      );
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials');
      (AuthService.login as vi.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(mockAuthStore.setUser).not.toHaveBeenCalled();
      expect(mockAuthStore.setTokens).not.toHaveBeenCalled();
    });

    it('should set loading state during login', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'token',
        refreshToken: 'refresh-token',
      };

      (AuthService.login as vi.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password',
        });
      });

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      (AuthService.logout as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle logout errors gracefully', async () => {
      const error = new Error('Logout failed');
      (AuthService.logout as vi.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear auth state even if API call fails
      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const mockAuthResponse = {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.register as vi.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });

      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'mock-token',
        'mock-refresh-token'
      );
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle registration failure', async () => {
      const error = new Error('Registration failed');
      (AuthService.register as vi.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Registration failed');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      mockAuthStore.refreshToken = 'valid-refresh-token';

      const mockResponse = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (AuthService.refreshToken as vi.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
    });

    it('should handle refresh token failure', async () => {
      mockAuthStore.refreshToken = null;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error: any) {
          expect(error.message).toBe('No refresh token available');
        }
      });
    });
  });

  describe('Password Management', () => {
    it('should handle forgot password request', async () => {
      (AuthService.forgotPassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.forgotPassword({ email: 'test@example.com' });
      });

      expect(AuthService.forgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should handle password reset', async () => {
      (AuthService.resetPassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPassword({
          token: 'reset-token',
          password: 'new-password',
        });
      });

      expect(AuthService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        password: 'new-password',
      });
    });

    it('should handle password change', async () => {
      (AuthService.changePassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.changePassword({
          currentPassword: 'old-password',
          newPassword: 'new-password',
        });
      });

      expect(AuthService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (AuthService.login as vi.Mock).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'password',
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Utilities', () => {
    it('should check user permissions correctly', () => {
      mockAuthStore.user = { ...mockUser, role: 'admin' };

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('any-permission')).toBe(true);
    });

    it('should check email verification status', () => {
      mockAuthStore.user = { ...mockUser, emailVerified: true };

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isEmailVerified()).toBe(true);
    });

    it('should get user display name', () => {
      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.getUserDisplayName()).toBe(
        `${mockUser.firstName} ${mockUser.lastName}`
      );
    });
  });
});
