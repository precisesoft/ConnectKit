import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';
import 'jest-axe/extend-expect';

// Setup MSW
beforeAll(() => {
  // Start the mock service worker
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();

  // Clean up DOM between tests
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();
});

afterAll(() => {
  // Stop the mock service worker
  server.close();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock fetch if not already mocked by MSW
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Note: Router context is provided by test utils, no global mocking needed

// Mock Material-UI theme
vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2',
          contrastText: '#fff',
        },
        secondary: {
          main: '#dc004e',
          contrastText: '#fff',
        },
        error: {
          main: '#f44336',
        },
        warning: {
          main: '#ff9800',
        },
        info: {
          main: '#2196f3',
        },
        success: {
          main: '#4caf50',
        },
        background: {
          default: '#fafafa',
          paper: '#fff',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
      },
      spacing: (factor: number) => `${8 * factor}px`,
      breakpoints: {
        up: () => '@media (min-width: 0px)',
        down: () => '@media (max-width: 0px)',
        between: () => '@media (min-width: 0px) and (max-width: 0px)',
        values: {
          xs: 0,
          sm: 600,
          md: 900,
          lg: 1200,
          xl: 1536,
        },
      },
      typography: {
        h1: { fontSize: '2rem' },
        h2: { fontSize: '1.75rem' },
        h3: { fontSize: '1.5rem' },
        h4: { fontSize: '1.25rem' },
        h5: { fontSize: '1.125rem' },
        h6: { fontSize: '1rem' },
        body1: { fontSize: '1rem' },
        body2: { fontSize: '0.875rem' },
      },
      shape: {
        borderRadius: 4,
      },
    }),
  };
});

// jest-dom matchers are automatically extended via the import at the top

// Global test utilities
export const waitFor = (
  callback: () => void | Promise<void>,
  options?: { timeout?: number }
) => {
  return new Promise((resolve, reject) => {
    const timeout = options?.timeout || 1000;
    const startTime = Date.now();

    const check = async () => {
      try {
        await callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, 50);
        }
      }
    };

    check();
  });
};

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific React warnings in tests
  if (
    args[0]?.includes?.('React Router Future Flag Warning') ||
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalWarn(...args);
};

// Add custom matchers for better test assertions
expect.extend({
  toHaveBeenCalledWithMatch(received, expected) {
    const pass = received.mock.calls.some((call: any[]) =>
      call.some(arg => {
        if (typeof expected === 'object' && expected !== null) {
          return Object.keys(expected).every(key => arg[key] === expected[key]);
        }
        return arg === expected;
      })
    );

    return {
      pass,
      message: () =>
        pass
          ? `Expected function not to have been called with matching argument`
          : `Expected function to have been called with matching argument`,
    };
  },
});

// Type augmentation for custom matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toHaveBeenCalledWithMatch(expected: any): any;
    }
  }
}

export default {};
