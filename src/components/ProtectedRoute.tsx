import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "super_admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, authState } = useAuth();
  const location = useLocation();

  if (loading || authState === "initializing") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <div className="relative">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-500 font-medium text-xs">Loading</span>
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm">Verifying session...</p>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl font-semibold mb-2 text-red-400">
            Authentication Error
          </h2>
          <p className="text-gray-400 mb-4">
            There was a problem verifying your session. Please try signing in
            again.
          </p>
          <a
            href={`/signin?from=${encodeURIComponent(location.pathname)}`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = location.pathname + location.search + location.hash;
    return (
      <Navigate
        to="/signin"
        state={{ from: location.pathname, fromFull: from }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
