import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      <div className="border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-cyan-500 rounded-full" />
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-400 mt-1 ml-3">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </motion.div>
  );
}
