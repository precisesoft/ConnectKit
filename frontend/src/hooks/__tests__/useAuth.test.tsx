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
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('useAuth', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize as loading when tokens exist in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      const mockAuthData = {
        user: mockUser,
        accessToken: 'mock-access-token',
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

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(AuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token'
      );
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
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      (AuthService.login as vi.Mock).mockReturnValueOnce(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!({
          user: createMockUser(),
          accessToken: 'token',
          refreshToken: 'refresh-token',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const mockUser = createMockUser();

      // Setup authenticated state
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Manually set authenticated state
      act(() => {
        (result.current as any).setUser(mockUser);
        (result.current as any).setIsAuthenticated(true);
      });

      (AuthService.logout as vi.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });

      expect(AuthService.logout).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle logout errors gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      (AuthService.logout as vi.Mock).mockRejectedValueOnce(
        new Error('Logout failed')
      );

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state even if server logout fails
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const mockUser = createMockUser();
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      (AuthService.register as vi.Mock).mockResolvedValueOnce({
        user: mockUser,
        message: 'Registration successful',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register(registrationData);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(AuthService.register).toHaveBeenCalledWith(registrationData);
    });

    it('should handle registration failure', async () => {
      const errorMessage = 'Email already exists';
      (AuthService.register as vi.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register({
            username: 'testuser',
            email: 'existing@example.com',
            password: 'TestPass123!',
            confirmPassword: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'refreshToken') return 'old-refresh-token';
        return null;
      });

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (AuthService.refreshToken as vi.Mock).mockResolvedValueOnce(newTokens);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(AuthService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token'
      );
    });

    it('should handle refresh token failure', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-refresh-token');
      (AuthService.refreshToken as vi.Mock).mockRejectedValueOnce(
        new Error('Invalid refresh token')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error) {
          // Expected to throw
        }
      });

      // Should logout user when refresh fails
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
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

      const resetData = {
        token: 'reset-token',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      await act(async () => {
        await result.current.resetPassword(resetData);
      });

      expect(AuthService.resetPassword).toHaveBeenCalledWith(resetData);
    });

    it('should handle password change', async () => {
      (AuthService.changePassword as vi.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const changeData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      await act(async () => {
        await result.current.changePassword(changeData);
      });

      expect(AuthService.changePassword).toHaveBeenCalledWith(changeData);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when clearError is called', async () => {
      // Set an error state
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        (result.current as any).setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors', async () => {
      (AuthService.login as vi.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'TestPass123!',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network request failed');
      });
    });
  });

  describe('Persistence', () => {
    it('should restore user session from localStorage on initialization', async () => {
      const mockUser = createMockUser();
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'accessToken') return 'stored-access-token';
        if (key === 'refreshToken') return 'stored-refresh-token';
        return null;
      });

      (AuthService.getCurrentUser as vi.Mock).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(AuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle invalid stored tokens', async () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'accessToken') return 'invalid-token';
        return null;
      });

      (AuthService.getCurrentUser as vi.Mock).mockRejectedValueOnce(
        new Error('Invalid token')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
});
