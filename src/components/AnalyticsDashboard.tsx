import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

// Analytics data types
interface AnalyticsSummary {
  total_sessions: number;
  total_users: number;
  total_events: number;
  conversion_rate: number;
  avg_session_duration: number;
  top_performing_apps: Array<{
    app_id: string;
    app_name: string;
    views: number;
    clicks: number;
    purchases: number;
    conversion_rate: number;
  }>;
  funnel_metrics: {
    card_views: number;
    card_clicks: number;
    modal_opens: number;
    cta_clicks: number;
    purchases: number;
  };
  performance_metrics: {
    avg_modal_load_time: number;
    image_load_success_rate: number;
    error_rate: number;
  };
  ab_test_results: Array<{
    test_id: string;
    test_name: string;
    variants: Array<{
      variant: string;
      conversions: number;
      conversion_rate: number;
      confidence: number;
    }>;
    winner?: string;
  }>;
}

interface AnalyticsDashboardProps {
  isAdmin?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isAdmin = false }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/summary?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-primary-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Failed to load analytics data</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time insights into user behavior and conversion optimization</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={formatNumber(data.total_sessions)}
          icon={<Users className="h-6 w-6" />}
          trend="+12.5%"
          color="blue"
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercentage(data.conversion_rate)}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="+8.2%"
          color="green"
        />
        <MetricCard
          title="Avg Session Duration"
          value={formatDuration(data.avg_session_duration)}
          icon={<Clock className="h-6 w-6" />}
          trend="+5.1%"
          color="purple"
        />
        <MetricCard
          title="Revenue"
          value={`$${(data.funnel_metrics.purchases * 97).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend="+15.3%"
          color="yellow"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Conversion Funnel
        </h2>

        <div className="space-y-4">
          {[
            { label: 'Card Views', value: data.funnel_metrics.card_views, icon: <Eye className="h-4 w-4" /> },
            { label: 'Card Clicks', value: data.funnel_metrics.card_clicks, icon: <MousePointer className="h-4 w-4" /> },
            { label: 'Modal Opens', value: data.funnel_metrics.modal_opens, icon: <BarChart3 className="h-4 w-4" /> },
            { label: 'CTA Clicks', value: data.funnel_metrics.cta_clicks, icon: <ShoppingCart className="h-4 w-4" /> },
            { label: 'Purchases', value: data.funnel_metrics.purchases, icon: <CheckCircle className="h-4 w-4" /> },
          ].map((step, index) => {
            const conversionRate = index === 0
              ? 100
              : (step.value / [data.funnel_metrics.card_views, data.funnel_metrics.card_clicks, data.funnel_metrics.modal_opens, data.funnel_metrics.cta_clicks][index - 1]) * 100;

            return (
              <div key={step.label} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium">{step.label}</span>
                    <span className="text-gray-400 text-sm">{formatNumber(step.value)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(conversionRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {formatPercentage(conversionRate / 100)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performing Apps */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Top Performing Apps
        </h2>

        <div className="space-y-4">
          {data.top_performing_apps.slice(0, 5).map((app, index) => (
            <div key={app.app_id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-white font-medium">{app.app_name}</h3>
                  <p className="text-gray-400 text-sm">
                    {formatNumber(app.views)} views • {formatNumber(app.clicks)} clicks
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">{formatPercentage(app.conversion_rate)}</div>
                <div className="text-gray-400 text-sm">{app.purchases} purchases</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* A/B Test Results */}
      {isAdmin && data.ab_test_results.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            A/B Test Results
          </h2>

          <div className="space-y-6">
            {data.ab_test_results.map((test) => (
              <div key={test.test_id} className="border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">{test.test_name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {test.variants.map((variant) => (
                    <div key={variant.variant} className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400 mb-1">{variant.variant}</div>
                      <div className="text-lg font-bold text-white">{formatPercentage(variant.conversion_rate)}</div>
                      <div className="text-xs text-gray-400">{variant.conversions} conversions</div>
                      {variant.confidence > 95 && (
                        <div className="text-xs text-green-400 mt-1">High confidence</div>
                      )}
                    </div>
                  ))}
                </div>
                {test.winner && (
                  <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Winner: {test.winner}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Performance Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {(data.performance_metrics.avg_modal_load_time / 1000).toFixed(2)}s
            </div>
            <div className="text-gray-400 text-sm">Avg Modal Load Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {formatPercentage(data.performance_metrics.image_load_success_rate)}
            </div>
            <div className="text-gray-400 text-sm">Image Load Success</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 mb-2">
              {formatPercentage(data.performance_metrics.error_rate)}
            </div>
            <div className="text-gray-400 text-sm">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="text-green-400 text-sm font-medium">
          {trend}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-gray-400 text-sm">
        {title}
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;