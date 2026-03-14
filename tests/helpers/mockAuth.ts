import { vi } from 'vitest';

export const mockAuthContext = (overrides: Record<string, any> = {}) => ({
  user: null,
  session: null,
  profile: null,
  organization: null,
  authState: 'unauthenticated' as const,
  loading: false,
  isAuthenticated: false,
  error: null,
  isSessionExpiringSoon: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
  refreshSession: vi.fn(),
  clearError: vi.fn(),
  switchOrganization: vi.fn(),
  ...overrides,
});

export const mockAuthenticatedContext = (overrides: Record<string, any> = {}) => {
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
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
  };

  return mockAuthContext({
    user: mockUser,
    session: mockSession,
    authState: 'authenticated' as const,
    isAuthenticated: true,
    ...overrides,
  });
};
