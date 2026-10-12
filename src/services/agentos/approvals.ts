// src/services/agentos/approvals.ts
//
// Human approval queue.
//
// The decision is applied by the SECURITY DEFINER agentos.resolve_approval()
// RPC, reached through the agentos-approvals edge function. The browser never
// updates an approval row directly: that would let a client approve its own
// pending gate without the ownership check the RPC performs.

import { supabase } from "../../utils/supabase";
import {
  err,
  ok,
  type AgentOSResult,
  type Approval,
  type ApprovalStatus,
} from "../../types/agentos";

export async function listApprovals(options: {
  status?: ApprovalStatus;
  limit?: number;
} = {}): Promise<AgentOSResult<Approval[]>> {
  let query = supabase
    .from("approvals")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) return err("database", "Could not load approvals", error.message);
  return ok((data ?? []) as Approval[]);
}

export async function getApproval(approvalId: string): Promise<AgentOSResult<Approval>> {
  if (!approvalId) return err("validation", "approvalId is required");

  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();

  if (error) return err("database", "Could not load approval", error.message);
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
    return err("unknown", envelope.error.message, envelope.error.detail);
  }

  return ok(envelope?.data ?? { resolution: params.decision, task: null });
}

/** Count of approvals waiting on a human, for sidebar badges. */
export async function countPendingApprovals(): Promise<AgentOSResult<number>> {
  const { count, error } = await supabase
    .from("approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return err("database", "Could not count approvals", error.message);
  return ok(count ?? 0);
}
