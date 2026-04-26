import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
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
          // Validate cache with server
          try {
            console.log("[useApps] Validating cache with server...");
            const { data: serverLastModified, error: validationError } =
              await supabase
                .from("apps")
                .select("updated_at")
                .order("updated_at", { ascending: false })
                .limit(1);

            console.log("[useApps] Cache validation response:", {
              data: serverLastModified,
              error: validationError,
              errorCode: validationError?.code,
              errorMessage: validationError?.message,
              errorDetails: validationError?.details,
            });

            // Handle 406 error (RLS or empty result)
            if (validationError) {
              console.warn(
                "[useApps] Cache validation failed due to RLS or empty table:",
                validationError,
              );
              // Continue to fetch fresh data - this is expected when RLS blocks access or table is empty
            } else if (serverLastModified && serverLastModified.length > 0) {
              const cached = localStorage.getItem(APPS_CACHE_KEY);
              if (cached) {
                const cacheData: CacheData = JSON.parse(cached);
                // If server data is newer, don't use cache
                if (
                  serverLastModified[0]?.updated_at &&
                  serverLastModified[0].updated_at > cacheData.lastModified
                ) {
                  // Cache is stale, continue to fetch fresh data
                  console.log(
                    "[useApps] Cache is stale, fetching fresh data...",
                  );
                } else {
                  // Cache is valid
                  console.log("[useApps] Cache is valid, using cached data");
                  setApps(cachedApps);
                  setLoading(false);
                  return;
                }
              }
            } else {
              // Empty result or no data
              console.log("[useApps] Empty result or no data available");
            }
          } catch (validationError) {
            console.warn(
              "Cache validation failed, fetching fresh data:",
              validationError,
            );
            // Continue to fetch fresh data
          }
        }
      }

      const { data, error: supabaseError } = await supabase
        .from("apps")
        .select("*")
        .order("sort_order", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const transformedApps = data.map(transformApp);
        setApps(transformedApps);

        // Get the latest modification timestamp for caching
        const latestModified = data.reduce(
          (latest, app) => (app.updated_at > latest ? app.updated_at : latest),
          data[0]?.updated_at || new Date().toISOString(),
        );

        // Cache the transformed data with modification timestamp
        setCachedApps(transformedApps, latestModified);
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
