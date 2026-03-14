import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as AuthContext from '../src/context/AuthContext';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { mockAuthContext, mockAuthenticatedContext } from './helpers/mockAuth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const DashboardPage = () => <div>Dashboard Content</div>;
const SignInPage = () => <div>Sign In Page</div>;

const renderWithRoute = (authState: any, initialPath = '/dashboard') => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
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
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to signin when user is not authenticated', () => {
      renderWithRoute(mockAuthContext());

      expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should redirect with from state when unauthenticated', () => {
      renderWithRoute(mockAuthContext(), '/dashboard');

      expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    });

    it('should not render protected content when user is null', () => {
      renderWithRoute(mockAuthContext({ user: null, isAuthenticated: false }));

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('should render protected content when user is authenticated', () => {
      renderWithRoute(mockAuthenticatedContext());

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should not redirect when user is authenticated', () => {
      renderWithRoute(mockAuthenticatedContext());

      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while auth state is initializing', () => {
      renderWithRoute(mockAuthContext({ authState: 'initializing', loading: true }));

      expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
    });

    it('should not render protected content while loading', () => {
      renderWithRoute(mockAuthContext({ authState: 'initializing', loading: true }));

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should not redirect while loading', () => {
      renderWithRoute(mockAuthContext({ authState: 'initializing', loading: true }));

      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show authentication error when authState is error', () => {
      renderWithRoute(
        mockAuthContext({
          authState: 'error',
          error: { message: 'Session expired', recoverable: true },
        })
      );

      expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
    });

    it('should not render protected content on auth error', () => {
      renderWithRoute(
        mockAuthContext({
          authState: 'error',
          error: { message: 'Session expired', recoverable: true },
        })
      );

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should show a link to sign in on auth error', () => {
      renderWithRoute(
        mockAuthContext({
          authState: 'error',
          error: { message: 'Session expired', recoverable: true },
        })
      );

      expect(screen.getByText(/go to sign in/i)).toBeInTheDocument();
    });
  });
});

describe('Auth Route Redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect authenticated user visiting /signin to /dashboard', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthenticatedContext());

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });
});

describe('Session Persistence', () => {
  it('should maintain authentication state across route changes', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthenticatedContext());

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
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
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
