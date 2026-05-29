import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";
import { useUserStats } from "../hooks/useUserStats";
import { useDashboardPreferences } from "../hooks/useDashboardPreferences";
import { useAchievements } from "../hooks/useAchievements";
import DashboardToolsSection from "../components/dashboard/DashboardToolsSection";
import DashboardPersonalizerSection from "../components/dashboard/DashboardPersonalizerSection";
import DashboardContactSection from "../components/dashboard/DashboardContactSection";
import EnhancedStatCard from "../components/dashboard/EnhancedStatCard";
import OnboardingProgressTracker from "../components/dashboard/OnboardingProgressTracker";
import MagicSparkles from "../components/MagicSparkles";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { preferences, setTheme } = useDashboardPreferences();
  const { achievements, getRecentAchievements } = useAchievements();
  const [greeting, setGreeting] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show wizard for any user who hasn't completed onboarding yet
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
              {/* Premium Left-Aligned Hero — consistent with new 1M dashboard language */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="mb-10"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-x-8 gap-y-6 mb-8">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[3px] text-primary-400/70 mb-1.5">YOUR COMMAND CENTER</div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-1.5px] text-white mb-3">
                      {greeting}, <span className="text-primary-400">{userName}</span>.
                    </h1>
                    <p className="text-xl text-gray-300 max-w-md">
                      You have powerful tools across <span className="font-medium text-white">10 production batches</span>. Let's create something exceptional today.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:pt-2">
                    <button
                      onClick={() => setTheme(preferences.theme === "dark" ? "light" : "dark")}
                      className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-[0.96]"
                      title="Toggle theme"
                    >
                      {preferences.theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => navigate("/profile")}
                      className="hidden md:flex h-11 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-all active:scale-[0.985]"
                    >
                      <User className="h-4 w-4" /> Profile
                    </button>

                    <button
                      onClick={async () => {
                        if (signingOut) return;
                        setSigningOut(true);
                        try {
                          const { error } = await signOut();
                          if (error) toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
                        } finally {
                          setSigningOut(false);
                        }
                      }}
                      disabled={signingOut}
                      className="hidden md:flex h-11 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/90 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-[0.985]"
                    >
                      {signingOut ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>

                {/* Recent Achievements — refined */}
                {recentAchievements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm"
                  >
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-white/90">Recent win:</span>
                    <span className="font-medium text-white">
                      {recentAchievements[0].achievement_type.replace(/_/g, " ")}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Onboarding Progress */}
              <div className="mb-8">
                <OnboardingProgressTracker />
              </div>

              {/* Premium Stats Row — elevated to match new batch dashboard language */}
              <div className="mb-10">
                <div className="text-[11px] font-semibold tracking-[3px] text-white/50 mb-3 px-1">YOUR PERFORMANCE AT A GLANCE</div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <EnhancedStatCard
                    title="Tools Owned"
                    value={stats.purchasedAppsCount}
                    icon={Zap}
                    sparklineData={sparklineData}
                    loading={statsLoading}
                    error={statsError}
                    change={15}
                    changeLabel="since last month"
                    color="#6366f1"
                  />
                  <EnhancedStatCard
                    title="Videos Created"
                    value={stats.videosCreated}
                    icon={Video}
                    loading={statsLoading}
                    error={statsError}
                    change={stats.videosCreated > 0 ? 25 : 0}
                    changeLabel="since last month"
                    color="#8b5cf6"
                  />
                  <EnhancedStatCard
                    title="Time Saved"
                    value={timeSavedPercentage}
                    suffix="%"
                    icon={Award}
                    loading={statsLoading}
                    error={statsError}
                    change={timeSavedPercentage > 0 ? 10 : 0}
                    changeLabel="productivity lift"
                    color="#10b981"
                  />
                </motion.div>
              </div>

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
        <DashboardPersonalizerSection />

        {/* Dashboard Tools Section */}
        <DashboardToolsSection />

        {/* Dashboard Contact Section */}
        <DashboardContactSection />

        {showOnboarding && (
          <OnboardingWizard
            onComplete={() => {
              setShowOnboarding(false);
              window.history.replaceState({}, '', '/dashboard');
            }}
          />
        )}
      </main>
    </>
  );
};

export default DashboardPage;
