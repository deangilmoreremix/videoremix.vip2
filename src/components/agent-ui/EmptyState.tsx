import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HelpCircle, Lightbulb, Sparkles } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  tips?: string[];
  image?: string; // Not used currently but kept for future
}

export function EmptyState({
  icon = <HelpCircle />,
  title,
  description,
  action,
  tips,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="mb-4 opacity-40">
        {icon}
      </div>

      <h3 className="text-lg font-medium text-white mb-2 max-w-md">
        {title}
      </h3>

      <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {action}
        </motion.div>
      )}

      {tips && tips.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Quick start:
          </p>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-3 text-sm text-gray-400 bg-gray-900/30 p-3 rounded-lg border border-gray-800/50"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-300">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
