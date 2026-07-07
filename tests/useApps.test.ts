import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useApps } from '../src/hooks/useApps';
import { supabase } from '../src/utils/supabase';

const mockAppsData = [
  {
    id: '1',
    name: 'Active App 1',
    slug: 'active-app-1',
    description: 'Description 1',
    category: 'video',
    image: '',
    is_active: true,
    is_featured: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Inactive App',
    slug: 'inactive-app',
    description: 'Description 2',
    category: 'content',
    image: '',
    is_active: false,
    is_featured: false,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockFromChain = () => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: mockAppsData, error: null }),
  };
  return chain;
};

describe('useApps Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (supabase as any).from = vi.fn(() => mockFromChain());
  });

  it('should load apps from Supabase', async () => {
    const { result } = renderHook(() => useApps());

    expect(result.current.loading).toBe(true);
    expect(result.current.apps).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toHaveLength(2);
    expect(result.current.apps[0].id).toBe('active-app-1');
    expect(result.current.apps[1].id).toBe('inactive-app');
    expect(result.current.error).toBeNull();
  });

  it('should handle Supabase errors gracefully', async () => {
    (supabase as any).from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('DB error');
  });
});
