import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  render,
  createMockUser,
  axe,
  testAccessibility,
} from '../../../tests/utils';
import LoginForm from '../LoginForm';

// Mock the auth hook
const mockLogin = vi.fn();
const mockAuthContext = {
  login: mockLogin,
  isLoading: false,
  user: null,
  isAuthenticated: false,
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock('../../../store/uiStore', () => ({
  showErrorNotification: vi.fn(),
}));

// Mock only the router hooks that are called at component level
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/login', search: '', hash: '', state: null };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isLoading = false;
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockNavigate.mockClear();
  });

  const renderLoginForm = (props = {}) => {
    return render(<LoginForm onSuccess={mockOnSuccess} {...props} />);
  };

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderLoginForm();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginForm();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLoginForm();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/create one now/i)).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      mockAuthContext.isLoading = true;
      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty email', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(emailInput);
      await user.tab(); // Trigger blur
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(passwordInput);
      await user.tab();
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials on valid submission', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });
    });

    it('should call onSuccess callback on successful login', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Mock successful login
      mockLogin.mockResolvedValueOnce({
        user: createMockUser(),
        accessToken: 'token',
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Mock login failure
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValueOnce(new Error(errorMessage));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission while loading', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockAuthContext.isLoading = true;

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /signing in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');

      expect(submitButton).toBeDisabled();

      await user.click(submitButton);
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when clicking eye icon', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(
        /^password$/i
      ) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', {
        name: /toggle password visibility/i,
      });

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Remember Me Functionality', () => {
    it('should render remember me checkbox', () => {
      renderLoginForm();

      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should toggle remember me state', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const checkbox = screen.getByLabelText(
        /remember me/i
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form fields', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const rememberCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Start from beginning
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      // Skip visibility toggle button
      await user.tab();
      expect(rememberCheckbox).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'TestPass123!',
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderLoginForm();

      // Inputs should have proper labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

      // Submit button should be properly identified
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should have proper error associations with inputs', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });

    it('should pass axe accessibility checks', async () => {
      const { container } = renderLoginForm();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper color contrast and accessibility features', async () => {
      const { container } = renderLoginForm();

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'aria-valid-attr': { enabled: true },
          label: { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should be navigable with keyboard', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Focus email input first
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      // Tab to password input
      await user.tab();
      expect(screen.getByLabelText(/^password$/i)).toHaveFocus();

      // Tab to password toggle
      await user.tab();
      expect(
        screen.getByRole('button', { name: /toggle password visibility/i })
      ).toHaveFocus();

      // Tab to remember me checkbox
      await user.tab();
      expect(screen.getByLabelText(/remember me/i)).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });

    it('should handle high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderLoginForm();

      // Should still pass accessibility checks in high contrast mode
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support screen reader navigation', async () => {
      const { container } = renderLoginForm();

      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Welcome Back');

      // Check for proper form structure
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();

      // Check for proper button roles
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      // Trigger an error first
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword');
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      await user.type(passwordInput, '!');

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid credentials/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Props and Customization', () => {
    it('should render with custom title when provided', () => {
      renderLoginForm({ title: 'Custom Login Title' });

      expect(screen.getByText('Custom Login Title')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderLoginForm({ className: 'custom-login-form' });

      expect(container.firstChild).toHaveClass('custom-login-form');
    });

    it('should render additional actions when provided', () => {
      const AdditionalActions = () => <div>Custom Actions</div>;

      renderLoginForm({
        additionalActions: <AdditionalActions />,
      });

      expect(screen.getByText('Custom Actions')).toBeInTheDocument();
    });
  });
});
