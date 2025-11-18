import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminUsersManagement from '../src/components/admin/AdminUsersManagement';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminUsersManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock admin token
    localStorage.setItem('admin_token', 'mock-admin-token');
  });

  it('should display loading spinner initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<AdminUsersManagement />);

    // Check for loading spinner (the div with animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display users successfully', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'John Doe',
        role: 'user',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-02T00:00:00Z'
      },
      {
        id: '2',
        email: 'admin@example.com',
        name: 'Jane Smith',
        role: 'admin',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        last_login: null
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Check roles
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should toggle user status when toggle button is clicked', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'John Doe',
        role: 'user',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-02T00:00:00Z'
      }
    ];

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers })
    });

    // Mock toggle request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { ...mockUsers[0], is_active: false } })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(button =>
      button.className.includes('rounded-full')
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    // Verify the toggle API was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/functions/v1/admin-users/1/toggle',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-admin-token'
        })
      })
    );
  });

  it('should delete user when delete button is clicked and confirmed', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-02T00:00:00Z'
      }
    ];

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers })
    });

    // Mock delete request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'User deleted successfully' })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and click the delete button (trash icon)
    const deleteButton = screen.getByTestId('delete-user-1') || screen.getAllByRole('button').find(button =>
      button.querySelector('svg') && button.querySelector('svg').classList.contains('lucide-trash2')
    );
    fireEvent.click(deleteButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Delete User')).toBeInTheDocument();
    });

    // Click the confirm delete button
    const confirmButton = screen.getByText('Delete User');
    fireEvent.click(confirmButton);

    // Verify the delete API was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/functions/v1/admin-users/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-admin-token'
        })
      })
    );
  });

  it('should filter users based on selected role', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'John Doe',
        role: 'user',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-02T00:00:00Z'
      },
      {
        id: '2',
        email: 'admin@example.com',
        name: 'Jane Smith',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        last_login: null
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click on role selector dropdown
    const dropdownButton = screen.getByText('All Roles');
    fireEvent.click(dropdownButton);

    // Select admin role
    const adminOption = screen.getByText('Admin');
    fireEvent.click(adminOption);

    // Should only show Jane Smith (admin)
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should create a new user successfully', async () => {
    const mockUsers = [];
    const newUser = {
      id: '1',
      email: 'newuser@example.com',
      name: 'New User',
      role: 'user',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      last_login: null
    };

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUsers })
    });

    // Mock create user request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: newUser })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    // Click Add User button
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    // Fill in the form
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const nameInput = screen.getByPlaceholderText('John Doe');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(nameInput, { target: { value: 'New User' } });

    // Click Add User button in modal
    const modalAddButton = screen.getByText('Add User');
    fireEvent.click(modalAddButton);

    // Verify the create API was called
    expect(mockFetch).toHaveBeenCalledWith(
      '/functions/v1/admin-users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user'
        })
      })
    );
  });

  it('should display empty state when no users found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first user.')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output pollution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});