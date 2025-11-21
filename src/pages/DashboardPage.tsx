import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Settings, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import DashboardToolsSection from '../components/dashboard/DashboardToolsSection';
import DashboardPersonalizerSection from '../components/dashboard/DashboardPersonalizerSection';
import DashboardContactSection from '../components/dashboard/DashboardContactSection';
import MagicSparkles from '../components/MagicSparkles';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();

  const timeSavedPercentage = stats.activeDays > 0
    ? Math.min(95, Math.floor((stats.activeDays / 30) * 100))
    : 0;
  return (
    <>
      <Helmet>
        <title>Dashboard | VideoRemix.vip</title>
        <meta 
          name="description" 
          content="Access your personalized VideoRemix.vip dashboard with all your favorite tools and account settings." 
        />
      </Helmet>

      <main className="pt-32 pb-20">
        {/* Dashboard Header */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MagicSparkles minSparkles={5} maxSparkles={8}>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Welcome to Your <span className="text-primary-400">Personalized Dashboard</span>
                  </h1>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  Access all your personalized tools and create amazing content
                </p>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mx-auto"></div>
                  ) : statsError ? (
                    <div className="text-2xl font-bold text-red-400">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary-400">{stats.purchasedAppsCount}</div>
                  )}
                  <div className="text-sm text-gray-300">Tools Available</div>
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mx-auto"></div>
                  ) : statsError ? (
                    <div className="text-2xl font-bold text-red-400">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary-400">{stats.videosCreated}</div>
                  )}
                  <div className="text-sm text-gray-300">Videos Created</div>
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-700 animate-pulse rounded mx-auto"></div>
                  ) : statsError ? (
                    <div className="text-2xl font-bold text-red-400">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-primary-400">{timeSavedPercentage}%</div>
                  )}
                  <div className="text-sm text-gray-300">Productivity Boost</div>
                </div>
              </motion.div>

              {statsError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                  Unable to load statistics. Please refresh the page.
                </div>
              )}

              {/* Account Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center border border-gray-700 transition-colors"
                >
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center border border-gray-700">
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center border border-gray-700">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </button>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Dashboard Personalizer Section */}
        <DashboardPersonalizerSection />

        {/* Dashboard Tools Section */}
        <DashboardToolsSection />

        {/* Dashboard Contact Section */}
        <DashboardContactSection />
      </main>
    </>
  );
};

export default DashboardPage;