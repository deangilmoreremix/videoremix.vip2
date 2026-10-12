// src/components/agentos/ui/Spinner.tsx
//
// Loading indicator. Uses the same Loader2 icon the rest of the dashboard uses.

import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className, label }) => (
  <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-white/50">
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />
    {label ? <span className="text-sm">{label}</span> : null}
  </span>
);

export default Spinner;
