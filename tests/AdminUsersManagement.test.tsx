import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminUsersManagement from '../src/components/admin/AdminUsersManagement';

// The component authenticates Supabase Edge Function calls with the Clerk
// session token (useSupabaseToken). Stub the hook so tests focus on behavior.
vi.mock('../src/hooks/useSupabaseToken', () => ({
  useSupabaseToken: () => async () => 'mock-admin-token',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const ADMIN_USERS_URL = '/functions/v1/admin-users';
const ADMIN_APPS_URL = '/functions/v1/admin-apps';

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  email: 'user1@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-01-02T00:00:00Z',
  app_access: [] as string[],
  app_count: 0,
  ...overrides,
});

/** Route-aware fetch mock: users list + app catalog. */
const mockAdminApis = (
  users: unknown[],
  apps: Array<{ slug: string; name: string; category: string }> = [],
) => {
  mockFetch.mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes(ADMIN_APPS_URL)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: apps }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: users }),
    });
  });
};

describe('AdminUsersManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading spinner initially', () => {
    mockAdminApis([]);

    render(<AdminUsersManagement />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display users successfully', async () => {
    mockAdminApis(
      [
        mockUser({ id: '1', email: 'user1@example.com', first_name: 'John', last_name: 'Doe' }),
        mockUser({
          id: '2',
          email: 'admin@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'admin',
          is_active: false,
          last_login: null,
        }),
      ],
      [],
    );

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Role badges
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    // Calls carry the Clerk bearer token
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(ADMIN_USERS_URL),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer mock-admin-token' }),
      }),
    );
  });

  it('should toggle user status when the toggle button is clicked', async () => {
    mockAdminApis([mockUser()], []);

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /deactivate user1@example.com/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(ADMIN_USERS_URL),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-admin-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ id: '1', is_active: false }),
        }),
      );
    });
  });

  it('should delete user when delete button is clicked and confirmed', async () => {
    mockAdminApis([mockUser()], []);
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: 'User deleted successfully' }),
        });
      }
      if (typeof url === 'string' && url.includes(ADMIN_APPS_URL)) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [mockUser()] }) });
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Trash icon button (aria-label)
    const deleteButton = screen.getByRole('button', { name: /delete user1@example.com/i });
    fireEvent.click(deleteButton);

    // Confirmation modal: the confirm button is exactly "Delete User"
    // (the trash button's accessible name is "Delete user1@example.com").
    const confirmButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Delete User' });
      expect(button).toBeInTheDocument();
      return button;
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(ADMIN_USERS_URL),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-admin-token',
          }),
          body: JSON.stringify({ id: '1' }),
        }),
      );
    });
  });

  it('should filter users based on selected role', async () => {
    mockAdminApis(
      [
        mockUser({ id: '1', first_name: 'John', last_name: 'Doe', role: 'user' }),
        mockUser({ id: '2', email: 'admin@example.com', first_name: 'Jane', last_name: 'Smith', role: 'admin' }),
      ],
      [],
    );

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Open the role dropdown
    fireEvent.click(screen.getByText('All Roles'));

    // Select the "Admin" option inside the dropdown (the user card also
    // renders an "Admin" role badge, so scope to the dropdown button).
    const adminOption = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.className.includes('w-full') && btn.textContent?.trim() === 'Admin',
    );
    expect(adminOption).toBeDefined();
    fireEvent.click(adminOption!);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should create a new user successfully', async () => {
    const createdUser = mockUser({
      id: '99',
      email: 'newuser@example.com',
      first_name: 'New',
      last_name: 'User',
    });
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: createdUser }),
        });
      }
      if (typeof url === 'string' && url.includes(ADMIN_APPS_URL)) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
    });

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    // Open the Add User modal (header button comes first in DOM order)
    const addButtons = screen.getAllByRole('button', { name: /^add user$/i });
    fireEvent.click(addButtons[0]);

    // Fill in the form
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const firstNameInput = screen.getByPlaceholderText('John');
    const lastNameInput = screen.getByPlaceholderText('Doe');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(firstNameInput, { target: { value: 'New' } });
    fireEvent.change(lastNameInput, { target: { value: 'User' } });

    // Submit from the modal ("Add New User" modal confirm is the 2nd match)
    const modalAddButton = screen.getAllByRole('button', { name: /^add user$/i })[1];
    fireEvent.click(modalAddButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(ADMIN_USERS_URL),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-admin-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'newuser@example.com',
            first_name: 'New',
            last_name: 'User',
            role: 'user',
          }),
        }),
      );
    });

    // The created user is prepended to the list.
    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
    });
  });

  it('should reject an invalid email in the create user form', async () => {
    mockAdminApis([], []);

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /^add user$/i });
    fireEvent.click(addButtons[0]);

    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'not-an-email' },
    });

    const modalAddButton = screen.getAllByRole('button', { name: /^add user$/i })[1];
    fireEvent.click(modalAddButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // No create call may be issued for an invalid form.
    const postCalls = mockFetch.mock.calls.filter(
      (call) => (call[1] as RequestInit | undefined)?.method === 'POST',
    );
    expect(postCalls).toHaveLength(0);
  });

  it('should filter users by the search field', async () => {
    mockAdminApis(
      [
        mockUser({ id: '1', email: 'sales@example.com', first_name: 'Sales', last_name: 'User' }),
        mockUser({ id: '2', email: 'support@example.com', first_name: 'Support', last_name: 'User' }),
      ],
      [],
    );

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('Sales User')).toBeInTheDocument();
      expect(screen.getByText('Support User')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'sales' } });

    await waitFor(() => {
      expect(screen.getByText('Sales User')).toBeInTheDocument();
      expect(screen.queryByText('Support User')).not.toBeInTheDocument();
    });
  });

  it('should display empty state when no users found', async () => {
    mockAdminApis([], []);

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first user.')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load users. Please check your connection and try again.'),
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
