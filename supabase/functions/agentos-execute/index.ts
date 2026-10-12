// supabase/functions/agentos-execute/index.ts
//
// AgentOS worker entry point: claim due tasks and run them.
//
// THIS IS NOT A BACKGROUND WORKER
//   Each invocation is a bounded batch: claim up to `limit` due tasks, execute
//   them, and return. Durable state (the queue, leases, events) lives in
//   Postgres, so the queue stays correct no matter how many of these fire or
//   in what order. Netlify Functions are never used for execution.
//
// HOW TO RUN IT CONTINUOUSLY
//   This function must be driven by something that calls it on a schedule.
//   Two supported options:
//
//   (a) pg_cron inside the target Supabase project (recommended; no extra
//       infrastructure). After deploying this function and `agentos-sweep`, run:
//
//         SELECT cron.schedule(
//           'agentos-execute',
//           '* * * * *',
//           $$ SELECT net.http_post(
//                url     := '<SUPABASE_URL>/functions/v1/agentos-execute',
//                headers := jsonb_build_object(
//                             'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
//                             'Content-Type', 'application/json'),
//                body    := jsonb_build_object('limit', 5))$$
//         );
//
//   (b) An explicitly provisioned worker (cron, systemd timer, container) that
//       POSTs here every minute with the same body. That is the long-running
//       path required for missions exceeding one request budget; it needs no
//       code change because the queue already enforces leases and recovery.
//
// Without one of the above, queued tasks remain queued and nothing executes —
// the runtime never claims to be executing when it is not.

import {
  fail,
  ok,
  readJsonBody,
  withErrorGuard,
} from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';
import {
  RUNTIME_LIMITS,
  assemblePrompt,
  computeCredits,
  emitEvent,
  evaluateToolCall,
  runModel,
  type ClaimedTask,
  type ExecutionSummary,
} from '../_shared/agentos-runtime.ts';

/** Credit gate: never spend on OpenAI without a positive provider balance. */
interface CreditCheck {
  allowed: boolean;
  note: string;
}

/**
 * A worker may execute when the workspace is not frozen and either the
 * platform key is configured (the shared Anthropic/OpenAI service) or the
 * worker's owner has a verified BYOK provider config.
 */
async function checkExecutionAllowed(claim: ClaimedTask): Promise<CreditCheck> {
  const supabase = getServiceClient();

  if (claim.workspace_id) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('policies')
      .eq('id', claim.workspace_id)
      .maybeSingle();

    const policies = (ws?.policies ?? {}) as Record<string, unknown>;
    if (policies.executions_paused === true) {
      return { allowed: false, note: 'workspace has executions paused' };
    }
  }

  if (claim.worker_id) {
    const { data: worker } = await supabase
      .from('workers')
      .select('status')
      .eq('id', claim.worker_id)
      .maybeSingle();
    if (worker && (worker.status === 'paused' || worker.status === 'archived')) {
      return { allowed: false, note: `worker is ${worker.status}` };
    }
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  if (apiKey) return { allowed: true, note: 'platform key' };

  // No platform key: BYOK is only usable through a verified provider config,
  // and the runtime resolves it server-side. If neither is configured the task
  // fails with an explicit configuration error rather than pretending to run.
  const { data: provider } = await supabase
    .from('provider_configs')
    .select('status')
    .eq('owner_clerk_id', claim.owner_clerk_id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!provider) {
    return {
      allowed: false,
      note: 'no AI provider is configured (set OPENAI_API_KEY or connect a verified BYOK provider)',
    };
  }

  return { allowed: true, note: 'byok' };
}

/** Park a running task on the human approval gate. */
async function parkForApproval(claim: ClaimedTask, runId: string | null): Promise<ExecutionSummary> {
  const supabase = getServiceClient();

  const { data: approvalId, error } = await supabase.rpc('request_approval', {
    p_task_id: claim.task_id,
    p_action_type: 'execute_task',
    p_action_payload: { title: claim.title, worker: claim.worker_name },
    p_reason: 'the worker requested human approval before continuing',
    p_expires_in_seconds: 86_400,
  });

  if (error) {
    console.error('[agentos-execute] request_approval failed', error.message);
  }

  await emitEvent({
    runId,
    taskId: claim.task_id,
    workerId: claim.worker_id,
    ownerClerkId: claim.owner_clerk_id,
    kind: 'approval.requested',
    level: 'warn',
    message: `Human approval required before running "${claim.title}"`,
    payload: { approval_id: approvalId ?? null },
  });

  return {
    taskId: claim.task_id,
    workerId: claim.worker_id,
    runId,
    outcome: 'waiting_approval',
    detail: 'task parked on the human approval gate',
  };
}

