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
//   7. Record usage, debit credits, emit run.succeeded / run.failed, complete
//      or fail the task.
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
  /** How many tool-execution rounds one task may run. */
  toolRounds: 3,
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
 *
 * WHY THE HIT COUNTER IS BUMPED HERE
 *   The ranking is `importance x recency`, and recency only moves when a
 *   memory is actually used. Without the counter every memory would keep the
 *   same `last_used_at` and the ranking would never reflect reality.
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

      // Every memory in the prompt counts as used. The RPC is owner-checked
      // inside the database, and the executor acts with the service role, so
      // this only ever touches the claim owner's own memories.
      for (const memory of memories as Array<{ id: string }>) {
        const { error } = await supabase.rpc('increment_memory_hit', {
          p_memory_id: memory.id,
        });
        if (error) {
          console.error('[agentos] could not bump a memory hit counter', error.message);
        }
      }

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
  /** Function calls the model asked for, if any. */
  toolCalls: ToolCall[];
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  // ReturnType<typeof setTimeout>, not `number`: with the npm dependencies
  // resolved, the DOM/Node typings disagree about what setTimeout returns
  // (number in Deno, Timeout in Node), and a hard-coded `number` fails the
  // type check under one of them.
  let timer: ReturnType<typeof setTimeout> | undefined;
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
 *
 * WHY THE TOOL PARAMETER EXISTS
 *   A model that asks for a tool and never gets one answered is a silent
 *   no-op: the text it returns describes an action nobody performed. Passing
 *   the offered tools makes the request honest, and the returned tool calls
 *   are what the tool loop feeds back.
 */
export async function runModel(params: {
  apiKey: string;
  system: string;
  prompt: string;
  model: string;
  fallbackModel?: string | null;
  temperature: number;
  /**
   * Whether the model accepts a temperature. False for the reasoning models
   * (gpt-5, gpt-5-mini, o3, o4-mini), which refuse one that is not their
   * default. The catalog carries it (model_catalog.supports_temperature).
   */
  supportsTemperature?: boolean;
  maxOutputTokens: number;
  /** The tools the worker is allowed to use. Empty keeps the plain call. */
  tools?: ToolDefinition[];
  /** A continued conversation (tool call + tool output items). */
  inputItems?: unknown[];
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
        const body: Record<string, unknown> = {
          model: attempt.model,
          instructions: params.system,
          max_output_tokens: params.maxOutputTokens,
          store: false,
        };
        // Some models reject a temperature other than their default (the
        // reasoning models: gpt-5, o3, o4-mini). The catalog records which
        // ones, and the parameter is omitted rather than sent with a value the
        // provider will refuse.
        if (params.supportsTemperature !== false) {
          body.temperature = params.temperature;
        }
        // A plain call keeps the historical shape; a tool round replays the
        // conversation so the provider can see what the tools returned.
        body.input = params.inputItems && params.inputItems.length > 0
          ? params.inputItems
          : params.prompt;
        if (params.tools && params.tools.length > 0) {
          body.tools = params.tools.map((tool) => ({
            type: 'function',
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          }));
          body.tool_choice = 'auto';
        }

        // The provider's base URL is configurable: the platform's own
        // provider is OpenAI-compatible, so a deployment that should use it
        // (rather than a key from OpenAI) only has to set OPENAI_BASE_URL.
        const baseUrl = (Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com').replace(
          /\/+$/,
          '',
        );

        const response = await withTimeout(
          fetch(`${baseUrl}/v1/responses`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${params.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
          toolCalls: extractToolCalls(payload),
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
// Tool calls
// ---------------------------------------------------------------------------

/** A tool as it is offered to the model. */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** One function call extracted from a Responses API payload. */
export interface ToolCall {
  /** The provider's call id; the handle a tool result is answered on. */
  callId: string;
  name: string;
  /** The raw JSON argument string, exactly as the provider sent it. */
  rawArguments: string;
  arguments: Record<string, unknown>;
}

/**
 * Pull the function calls out of a Responses API payload.
 *
 * WHY THIS EXISTS
 *   The Responses API returns a tool request as an output item of type
 *   'function_call'. Ignoring those items means the model asks for an action
 *   and the runtime answers with prose about an action nobody took.
 */
export function extractToolCalls(payload: any): ToolCall[] {
  const output = payload?.output;
  if (!Array.isArray(output)) return [];

  const calls: ToolCall[] = [];
  for (const item of output) {
    if (item?.type !== 'function_call') continue;
    const rawArguments = typeof item.arguments === 'string' ? item.arguments : '';
    let args: Record<string, unknown> = {};
    if (rawArguments) {
      try {
        const parsed = JSON.parse(rawArguments);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          args = parsed as Record<string, unknown>;
        }
      } catch {
        args = {};
      }
    }
    const callId = typeof item.call_id === 'string' && item.call_id.length > 0
      ? item.call_id
      : (typeof item.id === 'string' ? item.id : '');
    calls.push({
      callId,
      name: String(item.name ?? ''),
      rawArguments,
      arguments: args,
    });
  }
  return calls;
}

/**
 * How every implemented tool is described to the model.
 *
 * WHY A STATIC CATALOG
 *   The model needs a parameter schema before it can call a tool, and the
 *   integration directory only records capabilities. A tool with no schema
 *   here is never offered, so the model can never ask for something the
 *   runtime cannot describe.
 */
const TOOL_SPECS: Record<string, { description: string; parameters: Record<string, unknown> }> = {
  web_fetch: {
    description: 'Fetch a public web page over HTTP(S) and return a size-bounded text extract.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Absolute http(s) URL of a public page.' },
      },
      required: ['url'],
    },
  },
  vector_search: {
    description: "Search this worker's durable memories by keyword and recency.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords to match against memory content.' },
        limit: { type: 'integer', description: 'How many memories to return (1-20).' },
      },
      required: [],
    },
  },
  artifact_write: {
    description: 'Persist a text artifact for this run.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short label for the artifact.' },
        kind: { type: 'string', description: 'Artifact kind, usually "text".' },
        content: { type: 'string', description: 'The artifact body.' },
      },
      required: ['content'],
    },
  },
  videoremix_apps: {
    description: 'Invoke an app from the VideoRemix app catalog.',
    parameters: {
      type: 'object',
      properties: {
        app_slug: { type: 'string', description: 'The catalog app slug.' },
        inputs: { type: 'object', additionalProperties: true, description: 'The app inputs.' },
      },
      required: ['app_slug'],
    },
  },
  videoremix_personalizer: {
    description: 'Run a VideoRemix Personalizer scan, generation or media job.',
    parameters: {
      type: 'object',
      properties: {
        app_slug: { type: 'string', description: 'The catalog app slug.' },
        inputs: { type: 'object', additionalProperties: true, description: 'The job inputs.' },
      },
      required: ['app_slug'],
    },
  },
};

