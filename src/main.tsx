import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimationProvider } from './context/AnimationContext';
import { ModalsProvider } from './components/ModalsProvider';

// Import base styles early to prevent layout shifts
import './index.css';

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
import App from './App';

// Only mount the app after the DOM is fully loaded
const mountApp = () => {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </StrictMode>
    );
  }
};

// Safely handle requestIdleCallback
const runWhenIdle = (cb: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 50);
  }
};

runWhenIdle(mountApp);