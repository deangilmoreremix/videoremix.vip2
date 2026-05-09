import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  purchaseService,
  UserAppAccess,
  Purchase,
} from "../services/purchaseService";

interface UsePurchasesReturn {
  purchasedApps: string[];
  appAccessDetails: UserAppAccess[];
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  hasPurchased: (appSlug: string) => boolean;
  checkAccess: (appSlug: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  hasAnyPurchases: boolean;
}

export const usePurchases = (): UsePurchasesReturn => {
  const { user } = useAuth();
  const [purchasedApps, setPurchasedApps] = useState<string[]>([]);
  const [appAccessDetails, setAppAccessDetails] = useState<UserAppAccess[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseData = useCallback(async () => {
    if (!user) {
      setPurchasedApps([]);
      setAppAccessDetails([]);
      setPurchases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [apps, accessDetails, userPurchases] = await Promise.all([
        purchaseService.getUserPurchasedApps(user.id),
        purchaseService.getUserAppAccessDetails(user.id),
        purchaseService.getAllUserPurchases(user.id),
      ]);

      setPurchasedApps(apps);
      setAppAccessDetails(accessDetails);
      setPurchases(userPurchases);
    } catch (err: any) {
      console.error("Error fetching purchase data:", err);
      setError(err.message || "Failed to load purchase data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_purchases:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_app_access",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPurchaseData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPurchaseData]);

  const hasPurchased = useCallback(
    (appSlug: string): boolean => {
      return purchasedApps.includes(appSlug);
    },
    [purchasedApps],
  );

  const checkAccess = useCallback(
    async (appSlug: string): Promise<boolean> => {
      if (!user) return false;
      return await purchaseService.checkUserHasAccess(user.id, appSlug);
    },
    [user],
  );

  const refetch = useCallback(async () => {
    await fetchPurchaseData();
  }, [fetchPurchaseData]);

  return {
    purchasedApps,
    appAccessDetails,
    purchases,
    loading,
    error,
    hasPurchased,
    checkAccess,
    refetch,
    hasAnyPurchases: purchasedApps.length > 0,
  };
};

export default usePurchases;

import { supabase } from "../utils/supabaseClient";
