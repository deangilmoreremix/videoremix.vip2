// src/components/agentos/mission-control/nodes/WorkerNode.tsx
//
// Canvas node for a digital worker.

import { Bot } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";
import type { StatusTone } from "../../ui/statusTone";

export interface WorkerNodeData {
  workerId: string;
  name: string;
  role: string;
  model: string;
  status: string;
}

const WORKER_TONE: Record<string, StatusTone> = {
  draft: "idle",
  active: "active",
  paused: "warn",
  archived: "neutral",
};

export const WorkerNode: React.FC<NodeProps<WorkerNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title={data.name}
    subtitle={data.role || "no role"}
    accent="worker"
    icon={<Bot className="h-4 w-4" aria-hidden="true" />}
    status={WORKER_TONE[data.status] ?? "neutral"}
    statusLabel={data.status}
    selected={selected}
  >
    <div className="flex flex-wrap gap-1.5">
      <Pill tone="violet">{data.model}</Pill>
      <Pill tone={data.status === "active" ? "emerald" : "slate"}>{data.status}</Pill>
    </div>
  </MissionNodeShell>
);

export default WorkerNode;
