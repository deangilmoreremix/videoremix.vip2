import { useState, useCallback, useRef, useEffect } from 'react';
import { classifyError, withRetry, ClassifiedError, RetryConfig } from '../utils/errorHandling';

/**
 * Async operation states
 */
export interface AsyncState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: ClassifiedError | null;
}

/**
 * Options for async operation
 */
export interface AsyncOptions<T> {
  /** Initial data to use */
  initialData?: T | null;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: ClassifiedError) => void;
  /** Callback on retry */
  onRetry?: (attempt: number, error: ClassifiedError) => void;
  /** Auto-execute on mount */
  executeOnMount?: boolean;
  /** Prevent duplicate requests */
  preventDuplicates?: boolean;
}

/**
 * Return type for useAsyncOperation
 */
export interface AsyncOperationResult<T, P extends unknown[]> {
  /** Current state */
  state: AsyncState<T>;
  /** Execute the async operation */
  execute: (...params: P) => Promise<T | null>;
  /** Reset to initial state */
  reset: () => void;
  /** Retry the last operation */
  retry: () => Promise<T | null>;
  /** Is currently loading */
  isLoading: boolean;
  /** Is currently retrying */
  isRetrying: boolean;
  /** Has succeeded */
  isSuccess: boolean;
  /** Has errored */
  isError: boolean;
  /** Current retry attempt */
  retryAttempt: number;
}

/**
 * Hook for managing async operations with loading, error, and retry states.
 * Prevents duplicate requests and handles real-world network conditions.
 * 
 * @example
 * ```tsx
 * const { state, execute, isLoading, isError, retry } = useAsyncOperation(
 *   async (userId: string) => {
 *     const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
 *     if (error) throw error;
 *     return data;
 *   }
 * );
 * 
 * // Execute
 * await execute('user-123');
 * 
 * // Render
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorDisplay error={state.error} onRetry={retry} />;
 * return <div>{state.data.name}</div>;
 * ```
 */
export function useAsyncOperation<T, P extends unknown[] = []>(
  asyncFn: (...params: P) => Promise<T>,
  options: AsyncOptions<T> = {}
): AsyncOperationResult<T, P> {
  const {
    initialData = null,
    retryConfig,
    onSuccess,
    onError,
    onRetry,
    executeOnMount = false,
    preventDuplicates = true,
  } = options;

  const [state, setState] = useState<AsyncState<T>>(() => ({
    status: 'idle',
    data: initialData,
    error: null,
  }));

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Track in-flight requests to prevent duplicates
  // Note: requestIdRef is intentionally incremented in cleanup to cancel in-flight requests on unmount.
  // The ref value changing between render and cleanup is expected behavior for request cancellation.
  const requestIdRef = useRef(0);
  const lastParamsRef = useRef<P | null>(null);
  const isExecutingRef = useRef(false);

  // Cleanup on unmount - cancels any in-flight requests
  useEffect(() => {
    return () => {
      // Intentionally increment to cancel in-flight requests on unmount.
      // The ref value changing is expected behavior for request cancellation.
      // We WANT the latest value to cancel any requests that started before unmount.
       
      requestIdRef.current++;
      isExecutingRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      // Prevent duplicate requests
      if (preventDuplicates && isExecutingRef.current) {
        console.log('[useAsyncOperation] Preventing duplicate request');
        return null;
      }

      const currentRequestId = ++requestIdRef.current;
      isExecutingRef.current = true;
      lastParamsRef.current = params;

      // Set loading state
      setState(prev => ({
        status: 'loading',
        data: prev.data, // Keep previous data during loading
        error: null,
      }));

      try {
        const result = await withRetry(
          () => asyncFn(...params),
          retryConfig,
          (attempt, error) => {
            // Only update if this is still the current request
            if (currentRequestId === requestIdRef.current) {
              setIsRetrying(true);
              setRetryAttempt(attempt);
              onRetry?.(attempt, error);
            }
          }
        );

        // Check if request was cancelled
        if (currentRequestId !== requestIdRef.current) {
          return null;
        }

        // Success
        setState({
          status: 'success',
          data: result,
          error: null,
        });

        setIsRetrying(false);
        setRetryAttempt(0);
        onSuccess?.(result);

        return result;
      } catch (error) {
        // Check if request was cancelled
        if (currentRequestId !== requestIdRef.current) {
          return null;
        }

        const classifiedError = classifyError(error);

        // Error state
        setState(prev => ({
          status: 'error',
          data: prev.data, // Keep previous data on error
          error: classifiedError,
        }));

        setIsRetrying(false);
        onError?.(classifiedError);

        return null;
      } finally {
        if (currentRequestId === requestIdRef.current) {
          isExecutingRef.current = false;
        }
      }
    },
    [asyncFn, preventDuplicates, retryConfig, onSuccess, onError, onRetry]
  );

  const reset = useCallback(() => {
    requestIdRef.current++; // Cancel any in-flight requests
    isExecutingRef.current = false;
    setState({
      status: 'idle',
      data: initialData,
      error: null,
    });
    setIsRetrying(false);
    setRetryAttempt(0);
  }, [initialData]);

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastParamsRef.current) {
      return execute(...lastParamsRef.current);
    }
    return null;
  }, [execute]);

  // Execute on mount if requested
  useEffect(() => {
    if (executeOnMount) {
      execute(...([] as unknown as P));
    }
  }, [executeOnMount, execute]);

  return {
    state,
    execute,
    reset,
    retry,
    isLoading: state.status === 'loading',
    isRetrying,
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    retryAttempt,
  };
}

