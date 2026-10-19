// src/services/agentos/artifacts.ts
//
// Artifacts: the files, reports, and generated media an execution produced.
//
// WHY A PAGE OBJECT
//   The artifact list is unbounded — a long-lived tenant accumulates one row
//   per produced file — so the surface needs a window, not an array. The
//   service returns the rows for that window plus `hasMore`, which is what
//   lets the page render a "load more" control without a second count query.
//
// WHY NOT .range()
//   The AgentOS test harness (tests/agentos/harness.ts) models limit() but
//   not range(), so the window is fetched with limit(offset + limit + 1) and
//   sliced here. The one extra row is exactly how `hasMore` is known.
//
// WHY TOTALS ARE COMPUTED IN THE BROWSER
//   PostgREST has no aggregate endpoint, so a total cannot be summed by the
//   database. summarizeArtifacts() reads the bounded recent window and
//   aggregates it in the browser, and says so in its hint so the number is
//   never mistaken for a full-tenant figure.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type Artifact,
  type ArtifactKind,
} from "../../types/agentos";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;

/** How many artifacts summarizeArtifacts() reads when it aggregates totals. */
const SUMMARY_WINDOW = 1000;

export interface ArtifactListOptions {
  workerId?: string;
  taskId?: string;
  runId?: string;
  kind?: ArtifactKind;
  limit?: number;
  offset?: number;
}

export interface ArtifactPage {
  /** The artifacts inside the requested window, newest first. */
  items: Artifact[];
  /** The number of artifacts the database reports for the whole filter. */
  total: number;
  /** True when more artifacts exist past this window. */
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface ArtifactSummary {
  /** Artifacts in the summarised window. */
  total: number;
  /** Sum of `size_bytes` over the window. */
  totalBytes: number;
  /** How many distinct kinds the window contains. */
  kinds: number;
  /** How many artifacts the window actually covered. */
  window: number;
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

/**
 * List artifacts, newest first.
 *
 * The filters are ANDed, so a worker-scoped list and a kind filter compose
 * without the caller having to know how many columns the table has.
 */
export async function listArtifacts(
  options: ArtifactListOptions = {},
): Promise<AgentOSResult<ArtifactPage>> {
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  let query = agentosDb
    .from("artifacts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(offset + limit + 1);

  if (options.workerId) query = query.eq("worker_id", options.workerId);
  if (options.taskId) query = query.eq("task_id", options.taskId);
  if (options.runId) query = query.eq("run_id", options.runId);
  if (options.kind) query = query.eq("kind", options.kind);

  const { data, error } = await query;
  if (error) return err("database", "Could not load artifacts", agentosErrorMessage(error));

  const rows = (data ?? []) as Artifact[];
  const reportedTotal = typeof data?.count === "number" ? data.count : null;

  return ok({
    items: rows.slice(offset, offset + limit),
    total: reportedTotal ?? rows.length,
    hasMore: rows.length > offset + limit,
    limit,
    offset,
  });
}

/** One artifact by id. */
export async function getArtifact(artifactId: string): Promise<AgentOSResult<Artifact>> {
  if (!artifactId) return err("validation", "artifactId is required");

  const { data, error } = await agentosDb
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .maybeSingle();

  if (error) return err("database", "Could not load artifact", agentosErrorMessage(error));
  if (!data) return err("not_found", "Artifact not found");
  return ok(data as Artifact);
}

/**
 * Totals for the artifact surface: how many artifacts exist, how many bytes
 * they take, and how many kinds they span.
 *
 * WHY A WINDOW AND NOT THE WHOLE TABLE
 *   `size_bytes` is a bigint, so a sum would have to be computed somewhere.
 *   The browser reads the most recent SUMMARY_WINDOW artifacts and aggregates
 *   them; the caller is told how large the window was so the number can be
 *   labelled honestly.
 */
export async function summarizeArtifacts(): Promise<AgentOSResult<ArtifactSummary>> {
  const { data, error } = await agentosDb
    .from("artifacts")
    .select("id, size_bytes, kind")
    .order("created_at", { ascending: false })
    .limit(SUMMARY_WINDOW);

  if (error) return err("database", "Could not summarize artifacts", agentosErrorMessage(error));

  const rows = (data ?? []) as Artifact[];
  const kinds = new Set<string>();
  let totalBytes = 0;

  for (const row of rows) {
    kinds.add(String(row.kind));
    const size = Number(row.size_bytes ?? 0);
    if (Number.isFinite(size) && size > 0) totalBytes += size;
  }

  return ok({
    total: rows.length,
    totalBytes,
    kinds: kinds.size,
    window: SUMMARY_WINDOW,
  });
}
