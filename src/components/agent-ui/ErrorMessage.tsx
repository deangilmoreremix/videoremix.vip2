import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
  className?: string;
  variant?: "error" | "warning" | "info";
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  retryLoading,
  className,
  variant = "error",
}: ErrorMessageProps) {
  const variantStyles = {
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  };

  const iconColor = {
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-cyan-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mt-4 p-4 border rounded-lg flex items-start gap-3",
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <AlertCircle className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColor[variant])} />
      <div className="flex-1">
        {title && (
          <p className="font-medium mb-1">{title}</p>
        )}
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={retryLoading}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline disabled:opacity-50"
          >
            {retryLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );
}
