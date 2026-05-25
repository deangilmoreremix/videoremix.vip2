import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function ActionButton({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  variant = "primary",
  size = "default",
  ...props
}: ActionButtonProps) {
  const isPrimary = variant === "primary" || variant === "default";

  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    size === "sm" && "h-8 px-3 text-sm",
    size === "default" && "h-10 px-4 py-2",
    size === "lg" && "h-12 px-6 text-lg",
    className
  );

  const variantStyles = {
    default: isPrimary
      ? "bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white shadow-lg shadow-violet-500/10"
      : "bg-gray-700 hover:bg-gray-600 text-white",
    ghost: "hover:bg-gray-800 text-gray-200",
    outline: "border border-gray-600 hover:bg-gray-800 text-gray-200",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white",
  };

  return (
    <motion.button
      className={cn(baseStyles, variantStyles[variant as keyof typeof variantStyles] || variantStyles.default, className)}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          className=""
        >
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </motion.div>
      )}
      {children}
      {loading && loadingText && (
        <span className="hidden sm:inline">{loadingText}</span>
      )}
    </motion.button>
  );
}
