// src/services/agentos/workers.ts
//
// Digital worker lifecycle.
//
// Every function returns AgentOSResult<T> and never throws on an expected
// failure (validation, not-found, forbidden). All queries go through the
// canonical Clerk-authenticated Supabase client, so RLS is the security
// boundary — this file cannot read or write another tenant's rows even by
// mistake.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type Worker,
  type WorkerStatus,
  type WorkerTool,
} from "../../types/agentos";

const WORKER_COLUMNS = "*";

const REQUIRED_NAME_MESSAGE = "Give the worker a name";

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

export interface CreateWorkerInput {
  name: string;
  role?: string;
  instructions?: string;
  goals?: string;
  workspace_id?: string | null;
  model_provider?: string;
  model_id?: string;
  fallback_provider?: string | null;
  fallback_model_id?: string | null;
  temperature?: number;
  max_output_tokens?: number;
  tools?: Array<{ tool_key: string; enabled?: boolean; config?: Record<string, unknown> }>;
  memory_enabled?: boolean;
  permissions?: Record<string, unknown>;
  heartbeat?: Record<string, unknown>;
  accent?: string;
}

export interface UpdateWorkerInput {
  name?: string;
  role?: string;
  instructions?: string;
  goals?: string;
  accent?: string;
  status?: WorkerStatus;
  /**
   * Set to null to bring an archived worker back into the default lists.
   * The archive flag is a separate column from the status, so clearing it is
   * the only way to un-hide a worker that was archived.
   */
  archived_at?: string | null;
  model_provider?: string;
  model_id?: string;
  fallback_provider?: string | null;
  fallback_model_id?: string | null;
  temperature?: number;
  max_output_tokens?: number;
  memory_enabled?: boolean;
  permissions?: Record<string, unknown>;
  heartbeat?: Record<string, unknown>;
  knowledge?: Array<{ name: string; kind: string; ref?: string }>;
}

/** List workers the caller owns or can see through workspace membership. */
export async function listWorkers(options: {
  includeArchived?: boolean;
  workspaceId?: string;
} = {}): Promise<AgentOSResult<Worker[]>> {
  let query = agentosDb.from("workers").select(WORKER_COLUMNS);

  if (options.workspaceId) query = query.eq("workspace_id", options.workspaceId);
  if (!options.includeArchived) query = query.is("archived_at", null);

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return err("database", "Could not load workers", agentosErrorMessage(error));
  return ok((data ?? []) as Worker[]);
}

export async function getWorker(workerId: string): Promise<AgentOSResult<Worker>> {
  if (!workerId) return err("validation", "workerId is required");

  const { data, error } = await agentosDb
    .from("workers")
    .select(WORKER_COLUMNS)
    .eq("id", workerId)
    .maybeSingle();

  if (error) return err("database", "Could not load worker", agentosErrorMessage(error));
  if (!data) return err("not_found", "Worker not found");
  return ok(data as Worker);
}

/**
 * Create a worker and its tool assignments in one flow. The owner stamp comes
 * from the BEFORE INSERT trigger (verified JWT); we do not send owner_clerk_id.
 */
export async function createWorker(input: CreateWorkerInput): Promise<AgentOSResult<Worker>> {
  if (isBlank(input.name)) return err("validation", REQUIRED_NAME_MESSAGE);

  if (typeof input.temperature === "number" && (input.temperature < 0 || input.temperature > 2)) {
    return err("validation", "Temperature must be between 0 and 2");
  }

  const { data: created, error } = await agentosDb
    .from("workers")
    .insert({
      name: input.name.trim(),
      role: input.role ?? "",
      instructions: input.instructions ?? "",
      goals: input.goals ?? "",
      workspace_id: input.workspace_id ?? null,
      model_provider: input.model_provider ?? "openai",
      model_id: input.model_id ?? "gpt-4o-mini",
      fallback_provider: input.fallback_provider ?? null,
      fallback_model_id: input.fallback_model_id ?? null,
      temperature: input.temperature ?? 0.7,
      max_output_tokens: input.max_output_tokens ?? 2048,
      memory_enabled: input.memory_enabled ?? true,
      permissions: input.permissions ?? {},
      heartbeat: input.heartbeat ?? { enabled: false },
      accent: input.accent ?? "violet",
      status: "active",
    })
    .select(WORKER_COLUMNS)
    .single();

  if (error) return err("database", "Could not create worker", agentosErrorMessage(error));

  const worker = created as Worker;

  if (input.tools && input.tools.length > 0) {
    await replaceWorkerTools(worker.id, input.tools);
  }

  return ok(worker);
}

/** Replace the worker's tool assignments (assign/remove in one call). */
export async function replaceWorkerTools(
  workerId: string,
  tools: Array<{ tool_key: string; enabled?: boolean; config?: Record<string, unknown> }>,
): Promise<AgentOSResult<WorkerTool[]>> {
  if (!workerId) return err("validation", "workerId is required");
  if (!Array.isArray(tools)) return err("validation", "tools must be an array");

  const { error: deleteError } = await agentosDb.from("worker_tools").delete().eq("worker_id", workerId);
  if (deleteError) return err("database", "Could not reset worker tools", agentosErrorMessage(deleteError));

  if (tools.length === 0) return ok([]);

  const rows = tools.map((tool) => ({
    worker_id: workerId,
    tool_key: tool.tool_key,
    enabled: tool.enabled ?? true,
    config: tool.config ?? {},
  }));

  const { data, error } = await agentosDb.from("worker_tools").insert(rows).select("*");
  if (error) return err("database", "Could not assign worker tools", agentosErrorMessage(error));
  return ok((data ?? []) as WorkerTool[]);
}

