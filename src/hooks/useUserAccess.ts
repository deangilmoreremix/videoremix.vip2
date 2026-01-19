import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { purchaseService, UserAppAccess, Purchase } from '../services/purchaseService';
import { appConfig } from '../config/appConfig';

/**
 * Utility function for retry logic with exponential backoff
 * Automatically retries failed operations with increasing delays
 * @template T - The return type of the function to retry
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns Promise that resolves with the function result or rejects after all retries
 * @throws The last error encountered if all retries fail
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = appConfig.UI.MAX_RETRY_ATTEMPTS,
  baseDelay: number = appConfig.UI.RETRY_BASE_DELAY_MS
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Represents access information for a specific application
 */
interface AppAccess {
  /** Unique identifier for the app */
  appId: string;
  /** Slug identifier used for routing and access checks */
  appSlug: string;
  /** Display name of the application */
  appName: string;
  /** Access tier granted (e.g., 'lifetime', 'subscription') */
  accessTier: string;
  /** Numeric level of the access tier for comparison */
  tierLevel: number;
  /** Human-readable display name for the access tier */
  tierDisplayName: string;
  /** Array of product names that granted this access */
  grantedBy: string[];
}

/**
 * Represents a user product with mapping status
 */
interface UserProduct {
  /** Unique identifier for the product */
  productId: string;
  /** Display name of the product */
  productName: string;
  /** Whether this product is mapped to apps */
  isMapped: boolean;
}

/**
 * Complete user access data from the resolve-user-access function
 */
interface UserAccessData {
  /** Whether the user has any access at all */
  hasAccess: boolean;
  /** Array of apps the user has access to */
  apps: AppAccess[];
  /** Array of products the user owns */
  products: UserProduct[];
}

/**
 * Unified access data combining direct purchases and imported product access
 */
interface UnifiedAccessData {
  /** Array of app slugs purchased directly */
  purchasedApps: string[];
  /** Detailed access records from user_app_access table */
  appAccessDetails: UserAppAccess[];
  /** Complete purchase history */
  purchases: Purchase[];
  /** Access data from imported products (may be null) */
  accessData: UserAccessData | null;
  /** Loading state for access data fetching */
  loading: boolean;
  /** Error message if access data failed to load */
  error: string | null;
}

export const useUserAccess = (): UnifiedAccessData & {
  hasAccessToApp: (appSlug: string) => boolean;
  checkAccess: (appSlug: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  hasAnyPurchases: boolean;
} => {
  const [purchasedApps, setPurchasedApps] = useState<string[]>([]);
  const [appAccessDetails, setAppAccessDetails] = useState<UserAppAccess[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accessData, setAccessData] = useState<UserAccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading states for individual operations to prevent race conditions
  const [loadingStates, setLoadingStates] = useState({
    purchaseData: false,
    accessData: false
  });

  // Cache for user data to prevent unnecessary re-fetches
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const loadPurchaseData = useCallback(async () => {
    try {
      const { data: { user } } = await retryWithBackoff(() => supabase.auth.getUser());

      if (!user) {
        setPurchasedApps([]);
        setAppAccessDetails([]);
        setPurchases([]);
        return;
      }

      const [apps, accessDetails, userPurchases] = await Promise.all([
        retryWithBackoff(() => purchaseService.getUserPurchasedApps(user.id)),
        retryWithBackoff(() => purchaseService.getUserAppAccessDetails(user.id)),
        retryWithBackoff(() => purchaseService.getAllUserPurchases(user.id)),
      ]);

      setPurchasedApps(apps);
      setAppAccessDetails(accessDetails);
      setPurchases(userPurchases);
    } catch (err: unknown) {
      console.error('Error fetching purchase data after retries:', err);
      // Don't set global error for individual failures - let loadAllAccessData handle it
      throw err; // Re-throw to let Promise.allSettled handle it
    }
  }, []);

  const loadUserAccess = useCallback(async () => {
    setError(null);

    try {
      const { data: { user } } = await retryWithBackoff(() => supabase.auth.getUser());

      if (!user) {
        setAccessData(null);
        return;
      }

      const { data: session } = await retryWithBackoff(() => supabase.auth.getSession());
      if (!session?.session?.access_token) {
        setAccessData(null);
        return;
      }

      const result = await retryWithBackoff(async () => {
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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Failed to load user access');
        }

        return data;
      });

      setAccessData(result.data);
    } catch (err: unknown) {
      console.error('Error loading user access after retries:', err);
      // Don't expose internal error details to users
      throw err; // Re-throw to let Promise.allSettled handle it
    }
  }, []);

  const loadAllAccessData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Skip if user hasn't changed (prevents unnecessary re-fetches)
      if (lastUserId === (user?.id || null)) {
        return;
      }

      setLastUserId(user?.id || null);
      setLoading(true);
      setLoadingStates({ purchaseData: true, accessData: true });

      const [purchaseResult, accessResult] = await Promise.allSettled([
        loadPurchaseData(),
        loadUserAccess()
      ]);

      // Handle partial failures gracefully
      if (purchaseResult.status === 'rejected') {
        console.error('Failed to load purchase data:', purchaseResult.reason);
      }
      if (accessResult.status === 'rejected') {
        console.error('Failed to load access data:', accessResult.reason);
      }
    } catch (err: unknown) {
      console.error('Error in loadAllAccessData:', err);
      setError(appConfig.ERRORS.GENERIC_LOAD_ERROR);
    } finally {
      setLoading(false);
      setLoadingStates({ purchaseData: false, accessData: false });
    }
  }, [loadPurchaseData, loadUserAccess, lastUserId]);

  useEffect(() => {
    loadAllAccessData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadAllAccessData();
      } else if (event === 'SIGNED_OUT') {
        setLastUserId(null);
        setPurchasedApps([]);
        setAppAccessDetails([]);
        setPurchases([]);
        setAccessData(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadAllAccessData]);

  // Unified access checking - combines both direct purchases and imported product access
  const hasAccessToApp = useCallback(
    (appSlug: string): boolean => {
      if (!appSlug) return false;

      // Check direct purchases first
      if (purchasedApps.includes(appSlug)) {
        return true;
      }

      // Check imported product access
      if (accessData?.apps) {
        return accessData.apps.some(app => app.appSlug === appSlug);
      }

      return false;
    },
    [purchasedApps, accessData]
  );

  const checkAccess = useCallback(
    async (appSlug: string): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      return await purchaseService.checkUserHasAccess(user.id, appSlug);
    },
    []
  );

  const refetch = useCallback(async () => {
    await loadAllAccessData();
  }, [loadAllAccessData]);

  return {
    purchasedApps,
    appAccessDetails,
    purchases,
    accessData,
    loading,
    error,
    hasAccessToApp,
    checkAccess,
    refetch,
    hasAnyPurchases: purchasedApps.length > 0 || (accessData?.apps?.length || 0) > 0,
  };
};

export default useUserAccess;
