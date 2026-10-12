// supabase/functions/_shared/agentos-runtime.ts
//
// The AgentOS durable executor: turns one claimed task into a real execution.
//
// WHAT THIS IS NOT
//   This is not a background worker and not a long-running process. It is the
//   body of work a single `agentos-execute` invocation performs: claim, run,
//   record. The durable state lives in Postgres (see
//   20261012120400_agentos_queue_rpc.sql), so any number of these invocations
//   can run concurrently or sequentially and the queue stays correct.
//
// WHAT IT DOES, IN ORDER
//   1. Claim due work with the lease-holding RPC.
//   2. Emit run.claimed / run.started events.
//   3. Assemble the prompt (worker identity + task + memory + conversation).
//   4. Run the model with retry + fallback + a hard timeout.
//   5. Dispatch structured tool calls, subject to the worker's permissions
//      and the workspace approval policy.
//   6. If a tool needs human approval, park the task on the gate and stop.
//   7. Record usage, emit run.succeeded / run.failed, complete or fail the
//      task.
//
// No step here reports success it did not achieve.

import { getServiceClient } from './agentos-client.ts';

// deno-lint-ignore no-explicit-any
type Rpc = any;

/** Execution budget. These are the documented limits in RUNTIME_CERTIFICATION.md. */
export const RUNTIME_LIMITS = {
  /** Hard ceiling on a single OpenAI call. */
  openaiTimeoutMs: 90_000,
  /** Transient retries inside one attempt (provider 429/5xx/timeout). */
  retriesPerAttempt: 2,
  /** Backoff before each in-attempt retry. */
  retryBackoffMs: [1_000, 4_000],
  /** Overall ceiling on a single execute invocation. */
  invokeTimeoutMs: 120_000,
} as const;

export interface ClaimedTask {
  task_id: string;
  mission_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: string;
  title: string;
  description: string;
  input: Record<string, unknown>;
  attempt: number;
  max_attempts: number;
  priority: number;
  worker_id: string | null;
  worker_name: string | null;
  worker_role: string | null;
  worker_instructions: string | null;
  worker_goals: string | null;
  model_provider: string | null;
  model_id: string | null;
  fallback_provider: string | null;
  fallback_model_id: string | null;
  temperature: number;
  max_output_tokens: number;
  // deno-lint-ignore no-explicit-any
  worker_tools: any[];
  // deno-lint-ignore no-explicit-any
  worker_knowledge: any[];
  memory_enabled: boolean;
  requires_approval: boolean;
}

export interface ExecutionSummary {
  taskId: string;
  workerId: string | null;
  runId: string | null;
  outcome: 'succeeded' | 'failed' | 'retry' | 'waiting_approval' | 'no_worker' | 'no_credit';
  detail: string;
  modelId?: string;
  tokens?: { prompt: number; completion: number };
  credits?: number;
}

// ---------------------------------------------------------------------------
// Event emission
// ---------------------------------------------------------------------------