export async function listWorkerTools(workerId: string): Promise<AgentOSResult<WorkerTool[]>> {
  if (!workerId) return err("validation", "workerId is required");
  const { data, error } = await agentosDb
    .from("worker_tools")
    .select("*")
    .eq("worker_id", workerId)
    .order("tool_key", { ascending: true });
  if (error) return err("database", "Could not load worker tools", agentosErrorMessage(error));
  return ok((data ?? []) as WorkerTool[]);
}

export async function updateWorker(
  workerId: string,
  input: UpdateWorkerInput,
): Promise<AgentOSResult<Worker>> {
  if (!workerId) return err("validation", "workerId is required");
  if (input.name !== undefined && isBlank(input.name)) {
    return err("validation", REQUIRED_NAME_MESSAGE);
  }
  if (typeof input.temperature === "number" && (input.temperature < 0 || input.temperature > 2)) {
    return err("validation", "Temperature must be between 0 and 2");
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.role !== undefined) patch.role = input.role;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.goals !== undefined) patch.goals = input.goals;
  if (input.accent !== undefined) patch.accent = input.accent;
  if (input.status !== undefined) patch.status = input.status;
  // `null` is a meaningful value here: it clears archived_at, which is the
  // only way an archived worker becomes visible again.
  if (input.archived_at !== undefined) patch.archived_at = input.archived_at;
  if (input.model_provider !== undefined) patch.model_provider = input.model_provider;
  if (input.model_id !== undefined) patch.model_id = input.model_id;
  if (input.fallback_provider !== undefined) patch.fallback_provider = input.fallback_provider;
  if (input.fallback_model_id !== undefined) patch.fallback_model_id = input.fallback_model_id;
  if (input.temperature !== undefined) patch.temperature = input.temperature;
  if (input.max_output_tokens !== undefined) patch.max_output_tokens = input.max_output_tokens;
  if (input.memory_enabled !== undefined) patch.memory_enabled = input.memory_enabled;
  if (input.permissions !== undefined) patch.permissions = input.permissions;
  if (input.heartbeat !== undefined) patch.heartbeat = input.heartbeat;
  if (input.knowledge !== undefined) patch.knowledge = input.knowledge;

  const { data, error } = await agentosDb
    .from("workers")
    .update(patch)
    .eq("id", workerId)
    .select(WORKER_COLUMNS)
    .single();

  if (error) return err("database", "Could not update worker", agentosErrorMessage(error));
  return ok(data as Worker);
}

/** Pause / resume / archive / reactivate a worker. */
export async function setWorkerStatus(
  workerId: string,
  status: WorkerStatus,
): Promise<AgentOSResult<Worker>> {
  if (!workerId) return err("validation", "workerId is required");

  const { data: current } = await agentosDb
    .from("workers")
    .select("status, archived_at")
    .eq("id", workerId)
    .maybeSingle();

  if (!current) return err("not_found", "Worker not found");

  // Reactivating from archive clears archived_at so hidden rows stay hidden.
  const patch: Record<string, unknown> = { status };
  if (status === "archived") {
    patch.archived_at = new Date().toISOString();
  } else if (current.archived_at) {
    patch.archived_at = null;
  }

  const { data, error } = await agentosDb
    .from("workers")
    .update(patch)
    .eq("id", workerId)
    .select(WORKER_COLUMNS)
    .single();

  if (error) return err("database", "Could not change worker status", agentosErrorMessage(error));
  return ok(data as Worker);
}

/**
 * Deep-copy a worker and its tool assignments. Identity, timestamps and
 * ownership are regenerated by the database; only configuration is copied.
 */
export async function cloneWorker(workerId: string, overrides: { name?: string } = {}): Promise<AgentOSResult<Worker>> {
  if (!workerId) return err("validation", "workerId is required");

  const source = await getWorker(workerId);
  if (source.error || !source.data) return source;

  const original = source.data;
  const name = overrides.name?.trim() || `${original.name} (copy)`;

  const { data: created, error } = await agentosDb
    .from("workers")
    .insert({
      owner_clerk_id: original.owner_clerk_id,
      workspace_id: original.workspace_id,
      name,
      role: original.role,
      accent: original.accent,
      instructions: original.instructions,
      goals: original.goals,
      status: "active",
      model_provider: original.model_provider,
      model_id: original.model_id,
      fallback_provider: original.fallback_provider,
      fallback_model_id: original.fallback_model_id,
      temperature: original.temperature,
      max_output_tokens: original.max_output_tokens,
      tools: original.tools,
      knowledge: original.knowledge,
      memory_enabled: original.memory_enabled,
      permissions: original.permissions,
      heartbeat: original.heartbeat,
      cloned_from: original.id,
    })
    .select(WORKER_COLUMNS)
    .single();

  if (error) return err("database", "Could not clone worker", agentosErrorMessage(error));

  const worker = created as Worker;

  const tools = await listWorkerTools(workerId);
  if (tools.data && tools.data.length > 0) {
    await replaceWorkerTools(
      worker.id,
      tools.data.map((tool) => ({ tool_key: tool.tool_key, enabled: tool.enabled, config: tool.config })),
    );
  }

  return ok(worker);
}

/** Hard delete. Callers must confirm first; there is no undo. */
export async function deleteWorker(workerId: string): Promise<AgentOSResult<{ id: string }>> {
  if (!workerId) return err("validation", "workerId is required");

  const { error } = await agentosDb.from("workers").delete().eq("id", workerId);
  if (error) return err("database", "Could not delete worker", agentosErrorMessage(error));
  return ok({ id: workerId });
}
