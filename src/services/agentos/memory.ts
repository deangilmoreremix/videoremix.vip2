// src/services/agentos/memory.ts
//
// Durable memory and context.
//
// RETRIEVAL IS THE RUNTIME'S JOB
//   Write and edit operations live here because they are plain, RLS-gated CRUD.
//   Search is included for the UI, but it is a *preview* ranking, not the
//   retrieval path: at execution time the runtime assembles context from
//   worker identity + task + top-K memories (importance × recency, keyword when
//   the pgvector `embedding` column is absent). See
//   supabase/functions/_shared/agentos-runtime.ts:assemblePrompt().

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type MemoryKind,
  type MemoryScope,
  type WorkerMemory,
} from "../../types/agentos";

export interface CreateMemoryInput {
  content: string;
  kind?: MemoryKind;
  scope: MemoryScope;
  worker_id?: string;
  workspace_id?: string;
  importance?: number;
  tags?: string[];
  source?: string;
}

export async function listMemories(options: {
  workerId?: string;
  workspaceId?: string;
  kind?: MemoryKind;
  limit?: number;
} = {}): Promise<AgentOSResult<WorkerMemory[]>> {
  let query = agentosDb
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 200);

  if (options.workerId) query = query.eq("worker_id", options.workerId);
  if (options.workspaceId) query = query.eq("workspace_id", options.workspaceId);
  if (options.kind) query = query.eq("kind", options.kind);

  const { data, error } = await query;
  if (error) return err("database", "Could not load memory", agentosErrorMessage(error));
  return ok((data ?? []) as WorkerMemory[]);
}

export async function getMemory(memoryId: string): Promise<AgentOSResult<WorkerMemory>> {
  if (!memoryId) return err("validation", "memoryId is required");

  const { data, error } = await agentosDb
    .from("memories")
    .select("*")
    .eq("id", memoryId)
    .maybeSingle();

  if (error) return err("database", "Could not load memory entry", agentosErrorMessage(error));
  if (!data) return err("not_found", "Memory entry not found");
  return ok(data as WorkerMemory);
}

export async function createMemory(input: CreateMemoryInput): Promise<AgentOSResult<WorkerMemory>> {
  if (!input.content || !input.content.trim()) {
    return err("validation", "Add the content of this memory");
  }
  if (input.scope === "worker" && !input.worker_id) {
    return err("validation", "worker_id is required for worker-scoped memory");
  }
  if (input.scope === "workspace" && !input.workspace_id) {
    return err("validation", "workspace_id is required for workspace-scoped memory");
  }

  const { data, error } = await agentosDb
    .from("memories")
    .insert({
      content: input.content.trim(),
      kind: input.kind ?? "note",
      scope: input.scope,
      worker_id: input.worker_id ?? null,
      workspace_id: input.workspace_id ?? null,
      importance: input.importance ?? 3,
      tags: input.tags ?? [],
      source: input.source ?? "manual",
    })
    .select("*")
    .single();

  if (error) return err("database", "Could not save memory", agentosErrorMessage(error));
  return ok(data as WorkerMemory);
}

export interface UpdateMemoryInput {
  content?: string;
  kind?: MemoryKind;
  importance?: number;
  tags?: string[];
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
): Promise<AgentOSResult<WorkerMemory>> {
  if (!memoryId) return err("validation", "memoryId is required");
  if (input.content !== undefined && input.content.trim().length === 0) {
    return err("validation", "Memory content cannot be empty");
  }

  const patch: Record<string, unknown> = {};
  if (input.content !== undefined) patch.content = input.content.trim();
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.importance !== undefined) patch.importance = input.importance;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data, error } = await agentosDb
    .from("memories")
    .update(patch)
    .eq("id", memoryId)
    .select("*")
    .single();

  if (error) return err("database", "Could not update memory", agentosErrorMessage(error));
  return ok(data as WorkerMemory);
}

export async function deleteMemory(memoryId: string): Promise<AgentOSResult<{ id: string }>> {
  if (!memoryId) return err("validation", "memoryId is required");

  const { error } = await agentosDb.from("memories").delete().eq("id", memoryId);
  if (error) return err("database", "Could not delete memory", agentosErrorMessage(error));
  return ok({ id: memoryId });
}

export interface MemorySearchResult extends WorkerMemory {
  /** Preview relevance score. Not used by the runtime. */
  score: number;
}

/**
 * UI-side memory search: keyword filter, then a deterministic score of
 * importance (×2), recency, and hit history. The runtime performs the real
 * retrieval with the same ordering; this exists so the memory page can show a
 * ranked list without a backend round trip.
 */
export async function searchMemories(params: {
  query?: string;
  workerId?: string;
  workspaceId?: string;
  kind?: MemoryKind;
  importanceMin?: number;
  limit?: number;
} = {}): Promise<AgentOSResult<MemorySearchResult[]>> {
  const rows = await listMemories({
    workerId: params.workerId,
    workspaceId: params.workspaceId,
    kind: params.kind,
  });
  if (rows.error || !rows.data) {
    return err(
      "database",
      rows.error?.message ?? "Could not load memory",
      rows.error?.detail,
    );
  }

  const importanceMin = params.importanceMin ?? 1;
  const needle = (params.query ?? "").trim().toLowerCase();

  const scored = rows.data
    .filter((row) => row.importance >= importanceMin)
    .map((row) => {
      const content = row.content.toLowerCase();
      const keywordScore = needle
        ? content.includes(needle)
          ? 3
          : (row.tags ?? []).some((tag) => tag.toLowerCase().includes(needle))
            ? 1
            : 0
        : 0;

      // When a query is present, drop non-matching rows rather than padding the
      // list with unrelated memories.
      if (needle && keywordScore === 0) return null;

      const ageDays = row.last_used_at
        ? Math.max(0, (Date.now() - new Date(row.last_used_at).getTime()) / 86_400_000)
        : 30;
      const recencyScore = Math.max(0, 2 - ageDays / 30);
      const hitScore = Math.min(1, row.hit_count / 10);

      return {
        ...row,
        score: keywordScore * 3 + row.importance * 0.5 + recencyScore + hitScore,
      };
    })
    .filter((row): row is MemorySearchResult => row !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 50);

  return ok(scored);
}

/**
 * Record that a memory was used, so recency ranking can improve over time.
 * Best-effort: a failed counter must never break an execution.
 */
export async function touchMemory(memoryId: string): Promise<AgentOSResult<null>> {
  if (!memoryId) return err("validation", "memoryId is required");

  const { error } = await agentosDb.rpc("increment_memory_hit", { p_memory_id: memoryId });
  if (error) return err("database", "Could not update memory usage", agentosErrorMessage(error));
  return ok(null);
}
