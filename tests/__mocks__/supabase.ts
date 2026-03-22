// Mock Supabase client for testing
import { vi } from 'vitest';

// Mock data
export const mockApps = [
  {
    id: '1',
    name: 'Test App 1',
    slug: 'test-app-1',
    description: 'Description 1',
    category: 'video',
    icon_url: 'icon1.png',
    netlify_url: 'https://test-app-1.netlify.app',
    custom_domain: null,
    is_active: true,
    is_featured: true,
    is_public: true,
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
    netlify_url: null,
    custom_domain: 'app2.example.com',
    is_active: false,
    is_featured: false,
    is_public: false,
    sort_order: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

export const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@test.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'user@test.com',
    role: 'user',
    created_at: '2024-01-02T00:00:00Z'
  }
];

export const mockPurchases = [
  {
    id: 'purchase-1',
    user_id: 'user-1',
    app_id: '1',
    purchase_date: '2024-01-01T00:00:00Z',
    amount: 99.00,
    status: 'completed'
  }
];

export const mockFeatures = [
  {
    id: 'feature-1',
    app_id: '1',
    name: 'Feature 1',
    description: 'Description 1',
    is_enabled: true,
    sort_order: 1
  }
];

export const mockVideos = [
  {
    id: 'video-1',
    title: 'Test Video 1',
    description: 'Description 1',
    video_url: 'https://example.com/video1.mp4',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    duration: 120,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockSubscriptions = [
  {
    id: 'sub-1',
    user_id: 'user-1',
    plan: 'pro',
    status: 'active',
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2025-01-01T00:00:00Z'
  }
];

// Create a mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null })
  }));

  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  };
};

// Mock the supabaseClient module
vi.mock('../src/utils/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

// Mock appConfig
vi.mock('../src/config/appConfig', () => ({
  appConfig: {
    supabase: {
      projectId: 'test-project',
      siteUrl: 'http://localhost:5173'
    }
  }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const React = require('react');
  return {
    Settings: () => React.createElement('div', { 'data-testid': 'settings-icon' }),
    Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
    Edit: () => React.createElement('div', { 'data-testid': 'edit-icon' }),
    Trash2: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
    ToggleLeft: () => React.createElement('div', { 'data-testid': 'toggle-left-icon' }),
    ToggleRight: () => React.createElement('div', { 'data-testid': 'toggle-right-icon' }),
    Eye: () => React.createElement('div', { 'data-testid': 'eye-icon' }),
    EyeOff: () => React.createElement('div', { 'data-testid': 'eye-off-icon' }),
    ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down-icon' }),
    AlertTriangle: () => React.createElement('div', { 'data-testid': 'alert-icon' }),
    X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
    CheckCircle: () => React.createElement('div', { 'data-testid': 'check-icon' }),
    ExternalLink: () => React.createElement('div', { 'data-testid': 'external-link-icon' }),
    Copy: () => React.createElement('div', { 'data-testid': 'copy-icon' }),
    Globe: () => React.createElement('div', { 'data-testid': 'globe-icon' }),
    Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
    Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }),
    Download: () => React.createElement('div', { 'data-testid': 'download-icon' }),
    Upload: () => React.createElement('div', { 'data-testid': 'upload-icon' }),
    RefreshCw: () => React.createElement('div', { 'data-testid': 'refresh-icon' }),
    Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
    BarChart: () => React.createElement('div', { 'data-testid': 'chart-icon' }),
    Package: () => React.createElement('div', { 'data-testid': 'package-icon' }),
    CreditCard: () => React.createElement('div', { 'data-testid': 'card-icon' }),
    FileText: () => React.createElement('div', { 'data-testid': 'file-icon' }),
    Mail: () => React.createElement('div', { 'data-testid': 'mail-icon' }),
    Shield: () => React.createElement('div', { 'data-testid': 'shield-icon' }),
    LogOut: () => React.createElement('div', { 'data-testid': 'logout-icon' }),
    Home: () => React.createElement('div', { 'data-testid': 'home-icon' }),
    Menu: () => React.createElement('div', { 'data-testid': 'menu-icon' }),
    XCircle: () => React.createElement('div', { 'data-testid': 'x-circle-icon' }),
    AlertCircle: () => React.createElement('div', { 'data-testid': 'alert-circle-icon' }),
    Info: () => React.createElement('div', { 'data-testid': 'info-icon' }),
    Loader: () => React.createElement('div', { 'data-testid': 'loader-icon' })
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    form: 'form'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn()
  }),
  useInView: () => true
}));
