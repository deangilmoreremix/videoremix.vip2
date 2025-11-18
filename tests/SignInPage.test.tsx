import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SignInPage from '../src/pages/SignInPage';
import { AuthProvider } from '../src/context/AuthContext';
import * as AuthContext from '../src/context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../src/components/MagicSparkles', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../src/components/SparkleEffect', () => ({
  default: () => <div data-testid="sparkle-effect" />,
}));

const renderSignInPage = () => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SignInPage />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign in form with all fields', () => {
      renderSignInPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display welcome back heading', () => {
      renderSignInPage();

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should display link to sign up page', () => {
      renderSignInPage();

      const signUpLink = screen.getByText(/sign up for free/i);
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('should display link to forgot password', () => {
      renderSignInPage();

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    });

    it('should display back to home link', () => {
      renderSignInPage();

      const backLink = screen.getByText(/back to home/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should display benefits section', () => {
      renderSignInPage();

      expect(screen.getByText(/what you'll get with videoremix.vip/i)).toBeInTheDocument();
      expect(screen.getByText(/37\+ marketing personalization tools/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in email field', () => {
      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should allow typing in password field', () => {
      renderSignInPage();

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      renderSignInPage();

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);

      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should require email field', () => {
      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password field', () => {
      renderSignInPage();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it('should have email input type', () => {
      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct credentials on submit', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ user: {}, error: null });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: mockSignIn,
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during sign in', async () => {
      const mockSignIn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: {}, error: null }), 100))
      );

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: mockSignIn,
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });

    it('should display error message on failed sign in', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        user: null,
        error: { message: 'Invalid login credentials' },
      });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: mockSignIn,
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('should navigate to dashboard on successful sign in', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        error: null,
      });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: mockSignIn,
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should clear error message when user corrects input', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        user: null,
        error: { message: 'Invalid login credentials' },
      });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: mockSignIn,
        user: null,
        session: null,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });

      mockSignIn.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        error: null,
      });

      fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid login credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to dashboard if user is already logged in', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        signIn: vi.fn(),
        user: { id: 'user-123', email: 'test@example.com' } as any,
        session: {} as any,
        loading: false,
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      renderSignInPage();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
