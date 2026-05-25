import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Video,
  Zap
} from "lucide-react";

export interface ResultCardProps {
  icon?: React.ReactNode;
  title: string;
  value?: string | number;
  subtext?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  trending: TrendingUp,
  dollar: DollarSign,
  percent: Percent,
  chart: BarChart3,
  clock: Clock,
  check: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export function ResultCard({
  icon,
  title,
  value,
  subtext,
  description,
  variant = "default",
  className,
  onClick,
  children,
}: ResultCardProps) {
  const variantStyles = {
    default: "border-gray-700 bg-gray-900/40",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    error: "border-red-500/30 bg-red-500/5",
    info: "border-cyan-500/30 bg-cyan-500/5",
  };

  const accentColor = {
    default: "text-gray-300",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
    info: "text-cyan-400",
  };

  const subtextColor = {
    default: "text-gray-500",
    success: "text-green-500/70",
    warning: "text-yellow-500/70",
    error: "text-red-500/70",
    info: "text-cyan-500/70",
  };

  const IconComponent = typeof icon === 'string' ? iconMap[icon] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 transition-all duration-200",
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-5 bg-gradient-to-br",
        variant === 'success' && "from-green-500 to-transparent",
        variant === 'warning' && "from-yellow-500 to-transparent",
        variant === 'error' && "from-red-500 to-transparent",
        variant === 'info' && "from-cyan-500 to-transparent",
        variant === 'default' && "from-violet-500 to-transparent"
      )} />

      <div className="relative z-10">
        {/* Icon + Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={cn("flex-shrink-0", accentColor[variant])}>
                {IconComponent ? <IconComponent className="h-5 w-5" /> : icon}
              </div>
            )}
            <h4 className="text-sm font-medium text-gray-200">{title}</h4>
          </div>
        </div>

        {/* Value */}
        {value !== undefined && (
          <div className="mb-2">
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              variant === 'success' ? "text-green-300" :
              variant === 'error' ? "text-red-300" :
              variant === 'warning' ? "text-yellow-300" :
              variant === 'info' ? "text-cyan-300" :
              "text-white"
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        )}

        {/* Subtext */}
        {subtext && (
          <p className={cn("text-sm", subtextColor[variant])}>{subtext}</p>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        )}

        {/* Custom children */}
        {children}
      </div>
    </motion.div>
  );
}

export interface ResultGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ResultGrid({ children, columns = 2, className }: ResultGridProps) {
  const columnsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-4", columnsClass, className)}>
      {children}
    </div>
  );
}

// Preset icon sets for common result types
export const ResultIcons = {
  Success: CheckCircle2,
  Error: AlertTriangle,
  Info,
  Loading: Sparkles,
  File: FileText,
  Image: ImageIcon,
  Video,
  Zap,
};

export { ResultCard as default };
