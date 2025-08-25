import React, { ReactElement, ReactNode } from 'react';
import {
  render as rtlRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Test wrapper component
interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient,
  initialRoute = '/',
}) => {
  const testQueryClient =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

  // Mock location for router
  window.history.pushState({}, 'Test page', initialRoute);

  return (
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        <ThemeProvider theme={testTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  wrapper?: React.ComponentType<any>;
}

export const render = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { queryClient, initialRoute, wrapper, ...renderOptions } = options;

  const Wrapper = wrapper || TestProviders;

  const result = rtlRender(ui, {
    wrapper: props => (
      <Wrapper
        queryClient={queryClient}
        initialRoute={initialRoute}
        {...props}
      />
    ),
    ...renderOptions,
  });

  return {
    ...result,
    user: userEvent.setup(),
  };
};

// Mock auth context
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  ...overrides,
});

// Mock user data
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isVerified: true,
  ...overrides,
});

// Mock contact data
export const createMockContact = (overrides = {}) => ({
  id: 'contact-123',
  userId: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890',
  company: 'Acme Corp',
  notes: 'Test contact',
  isFavorite: false,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock API response
export const createMockApiResponse = <T = any,>(data: T, overrides = {}) => ({
  success: true,
  message: 'Success',
  data,
  ...overrides,
});

// Mock API error response
export const createMockApiError = (
  message = 'Error occurred',
  status = 400
) => ({
  success: false,
  message,
  status,
  timestamp: new Date().toISOString(),
});

// Query client for tests
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });

// Utility to wait for async operations
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Mock form data
export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  return formData;
};

// Mock file
export const createMockFile = (
  name = 'test.txt',
  content = 'test content',
  type = 'text/plain'
) => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// Utility to mock component
export const createMockComponent = (name: string, props: any = {}) => {
  const MockComponent = vi.fn(() => <div data-testid={`mock-${name}`} />);
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

// Mock event handlers
export const createMockHandlers = () => ({
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onFocus: vi.fn(),
  onBlur: vi.fn(),
  onKeyDown: vi.fn(),
  onKeyUp: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
});

// Test helpers for form interactions
export const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  formData: Record<string, string>
) => {
  for (const [name, value] of Object.entries(formData)) {
    const input = document.querySelector(
      `[name="${name}"]`
    ) as HTMLInputElement;
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
};

// Test helpers for async operations
export const waitForElement = async (selector: string, timeout = 1000) => {
  return new Promise<Element>((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(check, 50);
      }
    };

    check();
  });
};

// Mock localStorage
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return { ...store };
    },
  };
};

// Mock URL and navigation
export const createMockNavigation = () => ({
  navigate: vi.fn(),
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  params: {},
});

// Test utilities for Material-UI components
export const getByTestId = (testId: string) =>
  document.querySelector(`[data-testid="${testId}"]`);

export const queryByTestId = (testId: string) =>
  document.querySelector(`[data-testid="${testId}"]`);

// Utility to create mock props
export const createMockProps = <T extends Record<string, any>>(
  defaultProps: T,
  overrides: Partial<T> = {}
): T => ({
  ...defaultProps,
  ...overrides,
});

// Mock timers utility
export const createMockTimers = () => {
  vi.useFakeTimers();

  return {
    advanceTimersByTime: vi.advanceTimersByTime,
    runAllTimers: vi.runAllTimers,
    runOnlyPendingTimers: vi.runOnlyPendingTimers,
    clearAllTimers: vi.clearAllTimers,
    useRealTimers: vi.useRealTimers,
  };
};

// Accessibility testing utilities
export const checkA11y = async (container: HTMLElement, axeOptions?: any) => {
  const { axe } = await import('jest-axe');
  const results = await axe(container, axeOptions);
  return results;
};

// Accessibility test helper with common rules
export const testAccessibility = async (container: HTMLElement) => {
  const results = await checkA11y(container, {
    rules: {
      // Common accessibility rules to test
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'aria-labels': { enabled: true },
      'semantic-structure': { enabled: true },
    },
  });
  expect(results).toHaveNoViolations();
};

// Keyboard navigation test helper
export const testKeyboardNavigation = async (
  user: ReturnType<typeof userEvent.setup>,
  expectedFocusOrder: string[]
) => {
  for (let i = 0; i < expectedFocusOrder.length; i++) {
    await user.tab();
    const focusedElement = document.activeElement;
    const expectedElement = document.querySelector(expectedFocusOrder[i]);
    expect(focusedElement).toBe(expectedElement);
  }
};

// Re-export commonly used testing utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { vi } from 'vitest';
export { axe, toHaveNoViolations } from 'jest-axe';

// Export custom render as default
export default render;
