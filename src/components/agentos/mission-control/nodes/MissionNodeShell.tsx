// src/components/agentos/mission-control/nodes/MissionNodeShell.tsx
//
// Shared chrome for every canvas node type, so a worker, task, model and
// runtime node all read as one family: icon, title, subtitle, status dot, and
// an accent border keyed to node kind.

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "../../../../lib/utils";
import type { StatusTone } from "../../ui/statusTone";
import { StatusDot } from "../../ui/StatusDot";

export interface MissionNodeShellProps {
  title: string;
  subtitle?: string;
  status?: StatusTone;
  statusLabel?: string;
  icon: ReactNode;
  accent: "worker" | "task" | "model" | "runtime" | "workspace";
  selected?: boolean;
  children?: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  className?: string;
}

const ACCENT_BORDER: Record<MissionNodeShellProps["accent"], string> = {
  worker: "border-violet-400/30",
  task: "border-sky-400/30",
  model: "border-emerald-400/30",
  runtime: "border-amber-400/30",
  workspace: "border-white/15",
};

const ACCENT_ICON: Record<MissionNodeShellProps["accent"], string> = {
  worker: "text-violet-300",
  task: "text-sky-300",
  model: "text-emerald-300",
  runtime: "text-amber-300",
  workspace: "text-white/50",
};

export const MissionNodeShell: React.FC<MissionNodeShellProps> = ({
  title,
  subtitle,
  status,
  statusLabel,
  icon,
  accent,
  selected,
  children,
  showSourceHandle = true,
  showTargetHandle = true,
  className,
}) => (
  <div
    className={cn(
      "w-[220px] rounded-2xl border bg-[#0d0d0f]/95 backdrop-blur transition",
      selected ? "border-violet-400/60 shadow-lg shadow-violet-500/10" : ACCENT_BORDER[accent],
      className,
    )}
  >
    {showTargetHandle ? (
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-white/30" />
    ) : null}

    <div className="flex items-start gap-2.5 p-3">
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5",
          ACCENT_ICON[accent],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          {status ? <StatusDot tone={status} title={statusLabel} /> : null}
        </div>
        {subtitle ? <p className="truncate text-[11px] text-white/40">{subtitle}</p> : null}
      </div>
    </div>

    {children ? <div className="border-t border-white/5 px-3 py-2">{children}</div> : null}

    {showSourceHandle ? (
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-white/30" />
    ) : null}
  </div>
);

export default MissionNodeShell;

/** NodeProps-agnostic wrapper so reactflow's injected props stay out of the UI. */
export type MissionNodeComponent<P = Record<string, unknown>> = React.FC<NodeProps<P>>;
