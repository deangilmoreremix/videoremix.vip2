import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

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

const Sparkline: React.FC<{ data: SparklineDataPoint[]; color: string }> = ({
  data,
  color,
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      {/* Gradient fill under line */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="50%" stopColor={color} stopOpacity="0.1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,30 ${points} 100,30`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]"
      />
      {/* Animated dot at end */}
      <circle cx="100" cy={100 - ((data[data.length - 1]?.value - min) / range) * 100} r="3" fill={color} className="filter blur-[1px]">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  sparklineData,
  loading = false,
  error = false,
  color = "#6366f1",
  suffix = "",
  prefix = "",
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const TrendIcon = change === undefined || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  const trendColor = change === undefined || change === 0 ? "text-gray-400" : change > 0 ? "text-emerald-400" : "text-rose-400";

  // Animate number counting
  React.useEffect(() => {
    if (loading || error || typeof value !== 'number') return;
    const start = displayValue;
    const end = Number(value);
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value, loading, error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ backgroundColor: color, filter: `blur(40px)`, opacity: 0.25 }}
      />

      <div
        className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 group-hover:border-gray-600/70 transition-all duration-500 overflow-hidden"
      >
        {/* Subtle highlight gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {title}
            </p>

            {loading ? (
              <div className="h-10 w-28 bg-gray-800/80 rounded-lg animate-pulse"></div>
            ) : error ? (
              <div className="text-3xl font-bold text-rose-400">--</div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                className="text-4xl font-bold text-white flex items-baseline tracking-tight"
              >
                {prefix && <span className="text-lg mr-1 text-gray-400 font-medium">{prefix}</span>}
                <span>{displayValue.toLocaleString()}</span>
                {suffix && (
                  <span className="text-lg ml-1 text-gray-400 font-normal">{suffix}</span>
                )}
              </motion.div>
            )}
          </div>

          {Icon && (
            <motion.div
              whileHover={{ scale: 1.15, rotate: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative"
            >
              <div
                className="p-3 rounded-xl backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              {/* Subtle glow behind icon */}
              <div
                className="absolute inset-0 rounded-xl blur-md -z-10"
                style={{ backgroundColor: color, opacity: 0.2 }}
              />
            </motion.div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && !loading && !error && (
          <div className="mb-4 relative">
            <Sparkline data={sparklineData} color={color} />
          </div>
        )}

        {/* Change indicator */}
        {change !== undefined && !loading && !error && (
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 backdrop-blur-sm border border-white/5 ${trendColor}`}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="text-sm font-bold">{Math.abs(change)}%</span>
            </motion.div>
            <span className="text-xs text-gray-500">{changeLabel}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedStatCard;