export async function emitEvent(params: {
  runId: string | null;
  taskId: string;
  workerId: string | null;
  ownerClerkId: string;
  kind: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  message: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('execution_events')
    .insert({
      run_id: params.runId,
      task_id: params.taskId,
      worker_id: params.workerId,
      owner_clerk_id: params.ownerClerkId,
      kind: params.kind,
      level: params.level,
      message: params.message,
      payload: params.payload ?? {},
    });
  if (error) {
    // An event failure must never abort the execution — log and continue.
    console.error('[agentos] failed to emit event', params.kind, error.message);
  }
}

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

export interface AssembledPrompt {
  system: string;
  prompt: string;
  memoriesUsed: number;
}

/**
 * Build the model prompt from the worker's identity, the task, and (when
 * enabled) the top-K memories ranked by importance * recency. Keyword matching
 * is used because the `embedding` column is optional (see the memory migration)
 * and the runtime must work without pgvector.
 */
export async function assemblePrompt(claim: ClaimedTask): Promise<AssembledPrompt> {
  const systemParts: string[] = [];

  systemParts.push(`You are ${claim.worker_name ?? 'a digital worker'}.`);
  if (claim.worker_role) systemParts.push(`Role: ${claim.worker_role}`);
  if (claim.worker_instructions) {
    systemParts.push(`\n## Operating instructions\n${claim.worker_instructions}`);
  }
  if (claim.worker_goals) systemParts.push(`\n## Goals\n${claim.worker_goals}`);
  systemParts.push(
    '\n## Output contract\nAnswer the task directly. Do not claim to have ' +
      'performed an action you did not perform. If you lack the capability or ' +
      'the credentials to complete something, say so explicitly and stop.',
  );

  let memoriesUsed = 0;
  if (claim.memory_enabled && claim.worker_id) {
    const supabase = getServiceClient();
    const { data: memories } = await supabase
      .from('memories')
      .select('id, content, kind, importance, last_used_at')
      .eq('worker_id', claim.worker_id)
      .order('importance', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .limit(10);

    if (memories && memories.length > 0) {
      memoriesUsed = memories.length;
      const lines = memories.map(
        // deno-lint-ignore no-explicit-any
        (m: any) => `- [${m.kind}] ${m.content}`,
      );
      systemParts.push(`\n## Durable memory\n${lines.join('\n')}`);
      await emitEvent({
        runId: null,
        taskId: claim.task_id,
        workerId: claim.worker_id,
        ownerClerkId: claim.owner_clerk_id,
        kind: 'memory.retrieved',
        level: 'info',
        message: `Retrieved ${memoriesUsed} memories for ${claim.worker_name ?? 'worker'}`,
        payload: { memory_count: memoriesUsed },
      });
    }
  }

  const taskText = [
    claim.title,
    claim.description ? `\n${claim.description}` : '',
    Object.keys(claim.input ?? {}).length > 0
      ? `\n## Input\n${JSON.stringify(claim.input, null, 2)}`
      : '',
  ].join('');

  return { system: systemParts.join('\n'), prompt: taskText, memoriesUsed };
}

// ---------------------------------------------------------------------------
// Model invocation with retry + fallback + timeout
// ---------------------------------------------------------------------------

export interface ModelCallResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  modelUsed: string;
  usedFallback: boolean;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function classifyOpenAIError(status: number | undefined): 'retryable' | 'terminal' {
  if (!status) return 'retryable';
  if (status === 429) return 'retryable';
  if (status >= 500) return 'retryable';
  return 'terminal';
}

/**
 * Run the OpenAI Responses API for one task. Retries transient provider errors
 * and falls back to the worker's fallback model once when the primary is
 * unavailable. Never fabricates a result: if both models fail it throws.
 */
export async function runModel(params: {
  apiKey: string;
  system: string;
  prompt: string;
  model: string;
  fallbackModel?: string | null;
  temperature: number;
  maxOutputTokens: number;
}): Promise<ModelCallResult> {
  const attempts: Array<{ model: string; isFallback: boolean }> = [
    { model: params.model, isFallback: false },
  ];
  if (params.fallbackModel && params.fallbackModel !== params.model) {
    attempts.push({ model: params.fallbackModel, isFallback: true });
  }

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    for (let retry = 0; retry <= RUNTIME_LIMITS.retriesPerAttempt; retry += 1) {
      if (retry > 0) {
        const backoff = RUNTIME_LIMITS.retryBackoffMs[retry - 1] ?? 4_000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }

      try {
        const response = await withTimeout(
          fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${params.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: attempt.model,
              instructions: params.system,
              input: params.prompt,
              temperature: params.temperature,
              max_output_tokens: params.maxOutputTokens,
              store: false,
            }),
          }),
          RUNTIME_LIMITS.openaiTimeoutMs,
          `OpenAI call (${attempt.model})`,
        );

        if (!response.ok) {
          const raw = await response.text().catch(() => '');
          const err = new Error(`OpenAI ${response.status}: ${raw.slice(0, 500)}`);
          if (classifyOpenAIError(response.status) === 'retryable') {
            lastError = err;
            continue;
          }
          throw err;
        }

        // deno-lint-ignore no-explicit-any
        const payload = await response.json() as any;
        const text = extractOutputText(payload);
        const usage = payload?.usage ?? {};

        return {
          text,
          promptTokens: Number(usage.input_tokens ?? 0),
          completionTokens: Number(usage.output_tokens ?? 0),
          modelUsed: attempt.model,
          usedFallback: attempt.isFallback,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // A terminal provider error (4xx other than 429) breaks the retry loop
        // and moves on to the fallback model (if any).
        if (lastError.message.startsWith('OpenAI 4')) break;
      }
    }
  }

  throw lastError ?? new Error('model invocation failed');
}