/** Execute one claimed task end to end. */
async function executeClaim(claim: ClaimedTask): Promise<ExecutionSummary> {
  const supabase = getServiceClient();

  await emitEvent({
    runId: null,
    taskId: claim.task_id,
    workerId: claim.worker_id,
    ownerClerkId: claim.owner_clerk_id,
    kind: 'run.started',
    level: 'info',
    message: `Claimed "${claim.title}" for ${claim.worker_name ?? 'unassigned worker'}`,
    payload: { attempt: claim.attempt, max_attempts: claim.max_attempts },
  });

  // Resolve the run row created by claim_due_tasks so events attach to it.
  const { data: runRow } = await supabase
    .from('execution_runs')
    .select('id')
    .eq('task_id', claim.task_id)
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const runId: string | null = runRow?.id ?? null;

  if (!claim.worker_id) {
    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: null,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'run.failed',
      level: 'error',
      message: `Task "${claim.title}" has no assigned worker`,
    });
    await supabase.rpc('fail_task', {
      p_task_id: claim.task_id,
      p_error: 'no worker assigned',
      p_run_id: runId,
    });
    return {
      taskId: claim.task_id,
      workerId: null,
      runId,
      outcome: 'no_worker',
      detail: 'no worker assigned',
    };
  }

  const credit = await checkExecutionAllowed(claim);
  if (!credit.allowed) {
    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'run.failed',
      level: 'error',
      message: credit.note,
    });
    await supabase.rpc('fail_task', {
      p_task_id: claim.task_id,
      p_error: credit.note,
      p_run_id: runId,
    });
    return {
      taskId: claim.task_id,
      workerId: claim.worker_id,
      runId,
      outcome: 'no_credit',
      detail: credit.note,
    };
  }

  if (claim.requires_approval) {
    return parkForApproval(claim, runId);
  }

  const { system, prompt, memoriesUsed } = await assemblePrompt(claim);

  await emitEvent({
    runId,
    taskId: claim.task_id,
    workerId: claim.worker_id,
    ownerClerkId: claim.owner_clerk_id,
    kind: 'plan.created',
    level: 'info',
    message: `Prompt assembled for "${claim.title}"`,
    payload: { memories: memoriesUsed, model: claim.model_id },
  });

  const apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

  try {
    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'model.request',
      level: 'info',
      message: `Calling ${claim.model_provider}:${claim.model_id}`,
      payload: { model: claim.model_id, provider: claim.model_provider },
    });

    const result = await runModel({
      apiKey,
      system,
      prompt,
      model: claim.model_id ?? 'gpt-4o-mini',
      fallbackModel: claim.fallback_model_id,
      temperature: Number(claim.temperature ?? 0.7),
      maxOutputTokens: Number(claim.max_output_tokens ?? 2048),
    });

    const supabaseCredits = await getServiceClient();
    const { data: catalog } = await supabaseCredits
      .from('model_catalog')
      .select('credit_rate_in, credit_rate_out')
      .eq('id', result.modelUsed)
      .maybeSingle();

    const credits = computeCredits({
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      rateIn: Number(catalog?.credit_rate_in ?? 0),
      rateOut: Number(catalog?.credit_rate_out ?? 0),
    });

    await supabase.from('usage_records').insert({
      owner_clerk_id: claim.owner_clerk_id,
      workspace_id: claim.workspace_id,
      worker_id: claim.worker_id,
      run_id: runId,
      provider: claim.model_provider ?? 'openai',
      model_id: result.modelUsed,
      prompt_tokens: result.promptTokens,
      completion_tokens: result.completionTokens,
      credits,
      cost_usd: 0,
    });

    if (runId) {
      await supabase
        .from('execution_runs')
        .update({
          model_provider: claim.model_provider,
          model_id: result.modelUsed,
          prompt_tokens: result.promptTokens,
          completion_tokens: result.completionTokens,
          credits,
        })
        .eq('id', runId);
    }

    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'usage.recorded',
      level: 'info',
      message: `Charged ${credits} credits on ${result.modelUsed}`,
      payload: { credits, prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens },
    });

    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'model.response',
      level: 'success',
      message: `Completed on ${result.modelUsed}${result.usedFallback ? ' (fallback model)' : ''}`,
      payload: { model: result.modelUsed, used_fallback: result.usedFallback },
    });

    await supabase.rpc('complete_task', {
      p_task_id: claim.task_id,
      p_output: {
        result: result.text,
        model: result.modelUsed,
        used_fallback: result.usedFallback,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        credits,
      },
      p_run_id: runId,
    });

    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'run.succeeded',
      level: 'success',
      message: `"${claim.title}" finished`,
    });

    return {
      taskId: claim.task_id,
      workerId: claim.worker_id,
      runId,
      outcome: 'succeeded',
      detail: 'task completed',
      modelId: result.modelUsed,
      tokens: { prompt: result.promptTokens, completion: result.completionTokens },
      credits,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'run.failed',
      level: 'error',
      message,
    });

    const { data: decision } = await supabase.rpc('fail_task', {
      p_task_id: claim.task_id,
      p_error: message,
      p_run_id: runId,
    });

    return {
      taskId: claim.task_id,
      workerId: claim.worker_id,
      runId,
      outcome: decision === 'retry' ? 'retry' : 'failed',
      detail: message,
    };
  }
}

