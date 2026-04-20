import React from 'react';

interface SalesDropdownErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SalesDropdownErrorBoundaryState {
  hasError: boolean;
}

class SalesDropdownErrorBoundary extends React.Component<
  SalesDropdownErrorBoundaryProps,
  SalesDropdownErrorBoundaryState
> {
  constructor(props: SalesDropdownErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SalesDropdownErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SalesDropdown Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="sales-error text-sm text-gray-500 p-4 text-center bg-red-900/20 border border-red-500/30 rounded-lg">
          Unable to load sales information
        </div>
      );
    }
    return this.props.children;
  }
}

export default SalesDropdownErrorBoundary;