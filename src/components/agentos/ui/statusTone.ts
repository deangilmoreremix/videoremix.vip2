// src/components/agentos/ui/statusTone.ts
//
// Single source of truth for the status vocabulary of the AgentOS port.
//
// Every status shown anywhere in the UI maps through here, so a task status and
// a worker status never disagree about what colour 'running' means, and the
// operations cards group by the same values the database uses.

import type { PillTone } from "./Pill";
import type {
  ApprovalStatus,
  MissionStatus,
  RunStatus,
  TaskStatus,
  WorkerStatus,
} from "../../../types/agentos";

export type StatusTone =
  | "neutral"
  | "idle"
  | "active"
  | "running"
  | "warn"
  | "blocked"
  | "error"
  | "success";

export interface StatusStyle {
  tone: StatusTone;
  pill: PillTone;
  label: string;
}

const STYLE: Record<StatusTone, StatusStyle> = {
  neutral: { tone: "neutral", pill: "neutral", label: "unknown" },
  idle: { tone: "idle", pill: "slate", label: "idle" },
  active: { tone: "active", pill: "emerald", label: "active" },
  running: { tone: "running", pill: "sky", label: "running" },
  warn: { tone: "warn", pill: "amber", label: "waiting" },
  blocked: { tone: "blocked", pill: "amber", label: "blocked" },
  error: { tone: "error", pill: "rose", label: "failed" },
  success: { tone: "success", pill: "emerald", label: "done" },
};

/** Dot colours, keyed by the same tone names used above. */
export const DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-white/40",
  idle: "bg-white/30",
  active: "bg-emerald-400",
  running: "bg-sky-400 animate-pulse",
  warn: "bg-amber-400",
  blocked: "bg-amber-400",
  error: "bg-rose-400",
  success: "bg-emerald-400",
};

export const WORKER_STATUS_STYLE: Record<WorkerStatus, StatusStyle> = {
  draft: STYLE.idle,
  active: STYLE.active,
  paused: STYLE.warn,
  archived: STYLE.neutral,
};

export const TASK_STATUS_STYLE: Record<TaskStatus, StatusStyle> = {
  pending: STYLE.idle,
  blocked: STYLE.blocked,
  queued: STYLE.neutral,
  running: STYLE.running,
  waiting_approval: STYLE.warn,
  completed: STYLE.success,
  failed: STYLE.error,
  cancelled: STYLE.neutral,
};

export const RUN_STATUS_STYLE: Record<RunStatus, StatusStyle> = {
  running: STYLE.running,
  succeeded: STYLE.success,
  failed: STYLE.error,
  cancelled: STYLE.neutral,
  timeout: STYLE.error,
};

export const MISSION_STATUS_STYLE: Record<MissionStatus, StatusStyle> = {
  draft: STYLE.idle,
  planned: STYLE.neutral,
  active: STYLE.running,
  blocked: STYLE.blocked,
  completed: STYLE.success,
  failed: STYLE.error,
  cancelled: STYLE.neutral,
};

export const APPROVAL_STATUS_STYLE: Record<ApprovalStatus, StatusStyle> = {
  pending: STYLE.warn,
  approved: STYLE.success,
  rejected: STYLE.error,
  expired: STYLE.neutral,
  cancelled: STYLE.neutral,
};

/** A task status counts as terminal when the queue will never touch it again. */
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

/** A task that is consuming a lease right now. */
export function isLiveTaskStatus(status: TaskStatus): boolean {
  return status === "running" || status === "waiting_approval";
}
