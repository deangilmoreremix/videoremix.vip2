// supabase/functions/agentos-approvals/index.ts
//
// Human approval decisions.
//
// The browser calls this to approve or reject a parked task. The decision is
// applied by the SECURITY DEFINER agentos.resolve_approval() RPC, which
// verifies that the caller is the owner of the approval before it moves
// anything. Approving releases the task back to the queue; rejecting cancels it
// and records the reviewer's note as the failure reason. There is no other way
// for a task to leave waiting_approval.

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';

interface ApprovalBody {
  approval_id?: string;
  decision?: 'approved' | 'rejected';
  note?: string;
}

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Unauthorized');

  const parsed = await readJsonBody<ApprovalBody>(req);
  if (!parsed.ok) return parsed.response;
  const { approval_id: approvalId, decision, note } = parsed.body;

  if (!approvalId) return fail('validation', 'approval_id is required');
  if (decision !== 'approved' && decision !== 'rejected') {
    return fail('validation', 'decision must be approved | rejected');
  }

  const supabase = getServiceClient();

  // Verify ownership before calling the RPC so the failure is explicit rather
  // than an opaque 42501 from inside the database.
  const { data: approval } = await supabase
    .from('approvals')
    .select('id, owner_clerk_id, status, task_id')
    .eq('id', approvalId)
    .maybeSingle();

  if (!approval) return fail('not_found', 'Approval not found');
  if (approval.owner_clerk_id !== caller.clerkUserId) {
    return fail('forbidden', 'That approval belongs to a different tenant');
  }
  if (approval.status !== 'pending') {
    return fail('conflict', `approval is already ${approval.status}`);
  }

  const { data: result, error } = await supabase.rpc('resolve_approval', {
    p_approval_id: approvalId,
    p_decision: decision,
    p_note: note ?? '',
  });

  if (error) {
    return fail('internal', 'Could not resolve approval', error.message);
  }

  // Return the resulting task state so the UI can update without a second call.
  let task: unknown = null;
  if (approval.task_id) {
    const { data } = await supabase
      .from('tasks')
      .select('id, status, error, completed_at, output')
      .eq('id', approval.task_id)
      .maybeSingle();
    task = data ?? null;
  }

  return ok({ resolution: result, task });
}

Deno.serve((req) =>
  withErrorGuard(async () => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
    if (req.method !== 'POST') return fail('validation', 'Use POST');
    return handler(req);
  })(),
);
