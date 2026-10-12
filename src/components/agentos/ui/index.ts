// src/components/agentos/ui/index.ts
//
// Barrel for the shared AgentOS UI kit. Every AgentOS surface imports from
// here so the vocabulary stays small.

export { Pill, type PillTone } from "./Pill";
export { StatusDot } from "./StatusDot";
export { Spinner } from "./Spinner";
export { EmptyState } from "./EmptyState";
export { PageHeader } from "./PageHeader";
export { Section } from "./Section";
export { Stat } from "./Stat";
export { Modal } from "./Modal";
export {
  DOT_CLASS,
  TASK_STATUS_STYLE,
  WORKER_STATUS_STYLE,
  RUN_STATUS_STYLE,
  MISSION_STATUS_STYLE,
  APPROVAL_STATUS_STYLE,
  isTerminalTaskStatus,
  isLiveTaskStatus,
  type StatusTone,
} from "./statusTone";
