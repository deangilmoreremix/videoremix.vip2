// src/components/agentos/mission-control/nodes/ModelNode.tsx
//
// Canvas node for a routable model in the catalog.

import { Cpu } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";

export interface ModelNodeData {
  modelId: string;
  title: string;
  provider: string;
  contextWindow: number;
  rateIn: number;
  rateOut: number;
}

export const ModelNode: React.FC<NodeProps<ModelNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title={data.title}
    subtitle={data.provider}
    accent="model"
    icon={<Cpu className="h-4 w-4" aria-hidden="true" />}
    selected={selected}
  >
    <div className="flex flex-wrap gap-1.5">
      <Pill tone="sky">{data.modelId}</Pill>
      <Pill tone="slate">{data.contextWindow.toLocaleString()} ctx</Pill>
      <Pill tone="emerald">
        {data.rateIn}/{data.rateOut}
      </Pill>
    </div>
  </MissionNodeShell>
);

export default ModelNode;
