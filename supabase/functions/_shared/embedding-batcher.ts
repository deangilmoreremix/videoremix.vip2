/**
 * Embedding Batch Processor
 *
 * Optimizes embedding generation by:
 * - Batching multiple texts into single API calls
 * - Queue-based processing with worker pattern
 * - Rate limit awareness
 * - Aggressive caching (embeddings are deterministic)
 * - Automatic retry with exponential backoff
 *
 * OpenAI embedding limits:
 * - Max inputs per request: 2048
 * - Recommended batch size: 100-1000 for optimal throughput
 * - Rate limits: ~500 RPM for standard, higher for enterprise
 *
 * Usage:
 * ```typescript
 * const batcher = new EmbeddingBatcher(openai);
 *
 * // Queue individual embeddings
 * const embedding1 = await batcher.queue('text 1');
 * const embedding2 = await batcher.queue('text 2');
 * // Both may be batched together
 * ```
 */

import { OpenAI } from 'npm:openai@4.78.1';
import { retryWithBackoff } from './retry';
import { getLLMRateLimiter, estimateChatTokens } from './rate-limiter';

export interface BatchQueueItem {
  id: string;
  texts: string[];
  resolve: (embeddings: number[][]) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class EmbeddingBatcher {
  private queue: BatchQueueItem[] = [];
  private processing = false;
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly maxBatchSize: number;
  private readonly maxWaitMs: number;
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly rateLimiter: ReturnType<typeof getLLMRateLimiter>;

  // Statistics
  private stats = {
    totalRequests: 0,
    totalTexts: 0,
    totalCacheHits: 0,
    avgBatchSize: 0,
    errors: 0,
  };

  constructor(
    openai: OpenAI,
    options: {
      model?: string;
      maxBatchSize?: number;
      maxWaitMs?: number;
      rateLimitTokensPerMinute?: number;
    } = {},
  ) {
    this.openai = openai;
    this.model = options.model || 'text-embedding-3-small';
    this.maxBatchSize = options.maxBatchSize || 100; // Conservative for rate limits
    this.maxWaitMs = options.maxWaitMs || 50; // Wait up to 50ms to fill batch
    this.rateLimiter = getLLMRateLimiter();
  }

  /**
   * Get embedding for a single text (with batching)
   */
  async get(text: string, options: { cacheTtl?: number } = {}): Promise<number[]> {
    return this.queueBatch([text], options);
  }

  /**
   * Get embeddings for multiple texts (automatically batches)
   */
  async getBatch(
    texts: string[],
    options: { cacheTtl?: number } = {},
  ): Promise<number[][]> {
    if (texts.length === 0) return [];

    // Process in chunks if larger than max batch size
    if (texts.length <= this.maxBatchSize) {
      return this.queueBatch(texts, options);
    }

    // Split into multiple batches
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const chunk = texts.slice(i, i + this.maxBatchSize);
      const batchResult = await this.queueBatch(chunk, options);
      results.push(...batchResult);
    }
    return results;
  }

  /**
   * Queue texts for batch processing
   * Aggregates multiple calls into optimized API requests
   */
  private async queueBatch(
    texts: string[],
    options: { cacheTtl?: number },
  ): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const item: BatchQueueItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        texts,
        resolve: resolve as any,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(item);
      this.scheduleBatch();

      // Timeout safety
      setTimeout(() => {
        if (this.queue.includes(item)) {
          this.queue = this.queue.filter(i => i.id !== item.id);
          reject(new Error('Embedding batch timeout'));
        }
      }, 30000); // 30 second max
    });
  }

  /**
   * Schedule batch processing (debounced)
   */
  private scheduleBatch(): void {
    if (this.processing) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.maxWaitMs);
  }

  /**
   * Process the current queue as a batch
   */
  private async processBatch(): Promise<void> {
    this.processing = true;
    this.batchTimeout = null;

    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    // Take items from queue (up to maxBatchSize)
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      // Collect all texts
      const allTexts = batch.flatMap(item => item.texts);
      const uniqueTexts = Array.from(new Set(allTexts)); // Deduplicate texts within batch

      // Estimate token usage
      const estimatedTokens = estimateChatTokens(
        uniqueTexts.map(t => ({ role: 'user', content: t })),
      );

      // Respect rate limits
      await this.rateLimiter.acquire('openai', this.model, estimatedTokens);

      // Check cache for each unique text first
      const cacheHits = new Map<string, number[]>();
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      for (let i = 0; i < allTexts.length; i++) {
        const text = allTexts[i];
        const cached = await this.getCachedEmbedding(text);
        if (cached) {
          cacheHits.set(text, cached);
        } else {
          const originalIndex = uncachedTexts.indexOf(text);
          if (originalIndex === -1) {
            uncachedTexts.push(text);
            uncachedIndices.push(i);
          }
        }
      }

      // Fetch uncached embeddings in bulk
      let apiEmbeddings: number[][] = [];
      if (uncachedTexts.length > 0) {
        const response = await retryWithBackoff(
          () =>
            this.openai.embeddings.create({
              model: this.model,
              input: uncachedTexts,
            }),
          {
            maxAttempts: 3,
            retryableErrors: ['rate_limit', 'timeout', '429', '500', '502', '503', '504'],
            initialDelayMs: 2000,
          },
        );

        apiEmbeddings = response.data.map(d => d.embedding);

        // Cache all new embeddings
        for (let i = 0; i < uncachedTexts.length; i++) {
          await this.cacheEmbedding(uncachedTexts[i], apiEmbeddings[i]);
        }
      }

      // Reconstruct full result array
      const fullResults: number[][] = [];
      for (const text of allTexts) {
        if (cacheHits.has(text)) {
          fullResults.push(cacheHits.get(text)!);
        } else {
          const idx = uncachedTexts.indexOf(text);
          fullResults.push(apiEmbeddings[idx]);
        }
      }

      // Distribute results to batch items
      let resultIndex = 0;
      for (const item of batch) {
        const itemResults = fullResults.slice(resultIndex, resultIndex + item.texts.length);
        resultIndex += item.texts.length;
        item.resolve(itemResults);
      }

      // Update stats
      this.stats.totalRequests += 1;
      this.stats.totalTexts += allTexts.length;
      this.stats.avgBatchSize = (this.stats.avgBatchSize * (this.stats.totalRequests - 1) + allTexts.length) / this.stats.totalRequests;
      this.stats.totalCacheHits += cacheHits.size;

    } catch (error) {
      console.error('Embedding batch error:', error);
      this.stats.errors++;

      // Reject all batch items
      batch.forEach(item => item.reject(error));
    } finally {
      this.processing = false;

      // Process more if queued
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  private async getCachedEmbedding(text: string): Promise<number[] | null> {
    // This would use the responseCache - implement integration
    return null; // Placeholder - integrate with ResponseCache
  }

  private async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    // Cache for 24 hours (embeddings are deterministic)
    // Integration with responseCache
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      processing: this.processing,
    };
  }

  /**
   * Clear the queue (for shutdown/testing)
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Factory function
export function createEmbeddingBatcher(
  openai: OpenAI,
  options?: { model?: string; maxBatchSize?: number },
): EmbeddingBatcher {
  const batcher = new EmbeddingBatcher(openai, options);
  // Make globally available for performance.ts integration
  if (typeof globalThis !== 'undefined') {
    (globalThis as any)._embeddingBatcher = batcher;
  }
  return batcher;
}

export default {
  EmbeddingBatcher,
  createEmbeddingBatcher,
};
