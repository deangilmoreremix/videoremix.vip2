import { supabase } from "../utils/supabaseClient";
import { classifyError, withRetry, RetryConfig } from "../utils/errorHandling";

/**
 * Result type for safe mutations
 */
export interface SafeMutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Configuration for safe mutation
 */
export interface SafeMutationConfig {
  /** Unique key to prevent duplicate operations */
  idempotencyKey?: string;
  /** Table name for the operation */
  table: string;
  /** Retry configuration */
  retryConfig?: RetryConfig;
  /** Maximum time to wait before considering a request timed out */
  timeoutMs?: number;
}

/**
 * In-memory store for tracking in-flight mutations and idempotency keys
 * Note: This is per-session. For true duplicate prevention across sessions,
 * you would need server-side idempotency keys stored in the database.
 */
const inFlightMutations = new Map<string, Promise<unknown>>();
const completedIdempotencyKeys = new Map<string, unknown>();

/**
 * Clean up old idempotency keys to prevent memory growth
 * Uses a simple size limit - keys are evicted when map exceeds limit
 */
function cleanupIdempotencyKeys(): void {
  // Limit cache size to prevent unbounded growth
  if (completedIdempotencyKeys.size > 100) {
    const keysToDelete = Array.from(completedIdempotencyKeys.keys()).slice(0, 50);
    keysToDelete.forEach(key => completedIdempotencyKeys.delete(key));
  }
}

// Cleanup is triggered on each mutation rather than via interval
// This avoids memory leaks from unbounded setInterval calls

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a mutation with the same idempotency key is already in progress
 */
function isMutationInProgress(idempotencyKey: string): boolean {
  return inFlightMutations.has(idempotencyKey);
}

/**
 * Wait for an existing mutation to complete
 */
async function waitForMutation(idempotencyKey: string): Promise<unknown> {
  const existingPromise = inFlightMutations.get(idempotencyKey);
  if (existingPromise) {
    try {
      const result = await existingPromise;
      const cached = completedIdempotencyKeys.get(idempotencyKey);
      return cached ?? result;
    } catch {
      // If the existing mutation failed, allow retry
    }
  }
  return { success: false, error: "Operation in progress" };
}

/**
 * Safe mutation helper that prevents duplicate database writes
 * 
 * @param operation - The async operation to perform
 * @param config - Configuration for the mutation
 * 
 * @example
 * ```ts
 * const result = await safeMutation(
 *   async () => {
 *     const { data, error } = await supabase
 *       .from('purchases')
 *       .insert(purchaseData)
 *       .select()
 *       .single();
 *     if (error) throw error;
 *     return data;
 *   },
 *   {
 *     table: 'purchases',
 *     idempotencyKey: `purchase-${userId}-${productId}`,
 *   }
 * );
 * ```
 */
