// src/components/agentos/mission-control/MissionConnectionEdge.tsx
//
// Animated bezier edge for handoffs and assignments.

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { cn } from "../../../lib/utils";

const KIND_COLOUR = {
  handoff: "#a78bfa",
  dependency: "#38bdf8",
  assignment: "#34d399",
  data: "#fbbf24",
} as const;

export const MissionConnectionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
  style,
}) => {
  const kind = (data?.edge_kind ?? "handoff") as keyof typeof KIND_COLOUR;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const colour = KIND_COLOUR[kind] ?? KIND_COLOUR.handoff;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: colour,
          strokeWidth: 2,
          strokeDasharray: data?.animated === false ? undefined : "6 4",
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <span
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            )}
            style={{
              left: labelX,
              top: labelY,
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: `${colour}55`,
              background: "rgba(13,13,15,0.9)",
              color: colour,
            }}
          >
            {String(label)}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
};

export default MissionConnectionEdge;
