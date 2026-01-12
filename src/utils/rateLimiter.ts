// Simple in-memory rate limiter for Edge Functions
// In production, consider using Redis or a more robust solution

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: any;

  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100 // requests per window
  ) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
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
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
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

  // Special rate limits for different actions
  checkAdminLimit(userId: string, action: string = 'default'): { allowed: boolean; remaining: number; resetTime: number } {
    // Stricter limits for admin actions
    const limits = {
      'read': { windowMs: 5 * 60 * 1000, maxRequests: 200 }, // 200 reads per 5 minutes
      'write': { windowMs: 15 * 60 * 1000, maxRequests: 50 }, // 50 writes per 15 minutes
      'delete': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 deletes per hour
      'default': { windowMs: 15 * 60 * 1000, maxRequests: 100 }
    };

    const limit = limits[action as keyof typeof limits] || limits.default;
    const key = `admin:${userId}:${action}`;

    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + limit.windowMs
      });
      return {
        allowed: true,
        remaining: limit.maxRequests - 1,
        resetTime: now + limit.windowMs
      };
    }

    if (entry.count >= limit.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit.maxRequests - entry.count,
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