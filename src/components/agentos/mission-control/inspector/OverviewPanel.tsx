// src/components/agentos/mission-control/inspector/OverviewPanel.tsx
//
// Shown when nothing on the canvas is selected: a summary of the real estate
// the user owns, so the inspector is never blank.

import { useNavigate } from "react-router-dom";
import { Bot, FolderKanban, ListChecks } from "lucide-react";
import { Button } from "../../../ui/button";
import { Section } from "../../ui";

export interface OverviewPanelProps {
  workerCount?: number;
  workspaceCount?: number;
  missionCount?: number;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  workerCount = 0,
  workspaceCount = 0,
  missionCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <Section title="Your workspace" description="What the canvas is showing you.">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Bot className="h-4 w-4 text-violet-300" aria-hidden="true" />
            <dt className="flex-1 text-white/60">Workers</dt>
            <dd className="tabular-nums text-white">{workerCount}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <FolderKanban className="h-4 w-4 text-white/50" aria-hidden="true" />
            <dt className="flex-1 text-white/60">Workspaces</dt>
            <dd className="tabular-nums text-white">{workspaceCount}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <ListChecks className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <dt className="flex-1 text-white/60">Missions</dt>
            <dd className="tabular-nums text-white">{missionCount}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/agentos/workforce/new")}>
            New worker
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/agentos/missions/new")}>
            New mission
          </Button>
        </div>
      </Section>

      <p className="px-1 text-xs text-white/35">
        Select a node on the canvas to inspect it. Drag nodes to rearrange; positions save
        automatically.
      </p>
    </div>
  );
};

export default OverviewPanel;
