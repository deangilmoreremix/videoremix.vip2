// src/services/agentos/missions.ts
//
// Mission and task-browser services.
//
// WRITES GO THROUGH THE EDGE FUNCTION
//   Creating a task is the one place the port deliberately does not insert a
//   task row from the browser: the agentos-tasks edge function calls the
//   queue RPCs (enqueue_task, and the dependency/handoff edge inserts), which
//   is the only sanctioned path because it owns lease and dependency
//   bookkeeping. The browser sends the intent, the server applies it.

import { supabase } from "../../utils/supabase";
import { agentosDb, agentosErrorMessage } from "./client";
import {
  type AgentOSError,
  err,
  ok,
  type AgentOSResult,
  type Mission,
  type MissionStatus,
  type Task,
  type TaskEdge,
} from "../../types/agentos";

/**
 * Map an edge function's error envelope onto the shared AgentOSError codes.
 *
 * The edge functions already speak the same vocabulary (unauthenticated /
 * forbidden / not_found / validation / conflict / unsupported / ...), so
 * discarding it and reporting "unknown" throws away the one thing the UI
 * needs: whether the user must sign in, cannot do this, or can retry.
 */
function mapServerCode(code: string | undefined): AgentOSError["code"] {
  switch (code) {
    case "unauthenticated":
      return "unauthenticated";
    case "forbidden":
      return "forbidden";
    case "not_found":
      return "not_found";
    case "validation":
      return "validation";
    case "conflict":
      return "conflict";
    case "unsupported":
      return "unsupported";
    default:
      return "unknown";
  }
}


const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "";

async function callAction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<AgentOSResult<T>> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    return err("unknown", `Could not reach ${functionName}`, error.message);
  }
  const envelope = data as { data?: T; error?: { code: string; message: string; detail?: string } };
  if (envelope?.error) {
    return err(
      mapServerCode(envelope.error.code),
      envelope.error.message,
      envelope.error.detail,
    );
  }
  return ok((envelope?.data ?? null) as T);
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export async function listMissions(options: {
  status?: MissionStatus;
  limit?: number;
} = {}): Promise<AgentOSResult<Mission[]>> {
  let query = agentosDb
    .from("missions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) return err("database", "Could not load missions", agentosErrorMessage(error));
  return ok((data ?? []) as Mission[]);
}

export async function getMission(missionId: string): Promise<AgentOSResult<Mission>> {
  if (!missionId) return err("validation", "missionId is required");

  const { data, error } = await agentosDb
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error) return err("database", "Could not load mission", agentosErrorMessage(error));
  if (!data) return err("not_found", "Mission not found");
  return ok(data as Mission);
}

export interface CreateMissionInput {
  title: string;
  goal?: string;
  description?: string;
  workspace_id?: string | null;
  priority?: number;
}

export async function createMission(input: CreateMissionInput): Promise<AgentOSResult<Mission>> {
  if (!input.title || !input.title.trim()) {
    return err("validation", "Give the mission a title");
  }

  const { data, error } = await agentosDb
    .from("missions")
    .insert({
      title: input.title.trim(),
      goal: input.goal ?? "",
      description: input.description ?? "",
      workspace_id: input.workspace_id ?? null,
      priority: input.priority ?? 5,
      status: "active",
    })
    .select("*")
    .single();

  if (error) return err("database", "Could not create mission", agentosErrorMessage(error));
  return ok(data as Mission);
}

export async function cancelMission(missionId: string): Promise<AgentOSResult<{ missionId: string; cancelledTasks: number }>> {
  if (!missionId) return err("validation", "missionId is required");

  const tasks = await listTasks({ missionId: missionId });
  if (tasks.error || !tasks.data) {
    return err("database", "Could not load mission tasks", tasks.error?.detail);
  }

  let cancelled = 0;
  for (const task of tasks.data) {
    if (task.status === "completed" || task.status === "cancelled" || task.status === "failed") {
      continue;
    }
    const result = await cancelTask(task.id);
    if (result.data) cancelled += 1;
  }

  const { data, error } = await agentosDb
    .from("missions")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", missionId)
    .select("id")
    .single();

  if (error) return err("database", "Could not cancel mission", agentosErrorMessage(error));

  return ok({ missionId: (data as { id: string }).id, cancelledTasks: cancelled });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigned_worker_id?: string | null;
  mission_id?: string | null;
  workspace_id?: string | null;
  priority?: number;
  trigger?: "manual" | "mission" | "schedule" | "handoff" | "api";
  input?: Record<string, unknown>;
  requires_approval?: boolean;
  run_after?: string;
  depends_on?: string[];
  handoff_to_task_id?: string | null;
}

