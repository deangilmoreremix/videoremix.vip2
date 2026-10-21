// supabase/functions/agentos-sweep/index.ts
//
// Scheduler + lease recovery sweep.
//
// Three responsibilities, all idempotent and safe to call concurrently:
//
//   1. dispatch_due_schedules() — enqueue a task for every schedule whose
//      next_run_at has passed, then recompute next_run_at from the cron
//      expression. A schedule that yields no next occurrence is disabled
//      rather than silently looping.
//
//   2. recover_stale_runs() — expire leases that outlived their worker, mark
//      the run 'timeout', and requeue the task (or fail it when attempts are
//      exhausted). This is what makes a crashed or over-budget executor safe.
//
//   3. expire_stale_approvals() — a parked task must not wait forever: an
//      approval whose deadline passed is expired and its task is released.
//
// DRIVING IT
//   This must be called on a schedule, typically one minute, by either pg_cron
//   in the target project or an explicitly provisioned worker:
//
//     SELECT cron.schedule(
//       'agentos-sweep',
//       '* * * * *',
//       $$ SELECT net.http_post(
//            url     := '<SUPABASE_URL>/functions/v1/agentos-sweep',
//            headers := jsonb_build_object(
//                         'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
//                         'Content-Type', 'application/json'),
//            body    := '{}'::jsonb)$$
//     );
//
//   Calling agentos-execute from the same schedule is what makes scheduled and
//   recurring automation actually fire.

import { ok, fail, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, isServiceRoleRequest } from '../_shared/agentos-client.ts';

async function handler(): Promise<Response> {
  const supabase = getServiceClient();

  const { data: dispatched, error: dispatchError } = await supabase.rpc('dispatch_due_schedules');
  if (dispatchError) {
    console.error('[agentos-sweep] dispatch failed', dispatchError.message);
    return fail('internal', 'Schedule dispatch failed', dispatchError.message);
  }

  const { data: recovered, error: recoverError } = await supabase.rpc('recover_stale_runs');
  if (recoverError) {
    console.error('[agentos-sweep] recovery failed', recoverError.message);
    return fail('internal', 'Lease recovery failed', recoverError.message);
  }

  // A pending approval whose deadline passed holds its task hostage, so the
  // sweep expires it and releases the task.
  const { data: expired, error: expireError } = await supabase.rpc('expire_stale_approvals');
  if (expireError) {
    console.error('[agentos-sweep] approval expiry failed', expireError.message);
    return fail('internal', 'Approval expiry failed', expireError.message);
  }

  return ok({
    dispatched: (dispatched ?? []).length,
    recovered: (recovered ?? []).length,
    expired_approvals: (expired ?? []).length,
    details: {
      // deno-lint-ignore no-explicit-any
      schedules: (dispatched ?? []).map((row: any) => ({ schedule_id: row.schedule_id, task_id: row.task_id })),
      // deno-lint-ignore no-explicit-any
      runs: (recovered ?? []).map((row: any) => ({ task_id: row.recovered_task_id, decision: row.decision })),
      // deno-lint-ignore no-explicit-any
      approvals: (expired ?? []).map((row: any) => ({ approval_id: row.expired_approval_id, task_id: row.task_id })),
    },
  });
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
    // Scheduler-only. Both documented drivers (pg_cron in the project and an
    // explicitly provisioned worker) present the service-role key, so this
    // endpoint does not verify a user JWT: there is no browser caller. Without
    // the service-role check the sweep would be anonymous, letting anyone
    // enqueue schedules and expire leases across every tenant.
    if (!(await isServiceRoleRequest(req))) {
      return fail('unauthenticated', 'Unauthorized');
    }
    return handler();
  }),
);
