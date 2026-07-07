import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import * as AuthContext from '../src/context/AuthContext';
import ProtectedRoute from '../src/components/ProtectedRoute';

const DashboardPage = () => <div>Dashboard Content</div>;
const SignInPage = () => <div>Sign In Page</div>;

const renderProtectedRoute = (authState: any) => {
  const mockNavigate = vi.fn();
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue(authState);

  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
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
      </AuthProvider>
    </MemoryRouter>
  );

  return { mockNavigate };
};

describe('Protected Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should not render protected content when user is not authenticated', () => {
      renderProtectedRoute({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should redirect to signin when user is not authenticated', () => {
      const { mockNavigate } = renderProtectedRoute({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated Access', () => {
    it('should render protected content when user is authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      const { mockNavigate } = renderProtectedRoute({
        user: mockUser,
        session: { user: mockUser } as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while auth state is being determined', () => {
      renderProtectedRoute({
        user: null,
        session: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not render protected content while loading', () => {
      renderProtectedRoute({
        user: null,
        session: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });
});

describe('Auth Route Redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderAuthRoute = (authState: any) => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(authState);

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/signin" element={<SignInPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('Signin Page with Authenticated User', () => {
    it('should redirect authenticated users away from signin page', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      renderAuthRoute({
        user: mockUser,
        session: { user: mockUser } as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn(),
      });

      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });
});

describe('Session Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should maintain authentication state across route changes', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      user: mockUser,
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
    };

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      session: mockSession as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
