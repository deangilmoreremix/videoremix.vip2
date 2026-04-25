import React, { useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that handles authentication state reliably.
 *
 * Features:
 * - Waits for session resolution before making routing decisions
 * - Preserves intended destination for post-login redirect
 * - Prevents redirect loops
 * - Handles edge cases (tab switching, session expiry, etc.)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, authState, isAuthenticated, isSessionExpiringSoon, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Track if we've made a routing decision to prevent flicker
  const hasMadeDecisionRef = useRef(false);
  const previousAuthStateRef = useRef(authState);

  // Proactively refresh session if expiring soon
  useEffect(() => {
    if (isAuthenticated && isSessionExpiringSoon) {
      console.log("[ProtectedRoute] Session expiring soon, refreshing...");
      refreshSession();
    }
  }, [isAuthenticated, isSessionExpiringSoon, refreshSession]);

  // Reset decision flag when auth state changes
  useEffect(() => {
    if (authState !== previousAuthStateRef.current) {
      hasMadeDecisionRef.current = false;
      previousAuthStateRef.current = authState;
    }
  }, [authState]);

  // Loading state - wait for session resolution
  // We show loading until we have a definitive auth state
  if (loading || authState === "loading" || authState === "idle") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <div className="relative">
          <div className="w-20 h-20 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary-500 font-medium text-sm">Loading</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm">Verifying session...</p>
      </div>
    );
  }

  // Error state - show error with retry option
  if (authState === "error") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-400 mb-4">
            There was a problem verifying your session. Please try signing in again.
          </p>
          <button
            onClick={() => navigate("/signin", { state: { from: location.pathname } })}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated state - redirect to sign in
  // Only redirect after we're certain the user is not authenticated
  if (!isAuthenticated || !user) {
    // Prevent redirect loops - don't redirect if we're already going to signin
    if (location.pathname === "/signin" || location.pathname === "/signup") {
      console.log("[ProtectedRoute] On auth page, allowing access", {
        pathname: location.pathname,
        isAuthenticated,
        hasUser: !!user,
        authState
      });
      return <>{children}</>;
    }

    // Store the intended destination
    const from = location.pathname + location.search + location.hash;

    console.log("[ProtectedRoute] Not authenticated, redirecting to signin", {
      pathname: location.pathname,
      from,
      isAuthenticated,
      hasUser: !!user,
      authState,
      loading,
      timestamp: Date.now()
    });

    return (
      <Navigate
        to="/signin"
        state={{
          from: location.pathname,
          fromFull: from,
          timestamp: Date.now(),
        }}
        replace
      />
    );
  }

  // Authenticated - render protected content
  console.log("[ProtectedRoute] User authenticated, rendering protected content", {
    userId: user?.id,
    pathname: location.pathname,
    authState,
    isAuthenticated
  });
  hasMadeDecisionRef.current = true;

  return <>{children}</>;
};

export default ProtectedRoute;
