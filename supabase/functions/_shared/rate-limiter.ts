/**
 * LLM Rate Limiter - Token Bucket Implementation
 *
 * Implements token bucket algorithm for rate limiting LLM API calls.
 * Tracks usage per provider+model combination independently.
 * Supports both request-based and token-based limiting.
 *
 * Provider limits (as of 2025):
 * - OpenAI GPT-4o: ~10,000 RPM, ~80k TPM (varies by tier)
 * - OpenAI GPT-4o-mini: ~100,000 RPM, ~2M TPM
 * - Anthropic Claude: ~5,000 RPM, ~400k TPM
 * - Embeddings: ~500-1000 RPM
 *
 * Usage:
 * ```typescript
 * const rateLimiter = getLLMRateLimiter();
 *
 * // Before making API call
 * await rateLimiter.acquire('openai', 'gpt-4o-mini', estimatedTokens);
 *
 * // Or check availability without blocking
 * const available = rateLimiter.checkAvailability('openai', 'gpt-4o-mini', 1000);
 * ```
 */

export interface RateLimitConfig {
  provider: string;
  model: string;
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  burstCapacity: number; // Allow short bursts
}

// Provider-specific default configurations
const PROVIDER_LIMITS: Record<string, Partial<RateLimitConfig>> = {
  openai: {
    maxRequestsPerMinute: 10000,
    maxTokensPerMinute: 80000,
    burstCapacity: 1.2, // 20% burst allowance
  },
  'openai:gpt-4o-mini': {
    maxRequestsPerMinute: 100000,
    maxTokensPerMinute: 2000000,
    burstCapacity: 1.5,
  },
  'openai:text-embedding-3-small': {
    maxRequestsPerMinute: 500,
    maxTokensPerMinute: 200000,
    burstCapacity: 1.2,
  },
  anthropic: {
    maxRequestsPerMinute: 5000,
    maxTokensPerMinute: 400000,
    burstCapacity: 1.2,
  },
  'anthropic:claude-3-opus': {
    maxRequestsPerMinute: 1000,
    maxTokensPerMinute: 100000,
    burstCapacity: 1.1,
  },
};

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per ms
  requestCount: number;
  lastRequestReset: number;
}

