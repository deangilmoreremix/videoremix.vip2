// src/services/agentos/runtime.ts
//
// Runtime reads for the browser: runs, the execution transcript, and event
// streams.
//
// Everything here is a read. Execution is triggered by
// missions.runQueuedTasks() (which calls the agentos-execute edge function) or
// by the scheduler sweep — never by writing run rows from the browser.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type ExecutionEvent,
  type ExecutionRun,
} from "../../types/agentos";

export async function listRuns(options: {
  workerId?: string;
  limit?: number;
} = {}): Promise<AgentOSResult<ExecutionRun[]>> {
  let query = agentosDb
    .from("execution_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.workerId) query = query.eq("worker_id", options.workerId);

  const { data, error } = await query;
  if (error) return err("database", "Could not load execution runs", agentosErrorMessage(error));
  return ok((data ?? []) as ExecutionRun[]);
}

export async function listRunEvents(runId: string): Promise<AgentOSResult<ExecutionEvent[]>> {
  if (!runId) return err("validation", "runId is required");

  const { data, error } = await agentosDb
    .from("execution_events")
    .select("*")
    .eq("run_id", runId)
    .order("seq", { ascending: true });

  if (error) return err("database", "Could not load execution events", agentosErrorMessage(error));
  return ok((data ?? []) as ExecutionEvent[]);
}

/** The execution transcript for a task, newest last. */
export async function listTaskEvents(taskId: string): Promise<AgentOSResult<ExecutionEvent[]>> {
  if (!taskId) return err("validation", "taskId is required");

  const { data, error } = await agentosDb
    .from("execution_events")
    .select("*")
    .eq("task_id", taskId)
    .order("seq", { ascending: true });

  if (error) return err("database", "Could not load task events", agentosErrorMessage(error));
  return ok((data ?? []) as ExecutionEvent[]);
}

/** Latest activity across the tenant, used by the live activity stream. */
export async function listRecentEvents(options: {
  limit?: number;
  since?: string;
} = {}): Promise<AgentOSResult<ExecutionEvent[]>> {
  let query = agentosDb
    .from("execution_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.since) query = query.gt("created_at", options.since);

  const { data, error } = await query;
  if (error) return err("database", "Could not load activity", agentosErrorMessage(error));
  return ok((data ?? []) as ExecutionEvent[]);
}

/** The most recent run for a task, so a page can show its live state. */
export async function getLatestRunForTask(taskId: string): Promise<AgentOSResult<ExecutionRun | null>> {
  if (!taskId) return err("validation", "taskId is required");

  const { data, error } = await agentosDb
    .from("execution_runs")
    .select("*")
    .eq("task_id", taskId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return err("database", "Could not load the latest run", agentosErrorMessage(error));
  return ok((data ?? null) as ExecutionRun | null);
}
