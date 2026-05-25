import React from "react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4 border-2",
      md: "w-6 h-6 border-2",
      lg: "w-8 h-8 border-3"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border-primary-500 border-solid rounded-full animate-spin",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

ProgressIndicator.displayName = "ProgressIndicator";

export { ProgressIndicator };