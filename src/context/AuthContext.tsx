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
import { User, Session, AuthError, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";

// Auth state types
export type AuthState = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthErrorState {
  message: string;
  code?: string;
  recoverable: boolean;
}

interface AuthContextType {
  // Core state
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  authState: AuthState;
  error: AuthErrorState | null;

  // Session metadata
  sessionExpiresAt: number | null;
  isSessionExpiringSoon: boolean;

  // Auth actions
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

  // Utility
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Constants
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry (less aggressive)
const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds (less frequent)
const STORAGE_KEY_SESSION = "sb-session-state";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<AuthErrorState | null>(null);

  // Refs for cleanup and tracking
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  // Derived state
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);
  const sessionExpiresAt = useMemo(() => session?.expires_at ?? null, [session]);
  const isSessionExpiringSoon = useMemo(() => {
    if (!sessionExpiresAt) return false;
    const expiresAtMs = sessionExpiresAt * 1000;
    const now = Date.now();
    return expiresAtMs - now < SESSION_REFRESH_THRESHOLD_MS;
  }, [sessionExpiresAt]);

  // Clear error utility
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle auth errors
  const handleAuthError = useCallback((err: unknown, context: string) => {
    console.error(`[Auth] Error in ${context}:`, err);

    // Using let because we modify properties, not reassign the variable
    // eslint-disable-next-line prefer-const
    let authError: AuthErrorState = {
      message: "An unexpected authentication error occurred",
      recoverable: true,
    };

    if (err instanceof Error) {
      authError.message = err.message;

      // Check for specific error types
      if (err.message.includes("refresh") || err.message.includes("token")) {
        authError.code = "TOKEN_REFRESH_FAILED";
        authError.recoverable = true;
      } else if (err.message.includes("network") || err.message.includes("fetch")) {
        authError.code = "NETWORK_ERROR";
        authError.recoverable = true;
      } else if (err.message.includes("session") || err.message.includes("expired")) {
        authError.code = "SESSION_EXPIRED";
        authError.recoverable = true;
      }
    }

    setError(authError);
    return authError;
  }, []);

  // Refresh session proactively
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log("[Auth] Refresh already in progress, skipping");
      return false;
    }

    try {
      isRefreshingRef.current = true;
      console.log("[Auth] Starting session refresh");

      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("[Auth] Session refresh failed:", refreshError.message);

        // Only clear session on critical errors, not network issues
        if (refreshError.message.includes("Invalid refresh token") ||
            refreshError.message.includes("refresh_token_not_found")) {
          console.log("[Auth] Critical refresh error - clearing session");
          handleAuthError(refreshError, "refreshSession");
          if (mountedRef.current) {
            setSession(null);
            setUser(null);
            setAuthState("unauthenticated");
          }
          return false;
        } else {
          // For network errors or temporary issues, don't clear session
          console.log("[Auth] Non-critical refresh error, keeping existing session");
          return false;
        }
      }

      if (mountedRef.current && data.session) {
        console.log("[Auth] Session refresh successful");
        setSession(data.session);
        setUser(data.session.user);
        setAuthState("authenticated");
        return true;
      }

      console.log("[Auth] Refresh returned no session");
      return false;
    } catch (err) {
      console.error("[Auth] Session refresh exception:", err);

      // Only clear session on authentication errors, not network errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Invalid refresh token") ||
          errorMessage.includes("refresh_token_not_found")) {
        handleAuthError(err, "refreshSession");
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setAuthState("unauthenticated");
        }
      }
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [handleAuthError]);

  // Initialize session and set up listeners
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        setAuthState("loading");
        setLoading(true);

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          // Only treat as error if it's not a network/connectivity issue
          if (!sessionError.message.includes("fetch") && !sessionError.message.includes("network")) {
            handleAuthError(sessionError, "initializeAuth");
          } else {
            console.log("[Auth] Network error during session check, will retry later");
          }
        }

        if (mounted) {
          if (initialSession) {
            // Check if the session is already expired
            const now = Date.now();
            const expiresAt = initialSession.expires_at * 1000;

            if (expiresAt > now) {
              // Session is still valid
              setSession(initialSession);
              setUser(initialSession.user);
              setAuthState("authenticated");

              // Store session hint for faster recovery
              try {
                sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
                  userId: initialSession.user.id,
                  expiresAt: initialSession.expires_at,
                }));
              } catch {
                // Ignore storage errors
              }
            } else {
              // Session is expired
              console.log("[Auth] Initial session is expired, clearing");
              setSession(null);
              setUser(null);
              setAuthState("unauthenticated");
            }
          } else {
            setSession(null);
            setUser(null);
            setAuthState("unauthenticated");
          }
          setLoading(false);
        }
      } catch (err) {
        handleAuthError(err, "initializeAuth");
        if (mounted) {
          setAuthState("error");
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        console.log("[Auth] State change event:", event);

        if (!mounted) return;

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            console.log(`[Auth] ${event} - Setting authenticated state`);
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              setAuthState("authenticated");
              setError(null);

              // Update session hint
              try {
                sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
                  userId: newSession.user.id,
                  expiresAt: newSession.expires_at,
                }));
              } catch {
                // Ignore storage errors
              }
            }
            break;

          case "SIGNED_OUT":
            console.log("[Auth] SIGNED_OUT event received - user is being logged out", {
              currentUser: user?.id,
              currentSession: !!session,
              reason: newSession ? "new session provided" : "no session",
              timestamp: new Date().toISOString()
            });
            setSession(null);
            setUser(null);
            setAuthState("unauthenticated");
            setError(null);
            try {
              sessionStorage.removeItem(STORAGE_KEY_SESSION);
            } catch {
              // Ignore storage errors
            }
            break;

          case "USER_UPDATED":
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
            }
            break;

          case "PASSWORD_RECOVERY":
            // Keep session but allow password reset flow
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
            }
            break;

          default:
            // Handle other events
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              setAuthState("authenticated");
            }
        }

        setLoading(false);
      }
    );

    subscriptionRef.current = data.subscription;

    // Set up periodic session check (less aggressive)
    sessionCheckIntervalRef.current = setInterval(async () => {
      if (!mounted) return;

      try {
        // Get current session directly - avoids stale closure
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Only log if there are issues or significant changes
        if (!currentSession && session) {
          console.log("[Auth] Session lost during periodic check - clearing state");
          if (mounted) {
            setSession(null);
            setUser(null);
            setAuthState("unauthenticated");
          }
          return;
        }

        // Check if session is expired
        if (currentSession?.expires_at) {
          const expiresAtMs = currentSession.expires_at * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAtMs - now;

          // If session is already expired, clear state
          if (timeUntilExpiry <= 0) {
            console.log("[Auth] Session expired during periodic check");
            if (mounted) {
              setSession(null);
              setUser(null);
              setAuthState("unauthenticated");
            }
            return;
          }

          // Only refresh if expiring within threshold
          if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS && timeUntilExpiry > 0) {
            console.log("[Auth] Session expiring soon, refreshing...");
            await refreshSession(); // Don't block on refresh result
          }
        }
      } catch (error) {
        console.error("[Auth] Error during periodic session check:", error);
      }
    }, SESSION_CHECK_INTERVAL_MS);

    // Handle visibility change (tab switching)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && mounted) {
        console.log("[Auth] Tab became visible, checking session...");

        // Verify session is still valid
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          // Check if session expired while tab was hidden
          const expiresAt = currentSession.expires_at;
          const now = Date.now();
          const expiresAtMs = expiresAt ? expiresAt * 1000 : 0;

          if (expiresAt && expiresAtMs < now) {
            console.log("[Auth] Session expired while tab was hidden");
            setSession(null);
            setUser(null);
            setAuthState("unauthenticated");
          } else {
            // Only update if session actually changed
            if (!session || session.access_token !== currentSession.access_token) {
              console.log("[Auth] Session still valid, updating state");
              setSession(currentSession);
              setUser(currentSession.user);
              setAuthState("authenticated");
            }
          }
        } else {
          // Session was cleared (possibly signed out in another tab)
          console.log("[Auth] No session found on tab focus");
          setSession(null);
          setUser(null);
          setAuthState("unauthenticated");
        }

        setLoading(false);
      }
    };

    // Handle storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SESSION && mounted) {
        if (!e.newValue) {
          // Session was cleared in another tab
          setSession(null);
          setUser(null);
          setAuthState("unauthenticated");
        }
        // Don't update state for new values - let onAuthStateChange handle that
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      console.log("[Auth] Network back online, refreshing session...");
      refreshSession();
    };

    const handleOffline = () => {
      console.log("[Auth] Network offline");
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      mounted = false;
      mountedRef.current = false;

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleAuthError, refreshSession]);

  // Auth actions
  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      clearError();
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${siteUrl}/auth/confirm`,
          // SUPERPOWERS: Disable email confirmation requirement
          emailConfirm: false
        },
      });

      if (signUpError) {
        handleAuthError(signUpError, "signUp");
      }

      return { user: data.user, error: signUpError };
    },
    [clearError, handleAuthError]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      console.log("[Auth] signIn called", { email, timestamp: new Date().toISOString() });
      clearError();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.log("[Auth] signIn failed", { error: signInError.message });
        handleAuthError(signInError, "signIn");
      } else {
        console.log("[Auth] signIn successful", {
          userId: data.user?.id,
          email: data.user?.email,
          hasSession: !!data.session
        });
      }

      return { user: data.user, error: signInError };
    },
    [clearError, handleAuthError]
  );

  const signOut = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      console.log("[Auth] Starting sign out process");

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("[Auth] Sign out error:", signOutError);
        handleAuthError(signOutError, "signOut");
        setLoading(false);
        return { error: signOutError };
      }

      console.log("[Auth] Sign out successful, clearing local state");

      // Clear local state immediately
      setSession(null);
      setUser(null);
      setAuthState("unauthenticated");

      // Clear session storage
      try {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
        localStorage.removeItem("videoremix-auth");
      } catch {
        // Ignore storage errors
      }

      setLoading(false);
      return { error: null };
    } catch (err) {
      console.error("[Auth] Sign out exception:", err);
      handleAuthError(err, "signOut");
      setLoading(false);
      return { error: err as AuthError };
    }
  }, [clearError, handleAuthError]);

  const resetPassword = useCallback(
    async (email: string) => {
      clearError();
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback`,
      });

      if (resetError) {
        handleAuthError(resetError, "resetPassword");
      }

      return { error: resetError };
    },
    [clearError, handleAuthError]
  );

  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      clearError();
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (updateError) {
        handleAuthError(updateError, "updateProfile");
        return { user: data?.user, error: updateError };
      }

      // Also save to profiles table for extended profile data with tenant support
      if (data?.user) {
        const profileData = {
          user_id: data.user.id,
          email: data.user.email,
          full_name: `${updates.first_name || ''} ${updates.last_name || ''}`.trim(),
          avatar_url: updates.avatar_url || '',
          bio: updates.bio || '',
          company: updates.company || '',
          website: updates.website || '',
        };

        // Try to upsert into profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'user_id' });

        if (profileError) {
          console.warn('Failed to update profiles table:', profileError);
        }
      }

      return { user: data.user, error: updateError };
    },
    [clearError, handleAuthError, supabase]
  );

  const value: AuthContextType = useMemo(
    () => ({
      // Core state
      user,
      session,
      loading,
      isAuthenticated,
      authState,
      error,

      // Session metadata
      sessionExpiresAt,
      isSessionExpiringSoon,

      // Auth actions
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,

      // Utility
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
      isSessionExpiringSoon,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshSession,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
