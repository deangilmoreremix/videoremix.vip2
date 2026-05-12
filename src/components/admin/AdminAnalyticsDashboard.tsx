import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Settings,
  ToggleLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";

interface AnalyticsData {
  totalApps: { count: number; active: number; inactive: number };
  features: { count: number; enabled: number; disabled: number };
  users: {
    count: number;
    growth: string;
  };
}

const AdminAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || "Failed to load analytics");
      }
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <p className="text-red-400">{error || "Failed to load analytics"}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <button
          onClick={fetchAnalytics}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Settings className="h-8 w-8 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              {analytics.totalApps.active} active
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.totalApps.count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Apps</div>
          <div className="mt-4 pt-4 border-t border-blue-500/20 text-xs text-gray-400">
            {analytics.totalApps.inactive} inactive apps
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ToggleLeft className="h-8 w-8 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              {analytics.features.enabled} enabled
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.features.count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Features</div>
          <div className="mt-4 pt-4 border-t border-green-500/20 text-xs text-gray-400">
            {analytics.features.disabled} disabled features
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              {analytics.users.growth}
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.users.count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Active Users</div>
          <div className="mt-4 pt-4 border-t border-purple-500/20 text-xs text-gray-400">
            User growth this month
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
