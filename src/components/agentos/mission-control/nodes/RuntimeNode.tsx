// src/components/agentos/mission-control/nodes/RuntimeNode.tsx
//
// Canvas node for the execution runtime, anchored to the most recent run so the
// canvas shows what actually executed rather than a placeholder.

import { Activity } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";
import type { StatusTone } from "../../ui/statusTone";

export interface RuntimeNodeData {
  runId: string | null;
  status: string;
  model: string | null;
}

const RUN_TONE: Record<string, StatusTone> = {
  running: "running",
  succeeded: "success",
  failed: "error",
  cancelled: "neutral",
  timeout: "error",
};

export const RuntimeNode: React.FC<NodeProps<RuntimeNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title="Execution runtime"
    subtitle={data.runId ? `run ${data.runId.slice(0, 8)}` : "no runs yet"}
    accent="runtime"
    icon={<Activity className="h-4 w-4" aria-hidden="true" />}
    status={RUN_TONE[data.status] ?? "neutral"}
    statusLabel={data.status}
    selected={selected}
  >
    <div className="flex flex-wrap gap-1.5">
      <Pill tone={data.status === "succeeded" ? "emerald" : "slate"}>{data.status}</Pill>
      {data.model ? <Pill tone="sky">{data.model}</Pill> : null}
    </div>
  </MissionNodeShell>
);

export default RuntimeNode;
