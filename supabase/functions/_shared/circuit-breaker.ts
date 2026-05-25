/**
 * Circuit Breaker Pattern Implementation
 *
 * Protects services from cascading failures by:
 * - Tracking failure rates
 * - Opening circuit after threshold reached
 * - Allowing test requests during half-open state
 * - Automatically closing after successful recovery
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   name: 'openai-api',
 *   failureThreshold: 5,
 *   recoveryTimeoutMs: 30000,
 *   halfOpenMaxCalls: 3,
 * });
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await openai.chat.completions.create(...);
 *   });
 * } catch (error) {
 *   // Circuit open or call failed
 * }
 * ```
 */

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number; // Failures before opening
  recoveryTimeoutMs: number; // Time before half-open
  halfOpenMaxCalls: number; // Test calls in half-open
  successThreshold: number; // Successful calls to close from half-open
  timeoutMs: number; // Per-call timeout
}

export interface CircuitBreakerMetrics {
  name: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  rejectedRequests: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  name: 'default',
  failureThreshold: 5,
  recoveryTimeoutMs: 30000,
  halfOpenMaxCalls: 3,
  successThreshold: 2, // Need 2 successes to close from half-open
  timeoutMs: 30000,
};

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAllowedTime = 0;
  private halfOpenCalls = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly timers: NodeJS.Timeout[] = [];

  // Metrics
  public readonly metrics: CircuitBreakerMetrics = {
    name: '',
    state: 'closed',
    failureCount: 0,
    successCount: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    totalRequests: 0,
    rejectedRequests: 0,
  };

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics.name = this.config.name;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    const now = Date.now();

    // Check if circuit is open
    if (this.state === 'open') {
      if (now < this.nextAllowedTime) {
        this.metrics.rejectedRequests++;
        throw new CircuitBreakerOpenError(
          this.config.name,
          this.nextAllowedTime - now,
        );
      }
      // Transition to half-open
      this.transitionTo('half-open');
      this.halfOpenCalls = 0;
    }

    // Half-open: limit concurrent test calls
    if (this.state === 'half-open' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      this.metrics.rejectedRequests++;
      throw new CircuitBreakerOpenError(
        this.config.name,
        this.config.recoveryTimeoutMs,
        'max test calls reached',
      );
    }

    this.halfOpenCalls++;

    // Execute with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Circuit breaker timeout after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
      this.timers.push(timer);
    });

    try {
      const result = await Promise.race([fn(), timeoutPromise]);

      // Success
      this.onSuccess();
      this.halfOpenCalls = Math.max(0, this.halfOpenCalls - 1);

      return result;
    } catch (error) {
      this.onFailure();
      this.halfOpenCalls = Math.max(0, this.halfOpenCalls - 1);
      throw error;
    } finally {
      // Clear timeout if it exists
      const timer = this.timers.pop();
      if (timer) clearTimeout(timer);
    }
  }

  private onSuccess() {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.metrics.successCount++;
    this.metrics.state = this.state;

    if (this.state === 'half-open') {
      this.failureCount = 0; // Reset failures on success in half-open
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('closed');
        console.log(`✅ Circuit breaker [${this.config.name}] closed - service recovered`);
      }
    } else if (this.state === 'closed') {
      // Gradually reduce failure count on success (decay)
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.metrics.failureCount++;
    this.metrics.lastFailureTime = this.lastFailureTime;

    if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo('open');
      this.nextAllowedTime = Date.now() + this.config.recoveryTimeoutMs;
      console.warn(`🔴 Circuit breaker [${this.config.name}] OPENED after ${this.failureCount} failures`);
    } else if (this.state === 'half-open') {
      // Any failure in half-open reopens circuit immediately
      this.transitionTo('open');
      this.nextAllowedTime = Date.now() + this.config.recoveryTimeoutMs;
      console.warn(`🔴 Circuit breaker [${this.config.name}] REOPENED after failure in half-open`);
    }
  }

  private transitionTo(newState: CircuitState) {
    this.state = newState;
    this.metrics.state = newState;

    // Emit event/log
    console.log(`Circuit breaker [${this.config.name}] -> ${newState.toUpperCase()}`);
  }

  // Manual control
  forceOpen(): void {
    this.transitionTo('open');
    this.nextAllowedTime = Date.now() + this.config.recoveryTimeoutMs;
  }

  forceClose(): void {
    this.transitionTo('closed');
    this.failureCount = 0;
    this.successCount = 0;
  }

  reset(): void {
    this.forceClose();
    this.halfOpenCalls = 0;
    this.metrics.rejectedRequests = 0;
  }

  getState(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  isAvailable(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'half-open') return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    return false;
  }

  // Cleanup timers
  destroy(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.length = 0;
  }
}

export class CircuitBreakerOpenError extends Error {
  public readonly circuitName: string;
  public readonly retryAfterMs: number;
  public readonly retryAt: number;

  constructor(circuitName: string, retryAfterMs: number, reason?: string) {
    const message = `Circuit breaker '${circuitName}' is OPEN${reason ? `: ${reason}` : ''}. Retry after ${Math.ceil(retryAfterMs / 1000)}s`;
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.circuitName = circuitName;
    this.retryAfterMs = retryAfterMs;
    this.retryAt = Date.now() + retryAfterMs;
  }
}

// ============================================================================
// CIRCUIT BREAKER MANAGER (Singleton registry)
// ============================================================================

export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker({ ...config, name }));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.breakers.values()).map(b => b.getState());
  }

  destroy(): void {
    this.breakers.forEach(b => b.destroy());
    this.breakers.clear();
  }
}

// Global registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Convenience function
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>,
): Promise<T> {
  const breaker = circuitBreakerRegistry.getOrCreate(name, config);
  return await breaker.execute(fn);
}

export default {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitBreakerRegistry,
  circuitBreakerRegistry,
  withCircuitBreaker,
};
