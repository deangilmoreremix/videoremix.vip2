import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  LoadingSpinner,
  LoadingSkeleton,
  ErrorDisplay,
  EmptyState,
  AsyncContent,
  AsyncButton,
  NetworkStatusIndicator,
} from './AsyncStates';
import { ClassifiedError } from '../utils/errorHandling';

// Helper to create a mock classified error
const createMockError = (overrides: Partial<ClassifiedError> = {}): ClassifiedError => ({
  type: 'network',
  message: 'Connection issue. Please check your internet connection.',
  isRetryable: true,
  ...overrides,
});

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container, rerender } = render(<LoadingSpinner size="sm" />);
    expect(container.querySelector('.w-4.h-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(container.querySelector('.w-8.h-8')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(container.querySelector('.w-12.h-12')).toBeInTheDocument();
  });

  it('should display message when provided', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('LoadingSkeleton', () => {
  it('should render with default rows', () => {
    const { container } = render(<LoadingSkeleton />);
    const rows = container.querySelectorAll('.h-4.bg-gray-700');
    expect(rows).toHaveLength(3);
  });

  it('should render with custom number of rows', () => {
    const { container } = render(<LoadingSkeleton rows={5} />);
    const rows = container.querySelectorAll('.h-4.bg-gray-700');
    expect(rows).toHaveLength(5);
  });

  it('should use deterministic widths (not random)', () => {
    const { container } = render(<LoadingSkeleton rows={6} />);
    const rows = container.querySelectorAll('.h-4.bg-gray-700');

    // Check that widths follow a pattern
    const widths = Array.from(rows).map((row) =>
      row.getAttribute('style')?.match(/width:\s*(\d+%)/)?.[1]
    );

    // Widths should be deterministic (same pattern each render)
    expect(widths[0]).toBe('60%');
    expect(widths[1]).toBe('80%');
    expect(widths[2]).toBe('70%');
  });

  it('should apply animate-pulse class', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('ErrorDisplay', () => {
  it('should not render when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display error message', () => {
    const error = createMockError();
    render(<ErrorDisplay error={error} />);
    expect(screen.getByText('Connection issue. Please check your internet connection.')).toBeInTheDocument();
  });

  it('should show retry button for retryable errors', () => {
    const error = createMockError({ isRetryable: true });
    const onRetry = vi.fn();
    render(<ErrorDisplay error={error} onRetry={onRetry} />);

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button for non-retryable errors', () => {
    const error = createMockError({ isRetryable: false, type: 'auth' });
    render(<ErrorDisplay error={error} onRetry={vi.fn()} />);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should display context when provided', () => {
    const error = createMockError();
    render(<ErrorDisplay error={error} context="Failed to load users" />);

    expect(screen.getByText('Error: Failed to load users')).toBeInTheDocument();
  });

  it('should use custom retry text', () => {
    const error = createMockError();
    render(<ErrorDisplay error={error} onRetry={vi.fn()} retryText="Retry Now" />);

    expect(screen.getByText('Retry Now')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('should render with default props', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('No items to display.')).toBeInTheDocument();
  });

  it('should render with custom title and message', () => {
    render(<EmptyState title="No users found" message="Try adjusting your search criteria" />);

    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const onClick = vi.fn();
    render(<EmptyState action={{ label: 'Add User', onClick }} />);

    const button = screen.getByText('Add User');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render custom icon', () => {
    const { container } = render(
      <EmptyState icon={<span data-testid="custom-icon">Icon</span>} />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

describe('AsyncContent', () => {
  it('should show loading spinner when loading', () => {
    const { container } = render(
      <AsyncContent
        data={null}
        isLoading={true}
        error={null}
        loadingMessage="Loading..."
      >
        {(data) => <div>{data}</div>}
      </AsyncContent>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show skeleton when loadingSkeleton is true', () => {
    const { container } = render(
      <AsyncContent
        data={null}
        isLoading={true}
        error={null}
        loadingSkeleton={true}
        skeletonRows={4}
      >
        {(data) => <div>{data}</div>}
      </AsyncContent>
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelectorAll('.h-4.bg-gray-700')).toHaveLength(4);
  });

  it('should show error display when error exists', () => {
    const error = createMockError();
    const onRetry = vi.fn();

    render(
      <AsyncContent data={null} isLoading={false} error={error} onRetry={onRetry}>
        {(data) => <div>{data}</div>}
      </AsyncContent>
    );

    expect(screen.getByText('Connection issue. Please check your internet connection.')).toBeInTheDocument();
  });

  it('should show empty state when data is null', () => {
    render(
      <AsyncContent
        data={null}
        isLoading={false}
        error={null}
        emptyTitle="No results"
        emptyMessage="No data available"
      >
        {(data) => <div>{data}</div>}
      </AsyncContent>
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should show empty state when data is empty array', () => {
    render(
      <AsyncContent data={[]} isLoading={false} error={null}>
        {(data) => <div>{data.length} items</div>}
      </AsyncContent>
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render content when data exists', () => {
    render(
      <AsyncContent data="Hello World" isLoading={false} error={null}>
        {(data) => <div>{data}</div>}
      </AsyncContent>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render array content correctly', () => {
    render(
      <AsyncContent data={['item1', 'item2']} isLoading={false} error={null}>
        {(data) => <ul>{data.map((item) => <li key={item}>{item}</li>)}</ul>}
      </AsyncContent>
    );

    expect(screen.getByText('item1')).toBeInTheDocument();
    expect(screen.getByText('item2')).toBeInTheDocument();
  });
});

describe('AsyncButton', () => {
  it('should render children when not loading', () => {
    render(<AsyncButton isLoading={false}>Submit</AsyncButton>);

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should show loading text when loading', () => {
    render(
      <AsyncButton isLoading={true} loadingText="Saving...">
        Submit
      </AsyncButton>
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('should show spinner when loading', () => {
    const { container } = render(<AsyncButton isLoading={true}>Submit</AsyncButton>);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<AsyncButton isLoading={true}>Submit</AsyncButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<AsyncButton isLoading={false} disabled={true}>Submit</AsyncButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<AsyncButton isLoading={false} variant="primary">Submit</AsyncButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');

    rerender(<AsyncButton isLoading={false} variant="secondary">Submit</AsyncButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-700');

    rerender(<AsyncButton isLoading={false} variant="danger">Submit</AsyncButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('should handle click events', () => {
    const onClick = vi.fn();
    render(
      <AsyncButton isLoading={false} onClick={onClick}>
        Submit
      </AsyncButton>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('NetworkStatusIndicator', () => {
  it('should not render when online', () => {
    // Mock navigator.onLine to be true
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    const { container } = render(<NetworkStatusIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when offline', () => {
    // Mock navigator.onLine to be false
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<NetworkStatusIndicator />);

    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByText('Some features may be unavailable')).toBeInTheDocument();
  });

  it('should respond to online/offline events', async () => {
    // Start online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    const { container } = render(<NetworkStatusIndicator />);
    expect(container.firstChild).toBeNull();

    // Simulate going offline
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    // Simulate going back online
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
    });
  });
});