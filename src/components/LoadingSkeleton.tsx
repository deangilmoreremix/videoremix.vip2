import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "rectangle";
  lines?: number;
  width?: string | number;
  height?: string | number;
}

/**
 * Loading skeleton component for better perceived performance
 * Provides visual feedback while content is loading
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  variant = "rectangle",
  lines = 1,
  width,
  height,
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  const getVariantClasses = () => {
    switch (variant) {
      case "card":
        return "p-4 space-y-3";
      case "text":
        return "h-4";
      case "circle":
        return "rounded-full";
      default:
        return "";
    }
  };

  const getSizeClasses = () => {
    if (width || height) {
      return "";
    }

    switch (variant) {
      case "card":
        return "w-full h-32";
      case "text":
        return "w-full";
      case "circle":
        return "w-10 h-10";
      default:
        return "w-full h-4";
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  if (variant === "card") {
    return (
      <div
        className={`${baseClasses} ${getVariantClasses()} ${className}`}
        style={style}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()}`}
            style={{
              ...style,
              width: index === lines - 1 ? "60%" : undefined, // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      style={style}
    />
  );
};

/**
 * App card loading skeleton
 */
export const AppCardSkeleton: React.FC = () => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-700 rounded-full w-16"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-700 rounded"></div>
      <div className="h-3 bg-gray-700 rounded w-5/6"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 bg-gray-700 rounded w-12"></div>
      <div className="h-8 bg-gray-700 rounded w-20"></div>
    </div>
  </div>
);

/**
 * Grid of app card skeletons
 */
export const AppGridSkeleton: React.FC<{ count?: number }> = ({
  count = 6,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <AppCardSkeleton key={index} />
    ))}
  </div>
);

export default LoadingSkeleton;
