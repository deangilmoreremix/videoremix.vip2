// Enhanced rate limiter with Redis support for production scaling
// Falls back to in-memory storage when Redis is not available

import { appConfig } from "../config/appConfig";

// Redis client interface for Deno
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
}

// Redis client factory
class RedisClientFactory {
  private static client: RedisClient | null = null;
  private static isConnected = false;

  static async getClient(): Promise<RedisClient | null> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      // Try to import Redis client for Deno
      const { createClient } =
        await import("https://deno.land/x/redis@v0.32.0/mod.ts");

      const redisUrl = Deno.env.get("REDIS_URL");
      if (!redisUrl) {
        console.warn(
          "REDIS_URL not configured, falling back to in-memory rate limiting",
        );
        return null;
      }

      this.client = await createClient({
        hostname: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port) || 6379,
        password: new URL(redisUrl).password,
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      console.log("Redis client connected successfully");
      return this.client;
    } catch (error) {
      console.warn(
        "Failed to connect to Redis, falling back to in-memory rate limiting:",
        error.message,
      );
      return null;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit?.();
      } catch (error) {
        console.error("Error disconnecting Redis client:", error);
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private redisClient: RedisClient | null = null;
  private useRedis = false;

  constructor(
    private windowMs: number = appConfig.RATE_LIMIT.WINDOW_MS,
    private maxRequests: number = appConfig.RATE_LIMIT.MAX_REQUESTS,
  ) {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    // Try to get Redis client
    this.redisClient = await RedisClientFactory.getClient();
    this.useRedis = this.redisClient !== null;

    if (!this.useRedis) {
      // Fall back to in-memory storage with cleanup
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, appConfig.RATE_LIMIT.CLEANUP_INTERVAL_MS);
      console.log("RateLimiter: Using in-memory storage");
    } else {
      console.log("RateLimiter: Using Redis storage");
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.debug(`RateLimiter: Cleaned up ${cleaned} expired entries`);
    }
  }

  // Get current stats for monitoring
  getStats(): { totalEntries: number; nextCleanup: number } {
    return {
      totalEntries: this.limits.size,
      nextCleanup: Date.now() + appConfig.RATE_LIMIT.CLEANUP_INTERVAL_MS,
    };
  }

  private getKey(identifier: string, action: string = "default"): string {
    return `${identifier}:${action}`;
  }

  async checkLimit(
    identifier: string,
    action: string = "default",
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getKey(identifier, action);
    const now = Date.now();

    if (this.useRedis && this.redisClient) {
      return this.checkLimitRedis(key, now, this.maxRequests, this.windowMs);
    } else {
      return this.checkLimitMemory(key, now);
    }
  }

  private checkLimitMemory(
    key: string,
    now: number,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      console.debug(`RateLimiter: New window for ${key}`);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      console.warn(
        `RateLimiter: Rate limit exceeded for ${key}, remaining: ${Math.ceil((entry.resetTime - now) / 1000)}s`,
      );
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Reset limits for a specific identifier (useful for testing/admin)
  resetLimit(identifier: string, action: string = "default"): void {
    const key = this.getKey(identifier, action);
    this.limits.delete(key);
    console.debug(`RateLimiter: Reset limit for ${key}`);
  }

  // Cleanup method to prevent memory leaks
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Disconnect Redis client
    await RedisClientFactory.disconnect();
  }

  // Special rate limits for different actions
  async checkAdminLimit(
    userId: string,
    action: string = "default",
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // Stricter limits for admin actions
    const limits = appConfig.ADMIN_RATE_LIMIT;

    const limit =
      limits[action.toUpperCase() as keyof typeof limits] || limits.DEFAULT;
    const key = `admin:${userId}:${action}`;

    if (this.useRedis && this.redisClient) {
      return this.checkLimitRedis(
        key,
        Date.now(),
        limit.MAX_REQUESTS,
        limit.WINDOW_MS,
      );
    } else {
      return this.checkAdminLimitMemory(key, Date.now(), limit);
    }
  }

  private checkAdminLimitMemory(
    key: string,
    now: number,
    limit: { WINDOW_MS: number; MAX_REQUESTS: number },
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + limit.WINDOW_MS,
      });
      return {
        allowed: true,
        remaining: limit.MAX_REQUESTS - 1,
        resetTime: now + limit.WINDOW_MS,
      };
    }

    if (entry.count >= limit.MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit.MAX_REQUESTS - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private async checkLimitRedis(
    key: string,
    now: number,
    maxRequests: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.redisClient) {
      throw new Error("Redis client not available");
    }

    try {
      const countKey = `${key}:count`;
      const resetKey = `${key}:reset`;

      // Get current count and reset time
      const [countStr, resetStr] = await Promise.all([
        this.redisClient.get(countKey),
        this.redisClient.get(resetKey),
      ]);

      const currentCount = countStr ? parseInt(countStr) : 0;
      const resetTime = resetStr ? parseInt(resetStr) : 0;

      if (!countStr || now > resetTime) {
        // First request or window expired
        const newResetTime = now + windowMs;
        await Promise.all([
          this.redisClient.set(countKey, "1", {
            ex: Math.ceil(windowMs / 1000),
          }),
          this.redisClient.set(resetKey, newResetTime.toString(), {
            ex: Math.ceil(windowMs / 1000),
          }),
        ]);
        console.debug(`RateLimiter: New window for ${key} (Redis)`);
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: newResetTime,
        };
      }

      if (currentCount >= maxRequests) {
        console.warn(
          `RateLimiter: Rate limit exceeded for ${key}, remaining: ${Math.ceil((resetTime - now) / 1000)}s`,
        );
        return {
          allowed: false,
          remaining: 0,
          resetTime: resetTime,
        };
      }

      // Increment count
      const newCount = await this.redisClient.incr(countKey);
      return {
        allowed: true,
        remaining: maxRequests - newCount,
        resetTime: resetTime,
      };
    } catch (error) {
      console.error("Redis rate limiting error:", error);
      // Fall back to in-memory on Redis error
      const limit = { WINDOW_MS: windowMs, MAX_REQUESTS: maxRequests };
      return this.checkAdminLimitMemory(key, now, limit);
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Helper function for admin endpoints
export async function checkAdminRateLimit(
  userId: string,
  action: string = "default",
): Promise<{ allowed: boolean; error?: string }> {
  const result = await rateLimiter.checkAdminLimit(userId, action);

  if (!result.allowed) {
    const resetInMinutes = Math.ceil(
      (result.resetTime - Date.now()) / (60 * 1000),
    );
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${resetInMinutes} minutes.`,
    };
  }

  return { allowed: true };
}