export async function safeMutation<T>(
  operation: () => Promise<T>,
  config: SafeMutationConfig
): Promise<SafeMutationResult<T>> {
  const { 
    idempotencyKey, 
    table, 
    retryConfig, 
    timeoutMs = 30000 
  } = config;

  // Generate request ID for tracking
  const requestId = generateRequestId();
  
  // Use provided idempotency key or generate one
  const mutationKey = idempotencyKey || `${table}-${requestId}`;

  // Check if mutation is already in progress
  if (idempotencyKey && isMutationInProgress(mutationKey)) {
    console.log(`[safeMutation] Mutation in progress for key: ${mutationKey}`);
    const result = await waitForMutation(mutationKey);
    return result as SafeMutationResult<T>;
  }

  // Check if we have a recent completion for this idempotency key
  if (idempotencyKey && completedIdempotencyKeys.has(idempotencyKey)) {
    const cached = completedIdempotencyKeys.get(idempotencyKey);
    if (cached) {
      console.log(`[safeMutation] Returning cached result for key: ${idempotencyKey}`);
      return cached as SafeMutationResult<T>;
    }
  }

  // Cleanup old keys before adding new one
  cleanupIdempotencyKeys();

  // Create the mutation promise and store it
  const mutationPromise = (async (): Promise<SafeMutationResult<T>> => {
    try {
      // Execute with retry support
      const result = await withRetry(
        async () => {
          // Add timeout support
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Mutation timed out")), timeoutMs);
          });
          
          try {
            const result = await operation();
            return result;
          } catch (error) {
            // Check if it's a duplicate key error
            if (error instanceof Error && 
                (error.message.includes('duplicate key') || 
                 error.message.includes('unique constraint'))) {
              console.log(`[safeMutation] Duplicate detected for key: ${mutationKey}`);
              // Return a special marker for duplicate
              return null;
            }
            throw error;
          }
        },
        retryConfig,
        (attempt, error) => {
          console.log(`[safeMutation] Retry attempt ${attempt} for key: ${mutationKey}`, error);
        }
      );

      // Check if result is null (indicates duplicate)
      if (result === null) {
        const duplicateResult: SafeMutationResult<T> = {
          success: false,
          error: "Duplicate operation detected",
          isDuplicate: true,
        };
        
        if (idempotencyKey) {
          completedIdempotencyKeys.set(idempotencyKey, duplicateResult);
        }
        
        return duplicateResult;
      }

      const successResult: SafeMutationResult<T> = {
        success: true,
        data: result,
      };

      // Cache successful result
      if (idempotencyKey) {
        completedIdempotencyKeys.set(idempotencyKey, successResult);
      }

      return successResult;
    } catch (error) {
      const classifiedError = classifyError(error);
      
      const errorResult: SafeMutationResult<T> = {
        success: false,
        error: classifiedError.message || "Operation failed",
      };

      return errorResult;
    } finally {
      // Clean up in-flight mutation
      inFlightMutations.delete(mutationKey);
    }
  })();

  // Store the promise for other callers to wait on
  inFlightMutations.set(mutationKey, mutationPromise);

  return mutationPromise;
}

/**
 * Helper to create a safe insert operation
 * 
 * @example
 * ```ts
 * const result = await safeInsert(
 *   'purchases',
 *   purchaseData,
 *   { idempotencyKey: `purchase-${userId}-${productId}` }
 * );
 * ```
 */
export async function safeInsert<T = unknown>(
  table: string,
  data: Record<string, unknown>,
  options: {
    idempotencyKey?: string;
    retryConfig?: RetryConfig;
  } = {}
): Promise<SafeMutationResult<T>> {
  return safeMutation<T>(
    async () => {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (error) {
        // Check for duplicate key errors
        if (error.message.includes('duplicate key') || 
            error.message.includes('unique constraint')) {
          throw new Error(`DUPLICATE: ${error.message}`);
        }
        throw error;
      }
      
      return result as T;
    },
    {
      table,
      idempotencyKey: options.idempotencyKey,
      retryConfig: options.retryConfig,
    }
  );
}

/**
 * Helper to create a safe upsert operation (for updating or inserting)
 * 
 * @example
 * ```ts
 * const result = await safeUpsert(
 *   'user_app_access',
 *   { user_id: userId, app_slug: appSlug, is_active: true },
 *   { conflictColumns: ['user_id', 'app_slug'] }
 * );
 * ```
 */
export async function safeUpsert<T = unknown>(
  table: string,
  data: Record<string, unknown>,
  options: {
    idempotencyKey?: string;
    retryConfig?: RetryConfig;
    conflictColumns?: string[];
  } = {}
): Promise<SafeMutationResult<T>> {
  const { conflictColumns = [] } = options;
  
  return safeMutation<T>(
    async () => {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, { 
          onConflict: conflictColumns.join(', ')
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return result as T;
    },
    {
      table,
      idempotencyKey: options.idempotencyKey,
      retryConfig: options.retryConfig,
    }
  );
}

/**
 * Create a unique idempotency key for a purchase
 * This helps prevent duplicate purchases if the user clicks multiple times
 */
export function createPurchaseIdempotencyKey(
  userId: string,
  productId: string,
  platform: string
): string {
  return `purchase-${userId}-${productId}-${platform}`;
}

/**
 * Create a unique idempotency key for granting app access
 */
export function createAppAccessIdempotencyKey(
  userId: string,
  appSlug: string
): string {
  return `app-access-${userId}-${appSlug}`;
}
