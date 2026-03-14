import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminUsersManagement from '../src/components/admin/AdminUsersManagement';

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

describe('AdminUsersManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('admin_token', 'mock-admin-token');
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  it('should display loading spinner initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    });

    render(<AdminUsersManagement />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display users successfully', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-02T00:00:00Z',
      },
      {
        id: '2',
        email: 'admin@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'admin',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        last_login: null,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers, pagination: { total: 2, page: 1, limit: 10, totalPages: 1 } }),
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
  });
});