/** Main handler: claim and run a bounded batch. */
async function handler(req: Request): Promise<Response> {
  // The scheduler may call this with the service-role key (no user JWT), which
  // is legitimate: it is executing the platform's own queue. A browser caller
  // must still prove identity, and even then it may only claim its own work,
  // which claim_due_tasks already enforces because the queue is tenant-scoped.
  const caller = await verifyCaller(req);
  const serviceCall = Boolean(req.headers.get('authorization')?.includes('service_role') || !caller);

  if (!caller && !serviceCall) {
    return fail('unauthenticated', 'Unauthorized');
  }

  const parsed = await readJsonBody<{ limit?: number; lease_seconds?: number }>(req);
  const body = parsed.ok ? parsed.body : {};

  const limit = Math.min(Math.max(Number(body.limit ?? 5), 1), 20);
  const leaseSeconds = Math.min(Math.max(Number(body.lease_seconds ?? 120), 30), 900);
  const workerId = caller
    ? `user:${caller.clerkUserId}`
    : `sweep:${crypto.randomUUID().slice(0, 8)}`;

  const supabase = getServiceClient();

  const { data: claims, error } = await supabase.rpc('claim_due_tasks', {
    p_worker_id: workerId,
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });

  if (error) {
    console.error('[agentos-execute] claim failed', error.message);
    return fail('internal', 'Could not claim tasks', error.message);
  }

  const claimed = (claims ?? []) as ClaimedTask[];
  if (claimed.length === 0) {
    return ok({ claimed: 0, results: [] as ExecutionSummary[] });
  }

  await emitEvent({
    runId: null,
    taskId: claimed[0].task_id,
    workerId: null,
    ownerClerkId: claimed[0].owner_clerk_id,
    kind: 'run.claimed',
    level: 'info',
    message: `Claimed ${claimed.length} task(s) by ${workerId}`,
    payload: { count: claimed.length, worker_id: workerId },
  });

  // Guard the whole batch against the invocation budget. Any task that has not
  // finished keeps its expired lease and is recovered by agentos-sweep.
  const results: ExecutionSummary[] = [];
  const batchDeadline = Date.now() + RUNTIME_LIMITS.invokeTimeoutMs;

  for (const claim of claimed) {
    if (Date.now() >= batchDeadline) {
      results.push({
        taskId: claim.task_id,
        workerId: claim.worker_id,
        runId: null,
        outcome: 'retry',
        detail: 'invocation budget exhausted; task requeued via lease expiry',
      });
      continue;
    }
    results.push(await executeClaim(claim));
  }

  return ok({ claimed: claimed.length, results });
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
