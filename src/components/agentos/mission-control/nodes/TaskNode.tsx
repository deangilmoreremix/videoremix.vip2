// src/components/agentos/mission-control/nodes/TaskNode.tsx
//
// Canvas node for a mission / task group.

import { ListChecks } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";
import type { StatusTone } from "../../ui/statusTone";

export interface TaskNodeData {
  missionId: string;
  title: string;
  status: string;
  priority: number;
  taskCount: number;
}

const MISSION_TONE: Record<string, StatusTone> = {
  draft: "idle",
  planned: "neutral",
  active: "running",
  blocked: "blocked",
  completed: "success",
  failed: "error",
  cancelled: "neutral",
};

export const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title={data.title}
    subtitle={`${data.taskCount} task${data.taskCount === 1 ? "" : "s"}`}
    accent="task"
    icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
    status={MISSION_TONE[data.status] ?? "neutral"}
    statusLabel={data.status}
    selected={selected}
  >
    <div className="flex flex-wrap gap-1.5">
      <Pill tone={data.status === "active" ? "sky" : "slate"}>{data.status}</Pill>
      <Pill tone="slate">priority {data.priority}</Pill>
    </div>
  </MissionNodeShell>
);

export default TaskNode;
