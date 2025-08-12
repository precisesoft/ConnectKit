import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockUser } from '../../../tests/utils';
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

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isLoading = false;
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
  });

  const renderLoginForm = (props = {}) => {
    return render(
      <LoginForm onSuccess={mockOnSuccess} {...props} />
    );
  };

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderLoginForm();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginForm();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLoginForm();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
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
      const { user } = renderLoginForm();

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
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for empty password', async () => {
      const { user } = renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(passwordInput);
      await user.tab();
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      const { user } = renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials on valid submission', async () => {
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
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
      const { user } = renderLoginForm();
      
      // Mock successful login
      mockLogin.mockResolvedValueOnce({
        user: createMockUser(),
        accessToken: 'token',
      });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should display error message on login failure', async () => {
      const { user } = renderLoginForm();
      
      // Mock login failure
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValueOnce(new Error(errorMessage));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission while loading', async () => {
      const { user } = renderLoginForm();
      
      mockAuthContext.isLoading = true;

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
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
      const { user } = renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

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
      const { user } = renderLoginForm();

      const checkbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through form fields', async () => {
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
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
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

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

      // Form should have accessible name
      expect(screen.getByRole('form')).toHaveAccessibleName();

      // Inputs should have proper labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Submit button should be properly identified
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper error associations with inputs', async () => {
      const { user } = renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(emailInput).toHaveAttribute('aria-describedby', errorMessage.id);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { user } = renderLoginForm();
      
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'TestPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when user starts typing', async () => {
      const { user } = renderLoginForm();
      
      // Trigger an error first
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
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
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
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
        additionalActions: <AdditionalActions /> 
      });

      expect(screen.getByText('Custom Actions')).toBeInTheDocument();
    });
  });
});