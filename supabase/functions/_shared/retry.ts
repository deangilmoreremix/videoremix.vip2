/**
 * Retry Handler with Exponential Backoff and Jitter
 *
 * Intelligent retry logic that:
 * - Uses exponential backoff with full jitter to avoid thundering herd
 * - Retries only on transient failures (network, rate limits, 5xx)
 * - Respects Retry-After headers from APIs
 * - Supports per-attempt timeout adjustment
 * - Tracks retry metrics
 *
 * Error classification:
 * - Transient: rate_limit, timeout, 429, 500, 502, 503, 504, ENOTFOUND, ECONNREFUSED
 * - Permanent: 400, 401, 403, 404, 422, validation errors
 *
 * Usage:
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => openai.chat.completions.create(...),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 1000,
 *     maxDelayMs: 30000,
 *     retryableErrors: ['rate_limit', 'timeout', '429'],
 *   }
 * );
 * ```
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  maxTotalTimeoutMs?: number;
  retryableErrors?: string[]; // Error message substrings that are retryable
  retryableStatusCodes?: number[]; // HTTP status codes to retry
  backoffMultiplier?: number; // Usually 2 for exponential
  jitterFactor?: number; // 0-1, higher = more random
  onRetry?: (attempt: number, error: Error, delayMs: number) => void | Promise<void>;
}

const DEFAULT_RETRYABLE_ERRORS = [
  'rate_limit',
  'rate limit',
  'too many requests',
  'timeout',
  'timeout',
  'econnrefused',
  'enetunreach',
  'enotfound',
  'eagain',
  'interrupted',
  'reset',
];

const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

export interface RetryResult<T> {
  value: T;
  attempts: number;
  totalDurationMs: number;
  errors: Error[];
}

export class RetryMonitor {
  private attempts = 0;
  private errors: Error[] = [];
  private startTime = 0;
  private endTime = 0;

  start() {
    this.startTime = Date.now();
    this.attempts = 0;
    this.errors = [];
  }

  recordAttempt(error?: Error) {
    this.attempts++;
    if (error) this.errors.push(error);
  }

  complete() {
    this.endTime = Date.now();
  }

  getResult<T>(value: T): RetryResult<T> {
    return {
      value,
      attempts: this.attempts,
      totalDurationMs: this.endTime - this.startTime,
      errors: this.errors,
    };
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    maxTotalTimeoutMs = 120000, // 2 minutes total
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
    backoffMultiplier = 2,
    jitterFactor = 0.2, // 20% jitter
    onRetry,
  } = options;

  const monitor = new RetryMonitor();
  monitor.start();

  let lastError: Error | null = null;
  let attempt = 0;
  let accumulatedDelay = 0;

  while (attempt < maxAttempts) {
    attempt++;
    monitor.recordAttempt();

    try {
      const result = await fn();
      monitor.complete();
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = isRetryable(error, retryableErrors, retryableStatusCodes);

      if (!shouldRetry || attempt >= maxAttempts) {
        monitor.complete();
        throw error;
      }

      // Check total timeout
      if (maxTotalTimeoutMs && accumulatedDelay >= maxTotalTimeoutMs) {
        console.warn('Retry: total timeout exceeded');
        monitor.complete();
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const delayMs = calculateBackoff(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitterFactor,
      );

      accumulatedDelay += delayMs;

      // Respect Retry-After header if present
      const retryAfter = getRetryAfterMs(error);
      if (retryAfter && retryAfter > delayMs) {
        accumulatedDelay += retryAfter - delayMs;
        console.log(`Retry: server requested ${retryAfter}ms delay`);
        await sleep(retryAfter);
      } else {
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${Math.round(delayMs)}ms:`, error.message);
        await sleep(delayMs);
      }

      // Callback
      if (onRetry) {
        try {
          await onRetry(attempt, error, delayMs);
        } catch (callbackError) {
          console.error('Retry onRetry callback error:', callbackError);
        }
      }
    }
  }

  monitor.complete();
  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryable(
  error: any,
  retryableErrors: string[],
  retryableStatusCodes: number[],
): boolean {
  // Network error
  if (!error) return false;

  const errorMsg = (error.message || error.toString() || '').toLowerCase();

  // Check error message patterns
  for (const pattern of retryableErrors) {
    if (errorMsg.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check HTTP status code
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Check for numbered error codes
  if (error.code) {
    const codeStr = error.code.toString();
    if (retryableErrors.some(p => codeStr.includes(p))) {
      return true;
    }
  }

  // Check if it's a network-level error
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
}

/**
 * Calculate backoff delay with jitter
 * Uses "full jitter" strategy: sleep = random_between(0, min(cap, base * 2 ** attempt))
 */
