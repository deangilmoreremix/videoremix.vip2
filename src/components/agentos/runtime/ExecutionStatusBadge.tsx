// src/components/agentos/runtime/ExecutionStatusBadge.tsx
//
// Task / run status pill. Colour and label come from statusTone.ts so this badge
// and the canvas nodes can never disagree about what 'running' means.

import type { TaskStatus, RunStatus } from "../../../types/agentos";
import { Pill } from "../ui";
import { RUN_STATUS_STYLE, TASK_STATUS_STYLE } from "../ui";

export interface ExecutionStatusBadgeProps {
  status: TaskStatus | RunStatus;
}

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({ status }) => {
  const style =
    status in TASK_STATUS_STYLE
      ? TASK_STATUS_STYLE[status as TaskStatus]
      : RUN_STATUS_STYLE[status as RunStatus];

  return <Pill tone={style.pill}>{style.label}</Pill>;
};

export default ExecutionStatusBadge;