export class LLMRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private readonly defaultRefillWindow = 60 * 1000; // 1 minute
  private stats = new Map<string, { requests: number; tokens: number; lastReset: number }>();

  /**
   * Acquire tokens before making an API call
   * Blocks until tokens are available (with rate-based delay)
   */
  async acquire(
    provider: string,
    model: string,
    tokenEstimate: number,
    options: { priority?: 'low' | 'normal' | 'high' } = {},
  ): Promise<void> {
    const key = this.getBucketKey(provider, model);
    const bucket = this.getOrCreateBucket(key, provider, model);

    // Refill bucket based on elapsed time
    this.refillBucket(bucket);

    // Wait for tokens to become available
    const waitMs = this.calculateWaitTime(bucket, tokenEstimate, options.priority);

    if (waitMs > 0) {
      // Track that we're waiting
      this.recordWait(key, waitMs);
      await this.sleep(waitMs);
      // Refill again after waiting
      this.refillBucket(bucket);
    }

    // Consume tokens
    bucket.tokens -= tokenEstimate;
    bucket.requestCount++;
    this.recordUsage(key, tokenEstimate);
  }

  /**
   * Non-blocking check: returns true if call can be made immediately
   */
  canCall(provider: string, model: string, tokenEstimate: number): boolean {
    const key = this.getBucketKey(provider, model);
    const bucket = this.buckets.get(key);

    if (!bucket) return true; // No limits yet

    this.refillBucket(bucket);
    return bucket.tokens >= tokenEstimate && bucket.requestCount < bucket.capacity;
  }

  /**
   * Get current available tokens (for monitoring)
   */
  getAvailableTokens(provider: string, model: string): number {
    const key = this.getBucketKey(provider, model);
    const bucket = this.buckets.get(key);

    if (!bucket) return 0;

    this.refillBucket(bucket);
    return Math.floor(bucket.tokens);
  }

  /**
   * Get current request count in window
   */
  getRequestCount(provider: string, model: string): number {
    const key = this.getBucketKey(provider, model);
    const bucket = this.buckets.get(key);

    if (!bucket) return 0;

    const now = Date.now();
    const windowElapsed = now - bucket.lastRequestReset;

    if (windowElapsed >= this.defaultRefillWindow) {
      return 0; // Window reset
    }

    return bucket.requestCount;
  }

  /**
   * Get comprehensive rate limit status
   */
  getStatus(provider?: string, model?: string): any {
    if (provider && model) {
      const key = this.getBucketKey(provider, model);
      const bucket = this.buckets.get(key);
      if (!bucket) return null;

      this.refillBucket(bucket);
      return {
        availableTokens: Math.floor(bucket.tokens),
        requestCount: bucket.requestCount,
        capacity: bucket.capacity,
        refillRate: bucket.refillRate,
      };
    }

    // Return all statuses
    const statuses = new Map<string, any>();
    for (const [key, bucket] of this.buckets.entries()) {
      this.refillBucket(bucket);
      statuses.set(key, {
        availableTokens: Math.floor(bucket.tokens),
        requestCount: bucket.requestCount,
      });
    }
    return statuses;
  }

  /**
   * Reset limits for a provider/model (for testing)
   */
  reset(provider?: string, model?: string): void {
    if (provider && model) {
      const key = this.getBucketKey(provider, model);
      this.buckets.delete(key);
      this.stats.delete(key);
    } else {
      this.buckets.clear();
      this.stats.clear();
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): { totalBuckets: number; usage: Array<{ key: string; requests: number; tokens: number }> } {
    const usage = Array.from(this.stats.entries()).map(([key, stat]) => ({
      key,
      requests: stat.requests,
      tokens: stat.tokens,
    }));

    return {
      totalBuckets: this.buckets.size,
      usage,
    };
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  private getBucketKey(provider: string, model: string): string {
    return `${provider}:${model}`.toLowerCase();
  }

  private getOrCreateBucket(key: string, provider: string, model: string): TokenBucket {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      const limits = PROVIDER_LIMITS[key] || PROVIDER_LIMITS[provider] || PROVIDER_LIMITS['openai'];

      const capacity = Math.floor(
        (limits.maxRequestsPerMinute || 1000) * (limits.burstCapacity || 1.2),
      );

      const refillRate =
        ((limits.maxTokensPerMinute || 100000) / this.defaultRefillWindow) * (limits.burstCapacity || 1.2);

      bucket = {
        tokens: capacity, // Start with full capacity
        lastRefill: Date.now(),
        capacity,
        refillRate,
        requestCount: 0,
        lastRequestReset: Date.now(),
      };

      this.buckets.set(key, bucket);
      this.stats.set(key, { requests: 0, tokens: 0, lastReset: Date.now() });
    }

    return bucket;
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed > 0) {
      const tokensToAdd = elapsed * bucket.refillRate;
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;

      // Reset request count if window elapsed
      if (elapsed >= this.defaultRefillWindow) {
        bucket.requestCount = 0;
        bucket.lastRequestReset = now;
      }
    }
  }

  private calculateWaitTime(bucket: TokenBucket, neededTokens: number, priority?: string): number {
    let waitMs = 0;

    // Token-based wait
    if (bucket.tokens < neededTokens) {
      const tokensNeeded = neededTokens - bucket.tokens;
      waitMs = Math.ceil((tokensNeeded / bucket.refillRate) * 1000);
    }

    // Request-based wait (if at capacity)
    if (bucket.requestCount >= bucket.capacity) {
      const timeSinceReset = Date.now() - bucket.lastRequestReset;
      if (timeSinceReset < this.defaultRefillWindow) {
        const timeUntilReset = this.defaultRefillWindow - timeSinceReset;
        waitMs = Math.max(waitMs, timeUntilReset);
      }
    }

    // Priority adjustment (high priority gets 2x rate)
    if (priority === 'high') {
      waitMs = Math.floor(waitMs / 2);
    } else if (priority === 'low') {
      waitMs = Math.floor(waitMs * 1.5);
    }

    return Math.min(waitMs, 30000); // Cap wait at 30 seconds
  }

  private recordWait(key: string, waitMs: number): void {
    const stat = this.stats.get(key)!;
    // Could track wait times for metrics
  }

  private recordUsage(key: string, tokens: number): void {
    const stat = this.stats.get(key)!;
    stat.requests += 1;
    stat.tokens += tokens;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old buckets (called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const expireAfter = 60 * 60 * 1000; // 1 hour

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > expireAfter) {
        this.buckets.delete(key);
        this.stats.delete(key);
      }
    }
  }
}

// Global singleton
let globalRateLimiter: LLMRateLimiter | null = null;

export function getLLMRateLimiter(): LLMRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new LLMRateLimiter();
  }
  return globalRateLimiter;
}

/**
 * Quick check: estimate tokens for a chat completion
 */
export function estimateChatTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o-mini',
): number {
  // Rough approximation: 1 token ≈ 4 characters for English
  // Add overhead for role and message formatting (~4 tokens per message)
  const charCount = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const messageCount = messages.length;
  const approxTokens = Math.ceil(charCount / 4) + messageCount * 4;

  // Safety margin
  return Math.ceil(approxTokens * 1.2);
}

export default {
  LLMRateLimiter,
  getLLMRateLimiter,
  estimateChatTokens,
};
