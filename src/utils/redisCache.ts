// Redis-based caching utility for admin dashboard
// Provides caching for frequently accessed data with TTL support

import { safeParseInt } from "./safeParse";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Redis client interface for caching
interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<string>;
}

class RedisCache {
  private client: RedisCacheClient | null = null;
  private isConnected = false;
  private inMemoryCache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeCache();
    // Clean up expired in-memory entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private async initializeCache(): Promise<void> {
    try {
      // Try to import Redis client for Deno
      const { createClient } =
        await import("https://deno.land/x/redis@v0.32.0/mod.ts");

      const redisUrl = Deno.env.get("REDIS_URL");
      if (!redisUrl) {
        console.warn("REDIS_URL not configured, using in-memory cache");
        return;
      }

      this.client = await createClient({
        hostname: new URL(redisUrl).hostname,
        port: safeParseInt(new URL(redisUrl).port, 6379),
        password: new URL(redisUrl).password,
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      console.log("Redis cache client connected successfully");
    } catch (error) {
      console.warn(
        "Failed to connect to Redis for caching, using in-memory cache:",
        error.message,
      );
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.inMemoryCache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`RedisCache: Cleaned up ${cleaned} expired entries`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error("Redis cache get error:", error);
      }
    }

    // Fallback to in-memory cache
    const entry = this.inMemoryCache.get(key);
    if (entry && Date.now() < entry.timestamp + entry.ttl) {
      return entry.data;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Set in Redis if connected
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, JSON.stringify(value), {
          ex: ttlSeconds,
        });
        return;
      } catch (error) {
        console.warn("Redis cache set failed, using in-memory:", error.message);
      }
    }

    // Fallback to in-memory cache
    this.inMemoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });

    // Cleanup old entries if cache gets too large
    if (this.inMemoryCache.size > 100) {
      this.cleanup();
    }
  }

  async delete(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error("Redis cache delete error:", error);
      }
    }

    this.inMemoryCache.delete(key);
  }

  getStats(): { redisConnected: boolean; inMemoryEntries: number } {
    return {
      redisConnected: this.isConnected,
      inMemoryEntries: this.inMemoryCache.size,
    };
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.isConnected && this.client) {
      try {
        if (typeof (this.client as any).quit === "function") {
          await (this.client as any).quit();
        }
      } catch (error) {
        console.error("Error disconnecting Redis cache:", error);
      }
      this.isConnected = false;
    }

    this.inMemoryCache.clear();
  }
}

// Export singleton instance
export const redisCache = new RedisCache();

// Cache key generators
export const cacheKeys = {
  userAnalytics: (userId: string) => `admin:analytics:${userId}`,
  dashboardStats: () => "admin:dashboard:stats",
  announcements: () => "admin:announcements",
  userList: (page: number, limit: number) => `admin:users:${page}:${limit}`,
  appAccess: (userId: string) => `user:app_access:${userId}`,
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  USER_ANALYTICS: 5 * 60, // 5 minutes
  DASHBOARD_STATS: 2 * 60, // 2 minutes
  ANNOUNCEMENTS: 10 * 60, // 10 minutes
  USER_LIST: 1 * 60, // 1 minute
  APP_ACCESS: 5 * 60, // 5 minutes
};

// Export types for external use
export type { CacheEntry, RedisCacheClient };

// Export the class for instantiation if needed
export { RedisCache };
