import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface SparklineDataPoint {
  value: number;
}

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  sparklineData?: SparklineDataPoint[];
  loading?: boolean;
  error?: boolean;
  color?: string;
  suffix?: string;
  prefix?: string;
}

const Sparkline: React.FC<{ data: SparklineDataPoint[]; color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      className="w-full h-8"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  sparklineData,
  loading = false,
  error = false,
  color = '#6366f1',
  suffix = '',
  prefix = '',
}) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return Minus;
    return change > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-400';
    return change > 0 ? 'text-green-400' : 'text-red-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.3)' }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wide">
            {title}
          </p>

          {loading ? (
            <div className="h-10 w-24 bg-gray-700 animate-pulse rounded"></div>
          ) : error ? (
            <div className="text-3xl font-bold text-red-400">--</div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-3xl font-bold text-white flex items-baseline"
            >
              {prefix && <span className="text-lg mr-1">{prefix}</span>}
              <span>{value}</span>
              {suffix && <span className="text-lg ml-1 text-gray-400">{suffix}</span>}
            </motion.div>
          )}
        </div>

        {Icon && (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 p-3 rounded-lg group-hover:from-primary-500/30 group-hover:to-primary-600/30 transition-colors"
          >
            <Icon className="h-6 w-6 text-primary-400" />
          </motion.div>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && !loading && !error && (
        <div className="mb-3">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}

      {change !== undefined && !loading && !error && (
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 ${getTrendColor()}`}
          >
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {Math.abs(change)}%
            </span>
          </motion.div>
          <span className="text-xs text-gray-500">
            {changeLabel}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedStatCard;
