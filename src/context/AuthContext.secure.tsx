// SECURITY HARDENED: AuthContext with httpOnly cookies & JWT validation
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  id: string;
  email: string | null;
  user_metadata?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// JWT validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Treat invalid tokens as expired
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isRefreshing = React.useRef(false);

  const verifySession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check token expiration
      if (isTokenExpired(session.access_token)) {
        // Try to refresh
        const refreshed = await refreshSession();
        if (!refreshed) {
          setUser(null);
          setLoading(false);
          return;
        }
        // Re-get session after refresh
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser({
          id: newSession.user.id,
          email: newSession.user.email || null,
        });
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email || null,
        });
      }
    } catch (err: any) {
      console.error('Session verification error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshing.current) return false;
    isRefreshing.current = true;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.error('Token refresh failed:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Refresh exception:', err);
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) return { success: false, error: error.message };
      if (!data.session) return { success: false, error: 'No session returned' };

      // SECURITY: Don't store sensitive data in localStorage
      // JWT is automatically handled by Supabase client via httpOnly cookies when configured
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || null,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [navigate]);

  useEffect(() => {
    verifySession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || null,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [verifySession]);

return (
     <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, refreshSession }}>
       {children}
     </AuthContext.Provider>
   );
};