/**
 * The tools a worker may be offered to the model.
 *
 * WHY THE FILTER IS HERE
 *   The model must only ever be offered tools the worker is allowed to use:
 *   a denied tool, an unsupported integration and a tool the worker was never
 *   assigned are all removed BEFORE the request is sent, so the model cannot
 *   even ask for them.
 */
export async function resolveOfferedTools(params: {
  supabase: Rpc;
  workerTools: unknown;
  workerPermissions: Record<string, any>;
  workspacePolicies: Record<string, any>;
}): Promise<ToolDefinition[]> {
  const refs = Array.isArray(params.workerTools) ? params.workerTools : [];
  const candidates: string[] = [];
  for (const ref of refs as Array<Record<string, unknown>>) {
    const key = String(ref?.tool_key ?? '');
    if (!key) continue;
    if (ref?.enabled === false) continue;
    if (!TOOL_SPECS[key]) continue;
    if (!candidates.includes(key)) candidates.push(key);
  }
  if (candidates.length === 0) return [];

  const { data: integrations, error } = await params.supabase
    .from('integrations')
    .select('key, support')
    .in('key', candidates);
  if (error) {
    console.error('[agentos] could not load the integration directory', error.message);
    return [];
  }
  const support = new Map<string, string>();
  for (const row of (integrations ?? []) as Array<{ key: string; support: string }>) {
    support.set(row.key, row.support);
  }

  const offered: ToolDefinition[] = [];
  for (const key of candidates) {
    const integrationSupport = support.get(key) ?? null;
    if (integrationSupport === 'unsupported') continue;

    const decision = evaluateToolCall({
      toolKey: key,
      actionType: key,
      workerPermissions: params.workerPermissions,
      workspacePolicies: params.workspacePolicies,
      integrationSupport,
    });
    if (!decision.allowed) continue;

    // Permission switches that gate the tool outright.
    if (key === 'web_fetch' && params.workerPermissions?.allow_web_access === false) continue;
    if (key === 'artifact_write' && params.workerPermissions?.allow_artifacts === false) continue;

    const spec = TOOL_SPECS[key];
    offered.push({ name: key, description: spec.description, parameters: spec.parameters });
  }
  return offered;
}

