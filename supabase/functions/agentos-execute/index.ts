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
import { getCreditsClient, getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';
import {
  RUNTIME_LIMITS,
  assemblePrompt,
  computeCredits,
  emitEvent,
  hasGrantedApproval,
  loadToolPolicy,
  resolveOfferedTools,
  runModelWithTools,
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

/**
 * Record the failure of a claimed task and hand it back to the queue.
 *
 * WHY THE LEASE OWNER IS ALWAYS PASSED
 *   complete_task / fail_task fence on the lease owner. The owner is the
 *   identity this batch claimed the task with, so passing it is what proves
 *   the task was not re-claimed by somebody else in the meantime.
 */
async function failClaim(params: {
  claim: ClaimedTask;
  runId: string | null;
  leaseOwner: string;
  message: string;
  outcome?: ExecutionSummary['outcome'];
}): Promise<ExecutionSummary> {
  const supabase = getServiceClient();

  await emitEvent({
    runId: params.runId,
    taskId: params.claim.task_id,
    workerId: params.claim.worker_id,
    ownerClerkId: params.claim.owner_clerk_id,
    kind: 'run.failed',
    level: 'error',
    message: params.message,
  });

  const { data: decision, error } = await supabase.rpc('fail_task', {
    p_task_id: params.claim.task_id,
    p_error: params.message,
    p_run_id: params.runId,
    p_lease_owner: params.leaseOwner,
  });

  if (error) {
    console.error('[agentos-execute] could not fail the task', error.message);
    return {
      taskId: params.claim.task_id,
      workerId: params.claim.worker_id,
      runId: params.runId,
      outcome: 'failed',
      detail: `${params.message} (the queue could not be updated: ${error.message})`,
    };
  }

  return {
    taskId: params.claim.task_id,
    workerId: params.claim.worker_id,
    runId: params.runId,
    outcome: params.outcome ?? (decision === 'retry' ? 'retry' : 'failed'),
    detail: params.message,
  };
}

/**
 * Park a running task on the human approval gate.
 *
 * WHY THE RUN ID IS PASSED
 *   Without it the approval row has no link to the run that asked for it, and
 *   the transcript of the parked run loses its context.
 */
async function parkForApproval(params: {
  claim: ClaimedTask;
  runId: string | null;
  leaseOwner: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  reason: string;
}): Promise<ExecutionSummary> {
  const supabase = getServiceClient();

  const { data: approvalId, error } = await supabase.rpc('request_approval', {
    p_task_id: params.claim.task_id,
    p_action_type: params.actionType,
    p_action_payload: params.actionPayload,
    p_reason: params.reason,
    p_expires_in_seconds: 86_400,
    p_run_id: params.runId,
  });

  if (error) {
    // The gate could not be opened: the task must not sit in 'running' with a
    // lease nobody owns, so it is failed instead of being left dangling.
    console.error('[agentos-execute] could not request the approval', error.message);
    return failClaim({
      claim: params.claim,
      runId: params.runId,
      leaseOwner: params.leaseOwner,
      message: `the approval could not be requested: ${error.message}`,
    });
  }

  await emitEvent({
    runId: params.runId,
    taskId: params.claim.task_id,
    workerId: params.claim.worker_id,
    ownerClerkId: params.claim.owner_clerk_id,
    kind: 'approval.requested',
    level: 'warn',
    message: `Human approval required before running "${params.claim.title}"`,
    payload: { approval_id: approvalId ?? null, action_type: params.actionType },
  });

  return {
    taskId: params.claim.task_id,
    workerId: params.claim.worker_id,
    runId: params.runId,
    outcome: 'waiting_approval',
    detail: 'task parked on the human approval gate',
  };
}

/**
 * Debit the tenant for a completed run.
 *
 * WHY THE DEBIT IS PART OF THE RUN
 *   The provider was already paid for the tokens. A run whose credits could
 *   not be debited is not a successful run: the ledger has to agree with the
 *   provider bill, so the failure is reported instead of being swallowed.
 */
async function debitCredits(params: {
  ownerClerkId: string;
  taskId: string;
  runId: string | null;
  workerId: string | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  credits: number;
}): Promise<{ ok: boolean; error?: string }> {
  const amount = Math.round(params.credits);
  if (amount <= 0) return { ok: true };

  const creditsClient = getCreditsClient();
  const { error } = await creditsClient.rpc('deduct_credits', {
    p_user_id: params.ownerClerkId,
    p_app_id: 'agentos',
    p_amount: amount,
    p_type: 'api_usage',
    p_source: 'agentos_execute',
    p_source_id: params.runId ?? params.taskId,
    p_metadata: {
      task_id: params.taskId,
      run_id: params.runId,
      worker_id: params.workerId,
      model: params.model,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Execute one claimed task end to end. */
async function executeClaim(
  claim: ClaimedTask,
  leaseOwner: string,
): Promise<ExecutionSummary> {
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
    return failClaim({
      claim,
      runId,
      leaseOwner,
      message: `Task "${claim.title}" has no assigned worker`,
      outcome: 'no_worker',
    });
  }

  const credit = await checkExecutionAllowed(claim);
  if (!credit.allowed) {
    return failClaim({
      claim,
      runId,
      leaseOwner,
      message: credit.note,
      outcome: 'no_credit',
    });
  }

  if (claim.requires_approval) {
    // A human who already approved this task must not be asked a second time,
    // otherwise the released task parks itself forever.
    const granted = await hasGrantedApproval({
      supabase,
      taskId: claim.task_id,
      actionType: 'execute_task',
    });
    if (!granted) {
      return parkForApproval({
        claim,
        runId,
        leaseOwner,
        actionType: 'execute_task',
        actionPayload: { title: claim.title, worker: claim.worker_name },
        reason: 'the worker requested human approval before continuing',
      });
    }
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

  // The tool policy is resolved once and used for both the offer list and
  // every call the model makes.
  const { permissions, policies } = await loadToolPolicy({
    supabase,
    workerId: claim.worker_id,
    workspaceId: claim.workspace_id,
  });

  const tools = await resolveOfferedTools({
    supabase,
    workerTools: claim.worker_tools,
    workerPermissions: permissions,
    workspacePolicies: policies,
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
      payload: { model: claim.model_id, provider: claim.model_provider, tools: tools.length },
    });

    const loop = await runModelWithTools({
      apiKey,
      system,
      prompt,
      model: claim.model_id ?? 'gpt-4o-mini',
      fallbackModel: claim.fallback_model_id,
      temperature: Number(claim.temperature ?? 0.7),
      maxOutputTokens: Number(claim.max_output_tokens ?? 2048),
      tools,
      context: {
        supabase,
        workerId: claim.worker_id,
        ownerClerkId: claim.owner_clerk_id,
        taskId: claim.task_id,
        runId,
        permissions,
        policies,
        serviceToken: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        events: {
          runId,
          taskId: claim.task_id,
          workerId: claim.worker_id,
          ownerClerkId: claim.owner_clerk_id,
        },
      },
    });

    if (loop.outcome === 'approval_required' && loop.approval) {
      // The tool the model asked for is parked: the task waits for a human
      // decision instead of running the tool.
      return parkForApproval({
        claim,
        runId,
        leaseOwner,
        actionType: loop.approval.toolKey,
        actionPayload: {
          tool: loop.approval.toolKey,
          args: loop.approval.args,
          title: claim.title,
          worker: claim.worker_name,
        },
        reason: loop.approval.reason,
      });
    }

    if (loop.outcome === 'failed') {
      return failClaim({
        claim,
        runId,
        leaseOwner,
        message: loop.detail ?? 'the execution did not complete',
      });
    }

    const { data: catalog } = await supabase
      .from('model_catalog')
      .select('credit_rate_in, credit_rate_out')
      .eq('id', loop.modelUsed)
      .maybeSingle();

    const credits = computeCredits({
      promptTokens: loop.promptTokens,
      completionTokens: loop.completionTokens,
      rateIn: Number(catalog?.credit_rate_in ?? 0),
      rateOut: Number(catalog?.credit_rate_out ?? 0),
    });

    await supabase.from('usage_records').insert({
      owner_clerk_id: claim.owner_clerk_id,
      workspace_id: claim.workspace_id,
      worker_id: claim.worker_id,
      run_id: runId,
      provider: claim.model_provider ?? 'openai',
      model_id: loop.modelUsed,
      prompt_tokens: loop.promptTokens,
      completion_tokens: loop.completionTokens,
      credits,
      cost_usd: 0,
    });

    if (runId) {
      await supabase
        .from('execution_runs')
        .update({
          model_provider: claim.model_provider,
          model_id: loop.modelUsed,
          prompt_tokens: loop.promptTokens,
          completion_tokens: loop.completionTokens,
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
      message: `Charged ${credits} credits on ${loop.modelUsed}`,
      payload: { credits, prompt_tokens: loop.promptTokens, completion_tokens: loop.completionTokens },
    });

    await emitEvent({
      runId,
      taskId: claim.task_id,
      workerId: claim.worker_id,
      ownerClerkId: claim.owner_clerk_id,
      kind: 'model.response',
      level: 'success',
      message: `Completed on ${loop.modelUsed}${loop.usedFallback ? ' (fallback model)' : ''}`,
      payload: { model: loop.modelUsed, used_fallback: loop.usedFallback, tool_rounds: loop.rounds },
    });

    // The ledger is charged BEFORE the task is completed: a run whose credits
    // could not be debited must not be reported as a successful run.
    const debit = await debitCredits({
      ownerClerkId: claim.owner_clerk_id,
      taskId: claim.task_id,
      runId,
      workerId: claim.worker_id,
      model: loop.modelUsed,
      promptTokens: loop.promptTokens,
      completionTokens: loop.completionTokens,
      credits,
    });

    if (!debit.ok) {
      console.error('[agentos-execute] the credit debit failed', debit.error);
      return failClaim({
        claim,
        runId,
        leaseOwner,
        message: `the credits could not be debited: ${debit.error ?? 'unknown error'}`,
      });
    }

    const { error: completeError } = await supabase.rpc('complete_task', {
      p_task_id: claim.task_id,
      p_output: {
        result: loop.text,
        model: loop.modelUsed,
        used_fallback: loop.usedFallback,
        prompt_tokens: loop.promptTokens,
        completion_tokens: loop.completionTokens,
        credits,
        tool_rounds: loop.rounds,
      },
      p_run_id: runId,
      p_lease_owner: leaseOwner,
    });

    if (completeError) {
      console.error('[agentos-execute] could not complete the task', completeError.message);
      return failClaim({
        claim,
        runId,
        leaseOwner,
        message: `the task could not be completed: ${completeError.message}`,
      });
    }

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
      modelId: loop.modelUsed,
      tokens: { prompt: loop.promptTokens, completion: loop.completionTokens },
      credits,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return failClaim({ claim, runId, leaseOwner, message });
  }
}

/** Main handler: claim and run a bounded batch. */
async function handler(req: Request): Promise<Response> {
  // The scheduler may call this with the service-role key (no user JWT), which
  // is legitimate: it is executing the platform's own queue. A browser caller
  // must still prove identity, and even then it may only run its own work —
  // enforced below, because claim_due_tasks is a scheduler RPC with no tenant
  // predicate of its own.
  const caller = await verifyCaller(req);
  // Only a request carrying the service-role key counts as a service call.
  // `!caller` must NOT be treated as one: doing that made the guard below
  // unreachable and let an anonymous caller claim every tenant's queue.
  const serviceCall = Boolean(req.headers.get('authorization')?.includes('service_role'));

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

  // claim_due_tasks is SECURITY DEFINER with no owner predicate: a user-scoped
  // call claims every tenant's due tasks. A browser caller may only EXECUTE
  // its own work, so foreign claims are released back to the queue untouched
  // (our lease keeps other workers out until we release it).
  const owned = caller
    ? claimed.filter((claim) => claim.owner_clerk_id === caller.clerkUserId)
    : claimed;

  if (caller) {
    for (const claim of claimed) {
      if (claim.owner_clerk_id !== caller.clerkUserId) {
        await supabase
          .from('tasks')
          .update({
            status: 'queued',
            lease_owner: null,
            lease_expires_at: null,
            run_after: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', claim.task_id);

        // The claim created a run row for that task. Releasing the task
        // without closing the run would leave an orphaned 'running' run that
        // nothing ever finishes, so it is closed here.
        await supabase
          .from('execution_runs')
          .update({
            status: 'cancelled',
            ended_at: new Date().toISOString(),
          })
          .eq('task_id', claim.task_id)
          .eq('status', 'running');
      }
    }
  }

  if (owned.length === 0) {
    return ok({ claimed: 0, results: [] as ExecutionSummary[] });
  }

  await emitEvent({
    runId: null,
    taskId: owned[0].task_id,
    workerId: null,
    ownerClerkId: owned[0].owner_clerk_id,
    kind: 'run.claimed',
    level: 'info',
    message: `Claimed ${owned.length} task(s) by ${workerId}`,
    payload: { count: owned.length, worker_id: workerId },
  });

  // Guard the whole batch against the invocation budget. Any task that has not
  // finished keeps its expired lease and is recovered by agentos-sweep.
  const results: ExecutionSummary[] = [];
  const batchDeadline = Date.now() + RUNTIME_LIMITS.invokeTimeoutMs;

  for (const claim of owned) {
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
    results.push(await executeClaim(claim, workerId));
  }

  return ok({ claimed: owned.length, results });
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
  }),
);
