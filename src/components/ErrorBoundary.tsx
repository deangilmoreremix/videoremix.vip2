import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700 text-white">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-300 mb-4">
            We've encountered an error rendering this component. 
            The rest of the page should still work correctly.
          </p>
          <details className="bg-gray-900 p-3 rounded-md">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <p className="text-red-400 text-sm font-mono">
              {this.state.error?.toString()}
            </p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;