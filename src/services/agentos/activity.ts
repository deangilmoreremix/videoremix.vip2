// src/services/agentos/activity.ts
//
// The activity stream: what happened, and who did it.
//
// TWO SOURCES, ONE TIMELINE
//   agentos.audit_logs   the mutating-action trail (actor attributed)
//   agentos.execution_events  the runtime transcript of every run
//   They answer different questions, so the surface shows both. listActivityFeed()
//   merges them into a single newest-first stream, tagging each entry with the
//   table it came from.
//
// WHERE THE AUDIT ROWS COME FROM
//   The audit trail is written by the database: the agentos_audit_row_change
//   trigger (supabase/migrations/20261012121300_agentos_writers.sql) records
//   an actor-attributed row for every mutation that matters, with the changed
//   columns only. The execution events are written by the runtime. The two
//   answer different questions, so the page shows both.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type ActivityEntry,
  type ActivitySource,
  type AgentOSResult,
  type AuditLog,
  type ExecutionEvent,
} from "../../types/agentos";

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 200;

export interface ActivityListOptions {
  /** The Clerk user id of the actor. */
  actorId?: string;
  entityType?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityEventListOptions {
  /** The Clerk user id that owns the execution the event belongs to. */
  actorId?: string;
  kind?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityFeedOptions extends ActivityListOptions {
  /** Which source to read. "all" merges both. */
  source?: ActivitySource | "all";
  /**
   * The execution event kind. Applied to the event source only — the audit
   * trail is filtered by `action` and `entityType` instead, because those
   * columns do not exist on agentos.execution_events.
   */
  kind?: string;
}

export interface ActivityPage {
  /** The entries in the requested window, newest first. */
  items: ActivityEntry[];
  /** True when more entries exist past this window. */
  hasMore: boolean;
  limit: number;
  offset: number;
}

function clampLimit(limit: number | undefined): number {
  const value = limit ?? DEFAULT_LIMIT;
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(value), 1), MAX_LIMIT);
}

function clampOffset(offset: number | undefined): number {
  const value = offset ?? 0;
  if (!Number.isFinite(value)) return 0;
  return Math.max(Math.trunc(value), 0);
}

/** Project an audit row into the common activity shape. */
function toAuditEntry(row: AuditLog): ActivityEntry {
  return {
    id: row.id,
    source: "audit",
    kind: row.action,
    message: row.summary || row.action,
    actor_clerk_id: row.actor_clerk_id,
    acting_as: row.acting_as,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    worker_id: null,
    task_id: null,
    created_at: row.created_at,
  };
}

/**
 * Project an execution event into the common activity shape.
 *
 * The runtime writes these, so the actor is the owner of the execution and
 * the role is "system" — no human pressed the button at that moment.
 */
function toEventEntry(row: ExecutionEvent): ActivityEntry {
  return {
    id: row.id,
    source: "event",
    kind: row.kind,
    message: row.message || row.kind,
    actor_clerk_id: row.owner_clerk_id,
    acting_as: "system",
    entity_type: row.task_id ? "task" : row.worker_id ? "worker" : null,
    entity_id: row.task_id ?? row.worker_id ?? null,
    worker_id: row.worker_id,
    task_id: row.task_id,
    created_at: row.created_at,
  };
}

function newestFirst(left: ActivityEntry, right: ActivityEntry): number {
  if (left.created_at === right.created_at) return left.id < right.id ? -1 : 1;
  return left.created_at < right.created_at ? 1 : -1;
}

/**
 * Read the raw audit window: `offset + limit + 1` rows, newest first.
 *
 * WHY THE RAW WINDOW IS KEPT SEPARATE
 *   The merged feed needs each source from the very beginning of the stream,
 *   not from `offset`, so the raw rows are fetched here and the windowing
 *   happens in the caller that needs it.
 */
