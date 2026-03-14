import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncOperation, useDataFetch, useMutation } from './useAsyncOperation';

describe('useAsyncOperation', () => {
  describe('basic functionality', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() =>
        useAsyncOperation(async () => 'success')
      );

      expect(result.current.state.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should execute async operation and return result', async () => {
      const mockFn = vi.fn().mockResolvedValue('test result');
      const { result } = renderHook(() => useAsyncOperation(mockFn));

      await act(async () => {
        const res = await result.current.execute();
        expect(res).toBe('test result');
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result.current.state.status).toBe('success');
      expect(result.current.state.data).toBe('test result');
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle errors correctly', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const { result } = renderHook(() => useAsyncOperation(mockFn));

      await act(async () => {
        const res = await result.current.execute();
        expect(res).toBeNull();
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.state.error).not.toBeNull();
      expect(result.current.state.error?.message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('duplicate request prevention', () => {
    it('should prevent duplicate requests when preventDuplicates is true', async () => {
      let callCount = 0;
      const mockFn = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'result';
      });

      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { preventDuplicates: true })
      );

      // Start first request
      act(() => {
        result.current.execute();
      });

      // Try to start second request immediately - should return null
      let secondResult: unknown = 'not-null';
      await act(async () => {
        secondResult = await result.current.execute();
      });

      // Second request should return null (prevented)
      expect(secondResult).toBeNull();
      expect(callCount).toBe(1);
    });

    it('should allow concurrent requests when preventDuplicates is false', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { preventDuplicates: false })
      );

      await act(async () => {
        await Promise.all([
          result.current.execute(),
          result.current.execute(),
        ]);
      });

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retry functionality', () => {
    it('should retry with last parameters', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { retryConfig: { maxAttempts: 1 } })
      );

      // First execution fails
      await act(async () => {
        await result.current.execute('param1', 'param2');
      });

      expect(result.current.isError).toBe(true);

      // Retry should use same params
      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.isSuccess).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('param1', 'param2');
    });

    it('should reset to initial state', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { initialData: 'initial' })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.state.data).toBe('result');

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.data).toBe('initial');
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const mockFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith('result');
    });

    it('should call onError callback', async () => {
      const onError = vi.fn();
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useAsyncOperation(mockFn, { onError })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        type: 'unknown',
      }));
    });
  });

  describe('executeOnMount', () => {
    it('should not execute on mount by default', () => {
      const mockFn = vi.fn().mockResolvedValue('result');

      renderHook(() => useAsyncOperation(mockFn));

      expect(mockFn).not.toHaveBeenCalled();
    });
  });
});

describe('useDataFetch', () => {
  it('should fetch data on mount', async () => {
    const mockFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useDataFetch(mockFn));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.state.data).toBe('data');
    expect(mockFn).toHaveBeenCalled();
  });

  it('should provide refetch function', async () => {
    const mockFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useDataFetch(mockFn));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Clear the mock and refetch
    mockFn.mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('useMutation', () => {
  it('should provide canSubmit flag', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() => useMutation(mockFn));

    expect(result.current.canSubmit).toBe(true);

    // Start mutation
    act(() => {
      result.current.execute('data');
    });

    // During mutation, canSubmit should be false
    expect(result.current.canSubmit).toBe(false);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After mutation, canSubmit should be true again
    expect(result.current.canSubmit).toBe(true);
  });

  it('should always prevent duplicate mutations', async () => {
    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'result';
    });

    const { result } = renderHook(() => useMutation(mockFn));

    // Start first mutation
    act(() => {
      result.current.execute('data1');
    });

    // Try second mutation while first is in progress
    let secondResult: unknown = 'not-null';
    await act(async () => {
      secondResult = await result.current.execute('data2');
    });

    // Second should be prevented
    expect(secondResult).toBeNull();
    expect(callCount).toBe(1);
  });
});
