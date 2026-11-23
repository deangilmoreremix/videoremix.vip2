// src/components/agentos/mission-control/nodes/AppNode.tsx
//
// Canvas node for an app the workforce uses: by an agent, a mission step or a
// schedule (see canvas/appNodes.ts).

import { AppWindow } from "lucide-react";
import { Link } from "react-router-dom";
import type { NodeProps } from "reactflow";
import { Pill } from "../../ui";
import { MissionNodeShell } from "./MissionNodeShell";
import type { AppNodeData } from "../canvas/appNodes";

const titleCase = (value: string) =>
  value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const AppNode: React.FC<NodeProps<AppNodeData>> = ({ data, selected }) => (
  <MissionNodeShell
    title={data.name}
    subtitle={titleCase(data.category)}
    accent="app"
    icon={<AppWindow className="h-4 w-4" aria-hidden="true" />}
    status={data.running ? "running" : undefined}
    statusLabel={data.running ? "running now" : undefined}
    selected={selected}
    showSourceHandle={false}
  >
    <div className="flex flex-wrap items-center gap-1.5">
      {data.agentCount > 0 ? (
        <Pill tone="violet">
          {data.agentCount} agent{data.agentCount === 1 ? "" : "s"}
        </Pill>
      ) : null}
      {data.missionCount > 0 ? (
        <Pill tone="sky">
          {data.missionCount} mission{data.missionCount === 1 ? "" : "s"}
        </Pill>
      ) : null}
      {data.schedules.length > 0 ? (
        <Pill tone="emerald" title={data.schedules.join(", ")}>
          scheduled
        </Pill>
      ) : null}
      <Link
        to={`/dashboard/apps/${data.appSlug}`}
        className="nodrag ml-auto text-[11px] text-agentos-brand-soft hover:underline"
      >
        Open
      </Link>
    </div>
  </MissionNodeShell>
);

export default AppNode;
