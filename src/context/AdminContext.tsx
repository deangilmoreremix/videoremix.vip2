import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
  useMemo,
} from "react";
import { supabase } from "../utils/supabaseClient";

type AdminRole = "super_admin" | "admin";

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

async function resolveAdminUser(userId: string, email: string, createdAt: string): Promise<AdminUser | null> {
  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !roleData) return null;
  if (roleData.role !== "super_admin" && roleData.role !== "admin") return null;

  return {
    id: userId,
    email,
    role: roleData.role as AdminRole,
    is_active: true,
    created_at: createdAt,
  };
}

export const AdminProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isVerifyingRef = useRef(false);
  const lastVerificationRef = useRef(0);
  const VERIFICATION_COOLDOWN_MS = 2000;

  const verifyAuth = useCallback(async (): Promise<void> => {
    const now = Date.now();
    if (isVerifyingRef.current) return;
    if (now - lastVerificationRef.current < VERIFICATION_COOLDOWN_MS) return;

    isVerifyingRef.current = true;
    lastVerificationRef.current = now;

    try {
      setIsLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setUser(null);
        return;
      }

      const adminUser = await resolveAdminUser(
        session.user.id,
        session.user.email ?? "",
        session.user.created_at
      );

      setUser(adminUser);
    } catch (err) {
      console.error("[Admin] Auth verification error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.user || !authData.session) {
          return {
            success: false,
            error: authError?.message ?? "Authentication failed",
          };
        }

        const adminUser = await resolveAdminUser(
          authData.user.id,
          authData.user.email ?? "",
          authData.user.created_at
        );

        if (!adminUser) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: "Access denied: Admin privileges required",
          };
        }

        setUser(adminUser);
        return { success: true };
      } catch {
        return { success: false, error: "Network error occurred" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError || !data.user) {
          return {
            success: false,
            error: authError?.message ?? "Sign up failed",
          };
        }
        return { success: true };
      } catch {
        return { success: false, error: "Network error occurred" };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Admin] Logout error:", err);
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    verifyAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        verifyAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [verifyAuth]);

  const value = useMemo<AdminContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      verifyAuth,
    }),
    [user, isLoading, login, signup, logout, verifyAuth]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
