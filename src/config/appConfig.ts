// Centralized application configuration
// All hardcoded values should be moved here for better maintainability

/**
 * Centralized application configuration
 * Contains all configurable values for the videoremix.vip2 application
 * @constant
 */
export const appConfig = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  },

  // Admin rate limits
  ADMIN_RATE_LIMIT: {
    READ: { WINDOW_MS: 5 * 60 * 1000, MAX_REQUESTS: 200 }, // 200 reads per 5 minutes
    WRITE: { WINDOW_MS: 15 * 60 * 1000, MAX_REQUESTS: 50 }, // 50 writes per 15 minutes
    DELETE: { WINDOW_MS: 60 * 60 * 1000, MAX_REQUESTS: 10 }, // 10 deletes per hour
    DEFAULT: { WINDOW_MS: 15 * 60 * 1000, MAX_REQUESTS: 100 },
  },

  // Caching
  CACHE: {
    APPS_TTL: 5 * 60 * 1000, // 5 minutes
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    // Performance optimization defaults
    DEFAULT_API_CACHE_TTL: 300, // 5 minutes for LLM responses
    EMBEDDING_CACHE_TTL: 86400, // 24 hours for embeddings (deterministic)
    L1_CACHE_SIZE: 200, // In-memory hot cache entries
    L1_CACHE_TTL: 2 * 60 * 1000, // 2 minutes L1-only
  },

  // LLM Performance optimization
  LLM: {
    // Default app type configurations (overridden per-request)
    DEFAULT_APP_TYPE: 'default',
    // Embedding batch size
    EMBEDDING_BATCH_SIZE: 50, // Process up to 50 embeddings per batch
    EMBEDDING_BATCH_WAIT_MS: 100, // Wait up to 100ms to fill batch
    // Request deduplication
    DEDUPE_TTL_MS: 30000, // Keep in-flight dedupe entries for 30s
    // Retry defaults
    RETRY_MAX_ATTEMPTS: 3,
    RETRY_INITIAL_DELAY_MS: 1000,
    RETRY_MAX_DELAY_MS: 30000,
    // Circuit breaker
    CIRCUIT_FAILURE_THRESHOLD: 5,
    CIRCUIT_RECOVERY_TIMEOUT_MS: 30000,
    CIRCUIT_HALF_OPEN_MAX_CALLS: 3,
    // Rate limiting
    RATE_LIMIT_BURST_MULTIPLIER: 1.2, // Allow 20% burst
    RATE_LIMIT_TOKENS_PER_MIN: {
      openai_gpt4o: 80000,
      openai_gpt4o_mini: 2000000,
      openai_embedding: 200000,
      anthropic: 400000,
    },
  },

  // UI
  UI: {
    ITEMS_PER_PAGE: 12, // Apps per page in admin
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY_MS: 1000, // 1 second
  },

  // Error messages
  ERRORS: {
    GENERIC_LOAD_ERROR: "Unable to load information. Please try again later.",
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
    AUTHENTICATION_ERROR: "Authentication required. Please log in again.",
    AUTHORIZATION_ERROR: "You do not have permission to perform this action.",
    RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please wait and try again.",
    SERVICE_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
  },
} as const;

// Type-safe access to config values
export type AppConfig = typeof appConfig;
