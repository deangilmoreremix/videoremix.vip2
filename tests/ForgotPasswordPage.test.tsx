import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ForgotPasswordPage from '../src/pages/ForgotPasswordPage';
import * as AuthContext from '../src/context/AuthContext';
import { mockAuthContext } from './helpers/mockAuth';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../src/components/MagicSparkles', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../src/components/SparkleEffect', () => ({
  default: () => <div data-testid="sparkle-effect" />,
}));

const renderPage = () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext());
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the form with email field', () => {
      renderPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should display reset your password heading', () => {
      renderPage();

      expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    });

    it('should display back to sign in link', () => {
      renderPage();

      expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    });

    it('should display security tips section', () => {
      renderPage();

      expect(screen.getByText(/security tips/i)).toBeInTheDocument();
      expect(screen.getByText(/the reset link expires after 1 hour/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing email address', () => {
      renderPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should require the email field', () => {
      renderPage();

      expect(screen.getByLabelText(/email address/i)).toBeRequired();
    });

    it('should have email input type', () => {
      renderPage();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Submission', () => {
    it('should call resetPassword with the email on submit', async () => {
      const mockReset = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext({ resetPassword: mockReset }));

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </HelmetProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show loading state while submitting', async () => {
      const mockReset = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext({ resetPassword: mockReset }));

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </HelmetProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sending reset link/i)).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/sending reset link/i)).not.toBeInTheDocument();
      });
    });

    it('should show success state after successful reset request', async () => {
      const mockReset = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext({ resetPassword: mockReset }));

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </HelmetProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('should show error message on failed reset', async () => {
      const mockReset = vi.fn().mockResolvedValue({
        error: { message: 'Email not found' },
      });
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext({ resetPassword: mockReset }));

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </HelmetProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });

    it('should show back to sign in link after success', async () => {
      const mockReset = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext({ resetPassword: mockReset }));

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </HelmetProvider>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      const backLinks = screen.getAllByRole('link', { name: /back to sign in/i });
      expect(backLinks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
