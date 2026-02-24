import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Eye,
  Play,
  Users,
  Star,
  BarChart2,
  Activity,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useFeatures } from '../hooks/useFeatures';

interface AnalyticsData {
  totalViews: number;
  totalDemos: number;
  totalComparisons: number;
  averageRating: number;
  totalRatings: number;
  uniqueUsers: number;
  topFeatures: {
    id: string;
    name: string;
    views: number;
    demos: number;
    rating: number;
  }[];
  trendingFeatures: {
    id: string;
    name: string;
    growthRate: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    views: number;
  }[];
}

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const timeRanges: TimeRange[] = [
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'All Time', value: 'all', days: 0 },
];

const FeatureAnalyticsDashboard: React.FC = () => {
  const { features } = useFeatures();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[1]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeRange, features]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch feature analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('feature_analytics')
        .select('*');

      if (analyticsError) throw analyticsError;

      // Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('feature_ratings')
        .select('*');

      if (ratingsError) throw ratingsError;

      // Fetch unique user interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('user_feature_interactions')
        .select('user_id, created_at');

      if (interactionsError) throw interactionsError;

      // Filter by time range
      let filteredInteractions = interactionsData || [];
      if (selectedTimeRange.days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - selectedTimeRange.days);
        filteredInteractions = filteredInteractions.filter(
          i => new Date(i.created_at) >= cutoffDate
        );
      }

      // Calculate metrics
      const totalViews = analyticsData?.reduce((sum, a) => sum + Number(a.view_count), 0) || 0;
      const totalDemos = analyticsData?.reduce((sum, a) => sum + Number(a.demo_play_count), 0) || 0;
      const totalComparisons = analyticsData?.reduce((sum, a) => sum + Number(a.comparison_count), 0) || 0;

      const allRatings = ratingsData?.map(r => r.rating) || [];
      const averageRating = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

      const uniqueUsers = new Set(filteredInteractions.map(i => i.user_id)).size;

      // Top features
      const topFeatures = analyticsData
        ?.map(a => {
          const feature = features.find(f => f.id === a.feature_id);
          if (!feature) return null;

          const featureRatings = ratingsData?.filter(r => r.feature_id === a.feature_id) || [];
          const avgRating = featureRatings.length > 0
            ? featureRatings.reduce((sum, r) => sum + r.rating, 0) / featureRatings.length
            : 0;

          return {
            id: a.feature_id,
            name: feature.title,
            views: Number(a.view_count),
            demos: Number(a.demo_play_count),
            rating: avgRating,
          };
        })
        .filter(f => f !== null)
        .sort((a, b) => b!.views - a!.views)
        .slice(0, 5) || [];

      // Trending features (mock calculation - in real app, compare to previous period)
      const trendingFeatures = topFeatures.slice(0, 3).map(f => ({
        id: f!.id,
        name: f!.name,
        growthRate: Math.random() * 50 + 10, // Mock growth rate
      }));

      // Category breakdown
      const categoryMap = new Map<string, { count: number; views: number }>();
      features.forEach(feature => {
        const analytics = analyticsData?.find(a => a.feature_id === feature.id);
        const current = categoryMap.get(feature.category) || { count: 0, views: 0 };
        categoryMap.set(feature.category, {
          count: current.count + 1,
          views: current.views + (analytics ? Number(analytics.view_count) : 0),
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.views - a.views);

      setAnalytics({
        totalViews,
        totalDemos,
        totalComparisons,
        averageRating,
        totalRatings: allRatings.length,
        uniqueUsers,
        topFeatures: topFeatures as any,
        trendingFeatures,
        categoryBreakdown,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    trend?: 'up' | 'down';
  }> = ({ title, value, icon, change, trend }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary-600/20 p-3 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {change}%
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Activity className="h-8 w-8 text-primary-500" />
        </motion.div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary-400" />
            Feature Analytics Dashboard
          </h2>
          <p className="text-gray-400">Track feature usage and engagement metrics</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  selectedTimeRange.value === range.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          icon={<Eye className="h-6 w-6 text-primary-400" />}
          change={12}
          trend="up"
        />
        <StatCard
          title="Demo Plays"
          value={analytics.totalDemos.toLocaleString()}
          icon={<Play className="h-6 w-6 text-primary-400" />}
          change={8}
          trend="up"
        />
        <StatCard
          title="Unique Users"
          value={analytics.uniqueUsers.toLocaleString()}
          icon={<Users className="h-6 w-6 text-primary-400" />}
          change={15}
          trend="up"
        />
        <StatCard
          title="Avg Rating"
          value={analytics.averageRating.toFixed(1)}
          icon={<Star className="h-6 w-6 text-primary-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Features */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-400" />
            Top Features
          </h3>
          <div className="space-y-3">
            {analytics.topFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{feature.name}</p>
                    <p className="text-xs text-gray-400">
                      {feature.views} views • {feature.demos} demos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500" />
                  <span className="text-sm font-medium">{feature.rating.toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trending Features */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-400" />
            Trending Features
          </h3>
          <div className="space-y-3">
            {analytics.trendingFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-white font-medium">{feature.name}</p>
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-sm font-bold">{feature.growthRate.toFixed(0)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-400" />
          Category Performance
        </h3>
        <div className="space-y-3">
          {analytics.categoryBreakdown.map((cat, index) => {
            const maxViews = Math.max(...analytics.categoryBreakdown.map(c => c.views));
            const percentage = (cat.views / maxViews) * 100;

            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{cat.category}</span>
                  <span className="text-gray-400 text-sm">
                    {cat.count} features • {cat.views} views
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-primary-600 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </motion.button>
      </div>
    </div>
  );
};

export default FeatureAnalyticsDashboard;
