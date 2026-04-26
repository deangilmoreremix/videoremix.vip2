import React, { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SparkleBackground from "./components/SparkleBackground";
import SpecialHeader from "./components/SpecialHeader";
import ScrollProgressBar from "./components/ScrollProgressBar";
import CustomCursor from "./components/CustomCursor";
import LiveActivityIndicator from "./components/LiveActivityIndicator";
import AudioPlayer from "./components/AudioPlayer";
import ErrorBoundary from "./components/ErrorBoundary";
import AIAssistant from "./components/AIAssistant";
import ProtectedRoute from "./components/ProtectedRoute";
import MobileBottomNav from "./components/MobileBottomNav";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toast";
import { NetworkStatusIndicator } from "./components/AsyncStates";

// Lazy loaded components for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AppPage = lazy(() => import("./pages/AppPage"));
const ToolsHubPage = lazy(() => import("./pages/ToolsHubPage"));

// Generic pages
const PricingPage = lazy(() => import("./pages/PricingPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/admin/AdminLogin"));
const AdminSignUp = lazy(() => import("./components/admin/AdminSignUp"));
const SpecialFooter = lazy(() => import("./components/SpecialFooter"));

const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Auth pages
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmPage = lazy(() => import("./pages/EmailConfirmPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const MagicLinkPage = lazy(() => import("./pages/MagicLinkPage"));

// Loading fallback component
const SectionLoader = () => (
  <div className="flex justify-center items-center py-20 text-white">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-primary-500 font-medium">Loading</span>
      </div>
    </div>
  </div>
);

function App() {
  const location = useLocation();

  // Detect mobile/tablet
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check if we're on an admin page
  const isAdminPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);
  // Update document title with page section
  useEffect(() => {
    const updateTitle = () => {
      const sections = document.querySelectorAll("section[id]");
      let currentSection = "home";

      for (const section of sections as NodeListOf<HTMLElement>) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (
          window.scrollY >= sectionTop - 200 &&
          window.scrollY < sectionTop + sectionHeight - 200
        ) {
          currentSection = section.id;
          break;
        }
      }

      document.title = `VideoRemix.vip | ${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}`;
    };

    window.addEventListener("scroll", updateTitle);
    return () => window.removeEventListener("scroll", updateTitle);
  }, []);

  // Handle errors from error boundaries
  const handleError = () => {
    // In a production app, you might send this to an error tracking service
  };

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Helmet>
          <title>
            VideoRemix.vip - AI-Powered Marketing Personalization Platform
          </title>
          <meta
            name="description"
            content="Create personalized marketing content that converts with AI-powered tools. Transform your campaigns with VideoRemix.vip's marketing personalization platform."
          />
        </Helmet>

        {/* Header Navigation - Hidden on admin pages */}
        {!isAdminPage && <SpecialHeader topOffset={0} />}

        {/* Scroll Progress Indicator - Hidden on admin pages */}
        {!isAdminPage && <ScrollProgressBar topOffset={0} />}

        {/* Custom Cursor (desktop only) - Hidden on admin pages */}
        {!isMobile && !isTablet && !isAdminPage && <CustomCursor />}

        {/* Audio Feedback System - Hidden on admin pages */}
        {!isAdminPage && <AudioPlayer />}

        {/* Live Activity Indicator - Hidden on admin pages */}
        {!isAdminPage && <LiveActivityIndicator />}

        {/* AI Assistant - Hidden on admin pages */}
        {!isAdminPage && <AIAssistant />}

        <Routes>
          {/* Landing Page Route */}
          <Route
            path="/"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <LandingPage isMobile={isMobile} isTablet={isTablet} />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* Tools Hub Page */}
          <Route
            path="/tools"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <ToolsHubPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* App Detail Pages */}
          <Route
            path="/app/:appId"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <AppPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* Pricing Page */}
          <Route
            path="/pricing"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <PricingPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* FAQ Page */}
          <Route
            path="/faq"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <FAQPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* About Us Page */}
          <Route
            path="/about"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <AboutUsPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* Blog Routes */}
          <Route
            path="/blog"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <BlogPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          <Route
            path="/blog/:postId"
            element={
              <ErrorBoundary onError={handleError}>
                <SparkleBackground>
                  <Suspense fallback={<SectionLoader />}>
                    <BlogPostPage />
                    <SpecialFooter />
                  </Suspense>
                </SparkleBackground>
              </ErrorBoundary>
            }
          />

          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ErrorBoundary onError={handleError}>
                  <SparkleBackground>
                    <Suspense fallback={<SectionLoader />}>
                      <DashboardPage />
                      <SpecialFooter />
                    </Suspense>
                  </SparkleBackground>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary onError={handleError}>
                  <Suspense fallback={<SectionLoader />}>
                    <ProfilePage />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Auth Routes */}
          <Route
            path="/signin"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <SignInPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/signup"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <SignUpPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <ForgotPasswordPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/auth/recovery"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <ForgotPasswordPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/reset-password"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <ResetPassword />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/auth/reset-password"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <ResetPassword />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/auth/confirm"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <EmailConfirmPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/auth/callback"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <AuthCallback />
                </Suspense>
              </ErrorBoundary>
            }
          />

          <Route
            path="/auth/magic-link"
            element={
              <ErrorBoundary onError={handleError}>
                <Suspense fallback={<SectionLoader />}>
                  <MagicLinkPage />
                </Suspense>
              </ErrorBoundary>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/login"
            element={
              <AdminProvider>
                <ErrorBoundary onError={handleError}>
                  <Suspense fallback={<SectionLoader />}>
                    <AdminLogin />
                  </Suspense>
                </ErrorBoundary>
              </AdminProvider>
            }
          />
          <Route
            path="/admin/signup"
            element={
              <AdminProvider>
                <ErrorBoundary onError={handleError}>
                  <Suspense fallback={<SectionLoader />}>
                    <AdminSignUp />
                  </Suspense>
                </ErrorBoundary>
              </AdminProvider>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProvider>
                <ErrorBoundary onError={handleError}>
                  <Suspense fallback={<SectionLoader />}>
                    <AdminDashboard />
                    <SpecialFooter />
                  </Suspense>
                </ErrorBoundary>
              </AdminProvider>
            }
          />

          {/* Temporary debug route */}
          <Route
            path="/debug"
            element={
              <div className="min-h-screen bg-gray-900 text-white p-8">
                <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
                <div id="debug-output" className="font-mono text-sm bg-gray-800 p-4 rounded">
                  Loading debug info...
                </div>
                <script dangerouslySetInnerHTML={{
                  __html: `
                    console.log('🔍 Browser Storage & Auth Debug Test');
                    const output = document.getElementById('debug-output');
                    let log = '';

                    function addLog(message) {
                      log += message + '\\n';
                      if (output) output.textContent = log;
                      console.log(message);
                    }

                    addLog('📦 localStorage check:');
                    try {
                      const keys = Object.keys(localStorage);
                      addLog(\`   Keys found: \${keys.length}\`);
                      keys.forEach(key => {
                        if (key.includes('auth') || key.includes('session') || key.includes('videoremix')) {
                          const value = localStorage.getItem(key);
                          addLog(\`   \${key}: \${value?.substring(0, 50)}...\`);
                        }
                      });
                    } catch (error) {
                      addLog(\`   ❌ localStorage error: \${error}\`);
                    }

                    addLog('📦 sessionStorage check:');
                    try {
                      const keys = Object.keys(sessionStorage);
                      addLog(\`   Keys found: \${keys.length}\`);
                      keys.forEach(key => {
                        if (key.includes('auth') || key.includes('session') || key.includes('videoremix')) {
                          const value = sessionStorage.getItem(key);
                          addLog(\`   \${key}: \${value?.substring(0, 50)}...\`);
                        }
                      });
                    } catch (error) {
                      addLog(\`   ❌ sessionStorage error: \${error}\`);
                    }

                    addLog('🔧 Testing auth state...');
                    setTimeout(() => {
                      addLog('Check browser console for more detailed auth logs');
                    }, 1000);
                  `
                }} />
              </div>
            }
          />
        </Routes>
        <Toaster />
        <MobileBottomNav />
        <NetworkStatusIndicator />
      </div>
    </AuthProvider>
  );
}

export default App;
