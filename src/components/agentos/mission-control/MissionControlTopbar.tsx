// src/components/agentos/mission-control/MissionControlTopbar.tsx
//
// The workspace bar that floats over the Mission Control canvas, below the
// dashboard topbar: the workspace switcher, a live summary, and the search
// pill that opens the command bar.

import { Link } from "react-router-dom";
import { Bot, Boxes, Search, ShieldAlert, Waypoints } from "lucide-react";
import type { Workspace } from "../../../types/agentos";

export interface MissionControlTopbarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onOpenCommandBar: () => void;
  pendingApprovals?: number;
  counts?: { workers: number; workspaces: number; missions: number };
}

export const MissionControlTopbar: React.FC<MissionControlTopbarProps> = ({
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  onOpenCommandBar,
  pendingApprovals = 0,
  counts,
}) => (
  <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
    <div className="agentos-panel pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl p-1.5">
      <label className="sr-only" htmlFor="workspace-switcher">
        Workspace
      </label>
      <div className="flex items-center gap-1.5 rounded-xl px-2">
        <Boxes className="h-3.5 w-3.5 shrink-0 text-agentos-accent" aria-hidden="true" />
        <select
          id="workspace-switcher"
          value={activeWorkspaceId ?? ""}
          onChange={(event) => onWorkspaceChange(event.target.value || null)}
          className="max-w-[160px] cursor-pointer bg-transparent py-1 text-xs font-medium text-white outline-none"
        >
          <option value="">All workspaces</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      {counts ? (
        <div className="hidden items-center gap-3 border-l border-white/10 px-3 text-[11px] text-white/55 sm:flex">
          <span className="flex items-center gap-1">
            <Bot className="h-3.5 w-3.5 text-agentos-brand" aria-hidden="true" />
            <span className="tabular-nums text-white">{counts.workers}</span> agents
          </span>
          <span className="flex items-center gap-1">
            <Waypoints className="h-3.5 w-3.5 text-agentos-accent" aria-hidden="true" />
            <span className="tabular-nums text-white">{counts.missions}</span> missions
          </span>
        </div>
      ) : null}

      {pendingApprovals > 0 ? (
        <Link
          to="/dashboard/approvals"
          className="flex shrink-0 items-center gap-1 rounded-xl bg-agentos-brand/15 px-2.5 py-1.5 text-[11px] font-medium text-agentos-brand-soft hover:bg-agentos-brand/25"
        >
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {pendingApprovals} awaiting you
        </Link>
      ) : null}

      <button
        type="button"
        onClick={onOpenCommandBar}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:text-white"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Search or instruct an agent</span>
        <span className="sm:hidden">Search</span>
      </button>
    </div>
  </div>
);

export default MissionControlTopbar;