/**
 * Simplified hook for data fetching with automatic loading states.
 * 
 * Uses a ref pattern to avoid stale closure issues with the dependencies array.
 * The result ref is updated on each render to ensure the latest execute function
 * is called when dependencies change, without triggering infinite re-renders.
 * 
 * @param fetchFn - The async function to call for data fetching
 * @param options - Configuration options including dependencies array
 * 
 * @example
 * ```tsx
 * // Basic usage - fetches on mount
 * const { data, isLoading, error, refetch } = useDataFetch(() => fetchUsers());
 * 
 * // With dependencies - refetches when userId changes
 * const { data } = useDataFetch(() => fetchUser(userId), { dependencies: [userId] });
 * ```
 */
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  options: Omit<AsyncOptions<T>, 'preventDuplicates'> & { 
    preventDuplicates?: boolean;
    /** Dependencies array - will refetch when these values change */
    dependencies?: unknown[];
  } = {}
): AsyncOperationResult<T, []> & { refetch: () => Promise<T | null> } {
  const { dependencies = [], ...asyncOptions } = options;
  
  const result = useAsyncOperation(fetchFn, {
    ...asyncOptions,
    executeOnMount: true,
    preventDuplicates: true,
  });

  // Store result in a ref to avoid stale closure issues
  // This allows us to call the latest execute function without adding it to dependencies
  const resultRef = useRef(result);
  resultRef.current = result;

  // Re-fetch when dependencies change
  // Using ref to avoid including result.execute in dependencies (which would cause infinite loops)
  useEffect(() => {
    if (dependencies.length > 0) {
      resultRef.current.execute();
    }
     
  }, dependencies);

  return {
    ...result,
    refetch: result.execute,
  };
}

/**
 * Hook for mutations (operations that modify data).
 * Includes double-submit prevention by default.
 * 
 * @param mutationFn - The async mutation function
 * @param options - Configuration options
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, canSubmit, isError } = useMutation(
 *   async (data: FormData) => {
 *     return await api.submitForm(data);
 *   }
 * );
 * 
 * // In your form submit handler:
 * <button onClick={() => execute(formData)} disabled={!canSubmit}>
 *   {isLoading ? 'Saving...' : 'Submit'}
 * </button>
 * ```
 */
export function useMutation<T, P extends unknown[] = []>(
  mutationFn: (...params: P) => Promise<T>,
  options: AsyncOptions<T> = {}
): AsyncOperationResult<T, P> & {
  /** Whether the mutation can be executed (not already in progress) */
  canSubmit: boolean;
} {
  const result = useAsyncOperation(mutationFn, {
    ...options,
    preventDuplicates: true, // Always prevent duplicate mutations
  });

  return {
    ...result,
    canSubmit: !result.isLoading,
  };
}
