import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  classifyError,
  withRetry,
  logError,
  createUserMessage,
  isNetworkError,
  isAuthError,
  isRetryable,
  ErrorType,
  ClassifiedError,
} from './errorHandling';

describe('errorHandling', () => {
  describe('classifyError', () => {
    it('should classify null/undefined as unknown', () => {
      const result = classifyError(null);
      expect(result.type).toBe('unknown');
      expect(result.isRetryable).toBe(true);
    });

    it('should classify undefined as unknown', () => {
      const result = classifyError(undefined);
      expect(result.type).toBe('unknown');
    });

    it('should classify string errors', () => {
      const result = classifyError('Network connection failed');
      expect(result.type).toBe('network');
      expect(result.message).toBe('Connection issue. Please check your internet connection.');
    });

    it('should classify Error objects', () => {
      const error = new Error('fetch failed');
      const result = classifyError(error);
      expect(result.type).toBe('network');
    });

    it('should classify timeout errors', () => {
      const error = new Error('Request timed out');
      error.name = 'TimeoutError';
      const result = classifyError(error);
      expect(result.type).toBe('timeout');
    });

    it('should classify AbortError as timeout', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      const result = classifyError(error);
      expect(result.type).toBe('timeout');
    });

    it('should classify TypeError with fetch as network', () => {
      const error = new TypeError('fetch failed');
      const result = classifyError(error);
      expect(result.type).toBe('network');
    });

    it('should classify auth errors from string patterns', () => {
      const result = classifyError('Unauthorized access');
      expect(result.type).toBe('auth');
    });

    it('should classify permission errors', () => {
      const result = classifyError('Forbidden: access denied');
      expect(result.type).toBe('permission');
    });

    it('should classify not found errors', () => {
      const result = classifyError('User not found');
      expect(result.type).toBe('not_found');
    });

    it('should classify validation errors', () => {
      const result = classifyError('Invalid input: field is required');
      expect(result.type).toBe('validation');
    });

    it('should classify rate limit errors', () => {
      const result = classifyError('Rate limit exceeded');
      expect(result.type).toBe('rate_limit');
    });

    it('should classify Supabase errors with status code', () => {
      const supabaseError = { message: 'Error', status: 401 };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('auth');
    });

    it('should classify Supabase 404 errors', () => {
      const supabaseError = { message: 'Not found', status: 404 };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('not_found');
    });

    it('should classify Supabase 500 errors', () => {
      const supabaseError = { message: 'Server error', status: 500 };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('server');
    });

    it('should classify Supabase errors with code', () => {
      const supabaseError = { code: 'PGRST301', message: 'Not found' };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('not_found');
    });

    it('should classify Supabase unique violation (23505)', () => {
      const supabaseError = { code: '23505', message: 'Duplicate key' };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('validation');
    });

    it('should classify Supabase foreign key violation (23503)', () => {
      const supabaseError = { code: '23503', message: 'Foreign key violation' };
      const result = classifyError(supabaseError);
      expect(result.type).toBe('validation');
    });

    it('should determine retryable status correctly', () => {
      const networkResult = classifyError('Network error');
      expect(networkResult.isRetryable).toBe(true);

      const authResult = classifyError('Unauthorized');
      expect(authResult.isRetryable).toBe(false);

      const validationResult = classifyError('Invalid input');
      expect(validationResult.isRetryable).toBe(false);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { baseDelayMs: 100 });

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new Error('Unauthorized');
      const fn = vi.fn().mockRejectedValue(authError);

      await expect(withRetry(fn)).rejects.toThrow('Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max attempts', async () => {
      const networkError = new Error('Network error');
      const fn = vi.fn().mockRejectedValue(networkError);

      const resultPromise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });

      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();
      const resultPromise = withRetry(fn, { baseDelayMs: 100 }, onRetry);

      await vi.runAllTimersAsync();

      await resultPromise;
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.objectContaining({ type: 'network' }));
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, {
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffFactor: 2,
      });

      await vi.runAllTimersAsync();

      await resultPromise;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelayMs', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, {
        baseDelayMs: 5000,
        maxDelayMs: 5000,
        maxAttempts: 4,
      });

      await vi.runAllTimersAsync();

      await resultPromise;
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('logError', () => {
    it('should log error without PII in development mode', () => {
      // Mock NODE_ENV as development
      vi.stubEnv('NODE_ENV', 'development');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logError(new Error('Test error'), 'TestContext', {
        userId: '123',
        password: 'secret123',
        email: 'user@example.com',
        normalData: 'safe',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = consoleSpy.mock.calls[0][1];

      expect(loggedData.context).toBe('TestContext');
      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.email).toBe('[REDACTED]');
      expect(loggedData.normalData).toBe('safe');

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('should redact nested sensitive data in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logError(new Error('Test error'), 'TestContext', {
        user: {
          name: 'John',
          token: 'abc123',
          credentials: {
            apiKey: 'secret-key',
          },
        },
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.user.token).toBe('[REDACTED]');
      expect(loggedData.user.credentials.apiKey).toBe('[REDACTED]');
      expect(loggedData.user.name).toBe('John');

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe('createUserMessage', () => {
    it('should create user-friendly message', () => {
      const message = createUserMessage(new Error('Network error'));
      expect(message).toBe('Connection issue. Please check your internet connection.');
    });

    it('should include context when provided', () => {
      const message = createUserMessage(new Error('Network error'), 'Failed to load data');
      expect(message).toBe('Failed to load data: Connection issue. Please check your internet connection.');
    });
  });

  describe('helper functions', () => {
    it('isNetworkError should return true for network errors', () => {
      expect(isNetworkError(new Error('Network error'))).toBe(true);
      expect(isNetworkError(new Error('Unauthorized'))).toBe(false);
    });

    it('isAuthError should return true for auth errors', () => {
      expect(isAuthError(new Error('Unauthorized'))).toBe(true);
      expect(isAuthError(new Error('Network error'))).toBe(false);
    });

    it('isRetryable should return true for retryable errors', () => {
      expect(isRetryable(new Error('Network error'))).toBe(true);
      expect(isRetryable(new Error('Unauthorized'))).toBe(false);
      expect(isRetryable(new Error('Validation failed'))).toBe(false);
    });
  });
});
