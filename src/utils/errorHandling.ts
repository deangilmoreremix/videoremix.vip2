/**
 * Error Handling Utilities for Production Stability
 * 
 * This module provides:
 * - User-friendly error messages
 * - Retry logic with exponential backoff
 * - Error classification for proper handling
 * - Safe error logging (no PII)
 */

// Error types for classification
export type ErrorType = 
  | 'network'
  | 'timeout'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'validation'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  isRetryable: boolean;
  originalError?: unknown;
}

// Error message mappings (user-friendly)
const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Connection issue. Please check your internet connection.',
  timeout: 'Request timed out. Please try again.',
  auth: 'Your session has expired. Please sign in again.',
  permission: 'You do not have access to this resource.',
  not_found: 'The requested resource was not found.',
  validation: 'Invalid data provided. Please check your input.',
  rate_limit: 'Too many requests. Please wait a moment and try again.',
  server: 'Server error. Please try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// HTTP status code to error type mapping
const STATUS_CODE_MAP: Record<number, ErrorType> = {
  400: 'validation',
  401: 'auth',
  403: 'permission',
  404: 'not_found',
  429: 'rate_limit',
  500: 'server',
  502: 'server',
  503: 'server',
  504: 'timeout',
};

// Patterns to detect error types from messages
const ERROR_PATTERNS: Array<{ pattern: RegExp; type: ErrorType }> = [
  { pattern: /network|fetch|connection|offline|internet/i, type: 'network' },
  { pattern: /timeout|timed out|etimedout/i, type: 'timeout' },
  { pattern: /unauthorized|unauthenticated|invalid.*token|jwt|session/i, type: 'auth' },
  { pattern: /forbidden|permission|access denied|not allowed/i, type: 'permission' },
  { pattern: /not found|does not exist/i, type: 'not_found' },
  { pattern: /validation|invalid|required|must be/i, type: 'validation' },
  { pattern: /rate limit|too many|throttl/i, type: 'rate_limit' },
];

/**
 * Classify an error into a known type with user-friendly message
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle null/undefined
  if (!error) {
    return {
      type: 'unknown',
      message: ERROR_MESSAGES.unknown,
      isRetryable: true,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    const type = detectErrorTypeFromString(error);
    return {
      type,
      message: ERROR_MESSAGES[type],
      isRetryable: isRetryableType(type),
      originalError: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const type = detectErrorType(error);
    return {
      type,
      message: ERROR_MESSAGES[type],
      isRetryable: isRetryableType(type),
      originalError: error,
    };
  }

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: string; message?: string; status?: number };
    
    if (supabaseError.status) {
      const type = STATUS_CODE_MAP[supabaseError.status] || 'unknown';
      return {
        type,
        message: ERROR_MESSAGES[type],
        isRetryable: isRetryableType(type),
        originalError: error,
      };
    }

    if (supabaseError.code) {
      const type = mapSupabaseCodeToType(supabaseError.code);
      return {
        type,
        message: ERROR_MESSAGES[type],
        isRetryable: isRetryableType(type),
        originalError: error,
      };
    }

    if (supabaseError.message) {
      const type = detectErrorTypeFromString(supabaseError.message);
      return {
        type,
        message: ERROR_MESSAGES[type],
        isRetryable: isRetryableType(type),
        originalError: error,
      };
    }
  }

  return {
    type: 'unknown',
    message: ERROR_MESSAGES.unknown,
    isRetryable: true,
    originalError: error,
  };
}

/**
 * Detect error type from Error object
 */
function detectErrorType(error: Error): ErrorType {
  // Check message
  const message = error.message.toLowerCase();
  const typeFromString = detectErrorTypeFromString(message);
  if (typeFromString !== 'unknown') {
    return typeFromString;
  }

  // Check for specific error types
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return 'timeout';
  }

  if (error.name === 'TypeError' && message.includes('fetch')) {
    return 'network';
  }

  return 'unknown';
}

/**
 * Detect error type from string message
 */
function detectErrorTypeFromString(message: string): ErrorType {
  const lowerMessage = message.toLowerCase();
  
  for (const { pattern, type } of ERROR_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return type;
    }
  }

  return 'unknown';
}

/**
 * Map Supabase error codes to error types
 */
function mapSupabaseCodeToType(code: string): ErrorType {
  const codeMap: Record<string, ErrorType> = {
    'PGRST301': 'not_found',
    'PGRST116': 'not_found',
    '23505': 'validation', // Unique violation
    '23503': 'validation', // Foreign key violation
    '23502': 'validation', // Not null violation
    '42501': 'permission',
    'P0001': 'permission',
    '08001': 'network',
    '08006': 'network',
    '57014': 'timeout',
  };

  return codeMap[code] || 'unknown';
}

/**
 * Determine if error type is retryable
 */
function isRetryableType(type: ErrorType): boolean {
  const retryableTypes: ErrorType[] = ['network', 'timeout', 'rate_limit', 'server', 'unknown'];
  return retryableTypes.includes(type);
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: ClassifiedError) => void
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, backoffFactor } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: ClassifiedError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry non-retryable errors
      if (!lastError.isRetryable) {
        throw error;
      }

      // Don't retry after last attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Notify retry callback
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffFactor, attempt - 1),
        maxDelayMs
      );

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError?.originalError || new Error('Retry failed');
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe error logging (no PII)
 */
export function logError(
  error: unknown,
  context: string,
  additionalInfo?: Record<string, unknown>
): void {
  const classified = classifyError(error);
  
  // Create safe log entry (no PII)
  const logEntry = {
    timestamp: new Date().toISOString(),
    context,
    errorType: classified.type,
    message: classified.message,
    isRetryable: classified.isRetryable,
    // Only include non-sensitive additional info
    ...(additionalInfo ? sanitizeLogData(additionalInfo) : {}),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', logEntry);
  }

  // In production, this could send to an error tracking service
  // Example: Sentry.captureException(error, { tags: { context, errorType: classified.type } });
}

/**
 * Sanitize log data to remove PII
 */
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'email', 'phone', 'ssn', 'credit'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a user-friendly error message with context
 */
export function createUserMessage(
  error: unknown,
  context?: string
): string {
  const classified = classifyError(error);
  
  if (context) {
    return `${context}: ${classified.message}`;
  }
  
  return classified.message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return classifyError(error).type === 'network';
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  return classifyError(error).type === 'auth';
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  return classifyError(error).isRetryable;
}