async function fetchAuditRows(
  options: ActivityListOptions,
): Promise<AgentOSResult<AuditLog[]>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  let query = agentosDb
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(offset + limit + 1);

  if (options.actorId) query = query.eq("actor_clerk_id", options.actorId);
  if (options.entityType) query = query.eq("entity_type", options.entityType);
  if (options.action) query = query.eq("action", options.action);

  const { data, error } = await query;
  if (error) return err("database", "Could not load the audit trail", agentosErrorMessage(error));

  return ok((data ?? []) as AuditLog[]);
}

/**
 * Read the raw execution-event window: `offset + limit + 1` rows, newest
 * first.
 */
async function fetchEventRows(
  options: ActivityEventListOptions,
): Promise<AgentOSResult<ExecutionEvent[]>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  let query = agentosDb
    .from("execution_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(offset + limit + 1);

  if (options.actorId) query = query.eq("owner_clerk_id", options.actorId);
  if (options.kind) query = query.eq("kind", options.kind);

  const { data, error } = await query;
  if (error) {
    return err("database", "Could not load execution activity", agentosErrorMessage(error));
  }

  return ok((data ?? []) as ExecutionEvent[]);
}

/**
 * The audit trail: every mutating action, newest first.
 */
export async function listActivity(
  options: ActivityListOptions = {},
): Promise<AgentOSResult<ActivityPage>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  const result = await fetchAuditRows({ ...options, limit, offset });
  if (result.error) return err("database", result.error.message, result.error.detail);

  const rows = result.data ?? [];
  const entries = rows.map(toAuditEntry);

  return ok({
    items: entries.slice(offset, offset + limit),
    hasMore: rows.length > offset + limit,
    limit,
    offset,
  });
}

/**
 * The execution transcript, newest first.
 */
export async function listActivityEvents(
  options: ActivityEventListOptions = {},
): Promise<AgentOSResult<ActivityPage>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  const result = await fetchEventRows({ ...options, limit, offset });
  if (result.error) return err("database", result.error.message, result.error.detail);

  const rows = result.data ?? [];
  const entries = rows.map(toEventEntry);

  return ok({
    items: entries.slice(offset, offset + limit),
    hasMore: rows.length > offset + limit,
    limit,
    offset,
  });
}

/**
 * The merged stream: audit trail and execution events in one timeline.
 *
 * WHY THE WINDOW IS FETCHED PER SOURCE
 *   A merge cannot be done in the database, so each source is read with the
 *   same window and the union is sorted. That is correct: an entry that is
 *   the 61st newest in its own table cannot be in the newest 61 of the
 *   union, because 61 entries of that table are newer than it.
 */
export async function listActivityFeed(
  options: ActivityFeedOptions = {},
): Promise<AgentOSResult<ActivityPage>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);
  const source = options.source ?? "all";

  if (source === "audit") {
    return listActivity({ ...options, limit, offset });
  }
  if (source === "event") {
    return listActivityEvents({ ...options, limit, offset });
  }

  const [auditResult, eventResult] = await Promise.all([
    fetchAuditRows({
      actorId: options.actorId,
      entityType: options.entityType,
      action: options.action,
      limit,
      offset,
    }),
    fetchEventRows({
      actorId: options.actorId,
      kind: options.kind,
      limit,
      offset,
    }),
  ]);

  if (auditResult.error) return err("database", auditResult.error.message, auditResult.error.detail);
  if (eventResult.error) return err("database", eventResult.error.message, eventResult.error.detail);

  const auditRows = auditResult.data ?? [];
  const eventRows = eventResult.data ?? [];
  const merged = [...auditRows.map(toAuditEntry), ...eventRows.map(toEventEntry)].sort(newestFirst);

  return ok({
    items: merged.slice(offset, offset + limit),
    hasMore:
      auditRows.length > offset + limit ||
      eventRows.length > offset + limit ||
      merged.length > offset + limit,
    limit,
    offset,
  });
}
