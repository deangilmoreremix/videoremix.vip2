// src/components/agentos/ui/Pill.tsx
//
// Small rounded status chip. Tone maps a semantic state to a colour; every
// AgentOS status surface uses this so the palette stays consistent.

import React from "react";
import { cn } from "../../../lib/utils";

export type PillTone =
  | "neutral"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "slate";

const TONE_CLASS: Record<PillTone, string> = {
  neutral: "border-white/15 bg-white/5 text-white/70",
  violet: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  amber: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  rose: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  sky: "border-sky-400/30 bg-sky-500/15 text-sky-200",
  slate: "border-white/10 bg-white/5 text-white/50",
};

export interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
  title?: string;
}

export const Pill: React.FC<PillProps> = ({
  children,
  tone = "neutral",
  className,
  title,
}) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5",
      TONE_CLASS[tone],
      className,
    )}
  >
    {children}
  </span>
);
