import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import React from 'react';

// AuthContext is now a Clerk-backed adapter over the legacy Supabase-shaped
// auth API. Clerk is mocked at the provider boundary so the mapping logic
// (Clerk user -> AppUser, authState machine, error normalization, app_users
// sync, token wiring) is what actually gets tested.
const clerkMocks = vi.hoisted(() => ({
  userState: { user: null as any, isLoaded: false },
  sessionState: { session: null as any, isLoaded: false },
  signInState: {
    isLoaded: false,
    signIn: null as any,
    setActive: vi.fn(),
  },
  signUpState: {
    isLoaded: false,
    signUp: null as any,
    setActive: vi.fn(),
  },
  clerkState: { signOut: vi.fn() },
}));

const supabaseMocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  from: vi.fn(),
  setClerkTokenGetter: vi.fn(),
}));

vi.mock('../src/providers/ClerkProvider', () => ({
  useUser: () => clerkMocks.userState,
  useSession: () => clerkMocks.sessionState,
  useSignIn: () => clerkMocks.signInState,
  useSignUp: () => clerkMocks.signUpState,
  useClerk: () => clerkMocks.clerkState,
}));

vi.mock('../src/utils/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => {
      supabaseMocks.from(...args);
      return { upsert: (...upsertArgs: unknown[]) => supabaseMocks.upsert(...upsertArgs) };
    },
  },
  setClerkTokenGetter: (...args: unknown[]) => supabaseMocks.setClerkTokenGetter(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const resetClerkState = () => {
  clerkMocks.userState.user = null;
  clerkMocks.userState.isLoaded = false;
  clerkMocks.sessionState.session = null;
  clerkMocks.sessionState.isLoaded = false;
  clerkMocks.signInState.isLoaded = false;
  clerkMocks.signInState.signIn = null;
  clerkMocks.signInState.setActive = vi.fn().mockResolvedValue(undefined);
  clerkMocks.signUpState.isLoaded = false;
  clerkMocks.signUpState.signUp = null;
  clerkMocks.signUpState.setActive = vi.fn().mockResolvedValue(undefined);
  clerkMocks.clerkState.signOut = vi.fn().mockResolvedValue(undefined);
  supabaseMocks.upsert = vi.fn().mockResolvedValue({ error: null });
  supabaseMocks.from = vi.fn();
  supabaseMocks.setClerkTokenGetter = vi.fn();
};

/**
 * The Clerk mock state is mutated directly, so the hook must be re-rendered
 * for the context to observe the change.
 */
const loadClerk = (rerender: () => void) => {
  act(() => {
    clerkMocks.userState.isLoaded = true;
    clerkMocks.sessionState.isLoaded = true;
    rerender();
  });
};

const clerkUserFixture = {
  id: 'user_2abc123',
  primaryEmailAddress: { emailAddress: 'clerk@example.com' },
  firstName: 'Ada',
  lastName: 'Lovelace',
  imageUrl: 'https://img.example/ada.png',
  publicMetadata: { plan: 'pro' },
};

describe('AuthContext (Clerk-backed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClerkState();
  });

  describe('Initialization', () => {
    it('should initialize in loading state until Clerk reports loaded', async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.authState).toBe('loading');

      loadClerk(rerender);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.authState).toBe('unauthenticated');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should map a Clerk user onto the legacy user shape', async () => {
      clerkMocks.userState.user = clerkUserFixture;
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toMatchObject({
        id: 'user_2abc123',
        email: 'clerk@example.com',
      });
      expect(result.current.user?.user_metadata).toMatchObject({
        first_name: 'Ada',
        last_name: 'Lovelace',
        full_name: 'Ada Lovelace',
        image_url: 'https://img.example/ada.png',
        plan: 'pro',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.authState).toBe('authenticated');
    });

    it('should expose session expiry from the Clerk session', async () => {
      clerkMocks.userState.user = clerkUserFixture;
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.sessionState.session = {
        expireAt: new Date('2030-01-01T00:00:00Z'),
        getToken: vi.fn(),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 2030-01-01T00:00:00Z in unix seconds
      expect(result.current.sessionExpiresAt).toBe(1893456000);
      expect(result.current.session).not.toBeNull();
    });

    it('should sync the Clerk user into public.app_users', async () => {
      clerkMocks.userState.user = clerkUserFixture;
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabaseMocks.upsert).toHaveBeenCalled();
      });

      expect(supabaseMocks.from).toHaveBeenCalledWith('app_users');
      expect(supabaseMocks.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user_2abc123',
          clerk_user_id: 'user_2abc123',
          email: 'clerk@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          image_url: 'https://img.example/ada.png',
        }),
        { onConflict: 'clerk_user_id' },
      );
    });

    it('should not sync app_users when no Clerk user is present', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(clerkMocks.userState.isLoaded).toBe(true);
      });

      expect(supabaseMocks.upsert).not.toHaveBeenCalled();
    });

    it('should wire the Clerk token getter into the Supabase client', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabaseMocks.setClerkTokenGetter).toHaveBeenCalled();
      });

      const getter = supabaseMocks.setClerkTokenGetter.mock.calls[0][0] as () => Promise<string | null>;
      expect(typeof getter).toBe('function');

      // No session -> getter resolves null (must never emit an empty bearer).
      await expect(getter()).resolves.toBeNull();

      const getToken = vi.fn().mockResolvedValue('jwt-123');
      clerkMocks.sessionState.session = { expireAt: null, getToken };
      await expect(getter()).resolves.toBe('jwt-123');
    });
  });

  describe('signIn', () => {
    it('should reject when Clerk sign-in is not loaded yet', async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      loadClerk(rerender);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('a@example.com', 'password123');
      });

      expect(signInResult).toEqual({
        user: null,
        error: new Error('Sign-in is still loading. Please try again in a moment.'),
      });
    });

    it('should call Clerk create with the password strategy', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      const create = vi.fn().mockResolvedValue({ status: 'needs_first_factor' });
      clerkMocks.signInState.signIn = { create };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('a@example.com', 'password123');
      });

      expect(create).toHaveBeenCalledWith({
        strategy: 'password',
        identifier: 'a@example.com',
        password: 'password123',
      });
      expect(clerkMocks.signInState.setActive).not.toHaveBeenCalled();
      expect(signInResult.user).toBeNull();
      expect(signInResult.error).toBeInstanceOf(Error);
    });

    it('should surface a MFA-specific message for needs_second_factor', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      clerkMocks.signInState.signIn = {
        create: vi.fn().mockResolvedValue({ status: 'needs_second_factor' }),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('a@example.com', 'password123');
      });

      expect(signInResult.error.message).toMatch(/multi-factor authentication/i);
    });

    it('should error when Clerk completes but the session is never confirmed', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      clerkMocks.signInState.signIn = {
        create: vi.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_1',
        }),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('a@example.com', 'password123');
      }, 15_000);

      // setActive is invoked with the created session, but the Clerk user
      // never appears, so the context must NOT claim success.
      expect(clerkMocks.signInState.setActive).toHaveBeenCalledWith({ session: 'sess_1' });
      expect(signInResult.user).toBeNull();
      expect(signInResult.error.message).toMatch(/session could not be confirmed/i);
    }, 20_000);

    it('should return the error state when Clerk throws', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      clerkMocks.signInState.signIn = {
        create: vi.fn().mockRejectedValue(new Error('Invalid login credentials')),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('a@example.com', 'wrongpassword');
      });

      expect(signInResult.user).toBeNull();
      expect(signInResult.error.message).toBe('Invalid login credentials');
      expect(result.current.error?.message).toBe('Invalid login credentials');
      expect(result.current.authState).toBe('error');
    });
  });

  describe('signUp', () => {
    it('should reject when Clerk sign-up is not loaded yet', async () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      loadClerk(rerender);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(signUpResult).toEqual({
        user: null,
        error: new Error('Sign-up is still loading. Please try again in a moment.'),
      });
    });

    it('should require verification when Clerk does not complete sign-up', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signUpState.isLoaded = true;
      const create = vi.fn().mockResolvedValue({ status: 'missing_requirements' });
      clerkMocks.signUpState.signUp = { create };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password123');
      });

      expect(create).toHaveBeenCalledWith({
        emailAddress: 'new@example.com',
        password: 'password123',
      });
      expect(clerkMocks.signUpState.setActive).not.toHaveBeenCalled();
      expect(signUpResult.user).toBeNull();
      expect(signUpResult.error.message).toMatch(/additional verification/i);
    });

    it('should return an error when Clerk throws during sign-up', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signUpState.isLoaded = true;
      clerkMocks.signUpState.signUp = {
        create: vi.fn().mockRejectedValue(new Error('User already registered')),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(signUpResult.user).toBeNull();
      expect(signUpResult.error.message).toBe('User already registered');
    });
  });

  describe('signOut', () => {
    it('should sign out through Clerk and clear errors', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signOutResult: any;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(clerkMocks.clerkState.signOut).toHaveBeenCalled();
      expect(signOutResult).toEqual({ error: null });
    });

    it('should surface Clerk sign-out failures', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.clerkState.signOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signOutResult: any;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(signOutResult.error.message).toBe('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('should initiate the Clerk reset_password strategy', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      const create = vi.fn().mockResolvedValue({ status: 'needs_first_factor' });
      clerkMocks.signInState.signIn = { create };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult: any;
      await act(async () => {
        resetResult = await result.current.resetPassword('user@example.com');
      });

      expect(create).toHaveBeenCalledWith({
        strategy: 'reset_password',
        identifier: 'user@example.com',
      });
      expect(resetResult).toEqual({ error: null });
    });

    it('should surface reset errors', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      clerkMocks.signInState.signIn = {
        create: vi.fn().mockRejectedValue(new Error('Email not found')),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult: any;
      await act(async () => {
        resetResult = await result.current.resetPassword('missing@example.com');
      });

      expect(resetResult.error.message).toBe('Email not found');
    });
  });

  describe('updateProfile / refreshSession', () => {
    it('should return the current user for profile updates (Clerk-managed profile)', async () => {
      clerkMocks.userState.user = clerkUserFixture;
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProfile({ first_name: 'Grace' });
      });

      expect(updateResult.error).toBeNull();
      expect(updateResult.user?.id).toBe('user_2abc123');
    });

    it('should report refreshSession success from the Clerk auth state', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let refreshed: boolean | undefined;
      await act(async () => {
        refreshed = await result.current.refreshSession();
      });

      expect(refreshed).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear a previously set error', async () => {
      clerkMocks.userState.isLoaded = true;
      clerkMocks.sessionState.isLoaded = true;
      clerkMocks.signInState.isLoaded = true;
      clerkMocks.signInState.signIn = {
        create: vi.fn().mockRejectedValue(new Error('boom')),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('a@example.com', 'password123');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
