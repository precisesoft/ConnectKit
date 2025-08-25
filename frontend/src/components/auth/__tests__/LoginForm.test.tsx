import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  render,
  createMockUser,
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

// Mock router
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

  it('should render basic form elements', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/create one now/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockAuthContext.isLoading = true;
    render(<LoginForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it('should call login function on form submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={mockOnSuccess} />);

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
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

  it('should handle remember me checkbox', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={mockOnSuccess} />);

    const checkbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should hide title when showTitle is false', () => {
    render(<LoginForm onSuccess={mockOnSuccess} showTitle={false} />);

    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
  });

  it('should hide register link when showRegisterLink is false', () => {
    render(<LoginForm onSuccess={mockOnSuccess} showRegisterLink={false} />);

    expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create one now/i)).not.toBeInTheDocument();
  });
});