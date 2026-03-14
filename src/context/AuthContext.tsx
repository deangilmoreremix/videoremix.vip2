import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";

export type AuthState =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url?: string;
  default_organization_id?: string;
  onboarding_completed: boolean;
  metadata: Record<string, unknown>;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  plan: "free" | "pro" | "enterprise";
  settings: Record<string, unknown>;
  is_active: boolean;
}

export interface AuthErrorState {
  message: string;
  code?: string;
  recoverable: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  organization: Organization | null;
  authState: AuthState;
  loading: boolean;
  isAuthenticated: boolean;
  error: AuthErrorState | null;
  isSessionExpiringSoon: boolean;

  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Record<string, unknown>
  ) => Promise<{ user: User | null; error: AuthError | null }>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[Auth] Could not fetch user profile:", error.message);
    return null;
  }
  return data as UserProfile | null;
}

async function fetchUserOrganization(
  orgId: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (error) {
    console.warn("[Auth] Could not fetch organization:", error.message);
    return null;
  }
  return data as Organization | null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [authState, setAuthState] = useState<AuthState>("initializing");
  const [error, setError] = useState<AuthErrorState | null>(null);

  const mountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  const loading = authState === "initializing";
  const isAuthenticated = authState === "authenticated" && !!user && !!session;

  const isSessionExpiringSoon = useMemo(() => {
    if (!session?.expires_at) return false;
    return session.expires_at * 1000 - Date.now() < SESSION_REFRESH_THRESHOLD_MS;
  }, [session]);

  const clearError = useCallback(() => setError(null), []);

  const loadUserData = useCallback(async (userId: string) => {
    if (!mountedRef.current) return;
    const userProfile = await fetchUserProfile(userId);
    if (!mountedRef.current) return;
    setProfile(userProfile);

    if (userProfile?.default_organization_id) {
      const org = await fetchUserOrganization(
        userProfile.default_organization_id
      );
      if (mountedRef.current) setOrganization(org);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    try {
      isRefreshingRef.current = true;
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data.session) return false;
      if (mountedRef.current) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return true;
    } catch {
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[Auth] Session error:", sessionError.message);
        }

        if (!mountedRef.current) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          setAuthState("authenticated");
          loadUserData(initialSession.user.id);
        } else {
          setAuthState("unauthenticated");
        }
      } catch (err) {
        console.error("[Auth] Initialization error:", err);
        if (mountedRef.current) {
          setAuthState("error");
          setError({
            message: "Failed to initialize authentication",
            recoverable: true,
          });
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setAuthState("authenticated");
          setError(null);
          loadUserData(newSession.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setAuthState("unauthenticated");
        setError(null);
      } else if (event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          if (event === "USER_UPDATED") {
            loadUserData(newSession.user.id);
          }
        }
      }
    });

    const sessionCheckInterval = setInterval(async () => {
      if (!mountedRef.current || !session) return;
      if (isSessionExpiringSoon) {
        await refreshSession();
      }
    }, SESSION_CHECK_INTERVAL_MS);

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !mountedRef.current) return;
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (currentSession?.user) {
        if (
          currentSession.expires_at &&
          currentSession.expires_at * 1000 < Date.now()
        ) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setOrganization(null);
          setAuthState("unauthenticated");
        } else {
          setSession(currentSession);
          setUser(currentSession.user);
          setAuthState("authenticated");
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setAuthState("unauthenticated");
      }
    };

    const handleOnline = () => {
      if (session) refreshSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadUserData, refreshSession, session, isSessionExpiringSoon]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>
    ) => {
      clearError();
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${siteUrl}/auth/confirm`,
        },
      });
      if (signUpError) {
        setError({ message: signUpError.message, recoverable: true });
      }
      return { user: data.user, error: signUpError };
    },
    [clearError]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      clearError();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError({ message: signInError.message, recoverable: true });
      }
      return { user: data.user, error: signInError };
    },
    [clearError]
  );

  const signOut = useCallback(async () => {
    clearError();
    const { error: signOutError } = await supabase.auth.signOut();
    if (!signOutError && mountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setAuthState("unauthenticated");
    }
    return { error: signOutError };
  }, [clearError]);

  const resetPassword = useCallback(
    async (email: string) => {
      clearError();
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${siteUrl}/reset-password` }
      );
      if (resetError) {
        setError({ message: resetError.message, recoverable: true });
      }
      return { error: resetError };
    },
    [clearError]
  );

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      clearError();
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updates,
      });
      if (updateError) {
        setError({ message: updateError.message, recoverable: true });
      }
      return { user: data.user, error: updateError };
    },
    [clearError]
  );

  const switchOrganization = useCallback(
    async (orgId: string) => {
      if (!user) return;
      const org = await fetchUserOrganization(orgId);
      if (org && mountedRef.current) {
        setOrganization(org);
        await supabase
          .from("user_profiles")
          .update({ default_organization_id: orgId })
          .eq("user_id", user.id);
        if (profile) {
          setProfile({ ...profile, default_organization_id: orgId });
        }
      }
    },
    [user, profile]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      organization,
      authState,
      loading,
      isAuthenticated,
      error,
      isSessionExpiringSoon,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,
      clearError,
      switchOrganization,
    }),
    [
      user,
      session,
      profile,
      organization,
      authState,
      loading,
      isAuthenticated,
      error,
      isSessionExpiringSoon,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,
      clearError,
      switchOrganization,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
