# Frontend TDD Implementation Plan

## Overview

This document outlines the comprehensive Test-Driven Development (TDD) strategy for ConnectKit's frontend, focusing on React Testing Library, comprehensive testing patterns, and achieving high code coverage with quality assurance.

## TDD Philosophy and Principles

### Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    TDD Cycle for Frontend                       │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │    RED      │────▶│   GREEN     │────▶│  REFACTOR   │        │
│  │ Write Test  │    │  Make Pass   │    │   Clean Up  │        │
│  │ (Failing)   │    │ (Minimal)    │    │  (Improve)  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│        ▲                                        │                │
│        │                                        ▼                │
│        └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Testing Pyramid Strategy

```
┌─────────────────────────────────────────┐
│              E2E Tests                  │ ← 10% (Critical User Journeys)
│           (Playwright)                  │
├─────────────────────────────────────────┤
│          Integration Tests              │ ← 20% (Component Interactions)
│        (React Testing Library)         │
├─────────────────────────────────────────┤
│            Unit Tests                   │ ← 70% (Individual Functions/Hooks)
│        (Vitest + RTL)                  │
└─────────────────────────────────────────┘
```

## Testing Stack and Configuration

### Core Testing Technologies

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
});
```

### Test Setup and Utilities

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// MSW server setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Custom Test Utilities

```typescript
// src/tests/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme } from '../../styles/theme';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <BrowserRouter>{children}</BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Custom matchers
export const toBeInTheDocument = (received: any) => {
  const pass = received !== null;
  return {
    message: () =>
      pass
        ? `Expected element not to be in the document`
        : `Expected element to be in the document`,
    pass,
  };
};

// Mock factories
export const createMockContact = (overrides = {}) => ({
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: ['john.doe@example.com'],
  phone: ['+1234567890'],
  company: 'Acme Corp',
  title: 'Software Engineer',
  tags: ['developer', 'javascript'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user-1',
  lastModifiedBy: 'user-1',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
```

### MSW Setup for API Mocking

```typescript
// src/tests/mocks/handlers.ts
import { rest } from 'msw';
import { createMockContact, createMockUser } from '../utils/test-utils';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: createMockUser(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        user: createMockUser(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      })
    );
  }),

  // Contact endpoints
  rest.get('/api/contacts', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const search = req.url.searchParams.get('search');

    let contacts = Array.from({ length: 25 }, (_, i) =>
      createMockContact({
        id: (i + 1).toString(),
        firstName: `Contact${i + 1}`,
        email: [`contact${i + 1}@example.com`],
      })
    );

    if (search) {
      contacts = contacts.filter(
        (contact) =>
          contact.firstName.toLowerCase().includes(search.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(search.toLowerCase()) ||
          contact.email[0].toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = contacts.slice(startIndex, endIndex);

    return res(
      ctx.json({
        contacts: paginatedContacts,
        totalCount: contacts.length,
        totalPages: Math.ceil(contacts.length / limit),
        currentPage: page,
      })
    );
  }),

  rest.get('/api/contacts/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(createMockContact({ id })));
  }),

  rest.post('/api/contacts', (req, res, ctx) => {
    const body = req.body;
    return res(ctx.json(createMockContact(body)));
  }),

  rest.put('/api/contacts/:id', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.body;
    return res(ctx.json(createMockContact({ ...body, id })));
  }),

  rest.delete('/api/contacts/:id', (req, res, ctx) => {
    return res(ctx.json({ message: 'Contact deleted successfully' }));
  }),

  // Error scenarios
  rest.get('/api/contacts/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ message: 'Internal server error' })
    );
  }),
];
```

```typescript
// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Component Testing Patterns

### Atomic Component Testing (Button Example)

