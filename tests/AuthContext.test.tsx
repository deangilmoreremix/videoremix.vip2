import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/utils/supabaseClient';
import React from 'react';

vi.mock('../src/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  let mockSubscription: { unsubscribe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSubscription = { unsubscribe: vi.fn() };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with null user and loading state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should load existing session on mount', async () => {
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

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should set up auth state listener', () => {
      renderHook(() => useAuth(), { wrapper });
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe from auth state changes on unmount', async () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        app_metadata: {},
        user_metadata: { first_name: 'John', last_name: 'Doe' },
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('newuser@example.com', 'password123', {
          first_name: 'John',
          last_name: 'Doe',
        });
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: { first_name: 'John', last_name: 'Doe' },
        },
      });

      expect(signUpResult).toEqual({
        user: mockUser,
        error: null,
      });
    });

    it('should handle sign up errors', async () => {
      const mockError = {
        message: 'User already registered',
        status: 400,
      };

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(signUpResult).toEqual({
        user: null,
        error: mockError,
      });
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signInResult).toEqual({
        user: mockUser,
        error: null,
      });
    });

    it('should handle invalid credentials error', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
      };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
      });

      expect(signInResult).toEqual({
        user: null,
        error: mockError,
      });
    });

    it('should handle email not found error', async () => {
      const mockError = {
        message: 'Email not found',
        status: 400,
      };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('notfound@example.com', 'password123');
      });

      expect(signInResult).toEqual({
        user: null,
        error: mockError,
      });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(signOutResult).toEqual({ error: null });
    });

    it('should handle sign out errors', async () => {
      const mockError = {
        message: 'Sign out failed',
        status: 500,
      };

      (supabase.auth.signOut as any).mockResolvedValue({
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(signOutResult).toEqual({ error: mockError });
    });
  });

  describe('resetPassword', () => {
    it('should successfully request password reset', async () => {
      (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      expect(resetResult).toEqual({ error: null });
    });

    it('should handle password reset errors', async () => {
      const mockError = {
        message: 'Email not found',
        status: 400,
      };

      (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
        data: {},
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('notfound@example.com');
      });

      expect(resetResult).toEqual({ error: mockError });
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: { first_name: 'Jane', last_name: 'Doe' },
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.updateUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({
          first_name: 'Jane',
          last_name: 'Doe',
        });
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: { first_name: 'Jane', last_name: 'Doe' },
      });

      expect(updateResult).toEqual({
        user: mockUser,
        error: null,
      });
    });

    it('should handle profile update errors', async () => {
      const mockError = {
        message: 'Update failed',
        status: 500,
      };

      (supabase.auth.updateUser as any).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ first_name: 'Jane' });
      });

      expect(updateResult).toEqual({
        user: null,
        error: mockError,
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when auth state changes', async () => {
      let authCallback: (event: string, session: any) => void;

      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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

      act(() => {
        authCallback!('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('should clear user state on sign out event', async () => {
      let authCallback: (event: string, session: any) => void;

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

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: mockSubscription } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        authCallback!('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });
  });
});
