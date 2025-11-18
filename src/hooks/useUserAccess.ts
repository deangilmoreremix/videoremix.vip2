import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface AppAccess {
  appId: string;
  appSlug: string;
  appName: string;
  accessTier: string;
  tierLevel: number;
  tierDisplayName: string;
  grantedBy: string[];
}

interface UserProduct {
  productId: string;
  productName: string;
  isMapped: boolean;
}

interface UserAccessData {
  hasAccess: boolean;
  apps: AppAccess[];
  products: UserProduct[];
}

export const useUserAccess = () => {
  const [accessData, setAccessData] = useState<UserAccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserAccess = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAccessData(null);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        setAccessData(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-user-access`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setAccessData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load user access');
      }
    } catch (err: any) {
      console.error('Error loading user access:', err);
      setError(err.message || 'Failed to load access data');
      setAccessData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUserAccess();
      } else if (event === 'SIGNED_OUT') {
        setAccessData(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const hasAccessToApp = (appSlug: string): boolean => {
    if (!accessData) return false;
    return accessData.apps.some(app => app.appSlug === appSlug);
  };

  const getAppAccessTier = (appSlug: string): AppAccess | null => {
    if (!accessData) return null;
    return accessData.apps.find(app => app.appSlug === appSlug) || null;
  };

  const getUserProducts = (): UserProduct[] => {
    return accessData?.products || [];
  };

  const refreshAccess = () => {
    loadUserAccess();
  };

  return {
    accessData,
    isLoading,
    error,
    hasAccessToApp,
    getAppAccessTier,
    getUserProducts,
    refreshAccess,
  };
};
