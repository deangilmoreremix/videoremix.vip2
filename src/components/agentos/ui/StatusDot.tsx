// src/components/agentos/ui/StatusDot.tsx
//
// The coloured dot used by every AgentOS status surface. Colour comes from
// statusTone.ts so a node, a card, and a table row all agree.
//
// WHY THE DOT IS ARIA-HIDDEN
//   The dot is decoration: it repeats a status that is always spelled out in
//   text next to it (a Pill, a label, a status word). Exposing it as
//   role="status" with no accessible name made every card announce an empty
//   status, which is noise for a screen reader and tells the user nothing.
//   The readable label stays on the adjacent text; the title attribute keeps
//   the hover tooltip.

import type React from "react";
import { cn } from "../../../lib/utils";
import { DOT_CLASS, type StatusTone } from "./statusTone";

export interface StatusDotProps {
  tone: StatusTone;
  className?: string;
  title?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ tone, className, title }) => (
  <span
    title={title}
    aria-hidden="true"
    className={cn("inline-block h-2 w-2 shrink-0 rounded-full", DOT_CLASS[tone], className)}
  />
);

export default StatusDot;