export async function listTasks(options: {
  missionId?: string;
  status?: string;
  limit?: number;
} = {}): Promise<AgentOSResult<Task[]>> {
  let query = agentosDb
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 200);

  if (options.missionId) query = query.eq("mission_id", options.missionId);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) return err("database", "Could not load tasks", agentosErrorMessage(error));
  return ok((data ?? []) as Task[]);
}

export async function createTask(input: CreateTaskInput): Promise<AgentOSResult<Task>> {
  if (!input.title || !input.title.trim()) {
    return err("validation", "Give the task a title");
  }

  const response = await callAction<{ task: Task; queued_as: string }>("agentos-tasks", {
    action: "create",
    task: { ...input, title: input.title.trim() },
  });

  if (response.error || !response.data) {
    return err(response.error?.code ?? "unknown", response.error?.message ?? "Could not create task", response.error?.detail);
  }

  return ok(response.data.task);
}

/**
 * Attach a task to a mission.
 *
 * The task is created by the agentos-tasks edge function (the queue owns the
 * lifecycle), and the mission link is written afterwards: `mission_id` is one
 * of the five columns the browser is allowed to update on agentos.tasks.
 */
export async function attachTaskToMission(
  taskId: string,
  missionId: string,
): Promise<AgentOSResult<{ taskId: string; missionId: string }>> {
  if (!taskId) return err("validation", "taskId is required");
  if (!missionId) return err("validation", "missionId is required");

  const { error } = await agentosDb
    .from("tasks")
    .update({ mission_id: missionId })
    .eq("id", taskId);

  if (error) return err("database", "Could not attach the task to the mission", agentosErrorMessage(error));
  return ok({ taskId, missionId });
}

export async function cancelTask(taskId: string): Promise<AgentOSResult<{ status: string }>> {
  if (!taskId) return err("validation", "taskId is required");
  const response = await callAction<{ task_id: string; status: string }>("agentos-tasks", {
    action: "cancel",
    task_id: taskId,
  });
  if (response.error) return err(response.error.code, response.error.message, response.error.detail);
  return ok(response.data ?? { task_id: taskId, status: "cancelled" });
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: number;
  run_after?: string;
  mission_id?: string | null;
}

/**
 * Edit a task's metadata.
 *
 * WHY ONLY THESE COLUMNS
 *   The queue owns the lifecycle of a task: status, attempt, lease, output,
 *   error and the approval link are written by the queue RPCs, and the
 *   lockdown migration reduced the browser's UPDATE grant on agentos.tasks to
 *   exactly title, description, priority, run_after and mission_id. Sending
 *   anything else would be rejected by the database, so the service refuses
 *   it before the round trip.
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<AgentOSResult<Task>> {
  if (!taskId) return err("validation", "taskId is required");
  if (input.title !== undefined && input.title.trim().length === 0) {
    return err("validation", "Give the task a title");
  }
  if (input.priority !== undefined && (input.priority < 1 || input.priority > 10)) {
    return err("validation", "Priority must be between 1 and 10");
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.run_after !== undefined) patch.run_after = input.run_after;
  if (input.mission_id !== undefined) patch.mission_id = input.mission_id;

  if (Object.keys(patch).length === 0) {
    return err("validation", "Nothing to change");
  }

  const { data, error } = await agentosDb
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) return err("database", "Could not update the task", agentosErrorMessage(error));
  return ok(data as Task);
}

export async function retryTask(taskId: string): Promise<AgentOSResult<{ status: string }>> {
  if (!taskId) return err("validation", "taskId is required");
  const response = await callAction<{ task_id: string; status: string }>("agentos-tasks", {
    action: "retry",
    task_id: taskId,
  });
  if (response.error) return err(response.error.code, response.error.message, response.error.detail);
  return ok(response.data ?? { task_id: taskId, status: "queued" });
}

/** Trigger an immediate execution sweep for the current user's queued work. */
export async function runQueuedTasks(options: { limit?: number } = {}): Promise<AgentOSResult<{ claimed: number }>> {
  const response = await callAction<{ claimed: number }>("agentos-execute", {
    limit: options.limit ?? 1,
  });
  if (response.error || !response.data) {
    return err(response.error?.code ?? "unknown", response.error?.message ?? "Could not run tasks", response.error?.detail);
  }
  return ok(response.data);
}

