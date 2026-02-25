import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show error details in production (default: false) */
  showErrorDetails?: boolean;
  /** Custom error reporting function */
  reportError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

/**
 * Global Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree.
 * Prevents white-screen crashes and provides user-friendly error recovery.
 * 
 * Features:
 * - User-friendly error messages
 * - Error recovery options (retry, go home)
 * - Safe error logging (no PII)
 * - Development mode error details
 * - Production error reporting hook
 * 
 * @example
 * ```tsx
 * <ErrorBoundary 
 *   onError={(error, info) => Sentry.captureException(error)}
 *   showErrorDetails={false}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info for display
    this.setState({ errorInfo });

    // Log error safely (no PII)
    this.logError(error, errorInfo);

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Call optional error reporting function
    if (this.props.reportError) {
      this.props.reportError(error, errorInfo);
    }
  }

  /**
   * Log error safely without PII
   */
  private logError(error: Error, errorInfo: React.ErrorInfo) {
    // Create safe log entry
    const safeLog = {
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      message: error.message,
      name: error.name,
      // Component stack is safe to log
      componentStack: errorInfo.componentStack,
      // Don't log any user data
    };

    // Always log to console for debugging
    console.error('[ErrorBoundary] Caught error:', safeLog);

    // In development, log full error
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Full error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Determine if we should show error details
      const showDetails = this.props.showErrorDetails || process.env.NODE_ENV === 'development';

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-lg w-full bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. This has been logged and our team will investigate.
              Please try one of the options below.
            </p>

            {/* Error ID (for support) */}
            {this.state.errorId && (
              <p className="text-xs text-gray-500 mb-6 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </button>

              <button
                onClick={this.handleRefresh}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
            </div>

            {/* Error Details (Development or when enabled) */}
            {showDetails && this.state.error && (
              <details className="text-left bg-gray-900/50 rounded-lg p-4">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  Error Details {process.env.NODE_ENV === 'development' && '(Development)'}
                </summary>
                
                <div className="mt-4 space-y-4">
                  {/* Error Message */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Message</p>
                    <p className="text-sm text-red-300 font-mono">
                      {this.state.error.message}
                    </p>
                  </div>

                  {/* Error Stack */}
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Stack Trace</p>
                      <pre className="text-xs text-red-300 bg-red-900/20 p-3 rounded overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Component Stack</p>
                      <pre className="text-xs text-yellow-300 bg-yellow-900/20 p-3 rounded overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ErrorBoundary;