/**
 * True when a human already approved this action for this task.
 *
 * WHY IT IS NEEDED
 *   A parked task is released and re-executed from the top, so the model
 *   asks for the same tool again. Without remembering the decision the task
 *   would park forever and the human would be asked to approve the same
 *   action over and over.
 */
export async function hasGrantedApproval(params: {
  supabase: Rpc;
  taskId: string;
  actionType: string;
}): Promise<boolean> {
  const { data, error } = await params.supabase
    .from('approvals')
    .select('id')
    .eq('task_id', params.taskId)
    .eq('action_type', params.actionType)
    .eq('status', 'approved')
    .limit(1);

  if (error) {
    console.error('[agentos] could not read the approval history', error.message);
    return false;
  }
  return (data ?? []).length > 0;
}

/**
 * Load the worker's permission block and the workspace policy.
 *
 * WHY THE PERMISSIONS ARE READ HERE
 *   The allow-list (`allowed_app_slugs`) lives INSIDE the `permissions` jsonb
 *   column — `agentos.workers` has no top-level `allowed_app_slugs` column,
 *   and selecting one makes PostgREST reject the whole query (PGRST100).
 */
export async function loadToolPolicy(params: {
  supabase: Rpc;
  workerId: string | null;
  workspaceId: string | null;
}): Promise<{ permissions: Record<string, any>; policies: Record<string, any> }> {
  let permissions: Record<string, any> = {};
  let policies: Record<string, any> = {};

  if (params.workerId) {
    const { data: worker, error } = await params.supabase
      .from('workers')
      .select('permissions')
      .eq('id', params.workerId)
      .maybeSingle();
    if (error) {
      console.error('[agentos] could not load the worker permissions', error.message);
    }
    permissions = (worker?.permissions ?? {}) as Record<string, any>;
  }

  if (params.workspaceId) {
    const { data: workspace, error } = await params.supabase
      .from('workspaces')
      .select('policies')
      .eq('id', params.workspaceId)
      .maybeSingle();
    if (error) {
      console.error('[agentos] could not load the workspace policy', error.message);
    }
    policies = (workspace?.policies ?? {}) as Record<string, any>;
  }

  return { permissions, policies };
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
// Tool execution
// ---------------------------------------------------------------------------

export interface ToolExecutionContext {
  supabase: Rpc;
  toolKey: string;
  args: Record<string, unknown>;
  workerId: string | null;
  ownerClerkId: string;
  taskId: string | null;
  runId: string | null;
  /** The workspace the run belongs to, when it has one. */
  workspaceId?: string | null;
  permissions: Record<string, any>;
  /** The service-role token, used only for the internal app-catalog call. */
  serviceToken: string;
}

export interface ToolExecutionResult {
  ok: boolean;
  code?: 'forbidden' | 'validation' | 'not_found' | 'unsupported' | 'internal';
  result?: unknown;
  error?: string;
}

/**
 * Run one tool on behalf of a worker.
 *
 * WHY EVERY TOOL IS HERE AND NOT IN THE EDGE FUNCTION
 *   The executor (agentos-execute) and the browser dispatcher (agentos-tools)
 *   must enforce the SAME rules, otherwise a policy is only real on one of
 *   the two paths. Both call this function.
 */
export async function executeToolCall(
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const args = context.args ?? {};

  switch (context.toolKey) {
    case 'web_fetch': {
      if (context.permissions?.allow_web_access === false) {
        return { ok: false, code: 'forbidden', error: 'web access is disabled for this worker' };
      }
      const url = String(args.url ?? '');
      if (!url) return { ok: false, code: 'validation', error: 'url is required' };
      return { ok: true, result: await webFetchGuarded({ url }) };
    }

    case 'vector_search': {
      if (!context.workerId) {
        return { ok: false, code: 'validation', error: 'worker_id is required for vector_search' };
      }
      return {
        ok: true,
        result: await vectorSearch({
          supabase: context.supabase,
          workerId: context.workerId,
          args,
        }),
      };
    }

    case 'artifact_write': {
      if (context.permissions?.allow_artifacts === false) {
        return { ok: false, code: 'forbidden', error: 'artifact writing is disabled for this worker' };
      }
      const content = String(args.content ?? '');
      if (!content) return { ok: false, code: 'validation', error: 'content is required' };

      // WHY THE OWNERSHIP CHECK
      //   The task and run ids arrive with the request. Writing an artifact
      //   that points at another tenant's task would attach this tenant's
      //   output to that tenant's run, so both ids are proven to belong to
      //   the owner before anything is written.
      const ownership = await assertArtifactOwnership(context);
      if (!ownership.ok) return ownership;

      const { data, error } = await context.supabase
        .from('artifacts')
        .insert({
          owner_clerk_id: context.ownerClerkId,
          worker_id: context.workerId,
          run_id: context.runId,
          task_id: context.taskId,
          workspace_id: context.workspaceId ?? null,
          kind: String(args.kind ?? 'text'),
          name: String(args.name ?? 'artifact'),
          preview: content.slice(0, 4000),
          // Where the content lives, when the caller stored it somewhere. The
          // content itself is the preview; the path is the pointer.
          storage_path: args.storage_path ? String(args.storage_path) : null,
          mime_type: args.mime_type ? String(args.mime_type) : 'text/plain',
          size_bytes: new TextEncoder().encode(content).byteLength,
          metadata: { origin: 'agentos-tools' },
        })
        .select('id, name, kind')
        .single();
      if (error) return { ok: false, code: 'internal', error: error.message };
      return { ok: true, result: data };
    }

    case 'videoremix_apps':
    case 'videoremix_personalizer': {
      const slug = String(args.app_slug ?? '');
      if (!slug) return { ok: false, code: 'validation', error: 'app_slug is required' };
      const allowedApps = context.permissions?.allowed_app_slugs;
      if (Array.isArray(allowedApps) && allowedApps.length > 0 && !allowedApps.includes(slug)) {
        return { ok: false, code: 'forbidden', error: `${slug} is not in this worker's allowed app list` };
      }
      return {
        ok: true,
        result: await invokeCatalogApp({ args, serviceToken: context.serviceToken }),
      };
    }

    default:
      return {
        ok: false,
        code: 'unsupported',
        error: `${context.toolKey} has no implementation in this port`,
      };
  }
}

/**
 * Prove that the task and run named by a request belong to the owner.
 *
 * WHY IT MATTERS
 *   The artifact row carries the task and run ids. A caller that named a
 *   foreign task id would attach its own artifact to that tenant's run, and
 *   the foreign run would show content it never produced.
 */
async function assertArtifactOwnership(
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  if (context.taskId) {
    const { data: task, error } = await context.supabase
      .from('tasks')
      .select('id, owner_clerk_id')
      .eq('id', context.taskId)
      .maybeSingle();
    if (error) return { ok: false, code: 'internal', error: error.message };
    if (!task || task.owner_clerk_id !== context.ownerClerkId) {
      return {
        ok: false,
        code: 'forbidden',
        error: 'task_id does not belong to this tenant',
      };
    }
  }

  if (context.runId) {
    const { data: run, error } = await context.supabase
      .from('execution_runs')
      .select('id, owner_clerk_id')
      .eq('id', context.runId)
      .maybeSingle();
    if (error) return { ok: false, code: 'internal', error: error.message };
    if (!run || run.owner_clerk_id !== context.ownerClerkId) {
      return {
        ok: false,
        code: 'forbidden',
        error: 'run_id does not belong to this tenant',
      };
    }
  }

  return { ok: true };
}

/**
 * Invoke an app from the canonical catalog through the same runner and credit
 * system the dashboard uses.
 *
 * WHY THE TOKEN IS A PARAMETER
 *   The service-role key must never be read from a request-derived value, and
 *   the caller (edge function) owns the decision of which token to use.
 */
export async function invokeCatalogApp(params: {
  args: Record<string, unknown>;
  serviceToken: string;
}): Promise<unknown> {
  const slug = String(params.args.app_slug ?? '');
  if (!slug) throw new Error('app_slug is required');

  const inputs = (params.args.inputs ?? {}) as Record<string, unknown>;
  const baseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  const response = await fetch(`${baseUrl}/functions/v1/run-ai-app`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.serviceToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appSlug: slug, inputs, stream: false }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`run-ai-app returned ${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** Keyword + recency search over a worker's memories. */
export async function vectorSearch(params: {
  supabase: Rpc;
  workerId: string;
  args: Record<string, unknown>;
}): Promise<unknown> {
  const query = String(params.args.query ?? '').trim();
  const limit = Math.min(Number(params.args.limit ?? 5), 20);
  const { supabase, workerId } = params;

  const { data, error } = await supabase
    .from('memories')
    .select('id, content, kind, importance, tags, last_used_at, created_at')
    .eq('worker_id', workerId)
    .order('importance', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<Record<string, any>>;

  if (query) {
    const needle = query.toLowerCase();
    const matched = rows.filter((row) => String(row.content).toLowerCase().includes(needle));
    if (matched.length > 0) return { mode: 'keyword', results: matched.slice(0, limit) };
  }

  return { mode: 'recency', results: rows.slice(0, limit) };
}

// ---------------------------------------------------------------------------
// Outbound fetch with an SSRF guard
// ---------------------------------------------------------------------------

/** Hard cap on any fetched response body; keeps a runaway page from OOMing. */
export const MAX_FETCH_BYTES = 256 * 1024;
/** Wall-clock ceiling on one outbound fetch, redirects included. */
export const FETCH_TIMEOUT_MS = 20_000;
/** How many redirects a guarded fetch may follow. */
const MAX_REDIRECTS = 5;

/** Parse a dotted-quad IPv4 address into its four octets. */
function parseIpv4(value: string): number[] | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    octets.push(octet);
  }
  return octets;
}

/** Parse an IPv6 address into its eight 16-bit groups. */
function parseIpv6(value: string): number[] | null {
  const address = value.split('%')[0];
  if (!address.includes(':')) return null;

  const halves = address.split('::');
  if (halves.length > 2) return null;

  const toGroups = (part: string): number[] | null => {
    if (!part) return [];
    const groups: number[] = [];
    for (const chunk of part.split(':')) {
      if (chunk.includes('.')) {
        const octets = parseIpv4(chunk);
        if (!octets) return null;
        groups.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(chunk)) return null;
      groups.push(parseInt(chunk, 16));
    }
    return groups;
  };

  const head = toGroups(halves[0]);
  const tail = halves.length === 2 ? toGroups(halves[1]) : [];
  if (head === null || tail === null) return null;

  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...new Array<number>(fill).fill(0), ...tail];
  }
  return head.length === 8 ? head : null;
}

/**
 * True for every address that must never be reached from a server-side fetch:
 * loopback, link-local, private, CGNAT, multicast, reserved and the IPv6
 * equivalents (unique-local, IPv4-mapped and IPv4-translated).
 */
export function isBlockedAddress(value: string): boolean {
  const address = value.trim().toLowerCase();

  const octets = parseIpv4(address);
  if (octets) {
    const [a, b] = octets;
    if (a === 0) return true; // 0.0.0.0/8 "this network"
    if (a === 10) return true; // 10.0.0.0/8 private
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
    if (a === 192 && b === 0 && octets[2] === 0) return true; // 192.0.0.0/24
    if (a === 192 && b === 0 && octets[2] === 2) return true; // 192.0.2.0/24 docs
    if (a === 192 && b === 88 && octets[2] === 99) return true; // 192.88.99.0/24
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmark
    if (a === 198 && b === 51 && octets[2] === 100) return true; // 198.51.100.0/24
    if (a === 203 && b === 0 && octets[2] === 113) return true; // 203.0.113.0/24
    if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved
    return false;
  }

  const groups = parseIpv6(address);
  if (!groups) return true; // anything that is not a parseable address is refused

  const allZero = groups.every((group) => group === 0);
  if (allZero) return true; // ::
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) return true; // ::1
  if ((groups[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((groups[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (groups[0] === 0x0100 && groups[1] === 0 && groups[2] === 0) return true; // 100::/64 discard
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true; // 2001:db8::/32 docs
  // IPv4-mapped (::ffff:0:0/96) and IPv4-translated (64:ff9b::/96): the
  // embedded IPv4 address decides.
  const mapped = groups.slice(0, 4).every((group) => group === 0) && groups[4] === 0 && groups[5] === 0xffff;
  const translated = groups[0] === 0x0064 && groups[1] === 0xff9b && groups[2] === 0 && groups[3] === 0 && groups[4] === 0;
  if (mapped || translated) {
    const embedded = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    return isBlockedAddress(embedded);
  }
  return false;
}

/** True when the host is an IP literal rather than a name to resolve. */
function isIpLiteral(host: string): boolean {
  return parseIpv4(host) !== null || parseIpv6(host) !== null;
}

/**
 * Resolve a hostname to every address it points at.
 *
 * WHY EVERY ADDRESS IS CHECKED
 *   A name can resolve to a public address for the check and to a private one
 *   for the fetch (DNS rebinding). Refusing only the first answer leaves the
 *   hole open, so the whole answer set is inspected.
 */
async function resolveHostAddresses(hostname: string): Promise<string[]> {
  const resolver = (Deno as unknown as {
    resolveDns?: (host: string, family: 'A' | 'AAAA') => Promise<string[]>;
  }).resolveDns;

  if (typeof resolver !== 'function') {
    throw new Error('DNS resolution is unavailable in this runtime; the request was refused');
  }

  const addresses: string[] = [];
  let firstError: string | null = null;

  for (const family of ['A', 'AAAA'] as const) {
    try {
      const records = await resolver(hostname, family);
      for (const record of records ?? []) {
        const value = String(record).trim();
        if (value) addresses.push(value);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!firstError) firstError = message;
    }
  }

  if (addresses.length === 0) {
    throw new Error(`could not resolve ${hostname}${firstError ? `: ${firstError}` : ''}`);
  }
  return addresses;
}

/**
 * Validate a URL before it is fetched: http(s) only, and every address the
 * host resolves to must be a public one.
 */
export async function assertPublicUrl(url: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('the url could not be parsed');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('only http and https urls can be fetched');
  }

  const host = parsed.hostname.replace(/^\[/, '').replace(/\]$/, '');
  const addresses = isIpLiteral(host) ? [host] : await resolveHostAddresses(host);

  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      throw new Error('the host resolves to a blocked (private or reserved) address');
    }
  }

  return parsed;
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

/**
 * A bounded server-side GET.
 *
 * WHY THE REDIRECTS ARE FOLLOWED BY HAND
 *   A redirect can point at an internal address, so every hop is validated
 *   with the same rules as the first one. Following redirects automatically
 *   would skip exactly that check.
 */
export async function webFetchGuarded(params: { url: string }): Promise<{
  url: string;
  status: number;
  content_type: string;
  truncated: boolean;
  bytes: number;
  body: string;
}> {
  const deadline = Date.now() + FETCH_TIMEOUT_MS;
  let current = params.url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const target = await assertPublicUrl(current);

    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('the fetch timed out');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);

    try {
      const response = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: 'manual',
      });

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw new Error('the upstream returned a redirect without a location');
        current = new URL(location, target).toString();
        continue;
      }

      if (!response.ok) throw new Error(`upstream ${response.status}`);

      const contentType = response.headers.get('content-type') ?? '';
      const { bytes, truncated, body } = await readBoundedBody(response);
      return {
        url: target.toString(),
        status: response.status,
        content_type: contentType,
        truncated,
        bytes,
        body,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('too many redirects');
}

/** Read at most MAX_FETCH_BYTES from a response and decode it. */
async function readBoundedBody(response: Response): Promise<{
  bytes: number;
  truncated: boolean;
  body: string;
}> {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    const truncated = buffer.byteLength > MAX_FETCH_BYTES;
    return {
      bytes: Math.min(buffer.byteLength, MAX_FETCH_BYTES),
      truncated,
      body: new TextDecoder().decode(buffer.subarray(0, MAX_FETCH_BYTES)),
    };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    chunks.push(value);
    if (total > MAX_FETCH_BYTES) {
      truncated = true;
      await reader.cancel().catch(() => undefined);
      break;
    }
  }

  const merged = new Uint8Array(Math.min(total, MAX_FETCH_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= merged.length) break;
    const slice = chunk.subarray(0, merged.length - offset);
    merged.set(slice, offset);
    offset += slice.length;
  }

  return {
    bytes: merged.length,
    truncated,
    body: new TextDecoder().decode(merged),
  };
}

// ---------------------------------------------------------------------------
// The tool loop
// ---------------------------------------------------------------------------

export interface ToolLoopContext {
  supabase: Rpc;
  workerId: string | null;
  ownerClerkId: string;
  /** The workspace the run belongs to, when it has one. */
  workspaceId?: string | null;
  taskId: string | null;
  runId: string | null;
  permissions: Record<string, any>;
  policies: Record<string, any>;
  serviceToken: string;
  /** Where the run/worker events are attached. */
  events: {
    runId: string | null;
    taskId: string;
    workerId: string | null;
    ownerClerkId: string;
  };
}

export type ModelToolLoopResult = {
  outcome: 'completed' | 'approval_required' | 'failed';
  text: string;
  promptTokens: number;
  completionTokens: number;
  modelUsed: string;
  usedFallback: boolean;
  rounds: number;
  /** Set when the run must park on the human approval gate. */
  approval?: { toolKey: string; args: Record<string, unknown>; reason: string };
  /** Set when the loop could not converge. */
  detail?: string;
};

/**
 * Format a tool result for the model.
 *
 * WHY THE OUTPUT IS CAPPED
 *   A fetched page can be 256 KB. Feeding all of it back would blow up the
 *   context (and the bill) of the next round, so the result the model sees is
 *   bounded; the full result stays in the run's own records.
 */
const MAX_TOOL_OUTPUT_CHARS = 16_000;

function formatToolOutput(outcome: ToolExecutionResult): string {
  const text = JSON.stringify(
    outcome.ok ? { ok: true, result: outcome.result } : { ok: false, error: outcome.error },
  );
  if (text.length <= MAX_TOOL_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_TOOL_OUTPUT_CHARS)}... [truncated]`;
}

/**
 * Run the model, execute whatever tools it asks for, and feed the results
 * back — until the model answers or the round budget is spent.
 *
 * WHY THE POLICY IS EVALUATED HERE AND NOT ONLY IN THE DISPATCHER
 *   The model is a caller too: it must not reach a tool the worker may not
 *   use. Every call is evaluated against the worker's permissions and the
 *   workspace policy before it runs, and a tool the policy parks is never
 *   executed — the whole task waits for a human.
 */
export async function runModelWithTools(params: {
  apiKey: string;
  system: string;
  prompt: string;
  model: string;
  fallbackModel?: string | null;
  temperature: number;
  /** Whether the model accepts a temperature (see runModel). */
  supportsTemperature?: boolean;
  maxOutputTokens: number;
  tools: ToolDefinition[];
  context: ToolLoopContext;
}): Promise<ModelToolLoopResult> {
  const { context } = params;

  const conversation: unknown[] = [{ role: 'user', content: params.prompt }];
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed = params.model;
  let usedFallback = false;
  let text = '';

  for (let round = 0; round <= RUNTIME_LIMITS.toolRounds; round += 1) {
    const result = await runModel({
      apiKey: params.apiKey,
      system: params.system,
      prompt: params.prompt,
      model: params.model,
      fallbackModel: params.fallbackModel,
      temperature: params.temperature,
      supportsTemperature: params.supportsTemperature,
      maxOutputTokens: params.maxOutputTokens,
      tools: params.tools,
      inputItems: round === 0 ? undefined : conversation,
    });

    promptTokens += result.promptTokens;
    completionTokens += result.completionTokens;
    modelUsed = result.modelUsed;
    usedFallback = result.usedFallback;
    text = result.text;

    const calls = result.toolCalls;
    if (calls.length === 0) {
      return {
        outcome: 'completed',
        text,
        promptTokens,
        completionTokens,
        modelUsed,
        usedFallback,
        rounds: round,
      };
    }

    if (round === RUNTIME_LIMITS.toolRounds) {
      return {
        outcome: 'failed',
        text,
        promptTokens,
        completionTokens,
        modelUsed,
        usedFallback,
        rounds: round,
        detail: `the model kept asking for tools after ${RUNTIME_LIMITS.toolRounds} rounds`,
      };
    }

    // WHY THE POLICY IS EVALUATED FOR EVERY CALL BEFORE ANY OF THEM RUNS
    //   A tool that needs a human decision must not run, and no other tool
    //   may run first either: the human is deciding about the whole action
    //   set, so the task parks before anything is executed.
    const decisions: Array<{
      call: ToolCall;
      allowed: boolean;
      requiresApproval: boolean;
      reason: string;
    }> = [];
    for (const call of calls) {
      const offered = params.tools.some((tool) => tool.name === call.name);
      if (!offered) {
        decisions.push({
          call,
          allowed: false,
          requiresApproval: false,
          reason: `${call.name} is not one of the tools this worker may use`,
        });
        continue;
      }
      const { data: integration } = await context.supabase
        .from('integrations')
        .select('support')
        .eq('key', call.name)
        .maybeSingle();
      const decision = evaluateToolCall({
        toolKey: call.name,
        actionType: call.name,
        workerPermissions: context.permissions,
        workspacePolicies: context.policies,
        integrationSupport: integration?.support ?? null,
      });

      // A human who already approved this action for this task has already
      // made the decision; the tool may run without parking again.
      if (decision.allowed && decision.requiresApproval && context.taskId) {
        const granted = await hasGrantedApproval({
          supabase: context.supabase,
          taskId: context.taskId,
          actionType: call.name,
        });
        if (granted) {
          decisions.push({
            call,
            allowed: true,
            requiresApproval: false,
            reason: 'a human already approved this action for this task',
          });
          continue;
        }
      }

      decisions.push({ call, ...decision });
    }

    const needsApproval = decisions.find((entry) => entry.allowed && entry.requiresApproval);
    if (needsApproval) {
      await emitEvent({
        ...context.events,
        kind: 'tool.approval_required',
        level: 'warn',
        message: `${needsApproval.call.name} needs a human decision before it runs`,
        payload: { tool: needsApproval.call.name, reason: needsApproval.reason },
      });
      return {
        outcome: 'approval_required',
        text,
        promptTokens,
        completionTokens,
        modelUsed,
        usedFallback,
        rounds: round,
        approval: {
          toolKey: needsApproval.call.name,
          args: needsApproval.call.arguments,
          reason: needsApproval.reason,
        },
      };
    }

    for (const entry of decisions) {
      const { call } = entry;

      if (!entry.allowed) {
        await emitEvent({
          ...context.events,
          kind: 'tool.denied',
          level: 'warn',
          message: entry.reason,
          payload: { tool: call.name },
        });
        conversation.push({
          type: 'function_call',
          call_id: call.callId,
          name: call.name,
          arguments: call.rawArguments,
        });
        conversation.push({
          type: 'function_call_output',
          call_id: call.callId,
          output: JSON.stringify({ ok: false, error: entry.reason }),
        });
        continue;
      }

      await emitEvent({
        ...context.events,
        kind: 'tool.started',
        level: 'info',
        message: `Running ${call.name}`,
        payload: { tool: call.name },
      });

      let outcome: ToolExecutionResult;
      try {
        outcome = await executeToolCall({
          supabase: context.supabase,
          toolKey: call.name,
          args: call.arguments,
          workerId: context.workerId,
          ownerClerkId: context.ownerClerkId,
          taskId: context.taskId,
          runId: context.runId,
          workspaceId: context.workspaceId ?? null,
          permissions: context.permissions,
          serviceToken: context.serviceToken,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outcome = { ok: false, code: 'internal', error: message };
      }

      await emitEvent({
        ...context.events,
        kind: outcome.ok ? 'tool.completed' : 'tool.failed',
        level: outcome.ok ? 'success' : 'error',
        message: outcome.ok ? `${call.name} finished` : `${call.name} failed`,
        payload: { tool: call.name, error: outcome.ok ? null : outcome.error ?? null },
      });

      conversation.push({
        type: 'function_call',
        call_id: call.callId,
        name: call.name,
        arguments: call.rawArguments,
      });
      conversation.push({
        type: 'function_call_output',
        call_id: call.callId,
        output: formatToolOutput(outcome),
      });
    }
  }

  return {
    outcome: 'failed',
    text,
    promptTokens,
    completionTokens,
    modelUsed,
    usedFallback,
    rounds: RUNTIME_LIMITS.toolRounds,
    detail: 'the tool loop did not converge',
  };
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