// ---------------------------------------------------------------------------
// Dependency edges
// ---------------------------------------------------------------------------

export async function listTaskEdges(missionId: string): Promise<AgentOSResult<TaskEdge[]>> {
  if (!missionId) return err("validation", "missionId is required");

  const { data, error } = await agentosDb
    .from("task_edges")
    .select("task_id, waits_for, kind, created_at")
    .in(
      "task_id",
      (
        await agentosDb.from("tasks").select("id").eq("mission_id", missionId)
      ).data?.map((row: { id: string }) => row.id) ?? [],
    );

  if (error) return err("database", "Could not load task dependencies", agentosErrorMessage(error));
  return ok((data ?? []) as TaskEdge[]);
}

/**
 * Add a dependency. Rejects self-references and any edge that would create a
 * cycle, because the claim logic treats unmet dependencies as a hard gate.
 */
export async function addTaskEdge(params: {
  taskId: string;
  waitsFor: string;
  kind?: "depends_on" | "handoff";
}): Promise<AgentOSResult<{ task_id: string; waits_for: string }>> {
  if (!params.taskId || !params.waitsFor) {
    return err("validation", "taskId and waitsFor are required");
  }
  if (params.taskId === params.waitsFor) {
    return err("validation", "A task cannot depend on itself");
  }

  const wouldCycle = await createsCycle(params.taskId, params.waitsFor);
  if (wouldCycle) {
    return err("validation", "That dependency would create a cycle");
  }

  const { error } = await agentosDb.from("task_edges").insert({
    task_id: params.taskId,
    waits_for: params.waitsFor,
    kind: params.kind ?? "depends_on",
  });

  if (error) return err("database", "Could not add task dependency", agentosErrorMessage(error));
  return ok({ task_id: params.taskId, waits_for: params.waitsFor });
}

export async function removeTaskEdge(params: {
  taskId: string;
  waitsFor: string;
}): Promise<AgentOSResult<{ task_id: string; waits_for: string }>> {
  if (!params.taskId || !params.waitsFor) {
    return err("validation", "taskId and waitsFor are required");
  }

  const { error } = await agentosDb
    .from("task_edges")
    .delete()
    .eq("task_id", params.taskId)
    .eq("waits_for", params.waitsFor);

  if (error) return err("database", "Could not remove task dependency", agentosErrorMessage(error));
  return ok({ task_id: params.taskId, waits_for: params.waitsFor });
}

/** Depth-first reachability check over the caller's visible task graph. */
async function createsCycle(taskId: string, waitsFor: string): Promise<boolean> {
  const { data: edges } = await agentosDb.from("task_edges").select("task_id, waits_for");
  if (!edges || edges.length === 0) return false;

  const adjacency = new Map<string, string[]>();
  for (const edge of edges as Array<{ task_id: string; waits_for: string }>) {
    const list = adjacency.get(edge.task_id) ?? [];
    list.push(edge.waits_for);
    adjacency.set(edge.task_id, list);
  }

  // Would waitsFor eventually depend on taskId? If yes, adding the edge closes
  // a loop.
  const stack = [waitsFor];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }

  return false;
}

export const FUNCTIONS_URL = FUNCTIONS_BASE;
