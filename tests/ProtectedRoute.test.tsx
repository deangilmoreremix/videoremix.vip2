import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../src/context/AuthContext';
import ProtectedRoute from '../src/components/ProtectedRoute';
import React from 'react';

// ProtectedRoute consumes the Clerk-backed AuthContext; Clerk itself is
// irrelevant here, so the provider module is stubbed to keep the import chain
// importable without a publishable key.
vi.mock('../src/providers/ClerkProvider', () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useSession: () => ({ session: null, isLoaded: true }),
  useSignIn: () => ({ isLoaded: true, signIn: null, setActive: vi.fn() }),
  useSignUp: () => ({ isLoaded: true, signUp: null, setActive: vi.fn() }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

const DashboardPage = () => <div>Dashboard Content</div>;
const SignInPage = () => <div>Sign In Page</div>;

const mockRefreshSession = vi.fn();

const authState = (overrides: Record<string, unknown> = {}) => ({
  user: null,
  session: null,
  loading: false,
  isAuthenticated: false,
  authState: 'unauthenticated',
  error: null,
  sessionExpiresAt: null,
  isSessionExpiringSoon: false,
  refreshSession: mockRefreshSession,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
});

const mockUser = {
  id: 'user_2abc123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
};

const renderProtectedRoute = (state: Record<string, unknown>) => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue(authState(state) as any);

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('ProtectedRoute (Clerk-backed auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should not render protected content when user is not authenticated', () => {
      renderProtectedRoute({});

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should redirect to the signin route when user is not authenticated', () => {
      renderProtectedRoute({});

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
      expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render protected content when user is authenticated', () => {
      renderProtectedRoute({
        user: mockUser,
        session: { user: mockUser },
        isAuthenticated: true,
        authState: 'authenticated',
      });

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show the session verification indicator while auth is loading', () => {
      renderProtectedRoute({ loading: true, authState: 'loading' });

      expect(screen.getByText('Verifying session...')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should wait when the auth state machine is still idle', () => {
      renderProtectedRoute({ authState: 'idle' });

      expect(screen.getByText('Verifying session...')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show an authentication error with a sign-in escape hatch', () => {
      renderProtectedRoute({ authState: 'error', error: { message: 'token expired' } });

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to sign in/i })).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });

  describe('Session Refresh', () => {
    it('should proactively refresh an expiring authenticated session', () => {
      renderProtectedRoute({
        user: mockUser,
        session: { user: mockUser },
        isAuthenticated: true,
        authState: 'authenticated',
        isSessionExpiringSoon: true,
      });

      expect(mockRefreshSession).toHaveBeenCalled();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should not refresh when the session is not expiring', () => {
      renderProtectedRoute({
        user: mockUser,
        session: { user: mockUser },
        isAuthenticated: true,
        authState: 'authenticated',
        isSessionExpiringSoon: false,
      });

      expect(mockRefreshSession).not.toHaveBeenCalled();
    });
  });
});
