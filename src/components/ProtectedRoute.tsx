import React, { useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "@clerk/clerk-react";
import { isClerkConfigured } from "../lib/clerkSync";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, authState, isAuthenticated, isSessionExpiringSoon, refreshSession } = useAuth();
  const clerkActive = isClerkConfigured();
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const hasMadeDecisionRef = useRef(false);
  const previousAuthStateRef = useRef(authState);

  const isEffectivelyAuthenticated = isAuthenticated || (clerkActive && clerkLoaded && clerkSignedIn);

  useEffect(() => {
    if (isEffectivelyAuthenticated && isSessionExpiringSoon) {
      console.log("[ProtectedRoute] Session expiring soon, refreshing...");
      refreshSession();
    }
  }, [isEffectivelyAuthenticated, isSessionExpiringSoon, refreshSession]);

  useEffect(() => {
    if (authState !== previousAuthStateRef.current) {
      hasMadeDecisionRef.current = false;
      previousAuthStateRef.current = authState;
    }
  }, [authState]);

  const isLoading = !clerkActive
    ? loading || authState === "loading" || authState === "idle"
    : loading || authState === "loading" || authState === "idle" || !clerkLoaded;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <div className="relative">
          <div className="w-20 h-20 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary-500 font-medium text-sm">Verifying session...</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm">Please wait. This only takes a second.</p>
      </div>
    );
  }

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

  if (!isEffectivelyAuthenticated || (!user && !clerkSignedIn)) {
    if (location.pathname === "/signin" || location.pathname === "/signup") {
      console.log("[ProtectedRoute] On signin page, allowing access");
      return <>{children}</>;
    }

    const from = location.pathname + location.search + location.hash;

    console.log("[ProtectedRoute] Not authenticated, redirecting to signin. Current path:", location.pathname, "Auth state:", authState, "User:", !!user);

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

  console.log("[ProtectedRoute] User authenticated, allowing access to:", location.pathname);
  hasMadeDecisionRef.current = true;

  return <>{children}</>;
};

export default ProtectedRoute;
