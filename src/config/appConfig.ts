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
  },

  // UI
  UI: {
    ITEMS_PER_PAGE: 12, // Apps per page in admin
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY_MS: 1000, // 1 second
  },

  // Error messages
  ERRORS: {
    GENERIC_LOAD_ERROR: 'Unable to load information. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    AUTHENTICATION_ERROR: 'Authentication required. Please log in again.',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  },
} as const;

// Type-safe access to config values
export type AppConfig = typeof appConfig;