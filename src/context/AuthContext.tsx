import React, { createContext, useContext, useEffect, useRef, useMemo, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { useUser, useSession, useSignIn, useSignUp, useClerk } from "../providers/ClerkProvider";
import { supabase, setClerkTokenGetter } from "../utils/supabase";

// Extend the minimal Supabase-like User shape used in this app
type AppUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

// Supabase AuthContext compatibility
export interface AuthErrorState {
  message: string;
  code?: string;
  recoverable: boolean;
}

export type AuthState = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthContextType {
  user: User | AppUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  authState: AuthState;
  error: AuthErrorState | null;
  sessionExpiresAt: number | null;
  isSessionExpiringSoon: boolean;

  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ user: AppUser | null; error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: AppUser | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (
    updates: Record<string, unknown>
  ) => Promise<{ user: AppUser | null; error: Error | null }>;
  updateOnboardingAnswers: (
    answers: Record<string, unknown>
  ) => Promise<{ user: AppUser | null; error: Error | null }>;
  refreshSession: () => Promise<boolean>;

  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

const normalizeError = (err: unknown): AuthErrorState => {
  const message = err instanceof Error ? err.message : String(err);
  return {
    message,
    code: message.includes("verification") ? "EMAIL_VERIFY_REQUIRED" : undefined,
    recoverable: true,
  };
};

const toAppUser = (clerkUser: any): AppUser | null => {
  if (!clerkUser) return null;
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
    user_metadata: {
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      full_name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
      image_url: clerkUser.imageUrl,
      ...clerkUser.publicMetadata,
    },
  };
};

const upsertSupabaseProfileFromClerkUser = async (clerkUserId: string, appUser: AppUser) => {
  if (!appUser?.email) return;

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", clerkUserId)
    .maybeSingle();

  if (fetchError) {
    console.warn("[Auth] Profile sync query failed:", fetchError.message);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: clerkUserId,
      email: appUser.email,
      full_name: (appUser.user_metadata?.full_name as string | undefined) || null,
      avatar_url: (appUser.user_metadata?.image_url as string | undefined) || "",
      bio: "",
      company: "",
      website: "",
      onboarding_answers: null,
      onboarding_completed_at: null,
    });

    if (insertError) {
      console.warn("[Auth] Profile sync insert failed:", insertError.message);
    }
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const clerkUser = useUser();
  const clerkSession = useSession();
  const {
    isLoaded: signInLoaded,
    signIn: signInResource,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    signUp: signUpResource,
    setActive: setSignUpActive,
  } = useSignUp();
  const clerk = useClerk();

  const [loading, setLoading] = React.useState(true);
  const [authState, setAuthState] = React.useState<AuthState>("loading");
  const [error, setError] = React.useState<AuthErrorState | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = React.useState<number | null>(null);

  const mountedRef = useRef(true);
  const syncedRef = useRef<string | null>(null);
  const clerkUserRef = useRef<ReturnType<typeof useUser>["user"]>(null);
  const authStateRef = useRef<AuthState>(authState);

  clerkUserRef.current = clerkUser.user;
  authStateRef.current = authState;

  const isAuthenticated = !!clerkUser.user;
  const user: AppUser | null = toAppUser(clerkUser.user);
  const session: Session | null = clerkSession.session ? ({
    expires_at: clerkSession.session.expireAt ? Math.floor(new Date(clerkSession.session.expireAt).getTime() / 1000) : null,
  } as Session) : null;

  const waitForAuth = React.useCallback(
    async (predicate: () => boolean, timeoutMs = 4000): Promise<boolean> => {
      const start = Date.now();
      while (!predicate() && Date.now() - start < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return predicate();
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!clerkUser.isLoaded || !clerkSession.isLoaded) return;

    setLoading(false);

    if (clerkUser.user) {
      setAuthState("authenticated");
      setError(null);
      const expiresAt = clerkSession.session?.expireAt ? new Date(clerkSession.session.expireAt).getTime() / 1000 : null;
      setSessionExpiresAt(expiresAt);

      if (clerkUser.user.id && syncedRef.current !== clerkUser.user.id) {
        syncedRef.current = clerkUser.user.id;
        upsertSupabaseProfileFromClerkUser(clerkUser.user.id, toAppUser(clerkUser.user)).catch((err) => {
          console.warn("[Auth] Profile sync error:", err);
        });
      }
    } else {
      setAuthState("unauthenticated");
      syncedRef.current = null;
    }
  }, [clerkUser.isLoaded, clerkSession.isLoaded, clerkUser.user?.id, clerkSession.session?.expireAt]);

  // Wire the Clerk session token into the Supabase client so every Supabase
  // request carries the Clerk JWT (native Clerk-Supabase integration).
  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        return (await clerkSession.session?.getToken()) ?? null;
      } catch {
        return null;
      }
    });
  }, [clerkSession.session]);

  const clearError = React.useCallback(() => setError(null), []);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      clearError();
      if (!signInLoaded || !signInResource) {
        return { user: null, error: new Error("Sign-in is still loading. Please try again in a moment.") };
      }
      setAuthState("loading");

      try {
        const result = await signInResource.create({
          identifier: email,
          password,
        });

        if (result.status !== "complete") {
          setAuthState("unauthenticated");
          return { user: null, error: new Error("Sign in requires additional steps. Please follow the on-screen instructions.") };
        }

        await setSignInActive({ session: result.createdSessionId });

        const authenticated = await waitForAuth(() => !!clerkUserRef.current && authStateRef.current === "authenticated", 5000);
        if (!authenticated) {
          const currentUser = toAppUser(clerkUserRef.current);
          if (currentUser) {
            return { user: currentUser, error: null };
          }
          setAuthState("unauthenticated");
          return { user: null, error: new Error("Sign in succeeded but session could not be confirmed.") };
        }

        return { user: toAppUser(clerkUserRef.current), error: null };
      } catch (err: any) {
        const authError = normalizeError(err);
        setError(authError);
        setAuthState("error");
        return { user: null, error: new Error(authError.message) };
      }
    },
    [signInLoaded, signInResource, setSignInActive, clearError, waitForAuth]
  );

  const signUp = React.useCallback(
    async (email: string, password: string) => {
      clearError();
      if (!signUpLoaded || !signUpResource) {
        return { user: null, error: new Error("Sign-up is still loading. Please try again in a moment.") };
      }
      setAuthState("loading");
      try {
        const result = await signUpResource.create({
          emailAddress: email,
          password,
        });

        if (result.status !== "complete") {
          // Email verification or other missing requirements
          setAuthState("unauthenticated");
          return { user: null, error: new Error("Sign up requires additional verification. Please check your email.") };
        }

        await setSignUpActive({ session: result.createdSessionId });

        const appUser = toAppUser(result.user);
        if (appUser?.id) {
          await upsertSupabaseProfileFromClerkUser(appUser.id, appUser);
        }

        await waitForAuth(() => !!clerkUserRef.current && authStateRef.current === "authenticated", 5000);
        return { user: toAppUser(clerkUserRef.current) || appUser, error: null };
      } catch (err: any) {
        const authError = normalizeError(err);
        setError(authError);
        setAuthState("error");
        return { user: null, error: new Error(authError.message) };
      }
    },
    [signUpLoaded, signUpResource, setSignUpActive, clearError, waitForAuth]
  );

  const signOut = React.useCallback(async () => {
    clearError();
    syncedRef.current = null;
    try {
      await clerk.signOut();
      return { error: null };
    } catch (err: any) {
      const authError = normalizeError(err);
      setError(authError);
      return { error: new Error(authError.message) };
    }
  }, [clerk, clearError]);

  const resetPassword = React.useCallback(
    async (email: string) => {
      clearError();
      if (!signInLoaded || !signInResource) {
        return {
          error: new Error("Password reset is still loading. Please try again in a moment."),
        };
      }
      try {
        // Initiates a password reset for the identifier. Clerk sends the reset
        // email (via the instance's email provider) when strategy is reset_password.
        await signInResource.create({ strategy: "reset_password", identifier: email });
        return { error: null };
      } catch (err: any) {
        const authError = normalizeError(err);
        setError(authError);
        return { error: new Error(authError.message) };
      }
    },
    [signInLoaded, signInResource, clearError]
  );

  const updateProfile = React.useCallback(
    async (_updates: Record<string, unknown>) => {
      clearError();
      return { user: user, error: null };
    },
    [clearError, user]
  );

  const updateOnboardingAnswers = React.useCallback(
    async (_answers: Record<string, unknown>) => {
      return { user: user, error: null };
    },
    [user]
  );

  const refreshSession = React.useCallback(async () => {
    return isAuthenticated;
  }, [isAuthenticated]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated,
      authState,
      error,
      sessionExpiresAt,
      isSessionExpiringSoon: false,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      updateOnboardingAnswers,
      refreshSession,
      clearError,
    }),
    [
      user,
      session,
      loading,
      isAuthenticated,
      authState,
      error,
      sessionExpiresAt,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      updateOnboardingAnswers,
      refreshSession,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
