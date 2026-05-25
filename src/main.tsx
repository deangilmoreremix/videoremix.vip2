import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ModalsProvider } from "./components/ModalsProvider";
import { LandingPageProvider } from "./context/LandingPageContext";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import App from "./App";
import "./index.css";

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

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <GlobalErrorBoundary
        onError={(error, errorInfo) => {
          console.error('🚨 Global error caught:', error, errorInfo);
        }}
      >
        <LandingPageProvider>
          <BrowserRouter>
            <AuthProvider>
              <ModalsProvider>
                <Suspense fallback={<LoadingScreen />}>
                  <App />
                </Suspense>
              </ModalsProvider>
            </AuthProvider>
          </BrowserRouter>
        </LandingPageProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ App mounted successfully');
} else {
  console.error('❌ Root element not found');
}