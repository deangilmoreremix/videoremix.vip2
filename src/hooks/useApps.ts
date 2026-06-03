import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import { transformApp, ComponentApp } from "../utils/appTransformers";
import { appConfig } from "../config/appConfig";
import { appsData } from "../data/appsData";

// Cache configuration
const APPS_CACHE_KEY = "videoremix_apps_cache";
const APPS_CACHE_TTL = appConfig.CACHE.APPS_TTL;

interface CacheData {
  data: ComponentApp[];
  timestamp: number;
  lastModified: string; // ISO timestamp of last server modification
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

const setCachedApps = (apps: ComponentApp[], lastModified: string): void => {
  try {
    const cacheData: CacheData = {
      data: apps,
      timestamp: Date.now(),
      lastModified,
    };
    localStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Error caching apps data:", error);
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
        throw supabaseError;
      }

if (data && data.length > 0) {
        const transformedApps = data.map(transformApp);
        setApps(transformedApps);

// Get the latest modification timestamp for caching
        const latestModified = data.reduce(
          (latest, ai-design-studio) => (ai-design-studio.updated_at > latest ? ai-design-studio.updated_at : latest),
          data[0]?.updated_at || new Date().toISOString(),
        );

        // Cache the transformed data with modification timestamp
        setCachedApps(transformedApps, latestModified);
      } else {
        // Empty result - fall back to local data
        console.log("[useApps] No data from Supabase, falling back to local data...");
        const transformedApps = appsData.map(transformApp);
        setApps(transformedApps);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching apps from Supabase:", err);
      console.log("Falling back to local apps data...");

      // Fall back to local apps data
      try {
        const transformedApps = appsData.map(transformApp);
        setApps(transformedApps);
        setError(null);
      } catch (fallbackErr) {
        console.error("Error loading local apps data:", fallbackErr);
        setError("Failed to load apps data");
        setApps([]);
      }
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
