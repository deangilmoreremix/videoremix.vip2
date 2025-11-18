import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isVerifyingRef = React.useRef(false);
  const lastVerificationRef = React.useRef<number>(0);
  const VERIFICATION_COOLDOWN = 2000;

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user || !authData.session) {
        return { success: false, error: 'Authentication failed' };
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        return { success: false, error: 'User does not have admin privileges' };
      }

      if (roleData.role !== 'super_admin' && roleData.role !== 'admin') {
        await supabase.auth.signOut();
        return { success: false, error: 'Access denied: Admin privileges required' };
      }

      const adminUser: AdminUser = {
        id: authData.user.id,
        email: authData.user.email!,
        role: roleData.role,
        is_active: true,
        permissions: {},
        created_at: authData.user.created_at,
        last_login: new Date().toISOString(),
      };

      console.log('AdminContext - Login successful, setting user:', adminUser);
      console.log('AdminContext - Session exists:', !!authData.session);
      setUser(adminUser);

      // Verify session was persisted
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AdminContext - Session persisted after login:', !!session);
      }, 100);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Sign up failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const verifyAuth = useCallback(async (): Promise<void> => {
    const now = Date.now();

    if (isVerifyingRef.current) {
      return;
    }

    if (now - lastVerificationRef.current < VERIFICATION_COOLDOWN) {
      return;
    }

    try {
      isVerifyingRef.current = true;
      lastVerificationRef.current = now;

      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setUser(null);
        isVerifyingRef.current = false;
      }, 10000);

      const { data: { session }, error } = await supabase.auth.getSession();
      clearTimeout(timeoutId);

      if (error || !session) {
        setUser(null);
        setIsLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('AdminContext - Error fetching role:', roleError);
        // Don't sign out on error, just set loading to false and keep existing user
        setIsLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      if (!roleData) {
        console.log('AdminContext - No role found for user');
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      if (roleData.role !== 'super_admin' && roleData.role !== 'admin') {
        console.log('AdminContext - User does not have admin role:', roleData.role);
        await supabase.auth.signOut();
        setUser(null);
        setIsLoading(false);
        isVerifyingRef.current = false;
        return;
      }

      const adminUser: AdminUser = {
        id: session.user.id,
        email: session.user.email!,
        role: roleData.role,
        is_active: true,
        permissions: {},
        created_at: session.user.created_at,
      };

      setUser(adminUser);
      setIsLoading(false);
      isVerifyingRef.current = false;
    } catch (error) {
      console.error('AdminContext - Auth verification error:', error);
      setUser(null);
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  }, []);

  useEffect(() => {
    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        verifyAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifyAuth]);

  const value: AdminContextType = React.useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    verifyAuth,
  }), [user, isLoading, login, signup, logout, verifyAuth]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};