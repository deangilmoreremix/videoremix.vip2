import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ModalsProvider } from "./components/ModalsProvider";

// Import performance monitoring and error handling
import performanceMonitor from "./utils/performanceMonitor";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";

// Import base styles early to prevent layout shifts
import "./index.css";

// Simple loading indicator for initial app load
const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
    <div className="relative">
      <div className="w-20 h-20 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-primary-500 font-semibold">Loading</span>
      </div>
    </div>
  </div>
);

// Load the main app
import App from "./App";

// Mount app immediately
const initializeApp = () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <GlobalErrorBoundary
        onError={(error, errorInfo) => {
          console.error('🚨 Global error caught:', error, errorInfo);
        }}
      >
        <BrowserRouter>
          <ModalsProvider>
            <Suspense fallback={<LoadingScreen />}>
              <App />
            </Suspense>
          </ModalsProvider>
        </BrowserRouter>
      </GlobalErrorBoundary>
    );
  }
};

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}