// src/components/agentos/ui/EmptyState.tsx
//
// The "nothing here yet" surface. Every AgentOS list uses this rather than a
// blank div, so the first-run experience always offers an action.

import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-4 rounded-full border border-white/10 bg-white/5 p-3">
      <Icon className="h-6 w-6 text-white/40" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {description ? (
      <p className="mt-1.5 max-w-md text-sm text-white/50">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export default EmptyState;
