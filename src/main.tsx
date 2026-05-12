import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimationProvider } from "./context/AnimationContext";
import { ModalsProvider } from "./components/ModalsProvider";

// Import base styles early to prevent layout shifts
import "./index.css";

console.log("[DEBUG] main.tsx: Starting app initialization");
console.log("[DEBUG] main.tsx: Environment:", import.meta.env.MODE);
console.log("[DEBUG] main.tsx: Base URL:", import.meta.env.BASE_URL);

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
  console.log("[DEBUG] mountApp: Attempting to mount app");
  const root = document.getElementById("root");
  if (root) {
    console.log("[DEBUG] mountApp: Root element found, creating React root");
    try {
      createRoot(root).render(
        <StrictMode>
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
        </StrictMode>,
      );
      console.log("[DEBUG] mountApp: App mounted successfully");
    } catch (error) {
      console.error("[DEBUG] mountApp: Error mounting app:", error);
    }
  } else {
    console.error("[DEBUG] mountApp: Root element NOT found!");
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

console.log("[DEBUG] main.tsx: Calling runWhenIdle to mount app");
runWhenIdle(mountApp);

// Service Worker Registration - Production only
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);

      // Check for updates
      registration.update();

      // When new service worker is waiting, reload the page
      registration.addEventListener('updatefound', function() {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker installed, reloading...');
            window.location.reload();
          }
        });
      });
    }).catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });

    // Listen for the new service worker to take control
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('New service worker took control, reloading...');
      window.location.reload();
    });
  });
} else if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Non-production cleanup: unregister existing service workers and clear caches
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
     for (const registration of registrations) {
       registration.unregister().then(function(boolean) {
         console.log('Service Worker unregistered:', boolean);
       });
     }
   });

  // Clear caches
   if ('caches' in window) {
     caches.keys().then(function(names) {
       for (const name of names) {
         caches.delete(name).then(function() {
           console.log('Cache deleted:', name);
         });
       }
     });
   }
}
