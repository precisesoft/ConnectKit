import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { User } from '@types/user.types';

// Define the authentication state interface
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;

  // Actions
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateLastActivity: () => void;
  isTokenExpired: () => boolean;
  getAuthHeader: () => string | null;
}

// Token utility functions
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    // Decode JWT token (basic decode, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);

    if (!exp) return true;

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now() / 1000;
    return exp < now + 300; // 5 minutes buffer
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Create the authentication store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        lastActivity: Date.now(),

        // Actions
        setUser: (user: User) => {
          set(
            {
              user,
              isAuthenticated: !!user,
              lastActivity: Date.now(),
            },
            false,
            'setUser'
          );
        },

        setTokens: (token: string, refreshToken?: string) => {
          set(
            {
              token,
              refreshToken: refreshToken || get().refreshToken,
              isAuthenticated: true,
              lastActivity: Date.now(),
            },
            false,
            'setTokens'
          );
        },

        clearAuth: () => {
          set(
            {
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              lastActivity: Date.now(),
            },
            false,
            'clearAuth'
          );
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'setLoading');
        },

        updateLastActivity: () => {
          set({ lastActivity: Date.now() }, false, 'updateLastActivity');
        },

        isTokenExpired: () => {
          const { token } = get();
          return isTokenExpired(token);
        },

        getAuthHeader: () => {
          const { token, isTokenExpired } = get();
          if (!token || isTokenExpired()) {
            return null;
          }
          return `Bearer ${token}`;
        },
      })),
      {
        name: 'connectkit-auth', // localStorage key
        partialize: state => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          lastActivity: state.lastActivity,
        }),
        // Custom storage handlers for security
        storage: {
          getItem: name => {
            try {
              const item = localStorage.getItem(name);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.error('Error reading from localStorage:', error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.error('Error writing to localStorage:', error);
            }
          },
          removeItem: name => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error('Error removing from localStorage:', error);
            }
          },
        },
        // Migrate old state versions if needed
        version: 1,
        migrate: (persistedState: any, version) => {
          if (version === 0) {
            // Migration logic for version 0 to 1
            return {
              ...persistedState,
              lastActivity: Date.now(),
            };
          }
          return persistedState;
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selectors for performance optimization
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () =>
  useAuthStore(state => state.isAuthenticated);
export const useAuthToken = () => useAuthStore(state => state.token);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);

// Session timeout management
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Subscribe to store changes for session management
useAuthStore.subscribe(
  state => state.lastActivity,
  lastActivity => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;

    // Auto-logout if session has been inactive for too long
    if (
      timeSinceActivity > SESSION_TIMEOUT &&
      useAuthStore.getState().isAuthenticated
    ) {
      console.warn('Session timed out due to inactivity');
      useAuthStore.getState().clearAuth();
      // You might want to show a toast notification here
    }
  }
);

// Auto-logout when token expires
useAuthStore.subscribe(
  state => state.token,
  token => {
    if (token && isTokenExpired(token)) {
      console.warn('Token expired, logging out');
      useAuthStore.getState().clearAuth();
    }
  }
);
