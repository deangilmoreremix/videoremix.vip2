// src/components/agentos/ui/StatusDot.tsx
//
// The coloured dot used by every AgentOS status surface. Colour comes from
// statusTone.ts so a node, a card, and a table row all agree.

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
    role="status"
    className={cn("inline-block h-2 w-2 shrink-0 rounded-full", DOT_CLASS[tone], className)}
  />
);

export default StatusDot;
