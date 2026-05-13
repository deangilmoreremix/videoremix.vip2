/**
 * Client-Side Rate Limiter
 * Prevents rapid button clicks and API abuse
 */

interface RateLimitConfig {
  /** Maximum number of attempts allowed within the window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional callback when rate limit is exceeded */
  onRateLimit?: (key: string, attempts: number) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited
 * @param key - Unique key for the action (e.g., 'button-click', 'api-call')
 * @param config - Rate limit configuration
 * @returns true if action is allowed, false if rate limited
 */
export function isAllowed(
  key: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // First attempt or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }
  
  if (entry.count >= config.maxAttempts) {
    // Rate limit exceeded
    if (config.onRateLimit) {
      config.onRateLimit(key, entry.count);
    }
    return false;
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  return true;
}

/**
 * Rate-limited wrapper for functions
 * @param key - Unique key for the action
 * @param fn - Function to call if not rate limited
 * @param config - Rate limit configuration
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  key: string,
  fn: T,
  config: RateLimitConfig
): ((...args: Parameters<T>) => ReturnType<T> | null) {
  return ((...args: Parameters<T>) => {
    if (!isAllowed(key, config)) {
      console.warn(`Rate limit exceeded for key: ${key}`);
      return null;
    }
    return fn(...args);
  }) as (...args: Parameters<T>) => ReturnType<T> | null;
}

/**
 * React hook for rate limiting button clicks
 * @param key - Unique key for the action
 * @param config - Rate limit configuration
 */
export function useRateLimit(
  key: string,
  config: RateLimitConfig
): { isAllowed: () => boolean; reset: () => void } {
  const checkAllowed = () => isAllowed(key, config);
  
  const reset = () => {
    rateLimitStore.delete(key);
  };
  
  return { isAllowed: checkAllowed, reset };
}

/**
 * Clean up old entries to prevent memory leaks
 * Call this periodically or on page unload
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired rate limit entries`);
  }
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cleanupRateLimit();
  }, 5 * 60 * 1000);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupRateLimit();
  });
}
