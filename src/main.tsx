import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimationProvider } from "./context/AnimationContext";
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

// Only mount the app after the DOM is fully loaded
const mountApp = () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      // Temporarily disabled StrictMode to prevent Supabase auth lock conflicts
      // TODO: Re-enable after fixing Supabase client to handle multiple initializations
      // <StrictMode>
        <GlobalErrorBoundary
          onError={(error, errorInfo) => {
            console.error('🚨 Global error caught:', error, errorInfo);
            // Could send to error reporting service here
          }}
        >
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <HelmetProvider>
              <AnimationProvider>
                <ModalsProvider>
                  <Suspense fallback={<LoadingScreen />}>
                    <App />
                  </Suspense>
                </ModalsProvider>
              </AnimationProvider>
            </HelmetProvider>
          </BrowserRouter>
        </GlobalErrorBoundary>
      // </StrictMode>,
    );
  }
};

// Register service worker for better resource management
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, could show update prompt here
              console.log('[SW] New service worker available');
            }
          });
        }
      });

      console.log('[SW] Service worker registered successfully');
    } catch (error) {
      console.warn('[SW] Service worker registration failed:', error);
      // Continue without service worker - app still works
    }
  } else {
    console.log('[SW] Service worker not supported');
  }
};

// Safely handle requestIdleCallback
const runWhenIdle = (cb: () => void) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 50);
  }
};

// Mount app and register service worker
const initializeApp = () => {
  mountApp();
  registerServiceWorker();
};

runWhenIdle(initializeApp);
