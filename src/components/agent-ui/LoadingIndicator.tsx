import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface LoadingIndicatorProps {
  message: string;
  subtext?: string;
  progress?: number; // 0-100, undefined = indeterminate
  size?: "sm" | "md" | "lg";
}

export function LoadingIndicator({
  message,
  subtext,
  progress,
  size = "md",
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
  };

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Loader2 className={cn("animate-spin text-violet-500", sizeClasses[size])} />
      </motion.div>

      <p className={cn("font-medium text-white mt-4", textSize[size])}>
        {message}
      </p>

      {subtext && (
        <p className="text-sm text-gray-400 mt-2 max-w-md">
          {subtext}
        </p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <motion.div
          className="mt-6 w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </motion.div>
      )}
    </div>
  );
}
