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
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  totalApps: { count: number; active: number; inactive: number };
  users: {
    count: number;
    growth: string;
    regular: number;
    admins: number;
    newThisMonth: number;
  };
  purchases: {
    total: number;
    recent: number;
    revenue: string;
    recentRevenue: string;
  };
  subscriptions: { total: number; active: number; cancelled: number };
  appAccess: { total: number; recentGrants: number };
  analytics?: {
    eventBreakdown: Record<string, number>;
    topApps: Array<{ app_slug: string; user_count: number }>;
    revenueByPlatform: Record<string, { count: number; revenue: number }>;
    topProducts: Array<{ name: string; count: number; revenue: number }>;
    dailyTrends: Array<{
      date: string;
      users: number;
      activeUsers: number;
      newUsers: number;
      revenue: number;
      purchases: number;
      activeSubscriptions: number;
    }>;
    categoryBreakdown: Record<string, { total: number; active: number }>;
  };
  metrics?: {
    avgRevenuePerUser: string;
    avgRevenuePerPurchase: string;
    subscriptionRetentionRate: string;
    avgAppsPerUser: string;
  };
}

const AdminAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");
  const [viewMode, setViewMode] = useState<"basic" | "detailed">("basic");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("admin_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const detailed = viewMode === "detailed" ? "true" : "false";
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard-stats?detailed=${detailed}&range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
  }, [viewMode, timeRange]);

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
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("basic")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "basic"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "detailed"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              {analytics.users.growth}
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.users.count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Users</div>
          <div className="mt-4 pt-4 border-t border-blue-500/20 text-xs text-gray-400">
            {analytics.users.newThisMonth} new this month
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-400" />
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${parseFloat(analytics.purchases.revenue).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Revenue</div>
          <div className="mt-4 pt-4 border-t border-green-500/20 text-xs text-gray-400">
            ${parseFloat(analytics.purchases.recentRevenue).toLocaleString()}{" "}
            recent
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="h-8 w-8 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              {analytics.purchases.recent} recent
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.purchases.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Purchases</div>
          <div className="mt-4 pt-4 border-t border-purple-500/20 text-xs text-gray-400">
            {analytics.subscriptions.active} active subscriptions
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">
              {analytics.appAccess.recentGrants} new
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.appAccess.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">App Access Grants</div>
          <div className="mt-4 pt-4 border-t border-orange-500/20 text-xs text-gray-400">
            {analytics.totalApps.active} active apps
          </div>
        </motion.div>
      </div>

      {viewMode === "detailed" && analytics.analytics && (
        <>
          {analytics.metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                Key Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    ${analytics.metrics.avgRevenuePerUser}
                  </div>
                  <div className="text-sm text-gray-400">
                    Avg Revenue Per User
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    ${analytics.metrics.avgRevenuePerPurchase}
                  </div>
                  <div className="text-sm text-gray-400">
                    Avg Purchase Value
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {analytics.metrics.subscriptionRetentionRate}%
                  </div>
                  <div className="text-sm text-gray-400">
                    Subscription Retention
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">
                    {analytics.metrics.avgAppsPerUser}
                  </div>
                  <div className="text-sm text-gray-400">Avg Apps Per User</div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-400" />
                Top Apps by Users
              </h3>
              <div className="space-y-3">
                {analytics.analytics.topApps.slice(0, 5).map((app, index) => (
                  <div
                    key={app.app_slug}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-400 font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-white">{app.app_slug}</span>
                    </div>
                    <span className="text-blue-400 font-semibold">
                      {app.user_count} users
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                Top Products by Revenue
              </h3>
              <div className="space-y-3">
                {analytics.analytics.topProducts
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-gray-400 font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="text-white truncate">
                          {product.name}
                        </span>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-green-400 font-semibold">
                          ${product.revenue.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.count} sales
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-400" />
              Daily Trends
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Users</th>
                    <th className="pb-3 font-medium">Active</th>
                    <th className="pb-3 font-medium">New</th>
                    <th className="pb-3 font-medium">Purchases</th>
                    <th className="pb-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.analytics.dailyTrends
                    .slice(0, 7)
                    .map((trend, index) => (
                      <tr
                        key={trend.date}
                        className="border-b border-gray-800 text-sm"
                      >
                        <td className="py-3 text-gray-300">
                          {new Date(trend.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-white">
                          {trend.users.toLocaleString()}
                        </td>
                        <td className="py-3 text-blue-400">
                          {trend.activeUsers.toLocaleString()}
                        </td>
                        <td className="py-3 text-green-400">
                          +{trend.newUsers}
                        </td>
                        <td className="py-3 text-purple-400">
                          {trend.purchases}
                        </td>
                        <td className="py-3 text-green-400">
                          ${trend.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Revenue by Platform
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.analytics.revenueByPlatform).map(
                  ([platform, data]) => (
                    <div
                      key={platform}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white capitalize">{platform}</span>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">
                          ${data.revenue.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {data.count} transactions
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Apps by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.analytics.categoryBreakdown).map(
                  ([category, data]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-white">{category}</span>
                      <div className="text-right">
                        <span className="text-blue-400 font-semibold">
                          {data.active}
                        </span>
                        <span className="text-gray-400"> / {data.total}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