function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  jitterFactor: number,
): number {
  const baseDelay = initialDelayMs * Math.pow(multiplier, attempt - 1);
  const cappedDelay = Math.min(baseDelay, maxDelayMs);

  // Full jitter: random between 0 and capped delay
  const jitter = cappedDelay * jitterFactor;
  const finalDelay = Math.random() * (cappedDelay * (1 - jitterFactor)) + jitter;

  return Math.floor(finalDelay);
}

/**
 * Extract Retry-After header value (seconds or HTTP date)
 */
function getRetryAfterMs(error: any): number | null {
  if (!error.headers) return null;

  const retryAfter = error.headers.get('retry-after');
  if (!retryAfter) return null;

  // Try as seconds
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  // Try as HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    const diff = date.getTime() - Date.now();
    if (diff > 0) return diff;
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a wrapped function with built-in retry
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): () => Promise<T> {
  return () => retryWithBackoff(fn, options);
}

/**
 * Retry wrapper for specific error patterns
 */
export function retryOnError<T>(
  fn: () => Promise<T>,
  errorPatterns: string[],
  options: Omit<RetryOptions, 'retryableErrors'> = {},
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryableErrors: errorPatterns,
  });
}

// ============================================================================
// SPECIALIZED RETRY UTILITIES
// ============================================================================

/**
 * Retry with progressive timeout increase
 */
export async function retryWithTimeoutProgression<T>(
  fn: () => Promise<T>,
  options: {
    initialTimeoutMs?: number;
    maxTimeoutMs?: number;
    timeoutMultiplier?: number;
    maxAttempts?: number;
  } = {},
): Promise<T> {
  let timeout = options.initialTimeoutMs || 30000;

  for (let attempt = 1; ; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      return await Promise.race([fn(), timeoutPromise]);
    } catch (error: any) {
      if (error.message === 'Timeout' || attempt >= (options.maxAttempts || 3)) {
        throw error;
      }
      timeout = Math.min(timeout * (options.timeoutMultiplier || 2), options.maxTimeoutMs || 120000);
      await sleep(1000 * attempt); // Also wait between timeout increases
    }
  }
}

/**
 * Parallel retry: run multiple functions, retrying failed ones
 */
export async function parallelRetry<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<T[]> {
  const results = await Promise.allSettled(
    fns.map(fn => retryWithBackoff(fn, options)),
  );

  const values: T[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      values.push(result.value);
    } else {
      throw result.reason;
    }
  }

  return values;
}

// ============================================================================
// METRICS & OBSERVABILITY
// ============================================================================

export interface RetryMetrics {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  avgRetryDelayMs: number;
  maxRetryDelayMs: number;
  errorsByType: Map<string, number>;
}

class RetryMetricsCollector {
  private totalRetries = 0;
  private successfulRetries = 0;
  private failedRetries = 0;
  private retryDelays: number[] = [];
  private errors = new Map<string, number>();

  recordRetry(error: Error, delayMs: number, success: boolean) {
    this.totalRetries++;
    this.retryDelays.push(delayMs);
    if (success) this.successfulRetries++;
    else this.failedRetries++;

    const type = error.name || 'Unknown';
    this.errors.set(type, (this.errors.get(type) || 0) + 1);
  }

  getMetrics(): RetryMetrics {
    const avgDelay =
      this.retryDelays.length > 0
        ? this.retryDelays.reduce((a, b) => a + b) / this.retryDelays.length
        : 0;

    return {
      totalRetries: this.totalRetries,
      successfulRetries: this.successfulRetries,
      failedRetries: this.failedRetries,
      avgRetryDelayMs: avgDelay,
      maxRetryDelayMs: Math.max(...this.retryDelays, 0),
      errorsByType: this.errors,
    };
  }

  reset(): void {
    this.totalRetries = 0;
    this.successfulRetries = 0;
    this.failedRetries = 0;
    this.retryDelays = [];
    this.errors.clear();
  }
}

export const retryMetrics = new RetryMetricsCollector();

export default {
  retryWithBackoff,
  withRetry,
  retryOnError,
  parallelRetry,
  RetryMonitor,
  RetryMetricsCollector,
  retryMetrics,
};
