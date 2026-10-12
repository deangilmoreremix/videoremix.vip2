// src/components/agentos/ui/Stat.tsx
//
// Metric tile for the operations and overview surfaces. The value is always
// formatted by the caller (a real number), never a placeholder.

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
}

const VALUE_CLASS = {
  neutral: "text-white",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  sky: "text-sky-300",
  violet: "text-violet-300",
} as const;

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 bg-black/40 p-4",
      className,
    )}
  >
    <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</p>
    <p className={cn("mt-2 text-2xl font-semibold tabular-nums", VALUE_CLASS[tone])}>{value}</p>
    {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
  </div>
);

export default Stat;
