import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { transformApp, ComponentApp } from '../utils/appTransformers';

// Cache configuration
const APPS_CACHE_KEY = 'videoremix_apps_cache';
const APPS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheData {
  data: ComponentApp[];
  timestamp: number;
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
    console.warn('Error reading apps cache:', error);
    return null;
  }
};

const setCachedApps = (apps: ComponentApp[]): void => {
  try {
    const cacheData: CacheData = {
      data: apps,
      timestamp: Date.now()
    };
    localStorage.setItem(APPS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error caching apps data:', error);
  }
};

const clearAppsCache = (): void => {
  try {
    localStorage.removeItem(APPS_CACHE_KEY);
  } catch (error) {
    console.warn('Error clearing apps cache:', error);
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
        .from('apps')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const transformedApps = data.map(transformApp);
        setApps(transformedApps);
        // Cache the transformed data
        setCachedApps(transformedApps);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
    refetch
  };
};