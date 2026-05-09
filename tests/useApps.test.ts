import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useApps } from '../src/hooks/useApps';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
        domain: 'app1.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Inactive App',
        slug: 'inactive-app',
        description: 'Description 2',
        category: 'content',
        icon_url: 'icon2.png',
        is_active: false,
        is_featured: false,
        sort_order: 2,
        deployment_url: 'https://app2.com',
        domain: 'app2.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Active App 2',
        slug: 'active-app-2',
        description: 'Description 3',
        category: 'ai-image',
        icon_url: 'icon3.png',
        is_active: true,
        is_featured: false,
        sort_order: 3,
        deployment_url: 'https://app3.com',
        domain: 'app3.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    const { result } = renderHook(() => useApps());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.apps).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only return active apps, transformed
    expect(result.current.apps).toHaveLength(2);
    expect(result.current.apps[0]).toMatchObject({
      id: 'active-app-1',
      name: 'Active App 1',
      category: 'video',
      popular: true,
      url: 'https://app1.com'
    });
    expect(result.current.apps[1]).toMatchObject({
      id: 'active-app-2',
      name: 'Active App 2',
      category: 'ai-image',
      popular: false,
      url: 'https://app3.com'
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle API response errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch apps: 500');
  });

  it('should handle invalid API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Database error' })
    });

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps).toEqual([]);
    expect(result.current.error).toBe('Database error');
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
      sort_order: 1,
      deployment_url: 'https://test.com',
      domain: 'test.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [mockApp] })
    });

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const app = result.current.apps[0];
    expect(app).toMatchObject({
      id: 'test-app', // slug becomes id
      name: 'Test App',
      description: 'Test description',
      category: 'video',
      image: 'test-icon.png',
      popular: true, // is_featured becomes popular
      new: false, // default value
      comingSoon: false, // default value
      url: 'https://test.com' // deployment_url becomes url
    });

    // Should have a React element as icon
    expect(app.icon).toBeDefined();
    expect(typeof app.icon).toBe('object');
  });

  it('should use fallback URL when deployment_url is not provided', async () => {
    const mockApp = {
      id: '1',
      name: 'Test App',
      slug: 'test-app',
      description: 'Test description',
      category: 'video',
      icon_url: 'test-icon.png',
      is_active: true,
      is_featured: false,
      sort_order: 1,
      deployment_url: null,
      domain: 'test.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [mockApp] })
    });

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.apps[0].url).toBe('/app/test-app');
  });

  it('should call fetch on mount', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    renderHook(() => useApps());

    expect(mockFetch).toHaveBeenCalledWith('/functions/v1/admin-apps');
  });

  it('should provide refetch function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    const { result } = renderHook(() => useApps());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    result.current.refetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});