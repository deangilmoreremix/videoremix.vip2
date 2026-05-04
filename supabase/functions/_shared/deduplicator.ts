/**
 * Request Deduplication Utility
 *
 * Prevents duplicate concurrent API calls by caching in-flight promises.
 * Ideal for identical requests from multiple users/clients.
 *
 * Features:
 * - Automatic deduplication based on request key
 * - Configurable TTL for dedupe entries
 * - Periodic cleanup of stale entries
 * - Promise sharing for identical concurrent calls
 *
 * Usage:
 * ```typescript
 * import { deduplicateRequest } from '../_shared/deduplicator.ts';
 *
 * const result = await deduplicateRequest(
 *   'embedding:user123:query', // unique key
 *   async () => await openai.embeddings.create({ input: text }),
 *   10000 // TTL in ms
 * );
 * ```
 */

type AsyncFn<T> = () => Promise<T>;

interface DedupeEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class RequestDeduplicator {
  private entries = new Map<string, DedupeEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private defaultTtl = 30000; // 30 seconds default

  constructor(cleanupIntervalMs = 60000) {
    // Periodic cleanup of stale entries
    this.cleanupInterval = setInterval(() => this.cleanupStale(), cleanupIntervalMs);
  }

  /**
   * Execute a deduplicated request
   * If another request with the same key is in-flight, returns the same promise
   */
  async dedupe<T>(
    key: string,
    fn: AsyncFn<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {},
  ): Promise<T> {
    const { ttl = this.defaultTtl, forceRefresh = false } = options;

    // Force refresh bypasses cache
    if (forceRefresh) {
      return await fn();
    }

    // Check if already in-flight
    const existing = this.entries.get(key);
    if (existing) {
      // Check if entry is still valid (not expired)
      if (Date.now() - existing.timestamp < ttl) {
        return await existing.promise;
      }
      // Entry expired, remove it
      this.entries.delete(key);
    }

    // Create new promise
    const promise = (async (): Promise<T> => {
      try {
        const result = await fn();
        // Auto-remove after TTL (success or failure handled by finally)
        return result;
      } catch (error) {
        // On error, remove from dedupe so next call retries
        this.entries.delete(key);
        throw error;
      } finally {
        // Also remove after TTL if still present (for successes)
        setTimeout(() => {
          if (this.entries.get(key)?.timestamp === existing?.timestamp) {
            this.entries.delete(key);
          }
        }, ttl);
      }
    })();

    // Store entry
    this.entries.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Get current in-flight request count
   */
  getInFlightCount(): number {
    return this.entries.size;
  }

  /**
   * Clear all in-flight entries (for testing/shutdown)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Clear entries matching a pattern prefix
   */
  clearPattern(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): { inflight: number; keys: string[] } {
    return {
      inflight: this.entries.size,
      keys: Array.from(this.entries.keys()),
    };
  }

  /**
   * Periodic cleanup of stale entries (defensive)
   */
  private cleanupStale(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.entries.entries()) {
      if (now - entry.timestamp > this.defaultTtl * 2) {
        this.entries.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.debug(`Deduplicator: cleaned ${cleaned} stale entries`);
    }
  }

  /**
   * Destroy the deduplicator (cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Convenience function for deduplicating any request
 */
export async function deduplicateRequest<T>(
  key: string,
  fn: AsyncFn<T>,
  options: { ttl?: number; forceRefresh?: boolean } = {},
): Promise<T> {
  return requestDeduplicator.dedupe(key, fn, options);
}

/**
 * Generate a deterministic deduplication key from request parameters
 */
export function generateDedupeKey(
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  params?: Record<string, any>,
): string {
  // Create deterministic key from content
  const content = JSON.stringify({
    p: provider,
    m: model,
    msgs: messages.map(m => ({ r: m.role, c: m.content.slice(0, 200) })), // Limit content for key length
    p: params,
  });

  // Simple hash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return `${provider}:${model}:${Math.abs(hash)}`;
}

export default {
  RequestDeduplicator,
  requestDeduplicator,
  deduplicateRequest,
  generateDedupeKey,
};
