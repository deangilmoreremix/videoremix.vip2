import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminAppsManagement from '../src/components/admin/AdminAppsManagement';

// The component authenticates Supabase Edge Function calls with the Clerk
// session token (useSupabaseToken) and imports the Supabase client only for
// module side effects. Stub both so the suite runs without live credentials.
vi.mock('../src/hooks/useSupabaseToken', () => ({
  useSupabaseToken: () => async () => 'dev-token',
}));

vi.mock('../src/utils/supabase', () => ({
  supabase: {},
  setClerkTokenGetter: vi.fn(),
}));

const mockApps = [
  { id: '1', name: 'Test App 1', slug: 'test-app-1', description: 'Description 1', category: 'video', icon_url: '', netlify_url: null, custom_domain: null, is_active: true, is_featured: true, is_public: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', name: 'Test App 2', slug: 'test-app-2', description: 'Description 2', category: 'content', icon_url: '', netlify_url: null, custom_domain: null, is_active: false, is_featured: false, is_public: false, sort_order: 2, created_at: '', updated_at: '' },
];

const mockResponse = (data: any) => ({
  ok: true,
  json: async () => data,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  global.fetch = vi.fn().mockResolvedValue(mockResponse({ success: true, data: mockApps, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } })) as any;
});

it('should fetch and display apps successfully', async () => {
  render(<AdminAppsManagement />);

  await waitFor(() => {
    expect(screen.getByText('Test App 1')).toBeInTheDocument();
    expect(screen.getByText('Test App 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});

it('should fetch apps with the Clerk bearer token', async () => {
  render(<AdminAppsManagement />);

  await waitFor(() => {
    expect(screen.getByText('Test App 1')).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/functions/v1/admin-apps'),
    expect.objectContaining({
      headers: { Authorization: 'Bearer dev-token' },
    }),
  );
});

it('should display empty state when no apps found', async () => {
  (global.fetch as any).mockResolvedValueOnce(mockResponse({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }));

  render(<AdminAppsManagement />);

  await waitFor(() => {
    expect(screen.getByText('No applications found')).toBeInTheDocument();
  });
});

it('should handle API errors gracefully', async () => {
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

  render(<AdminAppsManagement />);

  await waitFor(() => {
    expect(screen.getByText('No applications found')).toBeInTheDocument();
  });
});