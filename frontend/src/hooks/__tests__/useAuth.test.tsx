import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAuth } from '../useAuth';
import { AuthService } from '../../services/auth.service';
import { createMockUser, createTestQueryClient } from '../../tests/utils';

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
  isTokenExpired: vi.fn().mockReturnValue(false),
};

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock UI store
vi.mock('../../store/uiStore', () => ({
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));

describe('useAuth', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    
    // Reset auth store mock
    mockAuthStore.user = null;
    mockAuthStore.token = null;
    mockAuthStore.refreshToken = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
    mockAuthStore.isTokenExpired.mockReturnValue(false);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize as loading when tokens exist in store', () => {
      mockAuthStore.token = 'mock-token';
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      const mockAuthData = {
        user: mockUser,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.login as vi.Mock).mockResolvedValueOnce(mockAuthData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });

      expect(AuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'mock-access-token',
        'mock-refresh-token'
      );
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      (AuthService.login as vi.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isAuthenticated).toBe(false);
      });
      
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Set initial authenticated state
      mockAuthStore.user = createMockUser();
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.token = 'mock-token';

      (AuthService.logout as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(AuthService.logout).toHaveBeenCalled();
      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle logout failure gracefully', async () => {
      (AuthService.logout as vi.Mock).mockRejectedValueOnce(
        new Error('Logout failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Should clear auth state even if API call fails
      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Registration', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = createMockUser({ email: 'new@example.com' });
      const mockAuthData = {
        user: mockUser,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.register as vi.Mock).mockResolvedValueOnce(mockAuthData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'TestPass123!',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        });
      });

      expect(AuthService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      });

      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'mock-access-token',
        'mock-refresh-token'
      );
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshData = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthStore.refreshToken = 'old-refresh-token';
      (AuthService.refreshToken as vi.Mock).mockResolvedValueOnce(
        mockRefreshData
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(AuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(mockAuthStore.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle refresh token failure', async () => {
      mockAuthStore.refreshToken = 'invalid-refresh-token';
      (AuthService.refreshToken as vi.Mock).mockRejectedValueOnce(
        new Error('Refresh failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error) {
          // Expected to throw
        }
      });

      // Should clear auth state on refresh failure
      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
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
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle password reset', async () => {
      (AuthService.resetPassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPassword({
          token: 'reset-token',
          newPassword: 'NewPassword123!',
        });
      });

      expect(AuthService.resetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      });
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle password change', async () => {
      (AuthService.changePassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.changePassword({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });
      });

      expect(AuthService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
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
      (AuthService.login as vi.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'password',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Persistence', () => {
    it('should restore user session from stored tokens on initialization', async () => {
      const mockUser = createMockUser();
      mockAuthStore.token = 'valid-access-token';
      mockAuthStore.refreshToken = 'valid-refresh-token';
      mockAuthStore.isTokenExpired.mockReturnValue(false);

      (AuthService.getCurrentUser as vi.Mock).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(AuthService.getCurrentUser).toHaveBeenCalled();
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle invalid stored tokens', async () => {
      mockAuthStore.token = 'expired-token';
      mockAuthStore.refreshToken = 'expired-refresh-token';
      mockAuthStore.isTokenExpired.mockReturnValue(false);

      (AuthService.getCurrentUser as vi.Mock).mockRejectedValueOnce(
        new Error('Token expired')
      );
      (AuthService.refreshToken as vi.Mock).mockRejectedValueOnce(
        new Error('Refresh failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.initializeAuth();
      });

      expect(mockAuthStore.clearAuth).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should get user display name', () => {
      const mockUser = createMockUser({
        firstName: 'John',
        lastName: 'Doe',
      });
      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.getUserDisplayName()).toBe('John Doe');
    });

    it('should check if user has permission', () => {
      const mockUser = createMockUser({ role: 'admin' });
      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('any-permission')).toBe(true);
    });

    it('should check if email is verified', () => {
      const mockUser = createMockUser({ emailVerified: true });
      mockAuthStore.user = mockUser;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isEmailVerified()).toBe(true);
    });
  });
});