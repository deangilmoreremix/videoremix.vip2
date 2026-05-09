// Test utilities and helper functions
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
const AllProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Custom render function
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Mock functions
export const createMockFn = <T extends (...args: unknown[]) => unknown>(
  implementation?: T
) => {
  return vi.fn(implementation) as T;
};

// Wait helper
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
export const generateMockApp = (overrides = {}) => ({
  id: `app-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test App',
  slug: 'test-app',
  description: 'Test Description',
  category: 'video',
  icon_url: 'https://example.com/icon.png',

// Wait helper
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
export const generateMockApp = (overrides = {}) => ({
  id: `app-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test App',
  slug: 'test-app',
  description: 'Test Description',
  category: 'video',
  icon_url: 'https://example.com/icon.png',
  netlify_url: null,
  custom_domain: null,
  is_active: true,
  is_featured: false,
  is_public: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const generateMockUser = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: 'test@example.com',
  role: 'user',
  created_at: new Date().toISOString(),
  ...overrides
});

export const generateMockPurchase = (overrides = {}) => ({
  id: `purchase-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-1',
  app_id: 'app-1',
  purchase_date: new Date().toISOString(),
  amount: 99.00,
  status: 'completed',
  ...overrides
});

export const generateMockFeature = (overrides = {}) => ({
  id: `feature-${Math.random().toString(36).substr(2, 9)}`,
  app_id: 'app-1',
  name: 'Test Feature',
  description: 'Test Description',
  is_enabled: true,
  sort_order: 1,
  ...overrides
});

export const generateMockVideo = (overrides = {}) => ({
  id: `video-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Video',
  description: 'Test Description',
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumb.jpg',
  duration: 120,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides
});

// Form testing utilities
export const fillFormField = (label: string, value: string) => {
  const input = document.querySelector(`input[name="${label}"]`) || 
                document.querySelector(`input[aria-label="${label}"]`);
  if (input) {
    fireEvent.change(input, { target: { value } });
  }
};

export const submitForm = (buttonText: string) => {
  const button = document.querySelector(`button[type="submit"]`) ||
                 Array.from(document.querySelectorAll('button')).find(
                   btn => btn.textContent?.includes(buttonText)
                 );
  if (button) {
    fireEvent.click(button);
  }
};

// Responsive testing utilities
export const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  window.dispatchEvent(new Event('resize'));
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
export { fireEvent };
export { waitFor };
export { act };
