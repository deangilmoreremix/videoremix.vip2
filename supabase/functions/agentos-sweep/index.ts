// supabase/functions/agentos-sweep/index.ts
//
// Scheduler + lease recovery sweep.
//
// Two responsibilities, both idempotent and safe to call concurrently:
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
import { getServiceClient } from '../_shared/agentos-client.ts';

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

  return ok({
    dispatched: (dispatched ?? []).length,
    recovered: (recovered ?? []).length,
    details: {
      // deno-lint-ignore no-explicit-any
      schedules: (dispatched ?? []).map((row: any) => ({ schedule_id: row.schedule_id, task_id: row.task_id })),
      // deno-lint-ignore no-explicit-any
      runs: (recovered ?? []).map((row: any) => ({ task_id: row.recovered_task_id, decision: row.decision })),
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
    return handler();
  })(),
);
