import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ResetPassword from '../src/pages/ResetPassword';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
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
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import { supabase } from '../src/utils/supabaseClient';

const renderWithSession = (hasSession = true) => {
  (supabase.auth.getSession as any).mockResolvedValue({
    data: {
      session: hasSession
        ? { user: { id: 'user-123' }, access_token: 'token', refresh_token: 'refresh', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer' }
        : null,
    },
    error: null,
  });

  return render(
    <HelmetProvider>
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Check', () => {
    it('should show loading spinner while checking session', () => {
      (supabase.auth.getSession as any).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <HelmetProvider>
          <BrowserRouter>
            <ResetPassword />
          </BrowserRouter>
        </HelmetProvider>
      );

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should redirect to signin when no session exists', async () => {
      renderWithSession(false);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
      });
    });

    it('should show the reset form when session exists', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('should render set new password heading', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByText(/set new password/i)).toBeInTheDocument();
      });
    });

    it('should render new password and confirm password fields', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });

    it('should render update password button', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in password fields', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      fireEvent.change(passwordInput, { target: { value: 'MyPass123' } });
      fireEvent.change(confirmInput, { target: { value: 'MyPass123' } });

      expect(passwordInput.value).toBe('MyPass123');
      expect(confirmInput.value).toBe('MyPass123');
    });

    it('should show password strength indicator when typing', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'test' },
      });

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('should toggle password visibility', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const showButtons = screen.getAllByRole('button', { name: /show password/i });
      fireEvent.click(showButtons[0]);
      expect(passwordInput.type).toBe('text');

      const hideButtons = screen.getAllByRole('button', { name: /hide password/i });
      fireEvent.click(hideButtons[0]);
      expect(passwordInput.type).toBe('password');
    });

    it('should show mismatch error when confirm differs from password', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Other456' } });

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('should show match confirmation when passwords match', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MyPass123' } });

      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error if password is too short', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'short' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should show error if passwords do not match', async () => {
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'DiffPass456' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        const matches = screen.getAllByText(/passwords do not match/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });

      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call supabase.auth.updateUser on valid submit', async () => {
      (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MyPass123' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'MyPass123' });
      });
    });

    it('should show success state after password update', async () => {
      (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MyPass123' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on update failure', async () => {
      (supabase.auth.updateUser as any).mockResolvedValue({
        data: {},
        error: { message: 'Password update failed' },
      });
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MyPass123' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password update failed/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      (supabase.auth.updateUser as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
      );
      renderWithSession(true);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'MyPass123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MyPass123' } });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/updating password/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText(/updating password/i)).not.toBeInTheDocument();
      });
    });
  });
});
