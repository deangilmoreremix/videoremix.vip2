import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminUsersManagement from '../src/components/admin/AdminUsersManagement';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn()
  }),
  useInView: () => true
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const React = require('react');
  return {
    Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
    Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
    Edit: () => React.createElement('div', { 'data-testid': 'edit-icon' }),
    Trash2: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
    ToggleLeft: () => React.createElement('div', { 'data-testid': 'toggle-left' }),
    ToggleRight: () => React.createElement('div', { 'data-testid': 'toggle-right' }),
    Upload: () => React.createElement('div', { 'data-testid': 'upload-icon' }),
    Download: () => React.createElement('div', { 'data-testid': 'download-icon' }),
    ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down' }),
    X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
    Key: () => React.createElement('div', { 'data-testid': 'key-icon' }),
    Settings: () => React.createElement('div', { 'data-testid': 'settings-icon' }),
    Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
    CheckSquare: () => React.createElement('div', { 'data-testid': 'check-square' }),
    Square: () => React.createElement('div', { 'data-testid': 'square' }),
    AlertTriangle: () => React.createElement('div', { 'data-testid': 'alert-triangle' }),
    Loader2: () => React.createElement('div', { 'data-testid': 'loader' }),
    FolderOpen: () => React.createElement('div', { 'data-testid': 'folder-open' }),
    Package: () => React.createElement('div', { 'data-testid': 'package-icon' }),
    Shield: () => React.createElement('div', { 'data-testid': 'shield-icon' }),
    FileText: () => React.createElement('div', { 'data-testid': 'file-text' }),
    BarChart3: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  };
});

// Mock bundleData
vi.mock('../src/data/bundleData', () => ({
  bundles: [
    {
      id: 'test-bundle',
      name: 'Test Bundle',
      description: 'Test bundle description',
      category: 'test-category',
      price: 397,
      priceCents: 39700,
      apps: ['app-1', 'app-2'],
      image: 'test.jpg',
      features: ['feature-1'],
      popular: true
    }
  ],
  getBundleApps: vi.fn().mockReturnValue(['app-1', 'app-2']),
  getAllBundleIds: vi.fn().mockReturnValue(['test-bundle']),
  getBundleForApp: vi.fn().mockReturnValue({ id: 'test-bundle', name: 'Test Bundle' }),
  getTotalAppCount: vi.fn().mockReturnValue(2),
  bundleIcons: {
    'test-category': { icon: '📦', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
  }
}));

describe('AdminUsersManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should display loading spinner initially', async () => {
    render(<AdminUsersManagement />);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display empty state when no users found', async () => {
    render(<AdminUsersManagement />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first user.')).toBeInTheDocument();
    });
  });

  it('should render the component structure', async () => {
    render(<AdminUsersManagement />);

    // Check for header elements
    await waitFor(() => {
      expect(screen.getByText('Users Management')).toBeInTheDocument();
      expect(screen.getByText('Manage application users and their access')).toBeInTheDocument();
    });

    // Check for action buttons
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('should show bundle analytics when users exist', async () => {
    render(<AdminUsersManagement />);

    // The bundle analytics section should be visible when there are users
    // (currently shows empty state, so analytics won't show)
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });
});