import React from "react";
import { Lock, Shield, Star, Crown, Sparkles, CheckCircle } from "lucide-react";

interface AppAccessBadgeProps {
  hasAccess: boolean;
  tierName?: string;
  tierLevel?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const AppAccessBadge: React.FC<AppAccessBadgeProps> = ({
  hasAccess,
  tierName,
  tierLevel,
  size = "md",
  showIcon = true,
}) => {
  const getTierIcon = (level: number) => {
    switch (level) {
      case 1:
        return Shield;
      case 2:
        return Star;
      case 3:
        return Crown;
      case 4:
        return Sparkles;
      default:
        return Shield;
    }
  };

  const getTierColor = (level: number) => {
    switch (level) {
      case 1:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-400",
          border: "border-gray-500/50",
        };
      case 2:
        return {
          bg: "bg-blue-500/20",
          text: "text-blue-400",
          border: "border-blue-500/50",
        };
      case 3:
        return {
          bg: "bg-purple-500/20",
          text: "text-purple-400",
          border: "border-purple-500/50",
        };
      case 4:
        return {
          bg: "bg-yellow-500/20",
          text: "text-yellow-400",
          border: "border-yellow-500/50",
        };
      default:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-400",
          border: "border-gray-500/50",
        };
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!hasAccess) {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium bg-red-500/20 text-red-400 border border-red-500/50`}
      >
        {showIcon && <Lock className={`${iconSizes[size]} mr-1`} />}
        Locked
      </span>
    );
  }

  if (!tierName || tierLevel === undefined) {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/50`}
      >
        {showIcon && <CheckCircle className={`${iconSizes[size]} mr-1`} />}
        Access Granted
      </span>
    );
  }

  const colors = getTierColor(tierLevel);
  const Icon = getTierIcon(tierLevel);

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
    </span>
  );
};

export default AppAccessBadge;
