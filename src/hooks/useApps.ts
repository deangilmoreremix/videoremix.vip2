import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { transformApp, safeTransform, isValidAppData, ComponentApp } from "../utils/appTransformers";
import { appConfig } from "../config/appConfig";

// Cache configuration
const APPS_CACHE_KEY = "videoremix_apps_cache";
const APPS_CACHE_TTL = appConfig.CACHE.APPS_TTL;
const APPS_CACHE_VERSION = "2";

interface CacheData {
  data: ComponentApp[];
  timestamp: number;
  version: string;
}

// Cache utility functions
const getCachedApps = (): ComponentApp[] | null => {
  try {
    const cached = localStorage.getItem(APPS_CACHE_KEY);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cacheData.timestamp > APPS_CACHE_TTL) {
      localStorage.removeItem(APPS_CACHE_KEY);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.warn("Error reading apps cache:", error);
    return null;
  }
};

const setCachedApps = (apps: ComponentApp[]): void => {
  try {
    const cacheData: CacheData = {
      data: apps,
      timestamp: Date.now(),
      version: APPS_CACHE_VERSION,
    };

    const cacheString = JSON.stringify(cacheData);

    // Check if the data is too large for localStorage (typically ~5-10MB limit)
    if (cacheString.length > 4 * 1024 * 1024) { // 4MB limit
      console.warn("Apps data too large for localStorage, skipping cache");
      return;
    }

    localStorage.setItem(APPS_CACHE_KEY, cacheString);
  } catch (error) {
    // Handle QuotaExceededError and other storage errors gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("Storage quota exceeded, clearing old cache and retrying");

      // Try clearing some space and retry once
      try {
        localStorage.removeItem(APPS_CACHE_KEY);
        // Clear other potential caches if they exist
        const keysToRemove = Object.keys(localStorage).filter(key =>
          key.includes('videoremix') || key.includes('cache')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Retry with smaller data or skip caching
        console.warn("Cache cleared, skipping apps data caching to prevent quota issues");
      } catch (clearError) {
        console.warn("Failed to clear cache:", clearError);
      }
    } else {
      console.warn("Error caching apps data:", error);
    }
  }
};

const clearAppsCache = (): void => {
  try {
    localStorage.removeItem(APPS_CACHE_KEY);
  } catch (error) {
    console.warn("Error clearing apps cache:", error);
  }
};

export const useApps = () => {
  const [apps, setApps] = useState<ComponentApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedApps = getCachedApps();
        if (cachedApps) {
          console.log("[useApps] Using cached data (skipping validation due to RLS issues)");
          setApps(cachedApps);
          setLoading(false);
          return;
        }
      }

      const { data, error: supabaseError } = await supabase
        .from("apps")
        .select("*")
        .order("sort_order", { ascending: true });

      if (supabaseError) {
        // Handle RLS/permission errors gracefully
        if (supabaseError.code === 'PGRST116' || supabaseError.message?.includes('permission denied') || supabaseError.message?.includes('RLS') || supabaseError.code === '42501') {
          console.warn("[useApps] Access denied to apps table, returning empty array:", supabaseError);
          setApps([]);
          setLoading(false);
          return;
        }
        throw supabaseError;
      }

      if (data) {
        // Validate data is an array before processing
        if (!Array.isArray(data)) {
          console.error("[useApps] Expected array from Supabase but got:", typeof data);
          setApps([]);
          setLoading(false);
          return;
        }

        // Filter for valid records first, then safely transform
        const transformedApps = data
          .filter(isValidAppData)
          .map(safeTransform)
          .filter((app): app is ComponentApp => app !== null);

        if (transformedApps.length > 0) {
          setApps(transformedApps);
          setCachedApps(transformedApps);
        } else {
          console.warn("[useApps] No valid apps after filtering/transformation");
          setApps([]);
        }
      }
    } catch (err) {
      console.error("Error fetching apps:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    clearAppsCache(); // Clear cache before refetching
    return fetchApps(true);
  }, [fetchApps]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return {
    apps,
    loading,
    error,
    refetch,
  };
};
