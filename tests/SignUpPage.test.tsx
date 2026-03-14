import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import SignUpPage from '../src/pages/SignUpPage';
import { AuthProvider } from '../src/context/AuthContext';
import * as AuthContext from '../src/context/AuthContext';
import { mockAuthContext, mockAuthenticatedContext } from './helpers/mockAuth';

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

vi.mock('../src/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

const renderSignUpPage = () => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SignUpPage />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign up form with all fields', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should display start your journey heading', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      expect(screen.getByText(/start your journey/i)).toBeInTheDocument();
    });

    it('should display link to sign in page', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const signInLink = screen.getByText(/sign in/i);
      expect(signInLink).toBeInTheDocument();
      expect(signInLink.closest('a')).toHaveAttribute('href', '/signin');
    });

    it('should display back to home link', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const backLink = screen.getByText(/back to home/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should display terms and privacy policy links', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      expect(screen.getByText(/by creating an account/i)).toBeInTheDocument();

      const termsLink = screen.getByRole('link', { name: /terms of service/i });
      expect(termsLink).toHaveAttribute('href', '/terms');

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('should display benefits section', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      expect(screen.getByText(/start your free account today/i)).toBeInTheDocument();
      expect(screen.getByText(/no credit card required/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in all input fields', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(toggleButtons[0]);

      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButtons[0]);
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle confirm password visibility', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      expect(confirmPasswordInput.type).toBe('password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(toggleButtons[1]);

      expect(confirmPasswordInput.type).toBe('text');

      fireEvent.click(toggleButtons[1]);
      expect(confirmPasswordInput.type).toBe('password');
    });

    it('should require email field', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password fields', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
      renderSignUpPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(passwordInput).toBeRequired();
      expect(confirmPasswordInput).toBeRequired();
    });
  });

  describe('Form Validation', () => {
    it('should show error if passwords do not match', async () => {
      const mockSignUp = vi.fn();

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should show error if password is too short', async () => {
      const mockSignUp = vi.fn();

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with correct data on submit', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ user: {}, error: null });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', {
          first_name: 'John',
          last_name: 'Doe',
        });
      });
    });

    it('should show loading state during sign up', async () => {
      const mockSignUp = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: {}, error: null }), 100))
      );

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
      });
    });

    it('should display error message on failed sign up', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        user: null,
        error: { message: 'User already registered' },
      });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
      });
    });

    it('should show success message and navigate on successful sign up', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'john@example.com',
          identities: [{ id: 'identity-1' }],
          email_confirmed_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(
        mockAuthContext({ signUp: mockSignUp })
      );

      renderSignUpPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to dashboard if user is already authenticated', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthenticatedContext());

      renderSignUpPage();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should not redirect if user is not authenticated', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());

      renderSignUpPage();

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });
});
