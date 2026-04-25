import React, { useState, useEffect, Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  Bell,
  LogOut,
  Zap,
  Video,
  Award,
  Sun,
  Moon,
  Menu,
  Home,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { useUserStats } from "../hooks/useUserStats";
import { useDashboardPreferences } from "../hooks/useDashboardPreferences";
import { useAchievements } from "../hooks/useAchievements";
const DashboardToolsSection = lazy(() => import("../components/dashboard/DashboardToolsSection"));
const DashboardPersonalizerSection = lazy(() => import("../components/dashboard/DashboardPersonalizerSection"));
const DashboardContactSection = lazy(() => import("../components/dashboard/DashboardContactSection"));
const EnhancedStatCard = lazy(() => import("../components/dashboard/EnhancedStatCard"));
const OnboardingProgressTracker = lazy(() => import("../components/dashboard/OnboardingProgressTracker"));
const MagicSparkles = lazy(() => import("../components/MagicSparkles"));

const DashboardPage: React.FC = () => {
  console.log("[DashboardPage] Rendering dashboard for user:", user?.id);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { preferences, setTheme } = useDashboardPreferences();
  const { achievements, getRecentAchievements } = useAchievements();
  const [greeting, setGreeting] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    console.log("[DashboardPage] Component mounted, user:", user?.id);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [user]);

  const timeSavedPercentage =
    stats.activeDays > 0
      ? Math.min(95, Math.floor((stats.activeDays / 30) * 100))
      : 0;

  const userName = user?.email?.split("@")[0] || "there";
  const recentAchievements = getRecentAchievements(3);

  const sparklineData = [
    { value: 10 },
    { value: 20 },
    { value: 15 },
    { value: 30 },
    { value: 25 },
    { value: 35 },
    { value: stats.purchasedAppsCount || 0 },
  ];
  // Debug: Check if we have basic data
  console.log("[DashboardPage] User:", user, "Stats:", stats, "Preferences:", preferences);

  return (
    <>
      <Helmet>
        <title>Dashboard | VideoRemix.vip</title>
        <meta
          name="description"
          content="Access your personalized VideoRemix.vip dashboard with all your favorite tools and account settings."
        />
      </Helmet>

      <main className="pt-32 pb-20 md:pb-8">
        {/* Dashboard Header */}
        <section className="py-8 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              {/* Left-Aligned Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
                    >
                      {greeting},{" "}
                      <span className="text-primary-400">{userName}</span>! 👋
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg text-gray-300"
                    >
                      Here's what's happening with your projects today
                    </motion.p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setTheme(
                          preferences.theme === "dark" ? "light" : "dark",
                        )
                      }
                      className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-700 transition-colors"
                      title="Toggle theme"
                    >
                      {preferences.theme === "dark" ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/profile")}
                      className="hidden md:flex bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg items-center gap-2 border border-gray-700 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        if (signingOut) return; // Prevent multiple clicks
                        setSigningOut(true);
                        try {
                          const { error } = await signOut();
                          if (error) {
                            toast({
                              title: "Sign Out Failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        } finally {
                          setSigningOut(false);
                        }
                      }}
                      disabled={signingOut}
                      className="hidden md:flex bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg items-center gap-2 transition-colors"
                    >
                      {signingOut ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                      <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Recent Achievements Banner */}
                {recentAchievements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4 mb-6"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          Recent Achievement!
                        </p>
                        <p className="text-xs text-gray-300">
                          You earned:{" "}
                          {recentAchievements[0].achievement_type.replace(
                            "_",
                            " ",
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Onboarding Progress */}
              <div className="mb-8">
                <OnboardingProgressTracker />
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
                  <Suspense fallback={
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" />
                    </div>
                  }>
                    <EnhancedStatCard
                      title="Tools Available"
                      value={stats.purchasedAppsCount}
                      icon={Zap}
                      sparklineData={sparklineData}
                      loading={statsLoading}
                      error={statsError}
                      change={15}
                      changeLabel="vs last month"
                      color="#6366f1"
                    />
                  </Suspense>
                </ErrorBoundary>

                <ErrorBoundary fallback={
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Stats unavailable</p>
                  </div>
                }>
                  <Suspense fallback={
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" />
                    </div>
                  }>
                    <EnhancedStatCard
                      title="Videos Created"
                      value={stats.videosCreated}
                      icon={Video}
                      loading={statsLoading}
                      error={statsError}
                      change={stats.videosCreated > 0 ? 25 : 0}
                      changeLabel="vs last month"
                      color="#8b5cf6"
                    />
                  </Suspense>
                </ErrorBoundary>

                <ErrorBoundary fallback={
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Stats unavailable</p>
                  </div>
                }>
                  <Suspense fallback={
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" />
                    </div>
                  }>
                    <EnhancedStatCard
                      title="Productivity Boost"
                      value={timeSavedPercentage}
                      suffix="%"
                      icon={Award}
                      loading={statsLoading}
                      error={statsError}
                      change={timeSavedPercentage > 0 ? 10 : 0}
                      changeLabel="vs last month"
                      color="#10b981"
                    />
                  </Suspense>
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

        {/* Dashboard Contact Section */}
        <ErrorBoundary fallback={
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-400">Contact section temporarily unavailable</p>
          </div>
        }>
          <Suspense fallback={
            <div className="bg-gray-800/30 rounded-lg p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-500" />
            </div>
          }>
            <DashboardContactSection />
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
};

export default DashboardPage;
