import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminAppsManagement from '../src/components/admin/AdminAppsManagement';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../src/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

import { supabase } from '../src/utils/supabaseClient';

describe('AdminAppsManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('admin_token', 'mock-admin-token');
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  it('should display loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    });

    render(<AdminAppsManagement />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display apps successfully', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Test App 1',
        slug: 'test-app-1',
        description: 'Description 1',
        category: 'video',
        icon_url: 'icon1.png',
        is_active: true,
        is_featured: true,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Test App 2',
        slug: 'test-app-2',
        description: 'Description 2',
        category: 'content',
        icon_url: 'icon2.png',
        is_active: false,
        is_featured: false,
        sort_order: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps, pagination: { total: 2, page: 1, limit: 10, totalPages: 1 } }),
    });

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test App 1')).toBeInTheDocument();
      expect(screen.getByText('Test App 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
