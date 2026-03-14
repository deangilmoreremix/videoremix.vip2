import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useApps } from '../src/hooks/useApps';

vi.mock('../src/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '../src/utils/supabaseClient';

const makeDataChain = (data: any[], error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data, error }),
});

describe('useApps Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should fetch and filter active apps successfully', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Active App 1',
        slug: 'active-app-1',
        description: 'Description 1',
        category: 'video',
        icon_url: 'icon1.png',
        is_active: true,
        is_featured: true,
        sort_order: 1,
        deployment_url: 'https://app1.com',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Active App 2',
        slug: 'active-app-2',
        description: 'Description 2',
        category: 'ai-image',
        icon_url: 'icon2.png',
        is_active: true,
        is_featured: false,
        sort_order: 2,
        deployment_url: 'https://app2.com',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    (supabase.from as any).mockReturnValueOnce(makeDataChain(mockApps));

    const { result } = renderHook(() => useApps());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    (supabase.from as any).mockReturnValueOnce(
      makeDataChain(null, { message: 'Network error' })
    );

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  it('should return empty apps when no data', async () => {
    (supabase.from as any).mockReturnValueOnce(makeDataChain([]));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should transform database apps to component format correctly', async () => {
    const mockApp = {
      id: '1',
      name: 'Test App',
      slug: 'test-app',
      description: 'Test description',
      category: 'video',
      icon_url: 'test-icon.png',
      is_active: true,
      is_featured: true,
      is_public: true,
      sort_order: 1,
      netlify_url: 'https://test.com',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as any).mockReturnValueOnce(makeDataChain([mockApp]));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const app = result.current.apps[0];
    expect(app).toBeDefined();
    expect(app.name).toBe('Test App');
    expect(app.description).toBe('Test description');
    expect(app.category).toBe('video');
    expect(app.url).toBe('https://test.com');
  });

  it('should use fallback URL when no netlify_url is provided', async () => {
    const mockApp = {
      id: '1',
      name: 'Test App',
      slug: 'test-app',
      description: 'Test description',
      category: 'video',
      icon_url: 'test-icon.png',
      is_active: true,
      is_public: true,
      is_featured: false,
      sort_order: 1,
      netlify_url: null,
      custom_domain: null,
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as any).mockReturnValueOnce(makeDataChain([mockApp]));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps[0].url).toBeDefined();
  });

  it('should call supabase.from on mount', async () => {
    (supabase.from as any).mockReturnValueOnce(makeDataChain([]));

    renderHook(() => useApps());

    expect(supabase.from).toHaveBeenCalledWith('apps');
  });

  it('should provide refetch function', async () => {
    (supabase.from as any)
      .mockReturnValueOnce(makeDataChain([]))
      .mockReturnValueOnce(makeDataChain([]));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.refetch();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });
});