```typescript
// src/components/atoms/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../tests/utils/test-utils';
import { Button } from './Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('primary');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('secondary');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('danger');
    });

    it('should render loading state', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Loading...');
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} isLoading>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(
        <Button ariaLabel="Custom label" ariaDescribedBy="description">
          Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should support keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Molecular Component Testing (ContactCard Example)

```typescript
// src/components/molecules/ContactCard/ContactCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../tests/utils/test-utils';
import { ContactCard } from './ContactCard';
import { createMockContact } from '../../../tests/utils/test-utils';

describe('ContactCard Component', () => {
  const mockContact = createMockContact();
  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TDD: Contact Information Display', () => {
    it('RED: should display contact full name', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('RED: should display contact email', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('RED: should display contact company and title', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      expect(screen.getByText('Software Engineer at Acme Corp')).toBeInTheDocument();
    });

    it('RED: should display contact avatar with initials', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('RED: should display contact tags', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });
  });

  describe('TDD: Action Buttons', () => {
    it('RED: should have view, edit, and delete buttons', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('GREEN: should call onView when view button is clicked', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      fireEvent.click(screen.getByRole('button', { name: /view/i }));
      expect(mockHandlers.onView).toHaveBeenCalledWith(mockContact);
    });

    it('GREEN: should call onEdit when edit button is clicked', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockContact);
    });

    it('GREEN: should call onDelete when delete button is clicked', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockContact.id);
    });
  });

  describe('TDD: Responsive Behavior', () => {
    it('RED: should apply hover effects', () => {
      render(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      const card = screen.getByRole('article');
      fireEvent.mouseEnter(card);
      
      expect(card).toHaveClass('hover-elevated');
    });
  });

  describe('REFACTOR: Performance Optimization', () => {
    it('should memoize properly with same contact', () => {
      const { rerender } = render(
        <ContactCard contact={mockContact} {...mockHandlers} />
      );
      
      const viewButton = screen.getByRole('button', { name: /view/i });
      const initialButton = viewButton;
      
      // Re-render with same props
      rerender(<ContactCard contact={mockContact} {...mockHandlers} />);
      
      expect(screen.getByRole('button', { name: /view/i })).toBe(initialButton);
    });

    it('should re-render when contact changes', () => {
      const { rerender } = render(
        <ContactCard contact={mockContact} {...mockHandlers} />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      const updatedContact = { ...mockContact, firstName: 'Jane' };
      rerender(<ContactCard contact={updatedContact} {...mockHandlers} />);
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });
});
```

### Organism Component Testing (ContactList Example)

```typescript
// src/components/organisms/ContactList/ContactList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../tests/utils/test-utils';
import { ContactList } from './ContactList';
import { server } from '../../../tests/mocks/server';
import { rest } from 'msw';

describe('ContactList Component', () => {
  const mockHandlers = {
    onEditContact: vi.fn(),
    onDeleteContact: vi.fn(),
    onViewContact: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TDD: Initial Load and Display', () => {
    it('RED: should show loading state initially', () => {
      render(<ContactList {...mockHandlers} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('GREEN: should display contacts after loading', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });
      
      // Should show first page of contacts
      expect(screen.getByText('Contact1')).toBeInTheDocument();
      expect(screen.getByText('Contact10')).toBeInTheDocument();
    });

    it('GREEN: should display empty state when no contacts', async () => {
      server.use(
        rest.get('/api/contacts', (req, res, ctx) => {
          return res(
            ctx.json({
              contacts: [],
              totalCount: 0,
              totalPages: 0,
              currentPage: 1,
            })
          );
        })
      );

      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('No contacts yet')).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Search Functionality', () => {
    it('RED: should have search input', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
      });
    });

    it('GREEN: should filter contacts based on search term', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search contacts...');
      fireEvent.change(searchInput, { target: { value: 'Contact1' } });

      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
        expect(screen.queryByText('Contact2')).not.toBeInTheDocument();
      });
    });

    it('GREEN: should show "no results" message for no matches', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search contacts...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentContact' } });

      await waitFor(() => {
        expect(screen.getByText('No contacts found')).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Pagination', () => {
    it('RED: should show pagination when there are multiple pages', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('GREEN: should navigate to next page', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });

      const nextPageButton = screen.getByRole('button', { name: /go to page 2/i });
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByText('Contact11')).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Error Handling', () => {
    it('RED: should display error message when API fails', async () => {
      server.use(
        rest.get('/api/contacts', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading contacts/i)).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Contact Actions Integration', () => {
    it('GREEN: should call edit handler when contact card edit is clicked', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(mockHandlers.onEditContact).toHaveBeenCalled();
    });

    it('GREEN: should call delete handler when contact card delete is clicked', async () => {
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByText('Contact1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(mockHandlers.onDeleteContact).toHaveBeenCalledWith('1');
    });
  });

  describe('REFACTOR: Performance Optimizations', () => {
    it('should debounce search input', async () => {
      vi.useFakeTimers();
      
      render(<ContactList {...mockHandlers} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search contacts...');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'C' } });
      fireEvent.change(searchInput, { target: { value: 'Co' } });
      fireEvent.change(searchInput, { target: { value: 'Con' } });
      
      // Fast forward timers
      vi.advanceTimersByTime(500);
      
      // Should only make one API call after debounce
      await waitFor(() => {
        expect(screen.getByDisplayValue('Con')).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });
});
```

## Custom Hook Testing Patterns

### Authentication Hook TDD Example

```typescript
// src/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { server } from '../tests/mocks/server';
import { rest } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  describe('TDD: Initial State', () => {
    it('RED: should return initial state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('TDD: Login Flow', () => {
    it('RED: should set loading state during login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('GREEN: should authenticate user on successful login', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toMatchObject({
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
        });
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('GREEN: should handle login errors', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Invalid credentials' })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe('Invalid credentials');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('TDD: Registration Flow', () => {
    it('RED: should register new user', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      await act(async () => {
        await result.current.register(userData);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toMatchObject({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      });
    });
  });

  describe('TDD: Logout Flow', () => {
    it('GREEN: should clear user data on logout', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // First login
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('TDD: Token Refresh', () => {
    it('RED: should refresh token automatically', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Trigger refresh
      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('GREEN: should logout user if refresh fails', async () => {
      server.use(
        rest.post('/api/auth/refresh', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Token expired' })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Trigger refresh that fails
      await act(async () => {
        await result.current.refreshToken();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe('Session expired');
      });
    });
  });
});
```

### Contact Management Hook TDD Example

```typescript
// src/hooks/useContacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from './useContacts';
import { createMockContact } from '../tests/utils/test-utils';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContacts Hook', () => {
  describe('TDD: Fetch Contacts', () => {
    it('RED: should fetch contacts successfully', async () => {
      const { result } = renderHook(() => useContacts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data?.contacts).toHaveLength(10);
      });
    });

    it('GREEN: should handle search parameters', async () => {
      const { result } = renderHook(
        () => useContacts({ search: 'Contact1', page: 1, limit: 5 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data?.contacts.every(
          contact => contact.firstName.includes('Contact1')
        )).toBe(true);
      });
    });

    it('GREEN: should handle pagination', async () => {
      const { result } = renderHook(
        () => useContacts({ page: 2, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data?.currentPage).toBe(2);
      });
    });
  });

  describe('TDD: Create Contact', () => {
    it('RED: should create contact successfully', async () => {
      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      });

      const newContactData = {
        firstName: 'New',
        lastName: 'Contact',
        email: ['new@example.com'],
        phone: ['+1234567890'],
        company: 'New Company',
        title: 'Developer',
        tags: ['new'],
      };

      await act(async () => {
        await result.current.mutateAsync(newContactData);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toMatchObject(newContactData);
    });

    it('GREEN: should handle validation errors', async () => {
      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      });

      const invalidContactData = {
        firstName: '', // Invalid - empty
        lastName: 'Contact',
        email: ['invalid-email'], // Invalid format
        phone: [],
        company: '',
        title: '',
        tags: [],
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidContactData);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('TDD: Update Contact', () => {
    it('RED: should update contact successfully', async () => {
      const { result } = renderHook(() => useUpdateContact(), {
        wrapper: createWrapper(),
      });

      const updateData = {
        id: '1',
        data: { firstName: 'Updated', title: 'Senior Developer' },
      };

      await act(async () => {
        await result.current.mutateAsync(updateData);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toMatchObject(updateData.data);
    });
  });

  describe('TDD: Delete Contact', () => {
    it('RED: should delete contact successfully', async () => {
      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('REFACTOR: Cache Management', () => {
    it('should invalidate contacts cache after creation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateContact(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createMockContact());
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
    });

    it('should invalidate specific contact cache after update', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateContact(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: '1',
          data: { firstName: 'Updated' },
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['contacts', '1'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
    });
  });
});
```

## Form Component Testing with React Hook Form

```typescript
// src/components/organisms/ContactForm/ContactForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../tests/utils/test-utils';
import { ContactForm } from './ContactForm';
import { createMockContact } from '../../../tests/utils/test-utils';

describe('ContactForm Component', () => {
  const mockHandlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TDD: Form Rendering', () => {
    it('RED: should render all form fields', () => {
      render(<ContactForm {...mockHandlers} />);

      expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /primary email/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /primary phone/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /company/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /job title/i })).toBeInTheDocument();
    });

    it('GREEN: should render form in create mode by default', () => {
      render(<ContactForm {...mockHandlers} />);
      
      expect(screen.getByText('Add New Contact')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument();
    });

    it('GREEN: should render form in edit mode when contact provided', () => {
      const mockContact = createMockContact();
      render(<ContactForm contact={mockContact} {...mockHandlers} />);
      
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update contact/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });

  describe('TDD: Form Validation', () => {
    it('RED: should show required field errors', async () => {
      render(<ContactForm {...mockHandlers} />);

      const submitButton = screen.getByRole('button', { name: /create contact/i });
      expect(submitButton).toBeDisabled(); // Initially disabled due to validation

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('GREEN: should validate email format', async () => {
      render(<ContactForm {...mockHandlers} />);

      const emailInput = screen.getByRole('textbox', { name: /primary email/i });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('GREEN: should validate minimum field lengths', async () => {
      render(<ContactForm {...mockHandlers} />);

      const firstNameInput = screen.getByRole('textbox', { name: /first name/i });
      fireEvent.change(firstNameInput, { target: { value: 'A' } });
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('GREEN: should enable submit when form is valid', async () => {
      render(<ContactForm {...mockHandlers} />);

      // Fill required fields
      fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /primary email/i }), {
        target: { value: 'john@example.com' },
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create contact/i });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('TDD: Form Submission', () => {
    it('RED: should call onSubmit with form data', async () => {
      render(<ContactForm {...mockHandlers} />);

      // Fill form
      fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /primary email/i }), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /company/i }), {
        target: { value: 'Acme Corp' },
      });

      const submitButton = screen.getByRole('button', { name: /create contact/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: ['john@example.com'],
          phone: [],
          company: 'Acme Corp',
          title: '',
          tags: [],
        });
      });
    });

    it('GREEN: should filter out empty email and phone fields', async () => {
      render(<ContactForm {...mockHandlers} />);

      // Fill form with empty secondary fields
      fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: /primary email/i }), {
        target: { value: 'john@example.com' },
      });

      const submitButton = screen.getByRole('button', { name: /create contact/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: ['john@example.com'],
            phone: [],
          })
        );
      });
    });

    it('GREEN: should show loading state during submission', async () => {
      render(<ContactForm {...mockHandlers} isLoading />);

      const submitButton = screen.getByRole('button', { name: /create contact/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('TDD: Tag Management', () => {
    it('RED: should allow adding tags', async () => {
      render(<ContactForm {...mockHandlers} />);

      const tagInput = screen.getByRole('combobox', { name: /tags/i });
      fireEvent.change(tagInput, { target: { value: 'developer' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('developer')).toBeInTheDocument();
      });
    });

    it('GREEN: should allow removing tags', async () => {
      const contactWithTags = createMockContact({
        tags: ['developer', 'javascript'],
      });

      render(<ContactForm contact={contactWithTags} {...mockHandlers} />);

      const developerTag = screen.getByText('developer');
      const removeButton = developerTag.parentElement?.querySelector('[data-testid="CancelIcon"]');
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('developer')).not.toBeInTheDocument();
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });
    });
  });

  describe('TDD: Cancel Functionality', () => {
    it('RED: should call onCancel when cancel button clicked', () => {
      render(<ContactForm {...mockHandlers} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('REFACTOR: Form Reset', () => {
    it('should reset form when new contact prop is provided', async () => {
      const contact1 = createMockContact({ firstName: 'John' });
      const { rerender } = render(<ContactForm contact={contact1} {...mockHandlers} />);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();

      const contact2 = createMockContact({ firstName: 'Jane' });
      rerender(<ContactForm contact={contact2} {...mockHandlers} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('John')).not.toBeInTheDocument();
      });
    });
  });
});
```

## E2E Testing with Playwright

### Authentication Flow E2E Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TDD: Complete login flow', async ({ page }) => {
    // RED: Should redirect to login page when not authenticated
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText('Sign In');

    // GREEN: Should login with valid credentials
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('TDD: Login validation errors', async ({ page }) => {
    await page.goto('/login');

    // RED: Should show validation errors for empty fields
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');

    // GREEN: Should show error for invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.blur('[data-testid="email-input"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
  });

  test('TDD: Registration flow', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');

    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, John!');
  });

  test('TDD: Logout flow', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
```

### Contact Management E2E Tests

```typescript
// tests/e2e/contacts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TDD: Create new contact', async ({ page }) => {
    await page.goto('/contacts');

    // RED: Should show empty state initially
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

    // GREEN: Should create new contact
    await page.click('[data-testid="add-contact-button"]');
    
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="company-input"]', 'Acme Corp');
    await page.fill('[data-testid="title-input"]', 'Software Engineer');

    await page.click('[data-testid="save-contact-button"]');

    // Should show success message and redirect to contact list
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Contact created successfully');
    await expect(page.locator('[data-testid="contact-card"]')).toContainText('John Doe');
  });

  test('TDD: Search contacts', async ({ page }) => {
    await page.goto('/contacts');

    // Assuming contacts already exist
    await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(10);

    // RED: Should filter contacts based on search
    await page.fill('[data-testid="search-input"]', 'John');
    
    await page.waitForTimeout(500); // Wait for debounce

    // Should show only matching contacts
    const contactCards = page.locator('[data-testid="contact-card"]');
    await expect(contactCards).toHaveCount(1);
    await expect(contactCards.first()).toContainText('John');
  });

  test('TDD: Edit contact', async ({ page }) => {
    await page.goto('/contacts');

    // Click edit on first contact
    const firstContact = page.locator('[data-testid="contact-card"]').first();
    await firstContact.locator('[data-testid="edit-button"]').click();

    // Update contact information
    await page.fill('[data-testid="title-input"]', 'Senior Software Engineer');
    await page.click('[data-testid="save-contact-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Contact updated successfully');
    await expect(firstContact).toContainText('Senior Software Engineer');
  });

  test('TDD: Delete contact', async ({ page }) => {
    await page.goto('/contacts');

    const initialContactCount = await page.locator('[data-testid="contact-card"]').count();

    // Click delete on first contact
    const firstContact = page.locator('[data-testid="contact-card"]').first();
    const contactName = await firstContact.locator('[data-testid="contact-name"]').textContent();
    
    await firstContact.locator('[data-testid="delete-button"]').click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Should show success message and remove contact
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Contact deleted successfully');
    await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(initialContactCount - 1);
    
    if (contactName) {
      await expect(page.locator(`text=${contactName}`)).not.toBeVisible();
    }
  });

  test('TDD: Contact pagination', async ({ page }) => {
    await page.goto('/contacts');

    // Should show pagination if more than one page
    const pagination = page.locator('[data-testid="pagination"]');
    await expect(pagination).toBeVisible();

    const page2Button = pagination.locator('button:has-text("2")');
    if (await page2Button.isVisible()) {
      const firstPageContacts = await page.locator('[data-testid="contact-card"]').allTextContents();
      
      await page2Button.click();
      await page.waitForTimeout(1000);

      const secondPageContacts = await page.locator('[data-testid="contact-card"]').allTextContents();
      
      // Contact lists should be different
      expect(firstPageContacts).not.toEqual(secondPageContacts);
    }
  });
});
```

## Visual Regression Testing

```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('TDD: Button component variations', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=atoms-button--primary');
    await expect(page.locator('[data-testid="button"]')).toHaveScreenshot('button-primary.png');

    await page.goto('/storybook/iframe.html?id=atoms-button--secondary');
    await expect(page.locator('[data-testid="button"]')).toHaveScreenshot('button-secondary.png');

    await page.goto('/storybook/iframe.html?id=atoms-button--danger');
    await expect(page.locator('[data-testid="button"]')).toHaveScreenshot('button-danger.png');

    await page.goto('/storybook/iframe.html?id=atoms-button--loading');
    await expect(page.locator('[data-testid="button"]')).toHaveScreenshot('button-loading.png');
  });

  test('TDD: Contact card component', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=molecules-contactcard--default');
    await expect(page.locator('[data-testid="contact-card"]')).toHaveScreenshot('contact-card-default.png');

    await page.goto('/storybook/iframe.html?id=molecules-contactcard--with-long-name');
    await expect(page.locator('[data-testid="contact-card"]')).toHaveScreenshot('contact-card-long-name.png');

    await page.goto('/storybook/iframe.html?id=molecules-contactcard--with-many-tags');
    await expect(page.locator('[data-testid="contact-card"]')).toHaveScreenshot('contact-card-many-tags.png');
  });

  test('TDD: Contact form component', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=organisms-contactform--create-mode');
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-create.png');

    await page.goto('/storybook/iframe.html?id=organisms-contactform--edit-mode');
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-edit.png');

    await page.goto('/storybook/iframe.html?id=organisms-contactform--with-errors');
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-errors.png');
  });

  test('TDD: Dashboard page layout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
    });
  });

  test('TDD: Responsive design breakpoints', async ({ page }) => {
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('contacts-mobile.png', { fullPage: true });

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('contacts-tablet.png', { fullPage: true });

    // Desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page).toHaveScreenshot('contacts-desktop.png', { fullPage: true });
  });
});
```

## Performance Testing

```typescript
// tests/performance/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('TDD: Page load performance', async ({ page }) => {
    // Start tracing
    await page.tracing.start({ screenshots: true, snapshots: true });

    const startTime = Date.now();
    await page.goto('/dashboard');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              vitals.cls = (vitals.cls || 0) + entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    // LCP should be less than 2.5s
    expect(metrics.lcp).toBeLessThan(2500);
    
    await page.tracing.stop({ path: 'traces/dashboard-load.zip' });
  });

  test('TDD: Contact list rendering performance', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/contacts');

    // Measure time to render contact list
    const renderStart = Date.now();
    await page.waitForSelector('[data-testid="contact-card"]');
    const renderEnd = Date.now();

    const renderTime = renderEnd - renderStart;
    
    // Contact list should render within 1 second
    expect(renderTime).toBeLessThan(1000);

    // Check that all contacts are rendered
    const contactCards = page.locator('[data-testid="contact-card"]');
    await expect(contactCards).toHaveCount(10);
  });

  test('TDD: Search performance', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/contacts');
    await page.waitForSelector('[data-testid="contact-card"]');

    // Measure search response time
    const searchStart = Date.now();
    await page.fill('[data-testid="search-input"]', 'John');
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('[data-testid="contact-card"]');
      return cards.length === 1;
    });
    const searchEnd = Date.now();

    const searchTime = searchEnd - searchStart;
    
    // Search should complete within 500ms
    expect(searchTime).toBeLessThan(500);
  });
});
```

## Accessibility Testing

```typescript
// tests/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('TDD: Dashboard page accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('TDD: Contact form accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/contacts/new');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('TDD: Keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.goto('/contacts');
    
    // Test tab navigation through contact cards
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBe('add-contact-button');

    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBe('search-input');

    // Test Enter key activation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should open first contact
    await expect(page.locator('[data-testid="contact-details"]')).toBeVisible();
  });

  test('TDD: Screen reader compatibility', async ({ page }) => {
    await page.goto('/contacts');
    
    // Check ARIA labels
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label', 'Search contacts');
    
    const addButton = page.locator('[data-testid="add-contact-button"]');
    await expect(addButton).toHaveAttribute('aria-label', 'Add new contact');
    
    // Check heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = await headings.evaluateAll(elements =>
      elements.map(el => parseInt(el.tagName.charAt(1)))
    );
    
    // Heading levels should not skip (1, 2, 3, not 1, 3, 2)
    for (let i = 1; i < headingLevels.length; i++) {
      expect(headingLevels[i] - headingLevels[i-1]).toBeLessThanOrEqual(1);
    }
  });
});
```

## Coverage Requirements and Quality Gates

### Coverage Configuration

```javascript
// vitest.config.ts coverage section
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/tests/',
    '**/*.d.ts',
    '**/*.stories.{ts,tsx}',
    '**/index.ts',
    'src/main.tsx',
    'src/vite-env.d.ts',
  ],
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds
    'src/components/**/*.tsx': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    'src/hooks/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90,
    },
    'src/services/**/*.ts': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
}
```

### Pre-commit Hooks

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type checking
echo "📝 Type checking..."
npm run type-check || (echo "❌ Type check failed" && exit 1)

# Linting
echo "🔍 Linting..."
npm run lint || (echo "❌ Linting failed" && exit 1)

# Testing with coverage
echo "🧪 Running tests with coverage..."
npm run test:unit || (echo "❌ Tests failed" && exit 1)

# Check coverage thresholds
echo "📊 Checking coverage thresholds..."
npm run test:coverage || (echo "❌ Coverage thresholds not met" && exit 1)

echo "✅ All pre-commit checks passed!"
```

## Test Execution Commands

```json
// package.json test scripts
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:unit:watch": "vitest watch",
    "test:unit:ui": "vitest --ui",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:visual": "playwright test tests/visual --update-snapshots",
    "test:a11y": "playwright test tests/accessibility",
    "test:performance": "playwright test tests/performance",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:coverage": "vitest run --coverage && npm run test:coverage:check",
    "test:coverage:check": "nyc check-coverage --lines 80 --functions 80 --branches 80 --statements 80",
    "test:coverage:report": "open coverage/index.html"
  }
}
```

## Continuous Integration Pipeline

```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Type checking
        run: |
          cd frontend
          npm run type-check

      - name: Linting
        run: |
          cd frontend
          npm run lint

      - name: Unit tests with coverage
        run: |
          cd frontend
          npm run test:unit

      - name: Integration tests
        run: |
          cd frontend
          npm run test:integration

      - name: Build application
        run: |
          cd frontend
          npm run build

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/lcov.info
          flags: frontend
          name: frontend-coverage

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            frontend/coverage/
            frontend/test-results/
            frontend/playwright-report/
```

This comprehensive TDD implementation plan provides a solid foundation for building high-quality, well-tested React components and applications with excellent coverage and maintainability.