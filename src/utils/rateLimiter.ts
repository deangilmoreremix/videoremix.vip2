// Simple in-memory rate limiter for Edge Functions
// In production, consider using Redis or a more robust solution

import { appConfig } from '../config/appConfig';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private windowMs: number = appConfig.RATE_LIMIT.WINDOW_MS,
    private maxRequests: number = appConfig.RATE_LIMIT.MAX_REQUESTS
  ) {
    // Clean up expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, appConfig.RATE_LIMIT.CLEANUP_INTERVAL_MS);
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
      nextCleanup: Date.now() + appConfig.RATE_LIMIT.CLEANUP_INTERVAL_MS
    };
  }

  private getKey(identifier: string, action: string = 'default'): string {
    return `${identifier}:${action}`;
  }

  checkLimit(identifier: string, action: string = 'default'): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      console.debug(`RateLimiter: New window for ${key}`);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      console.warn(`RateLimiter: Rate limit exceeded for ${key}, remaining: ${Math.ceil((entry.resetTime - now) / 1000)}s`);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Reset limits for a specific identifier (useful for testing/admin)
  resetLimit(identifier: string, action: string = 'default'): void {
    const key = this.getKey(identifier, action);
    this.limits.delete(key);
    console.debug(`RateLimiter: Reset limit for ${key}`);
  }

  // Cleanup method to prevent memory leaks
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Special rate limits for different actions
  checkAdminLimit(userId: string, action: string = 'default'): { allowed: boolean; remaining: number; resetTime: number } {
    // Stricter limits for admin actions
    const limits = appConfig.ADMIN_RATE_LIMIT;

    const limit = limits[action.toUpperCase() as keyof typeof limits] || limits.DEFAULT;
    const key = `admin:${userId}:${action}`;

    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + limit.WINDOW_MS
      });
      return {
        allowed: true,
        remaining: limit.MAX_REQUESTS - 1,
        resetTime: now + limit.WINDOW_MS
      };
    }

    if (entry.count >= limit.MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit.MAX_REQUESTS - entry.count,
      resetTime: entry.resetTime
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Helper function for admin endpoints
export function checkAdminRateLimit(userId: string, action: string = 'default'): { allowed: boolean; error?: string } {
  const result = rateLimiter.checkAdminLimit(userId, action);

  if (!result.allowed) {
    const resetInMinutes = Math.ceil((result.resetTime - Date.now()) / (60 * 1000));
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${resetInMinutes} minutes.`
    };
  }

  return { allowed: true };
}