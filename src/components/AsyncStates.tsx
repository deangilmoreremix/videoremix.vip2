import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { ClassifiedError } from '../utils/errorHandling';

/**
 * Loading Spinner Component
 * Shows a consistent loading indicator across the app
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500`} />
      {message && (
        <p className="mt-3 text-sm text-gray-400">{message}</p>
      )}
    </div>
  );
};

/**
 * Loading Skeleton Component
 * Shows placeholder content while loading
 */
interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 3,
  className = '',
}) => {
  // Deterministic width pattern based on row index
  // This avoids Math.random() which can cause hydration mismatches in SSR
  const getWidth = (index: number): string => {
    const widths = ['60%', '80%', '70%', '90%', '65%', '75%'];
    return widths[index % widths.length];
  };

  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-700 rounded"
          style={{ width: getWidth(i) }}
        />
      ))}
    </div>
  );
};

/**
 * Error Display Component
 * Shows user-friendly error message with retry option
 */
interface ErrorDisplayProps {
  error: ClassifiedError | null;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  context?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  className = '',
  context,
}) => {
  if (!error) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {context ? `Error: ${context}` : 'Something went wrong'}
      </h3>

      <p className="text-gray-400 text-center max-w-md mb-6">
        {error.message}
      </p>

      {error.isRetryable && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryText}
        </button>
      )}
    </div>
  );
};

/**
 * Empty State Component
 * Shows when no data exists
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data',
  message = 'No items to display.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
        {icon || <Inbox className="h-8 w-8 text-gray-400" />}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

      <p className="text-gray-400 text-center max-w-md mb-6">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Async Content Wrapper
 * Handles loading, error, and empty states for async content
 */
interface AsyncContentProps<T> {
  data: T | null;
  isLoading: boolean;
  error: ClassifiedError | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyTitle?: string;
  loadingMessage?: string;
  loadingSkeleton?: boolean;
  skeletonRows?: number;
  children: (data: T) => React.ReactNode;
  className?: string;
}

export function AsyncContent<T>({
  data,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'No items to display.',
  emptyTitle = 'No data',
  loadingMessage,
  loadingSkeleton = false,
  skeletonRows = 3,
  children,
  className = '',
}: AsyncContentProps<T>): React.ReactNode {
  // Loading state
  if (isLoading) {
    if (loadingSkeleton) {
      return <LoadingSkeleton rows={skeletonRows} className={className} />;
    }
    return <LoadingSpinner message={loadingMessage} className={className} />;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} className={className} />;
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState title={emptyTitle} message={emptyMessage} className={className} />;
  }

  // Success - render content
  return <>{children(data)}</>;
}

/**
 * Button with Loading State
 * Prevents double submissions
 */
interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  isLoading,
  loadingText,
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center px-4 py-2 rounded-lg
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};

/**
 * Network Status Indicator
 * Shows when the app is offline
 */
export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-yellow-500/90 text-black px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
      <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
      <div>
        <p className="font-medium">You're offline</p>
        <p className="text-sm opacity-80">Some features may be unavailable</p>
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingSkeleton,
  ErrorDisplay,
  EmptyState,
  AsyncContent,
  AsyncButton,
  NetworkStatusIndicator,
};
