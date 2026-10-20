// src/services/agentos/approvals.ts
//
// Human approval queue.
//
// The decision is applied by the SECURITY DEFINER agentos.resolve_approval()
// RPC, reached through the agentos-approvals edge function. The browser never
// updates an approval row directly: that would let a client approve its own
// pending gate without the ownership check the RPC performs.

import { supabase } from "../../utils/supabase";
import { agentosDb, agentosErrorMessage } from "./client";
import {
  type AgentOSError,
  err,
  ok,
  type AgentOSResult,
  type Approval,
  type ApprovalStatus,
} from "../../types/agentos";

/**
 * Map an edge function's error envelope onto the shared AgentOSError codes.
 *
 * The edge functions already speak the same vocabulary (unauthenticated /
 * forbidden / not_found / validation / conflict / unsupported / ...), so
 * discarding it and reporting "unknown" throws away the one thing the UI
 * needs: whether the user must sign in, cannot do this, or can retry.
 *
 * WHY THE EXTRA CODES
 *   The AgentOS edge functions (supabase/functions/_shared/agentos-errors.ts)
 *   also return `not_configured`, `out_of_credits` and `timeout`, which the
 *   shared union did not know — they all surfaced as "unknown". `internal` is
 *   the server-side catch-all and maps onto `database`.
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
    case "not_configured":
      return "not_configured";
    case "out_of_credits":
      return "out_of_credits";
    case "timeout":
      return "timeout";
    case "internal":
      return "database";
    default:
      return "unknown";
  }
}


/**
 * The statuses an approval can hold once it is no longer waiting on a human.
 *
 * `expired` and `cancelled` are decisions the system made, not the operator,
 * but they are decided rows: they carry a decided_at and they belong in the
 * history the operator can read.
 */
export const DECIDED_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

export interface ListApprovalsOptions {
  /** One status, or several. Omit to return every approval. */
  status?: ApprovalStatus | ApprovalStatus[];
  limit?: number;
}

export async function listApprovals(
  options: ListApprovalsOptions = {},
): Promise<AgentOSResult<Approval[]>> {
  let query = agentosDb
    .from("approvals")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (Array.isArray(options.status)) {
    if (options.status.length === 0) return ok([]);
    query = query.in("status", options.status);
  } else if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) return err("database", "Could not load approvals", agentosErrorMessage(error));
  return ok((data ?? []) as Approval[]);
}

export async function getApproval(approvalId: string): Promise<AgentOSResult<Approval>> {
  if (!approvalId) return err("validation", "approvalId is required");

  const { data, error } = await agentosDb
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();

  if (error) return err("database", "Could not load approval", agentosErrorMessage(error));
  if (!data) return err("not_found", "Approval not found");
  return ok(data as Approval);
}

export interface ApprovalDecisionResult {
  resolution: string;
  task: unknown;
}

/**
 * Approve or reject a parked task. The edge function verifies caller ownership
 * before invoking the RPC, so a cross-tenant decision fails with 403 there
 * rather than being silently applied here.
 */
export async function decideApproval(params: {
  approvalId: string;
  decision: "approved" | "rejected";
  note?: string;
}): Promise<AgentOSResult<ApprovalDecisionResult>> {
  if (!params.approvalId) return err("validation", "approvalId is required");
  if (params.decision !== "approved" && params.decision !== "rejected") {
    return err("validation", "decision must be approved | rejected");
  }

  const { data, error } = await supabase.functions.invoke("agentos-approvals", {
    body: {
      approval_id: params.approvalId,
      decision: params.decision,
      note: params.note ?? "",
    },
  });

  if (error) return err("unknown", "Could not record the decision", error.message);

  const envelope = data as
    | { data?: ApprovalDecisionResult; error?: { code: string; message: string; detail?: string } };
  if (envelope?.error) {
    return err(
      mapServerCode(envelope.error.code),
      envelope.error.message,
      envelope.error.detail,
    );
  }

  return ok(envelope?.data ?? { resolution: params.decision, task: null });
}

/** Count of approvals waiting on a human, for sidebar badges. */
export async function countPendingApprovals(): Promise<AgentOSResult<number>> {
  const { count, error } = await agentosDb
    .from("approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return err("database", "Could not count approvals", agentosErrorMessage(error));
  return ok(count ?? 0);
}
