import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import { useUser, useSession, useSignIn, useSignUp, useClerk } from "../providers/ClerkProvider";
import { supabase } from "../utils/supabase";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions: Record<string, any>;
  created_at: string;
  last_login?: string;
}

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<void>;
  sessionExpiry?: Date;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const clerk = useClerk();
  const clerkUser = useUser();
  const clerkSession = useSession();
  const { isLoaded: signInLoaded, signIn: signInResource, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp: signUpResource } = useSignUp();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | undefined>();
  const isFetchingRoleRef = useRef(false);

  const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;

  // Fetch the admin role for the current Clerk user from user_roles (keyed by Clerk user ID).
  // The supabase client sends the Clerk JWT via the accessToken callback set in AuthContext.
  const fetchAndSetRole = useCallback(
    async (clerkUserId: string, clerkUserEmail: string | null | undefined, clerkCreatedAt: string | undefined) => {
      if (isFetchingRoleRef.current) return null;
      isFetchingRoleRef.current = true;
      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", clerkUserId)
          .maybeSingle();

        if (roleError) {
          console.warn(
            "AdminContext - user_roles lookup failed:",
            roleError.message,
          );
          return null;
        }

        const role = roleData?.role;
        if (!role || (role !== "super_admin" && role !== "admin")) {
          return null;
        }

        const adminUser: AdminUser = {
          id: clerkUserId,
          email: clerkUserEmail || "",
          role,
          is_active: true,
          permissions: {},
          created_at: clerkCreatedAt || new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
        setUser(adminUser);
        setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT_MS));
        return adminUser;
      } finally {
        isFetchingRoleRef.current = false;
      }
    },
    [],
  );

  // When the Clerk user changes, fetch the admin role.
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!clerkUser.isLoaded) {
        return;
      }
      if (!clerkUser.user) {
        setUser(null);
        setSessionExpiry(undefined);
        setIsLoading(false);
        return;
      }
      const u = clerkUser.user;
      const email = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress;
      const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : undefined;
      await fetchAndSetRole(u.id, email, createdAt);
      if (!cancelled) setIsLoading(false);
    };
    sync();
    return () => {
      cancelled = true;
    };
  }, [clerkUser.isLoaded, clerkUser.user?.id, fetchAndSetRole]);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!signInLoaded || !signInResource) {
        return { success: false, error: "Sign-in is still loading. Please try again." };
      }
      try {
        setIsLoading(true);
        const result = await signInResource.create({ identifier: email, password });
        if (result.status !== "complete") {
          return { success: false, error: "Sign in requires additional steps." };
        }
        await setSignInActive({ session: result.createdSessionId });
        // The useEffect on clerkUser will fetch the role once the user is set.
        // Wait briefly for the role to resolve so the caller can rely on admin state.
        const u = clerkUser.user;
        if (u) {
          const emailAddr = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress;
          const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : undefined;
          const admin = await fetchAndSetRole(u.id, emailAddr, createdAt);
          if (!admin) {
            return { success: false, error: "User does not have admin privileges" };
          }
        }
        return { success: true };
      } catch (err: any) {
        const message = err?.errors?.[0]?.message || err?.message || "Sign in failed";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [signInLoaded, signInResource, setSignInActive, clerkUser.user, fetchAndSetRole],
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!signUpLoaded || !signUpResource) {
        return { success: false, error: "Sign-up is still loading. Please try again." };
      }
      try {
        setIsLoading(true);
        const result = await signUpResource.create({ emailAddress: email, password });
        if (result.status === "complete") {
          return { success: true };
        }
        return { success: false, error: "Sign up requires additional verification." };
      } catch (err: any) {
        const message = err?.errors?.[0]?.message || err?.message || "Sign up failed";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [signUpLoaded, signUpResource],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await clerk.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setSessionExpiry(undefined);
    }
  }, [clerk]);

  const verifyAuth = useCallback(async (): Promise<void> => {
    if (!clerkUser.isLoaded) {
      setIsLoading(true);
      return;
    }
    if (!clerkUser.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const u = clerkUser.user;
    const email = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress;
    const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : undefined;
    await fetchAndSetRole(u.id, email, createdAt);
    setIsLoading(false);
  }, [clerkUser.isLoaded, clerkUser.user, fetchAndSetRole]);

  // Session timeout checker
  useEffect(() => {
    if (!sessionExpiry || !user) return;
    const check = () => {
      if (new Date() > sessionExpiry) {
        logout();
      }
    };
    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [sessionExpiry, user, logout]);

  // Keep the Clerk session active and the supabase token wired.
  useEffect(() => {
    // No-op; AuthContext already wires the Clerk token to the supabase client.
    // This effect exists so the AdminProvider re-renders when the Clerk session changes,
    // keeping admin state in sync via the clerkUser useEffect above.
  }, [clerkSession.session?.id]);

  const value: AdminContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      verifyAuth,
      sessionExpiry,
    }),
    [user, isLoading, login, signup, logout, verifyAuth, sessionExpiry],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