/** Pull the concatenated text out of a Responses API payload. */
// deno-lint-ignore no-explicit-any
export function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.length > 0) {
    return payload.output_text;
  }
  const output = payload?.output;
  if (Array.isArray(output)) {
    const parts: string[] = [];
    for (const item of output) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const chunk of content) {
          if (typeof chunk?.text === 'string') parts.push(chunk.text);
        }
      }
    }
    if (parts.length > 0) return parts.join('');
  }
  return typeof payload?.text === 'string' ? payload.text : '';
}

// ---------------------------------------------------------------------------
// Tool policy
// ---------------------------------------------------------------------------

export interface ToolDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

/**
 * Decide whether the worker may call a tool, and whether it needs a human
 * first. Denied tools are refused outright. Tools named in the workspace
 * `approval_required_tools` policy or the worker's
 * `approval_required_actions` permission park the task on the gate.
 *
 * An unsupported integration (OpenClaw and friends) is always refused — the
 * seeded catalog marks it support = 'unsupported' and it must never execute.
 */
export function evaluateToolCall(params: {
  toolKey: string;
  actionType: string;
  // deno-lint-ignore no-explicit-any
  workerPermissions: any;
  // deno-lint-ignore no-explicit-any
  workspacePolicies: any;
  integrationSupport?: string | null;
}): ToolDecision {
  if (params.integrationSupport === 'unsupported') {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `${params.toolKey} is unsupported in this port and can never be executed`,
    };
  }

  const denied = params.workerPermissions?.denied_tools;
  if (Array.isArray(denied) && denied.includes(params.toolKey)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `${params.toolKey} is denied by the worker's permissions`,
    };
  }

  const approvalTools = params.workspacePolicies?.approval_required_tools;
  if (Array.isArray(approvalTools) && approvalTools.includes(params.toolKey)) {
    return {
      allowed: true,
      requiresApproval: true,
      reason: `workspace policy requires approval before ${params.toolKey}`,
    };
  }

  const approvalActions = params.workerPermissions?.approval_required_actions;
  if (Array.isArray(approvalActions) && approvalActions.includes(params.actionType)) {
    return {
      allowed: true,
      requiresApproval: true,
      reason: `worker requires approval before ${params.actionType}`,
    };
  }

  return { allowed: true, requiresApproval: false, reason: 'allowed by default' };
}

// ---------------------------------------------------------------------------
// Credit accounting
// ---------------------------------------------------------------------------

/** Credits charged for one execution, priced from the model catalog. */
export function computeCredits(params: {
  promptTokens: number;
  completionTokens: number;
  rateIn: number;
  rateOut: number;
}): number {
  const inputCredits = (params.promptTokens * params.rateIn) / 1000;
  const outputCredits = (params.completionTokens * params.rateOut) / 1000;
  return Math.round((inputCredits + outputCredits) * 1_000_000) / 1_000_000;
}
