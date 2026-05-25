import React, { useState, useEffect, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import User from "lucide-react/dist/esm/icons/user.js";
import Settings from "lucide-react/dist/esm/icons/settings.js";
import Bell from "lucide-react/dist/esm/icons/bell.js";
import LogOut from "lucide-react/dist/esm/icons/log-out.js";
import Zap from "lucide-react/dist/esm/icons/zap.js";
import Video from "lucide-react/dist/esm/icons/video.js";
import Award from "lucide-react/dist/esm/icons/award.js";
import Sun from "lucide-react/dist/esm/icons/sun.js";
import Moon from "lucide-react/dist/esm/icons/moon.js";
import Menu from "lucide-react/dist/esm/icons/menu.js";
import Home from "lucide-react/dist/esm/icons/home.js";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle.js";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.js";
import Key from "lucide-react/dist/esm/icons/key.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { useUserStats } from "../hooks/useUserStats";
import { useDashboardPreferences } from "../hooks/useDashboardPreferences";
import { useAchievements } from "../hooks/useAchievements";

import EnhancedStatCard from "../components/dashboard/EnhancedStatCard";
import MagicSparkles from "../components/MagicSparkles";
import AgentApiConfigPanel from "../components/AgentApiConfigPanel";
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

// Lazy load heavy dashboard sections
const DashboardToolsSection = lazy(() => import("../components/dashboard/DashboardToolsSection"));
const DashboardPersonalizerSection = lazy(() => import("../components/dashboard/DashboardPersonalizerSection"));
const OnboardingProgressTracker = lazy(() => import("../components/dashboard/OnboardingProgressTracker"));

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { preferences, setTheme } = useDashboardPreferences();
  const { achievements, getRecentAchievements } = useAchievements();
  const [searchParams] = useSearchParams();
  const [greeting, setGreeting] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show wizard for any user who hasn't completed onboarding yet
    // This triggers on every sign-in for users who haven't finished the wizard
    const onboardingCompleted = user?.user_metadata?.onboarding_completed;
    if (!onboardingCompleted && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const timeSavedPercentage = React.useMemo(() =>
    stats.activeDays > 0
      ? Math.min(95, Math.floor((stats.activeDays / 30) * 100))
      : 0, [stats.activeDays]);

  const userName = React.useMemo(() =>
    user?.email?.split("@")[0] || "there", [user?.email]);

  const recentAchievements = React.useMemo(() =>
    getRecentAchievements(3), [achievements]);

  const sparklineData = React.useMemo(() => [
    { value: 10 },
    { value: 20 },
    { value: 15 },
    { value: 30 },
    { value: 25 },
    { value: 35 },
    { value: stats.purchasedAppsCount || 0 },
  ], [stats.purchasedAppsCount]);

  return (
    <>
      <Helmet>
        <title>Dashboard | VideoRemix.vip</title>
        <meta
          name="description"
          content="Access your personalized VideoRemix.vip dashboard with all your favorite tools and account settings."
        />
      </Helmet>

      <main className="pt-24 pb-20 md:pb-8">
        {/* Dashboard Hero Header */}
        <section className="relative overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-600/25 to-accent-500/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-accent-500/20 to-primary-600/15 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-primary-500/5 rounded-full blur-[80px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="py-12 md:py-20"
              >
                {/* Hero Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
                  {/* Greeting */}
                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/40 border border-primary-500/30 text-primary-300 text-xs font-medium mb-4"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                      </span>
                      Welcome back
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {greeting},{" "}
                      <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent animate-gradient-shift"
                        style={{ backgroundSize: '200% auto' }}>
                        {userName}
                      </span>
                      !
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed"
                    >
                      Transform your video content with AI-powered tools. Create, edit, and launch stunning videos in minutes.
                    </motion.p>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setTheme(
                          preferences.theme === "dark" ? "light" : "dark",
                        )
                      }
                      className="group glass-button px-4 py-3 rounded-xl transition-all duration-300"
                      title="Toggle theme"
                    >
                      <div className="flex items-center gap-2">
                        {preferences.theme === "dark" ? (
                          <>
                            <Sun className="h-5 w-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                            <span className="text-white text-sm font-medium hidden sm:inline">Light</span>
                          </>
                        ) : (
                          <>
                            <Moon className="h-5 w-5 text-indigo-400 group-hover:-rotate-12 transition-transform" />
                            <span className="text-white text-sm font-medium hidden sm:inline">Dark</span>
                          </>
                        )}
                      </div>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowApiConfig(true)}
                      className="hidden md:flex glass-button px-5 py-3 rounded-xl text-white items-center gap-2 transition-all duration-300"
                      title="API Settings"
                    >
                      <Key className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">API Settings</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/settings/api")}
                      className="hidden md:flex glass-button px-5 py-3 rounded-xl text-white items-center gap-2 transition-all duration-300"
                    >
                      <Settings className="h-5 w-5 text-blue-400" />
                      <span className="font-medium">Settings</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        if (signingOut) return;
                        setSigningOut(true);
                        try {
                          await signOut();
                        } finally {
                          setSigningOut(false);
                        }
                      }}
                      disabled={signingOut}
                      className="hidden md:flex bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 disabled:opacity-50 text-white px-5 py-3 rounded-xl items-center gap-2 transition-all duration-300 shadow-lg shadow-red-900/20"
                    >
                      {signingOut ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                      <span className="font-medium">{signingOut ? "Signing Out..." : "Sign Out"}</span>
                    </motion.button>
                  </motion.div>
                </div>

                {/* Achievement Banner */}
                {recentAchievements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl p-4 mb-12 border border-yellow-500/30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
                      boxShadow: '0 0 40px rgba(234, 179, 8, 0.15) inset, 0 4px 20px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg">
                        <Award className="h-6 w-6 text-yellow-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          Recent Achievement Unlocked!
                        </p>
                        <p className="text-xs text-yellow-200/80 mt-0.5">
                          You earned:{" "}
                          <span className="text-yellow-100 font-medium uppercase tracking-wider">
                            {recentAchievements[0].achievement_type.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <span className="text-lg">🎉</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
               </motion.div>

              {showOnboarding && (
                <OnboardingWizard
                  onComplete={() => {
                    setShowOnboarding(false);
                    window.history.replaceState({}, '', '/dashboard');
                  }}
                />
              )}

               {/* Onboarding Progress */}
              <div className="mb-8">
                <ErrorBoundary fallback={<div></div>}>
                  <OnboardingProgressTracker />
                </ErrorBoundary>
              </div>

              {/* Enhanced Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <ErrorBoundary fallback={
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Stats unavailable</p>
                  </div>
                }>
                  <EnhancedStatCard
                    title="Tools Available"
                    value={stats.purchasedAppsCount}
                    icon={Zap}
                    sparklineData={sparklineData}
                    loading={statsLoading}
                    error={!!statsError}
                    change={15}
                    changeLabel="vs last month"
                    color="#6366f1"
                  />
                </ErrorBoundary>

                <ErrorBoundary fallback={
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Stats unavailable</p>
                  </div>
                }>
                  <EnhancedStatCard
                    title="Videos Created"
                    value={stats.videosCreated}
                    icon={Video}
                    loading={statsLoading}
                    error={!!statsError}
                    change={stats.videosCreated > 0 ? 25 : 0}
                    changeLabel="vs last month"
                    color="#8b5cf6"
                  />
                </ErrorBoundary>

                <ErrorBoundary fallback={
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Stats unavailable</p>
                  </div>
                }>
                  <EnhancedStatCard
                    title="Productivity Boost"
                    value={timeSavedPercentage}
                    suffix="%"
                    icon={Award}
                    loading={statsLoading}
                    error={!!statsError}
                    change={timeSavedPercentage > 0 ? 10 : 0}
                    changeLabel="vs last month"
                    color="#10b981"
                  />
                </ErrorBoundary>
              </motion.div>

              {statsError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300"
                >
                  Unable to load statistics. Please refresh the page.
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Personalizer Section */}
        <ErrorBoundary fallback={
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-yellow-400">Personalizer section temporarily unavailable</p>
          </div>
        }>
          <Suspense fallback={
            <div className="bg-gray-800/30 rounded-lg p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" />
            </div>
          }>
            <DashboardPersonalizerSection />
          </Suspense>
        </ErrorBoundary>

        {/* Dashboard Tools Section */}
        <ErrorBoundary fallback={
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Tools Section Unavailable</h3>
            <p className="text-gray-400">Unable to load the tools section. Please refresh the page.</p>
          </div>
        }>
          <Suspense fallback={
            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
              <p className="text-gray-400">Loading tools...</p>
            </div>
          }>
            <DashboardToolsSection />
          </Suspense>
        </ErrorBoundary>

        {/* API Config Panel */}
        <AgentApiConfigPanel
          open={showApiConfig}
          onOpenChange={setShowApiConfig}
        />

      </main>
    </>
  );
};

export default DashboardPage;
