import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminAppsManagement from '../src/components/admin/AdminAppsManagement';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminAppsManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock admin token
    localStorage.setItem('admin_token', 'mock-admin-token');
  });

  it('should display loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<AdminAppsManagement />);

    // Check for loading spinner (the div with animate-spin class)
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
        updated_at: '2024-01-01T00:00:00Z'
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
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test App 1')).toBeInTheDocument();
      expect(screen.getByText('Test App 2')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should toggle app status when toggle button is clicked', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Test App',
        slug: 'test-app',
        description: 'Description',
        category: 'video',
        icon_url: 'icon.png',
        is_active: true,
        is_featured: false,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    // Mock toggle request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { ...mockApps[0], is_active: false } })
    });

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { hidden: true });
    fireEvent.click(toggleButton);

    // Verify the toggle API was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/functions/v1/admin-apps/1/toggle',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-admin-token'
        })
      })
    );
  });

  it('should delete app when delete button is clicked and confirmed', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Test App',
        slug: 'test-app',
        description: 'Description',
        category: 'video',
        icon_url: 'icon.png',
        is_active: true,
        is_featured: false,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    // Mock delete request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'App deleted successfully' })
    });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    // Find and click the delete button (trash icon)
    const deleteButton = screen.getByTestId('delete-app-1') || screen.getAllByRole('button')[1]; // Assuming second button is delete
    fireEvent.click(deleteButton);

    // Verify confirm was called
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this app?');

    // Verify the delete API was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/functions/v1/admin-apps/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-admin-token'
        })
      })
    );

    confirmSpy.mockRestore();
  });

  it('should not delete app when delete is cancelled', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Test App',
        slug: 'test-app',
        description: 'Description',
        category: 'video',
        icon_url: 'icon.png',
        is_active: true,
        is_featured: false,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test App')).toBeInTheDocument();
    });

    // Find and click the delete button
    const deleteButton = screen.getByTestId('delete-app-1') || screen.getAllByRole('button')[1];
    fireEvent.click(deleteButton);

    // Verify confirm was called
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this app?');

    // Verify the delete API was NOT called
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only the initial fetch

    confirmSpy.mockRestore();
  });

  it('should filter apps based on selected app', async () => {
    const mockApps = [
      {
        id: '1',
        name: 'Video App',
        slug: 'video-app',
        description: 'Video description',
        category: 'video',
        icon_url: 'icon1.png',
        is_active: true,
        is_featured: false,
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Content App',
        slug: 'content-app',
        description: 'Content description',
        category: 'content',
        icon_url: 'icon2.png',
        is_active: true,
        is_featured: false,
        sort_order: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApps })
    });

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Video App')).toBeInTheDocument();
      expect(screen.getByText('Content App')).toBeInTheDocument();
    });

    // Click on app selector dropdown
    const dropdownButton = screen.getByText('All Apps');
    fireEvent.click(dropdownButton);

    // Select specific app
    const contentAppOption = screen.getByText('Content App');
    fireEvent.click(contentAppOption);

    // Should only show Content App
    await waitFor(() => {
      expect(screen.queryByText('Video App')).not.toBeInTheDocument();
      expect(screen.getByText('Content App')).toBeInTheDocument();
    });
  });

  it('should display empty state when no apps found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('No applications found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first application.')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output pollution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminAppsManagement />);

    await waitFor(() => {
      expect(screen.getByText('No applications found')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});