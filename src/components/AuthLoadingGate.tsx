import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface AuthLoadingGateProps {
  children: React.ReactNode;
  /**
   * Minimum time to show loading state (prevents flash)
   * Default: 100ms
   */
  minLoadingTime?: number;
  /**
   * Custom loading component to show while auth is resolving
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom error component to show if auth fails
   */
  errorComponent?: React.ReactNode;
  /**
   * Callback when auth state is resolved (authenticated or not)
   */
  onAuthResolved?: (isAuthenticated: boolean) => void;
}

/**
 * AuthLoadingGate prevents page flicker by waiting for auth state resolution
 * before rendering children. This is useful for pages that need to know
 * the auth state before deciding what to render.
 *
 * Features:
 * - Minimum loading time to prevent flash
 * - Customizable loading and error states
 * - Callback for auth resolution
 */
const AuthLoadingGate: React.FC<AuthLoadingGateProps> = ({
  children,
  minLoadingTime = 100,
  loadingComponent,
  errorComponent,
  onAuthResolved,
}) => {
  const { loading, authState, isAuthenticated, error } = useAuth();
  const [hasMinLoadingTimePassed, setHasMinLoadingTimePassed] = useState(false);
  const [hasNotifiedResolution, setHasNotifiedResolution] = useState(false);

  // Minimum loading time to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMinLoadingTimePassed(true);
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  // Notify when auth is resolved
  useEffect(() => {
    if (!loading && authState !== "initializing" && !hasNotifiedResolution) {
      setHasNotifiedResolution(true);
      onAuthResolved?.(isAuthenticated);
    }
  }, [loading, authState, isAuthenticated, hasNotifiedResolution, onAuthResolved]);

  // Default loading component
  const defaultLoadingComponent = (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <div className="relative">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary-500 font-medium text-xs">Loading</span>
        </div>
      </div>
      <p className="mt-3 text-gray-400 text-sm">Initializing...</p>
    </div>
  );

  // Default error component
  const defaultErrorComponent = (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <div className="text-center max-w-md px-4">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
        <p className="text-gray-400 text-sm mb-4">
          {error?.message || "Unable to verify your session. Please refresh the page."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );

  // Show error state
  if (authState === "error") {
    return <>{errorComponent || defaultErrorComponent}</>;
  }

  // Show loading state until auth is resolved AND minimum time has passed
  if (loading || authState === "initializing" || !hasMinLoadingTimePassed) {
    return <>{loadingComponent || defaultLoadingComponent}</>;
  }

  // Auth is resolved, render children
  return <>{children}</>;
};

export default AuthLoadingGate;
