// src/components/agentos/mission-control/MissionControlTopbar.tsx
//
// Top bar for the AgentOS shell: workspace switcher over the user's real
// workspaces, command-palette trigger, and a link back to the dashboard.

import { useNavigate } from "react-router-dom";
import { Command, LayoutDashboard, Search } from "lucide-react";
import type { Workspace } from "../../../types/agentos";

export interface MissionControlTopbarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onOpenCommandBar: () => void;
}

export const MissionControlTopbar: React.FC<MissionControlTopbarProps> = ({
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  onOpenCommandBar,
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b0b0d] px-4">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-4 w-4 text-violet-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-white">Mission Control</span>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center">
        <button
          type="button"
          onClick={onOpenCommandBar}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-left text-sm text-white/35 transition hover:border-white/20"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Search workers, missions, tasks…
          <span className="ml-auto flex items-center gap-0.5 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
            <Command className="h-2.5 w-2.5" aria-hidden="true" />K
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="workspace-switcher">
          Workspace
        </label>
        <select
          id="workspace-switcher"
          value={activeWorkspaceId ?? ""}
          onChange={(event) => onWorkspaceChange(event.target.value || null)}
          className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white/70"
        >
          <option value="">All workspaces</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-white/55 hover:bg-white/5"
        >
          Dashboard
        </button>
      </div>
    </header>
  );
};

export default MissionControlTopbar;
