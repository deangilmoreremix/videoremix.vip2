// src/components/agentos/mission-control/nodes/WorkspaceNode.tsx
//
// Canvas node for a workspace (the shared context a team of workers runs in).

import { FolderKanban } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";

export interface WorkspaceNodeData {
  workspaceId: string;
  name: string;
  workerCount: number;
}

export const WorkspaceNode: React.FC<NodeProps<WorkspaceNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title={data.name}
    subtitle="workspace"
    accent="workspace"
    icon={<FolderKanban className="h-4 w-4" aria-hidden="true" />}
    status="active"
    selected={selected}
  >
    <Pill tone="slate">
      {data.workerCount} worker{data.workerCount === 1 ? "" : "s"}
    </Pill>
  </MissionNodeShell>
);

export default WorkspaceNode;
