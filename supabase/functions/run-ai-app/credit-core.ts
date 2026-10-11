// supabase/functions/run-ai-app/credit-core.ts
//
// Pure, dependency-injected core of the credit-enforcement logic shared by the
// run-ai-app and proxy-openai edge functions.
//
// WHY THIS FILE EXISTS
//   The edge-function entrypoints import Deno-only modules (` Deno.env`,
//   `https://deno.land/std/http/server.ts`, `npm:@supabase/server`) and call
//   `serve()`, so they cannot be imported by the vitest suite. Every
//   money-critical decision lives here as a pure function with injected
//   side effects (an `rpc` callable, a `charge` callback, a logger), so the
//   credit gate, the SSE billing parser, and the deduction contract can be
//   proven by tests instead of inspection.
//
// SECURITY CONTRACT (mirrors the header of run-ai-app/index.ts):
//  1. Identity comes ONLY from verified JWT claims — never the request body,
//     query string, or headers beyond the verified token itself.
//  2. The credit gate (402) always precedes any provider call; an unpriced
//     model can never reach a provider because it is refused first.
//  3. Post-call billing is computed from real provider token usage. Cached
//     input tokens are reported for the ledger but billed at the full input
//     rate (conservative; see docs/completion/runtime-credit-audit.md).
//  4. A stream is charged at most once: `createBillingTee` guards finalize
//     with a synchronous `settled` flag shared by flush and cancel.
//  5. Nothing is charged when the provider produced no bytes or ended the
//     stream with a terminal error event (no spend -> no charge).
//  6. Deduction is delegated to the `credits.deduct_credits` RPC, which is
//     the single atomic (DB-side) mutation point. This module never performs
//     read-modify-write on balances itself.

import {
  calculateRealtimeCredits,
  calculateUsageCredits,
} from "../_shared/creditRates.ts";

export const INSUFFICIENT_CREDITS_CODE = "INSUFFICIENT_CREDITS";
export const MODEL_NOT_PRICED_CODE = "MODEL_NOT_PRICED";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Shape of the verified-auth context returned by
 * `createSupabaseContext(req, { auth: "user" })` (npm:@supabase/server).
 * Only claim fields are read — the request itself is never consulted, so a
 * client-supplied identity in the body/query cannot reach the caller.
 */
export interface VerifiedAuthContextLike {
  jwtClaims?: Record<string, unknown> | null;
  userClaims?: Record<string, unknown> | null;
}

/**
 * Derive the billed user id from VERIFIED claims only.
 *
 * Returns null when no usable claim exists (the caller must then refuse the
 * request). Extra properties on the context object (e.g. anything echoing a
 * request body) are deliberately ignored: only `jwtClaims.sub` (Clerk sub for
 * Clerk-issued JWTs) or `userClaims.id` is trusted.
 */
export function deriveUserIdFromVerifiedContext(
  ctx: VerifiedAuthContextLike | null | undefined,
): string | null {
  const sub = ctx?.jwtClaims?.sub;
  if (typeof sub === "string" && sub.length > 0) return sub;

  const id = ctx?.userClaims?.id;
  if (typeof id === "string" && id.length > 0) return id;

  return null;
}

/**
 * The only token the WebSocket upgrade path will verify. Browser WebSockets
 * cannot attach an Authorization header, so the verified token is passed as a
 * query parameter; it is verified server-side exactly like a bearer token
 * (see authenticateRequest in index.ts) before the socket is accepted.
 */
export function extractUpgradeToken(url: URL): string | null {
  return url.searchParams.get("access_token") ?? url.searchParams.get("token");
}

// ---------------------------------------------------------------------------
// Request classification (HTTP vs WebSocket upgrade)
// ---------------------------------------------------------------------------

export type IncomingRequestKind =
  | { kind: "http" }
  | { kind: "ws_realtime" }
  | { kind: "ws_unsupported" };

/**
 * Classify an incoming request. A generic (non-realtime) WebSocket upgrade is
 * refused with 426 by the caller: accepting it would be an OpenAI-spend
 * bypass, because browser WS callers cannot present the verified identity.
 */
export function classifyIncomingRequest(params: {
  upgradeHeader: string | null;
  url: URL;
}): IncomingRequestKind {
  if ((params.upgradeHeader ?? "").toLowerCase() !== "websocket") {
    return { kind: "http" };
  }
  if (params.url.searchParams.get("mode") === "realtime") {
    return { kind: "ws_realtime" };
  }
  return { kind: "ws_unsupported" };
}

// ---------------------------------------------------------------------------
// Credit gate (preflight)
// ---------------------------------------------------------------------------

export interface InsufficientCreditsBody {
  error: typeof INSUFFICIENT_CREDITS_CODE;
  message: string;
  required: number;
  balance: number;
  model: string;
}

/** Machine-readable 402 body: stable `error` code plus remediation hint. */
export function insufficientCreditsBody(params: {
  required: number;
  balance: number;
  model: string;
  message?: string;
}): InsufficientCreditsBody {
  return {
    error: INSUFFICIENT_CREDITS_CODE,
    message:
      params.message ??
      "Not enough credits to run this AI app. Purchase more credits to continue.",
    required: params.required,
    balance: params.balance,
    model: params.model,
  };
}

export function creditGateHeaders(params: {
  balance: number;
  required: number;
}): Record<string, string> {
  return {
    "X-Credits-Balance": String(params.balance),
    "X-Credits-Required": String(params.required),
  };
}

export type CreditGateResult =
  | { ok: true }
  | {
      ok: false;
      status: 402 | 500;
      body: Record<string, unknown>;
      headers: Record<string, string>;
    };

/**
 * The preflight decision taken BEFORE any provider call.
 *
 * Order matters:
 *  1. A balance-read failure fails closed (500) — never guess a balance.
 *  2. An unpriced model is refused (500 MODEL_NOT_PRICED) — its usage could
 *     never be billed, so letting it run would be uncharged spend.
 *  3. balance < required estimate -> 402 INSUFFICIENT_CREDITS with headers.
 */
export function evaluateCreditGate(input: {
  balanceError?: string | null;
  balance: number;
  requiredCredits: number;
  model: string;
  modelSupported: boolean;
  appSlug?: string;
}): CreditGateResult {
  if (input.balanceError) {
    return {
      ok: false,
      status: 500,
      body: { error: "CREDIT_BALANCE_UNAVAILABLE", message: "Failed to check credit balance" },
      headers: {},
    };
  }

  if (!input.modelSupported) {
    return {
      ok: false,
      status: 500,
      body: {
        error: MODEL_NOT_PRICED_CODE,
        message: "Model pricing is not configured for this app",
        ...(input.appSlug ? { appSlug: input.appSlug } : {}),
        model: input.model,
      },
      headers: {},
    };
  }

  if (input.balance < input.requiredCredits) {
    return {
      ok: false,
      status: 402,
      body: insufficientCreditsBody({
        required: input.requiredCredits,
        balance: input.balance,
        model: input.model,
      }),
      headers: creditGateHeaders({ balance: input.balance, required: input.requiredCredits }),
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// SSE usage parsing
// ---------------------------------------------------------------------------

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  /**
   * Cached input tokens reported by the provider (OpenAI:
   * `input_tokens_details.cached_tokens` / `prompt_tokens_details.cached_tokens`).
   * NOTE: `inputTokens` already INCLUDES cached tokens, so cached tokens are
   * never added on top; they are captured for the ledger only.
   */
  cachedInputTokens: number;
}

export interface SseParseState extends ProviderUsage {
  /** A terminal usage event (`response.completed` / chat final chunk) was seen. */
  sawUsage: boolean;
  /** At least one non-empty byte arrived from the provider. */
  sawAnyChunk: boolean;
  /** The stream ended with a terminal error event (`error` / `response.failed`). */
  sawErrorEvent: boolean;
  sawDone: boolean;
}

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Extract token usage from a parsed SSE payload.
 *
 * Accepts both shapes the two functions proxy:
 *  - Responses API: `{ type: "response.completed", response: { usage } }`
 *  - Chat Completions: `{ usage }` (final chunk, `stream_options.include_usage`)
 *
 * Returns null for anything that is not a *successful terminal* usage event
 * (keep-alives, deltas, and terminal error events).
 */
export function extractUsageFromEvent(event: unknown): ProviderUsage | null {
  if (!event || typeof event !== "object") return null;
  const record = event as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : undefined;

  // Terminal error/failure events are never billable usage (Responses API
  // `error`/`response.failed` events plus Chat Completions `{ error }` frames).
  if (isTerminalErrorEvent(event)) return null;

  const usage = (record.response as Record<string, unknown> | undefined)?.usage ??
    (record.usage as Record<string, unknown> | undefined);
  if (!usage || typeof usage !== "object") return null;
  const usageRecord = usage as Record<string, unknown>;

  const isTerminal =
    type === undefined || // chat-completions final chunk (no `type` field)
    type === "response.completed" ||
    type === "response.done" ||
    type === "response.incomplete";
  if (!isTerminal) return null;

  const inputTokens = toFiniteNumber(usageRecord.input_tokens ?? usageRecord.prompt_tokens);
  const outputTokens = toFiniteNumber(usageRecord.output_tokens ?? usageRecord.completion_tokens);

  const cachedInputTokens = toFiniteNumber(
    (usageRecord.input_tokens_details as Record<string, unknown> | undefined)?.cached_tokens ??
      (usageRecord.prompt_tokens_details as Record<string, unknown> | undefined)?.cached_tokens,
  );

  return { inputTokens, outputTokens, cachedInputTokens };
}

/**
 * True when a parsed SSE payload is a terminal error event. Covers the
 * Responses API shape (`type: "error"` / `type: "response.failed"`) and the
 * Chat Completions shape (a top-level `error` object). Terminal errors are
 * never billed.
 */
export function isTerminalErrorEvent(event: unknown): boolean {
  if (!event || typeof event !== 'object') return false;
  const record = event as Record<string, unknown>;
  if (record.type === 'error' || record.type === 'response.failed') return true;
  const error = record.error;
  return error !== undefined && error !== null;
}

/**
 * Incremental SSE scanner. Feed it the provider's byte stream (any chunk
 * boundaries); it buffers partial frames and records the terminal usage
 * event, whether any bytes arrived, and whether the stream errored.
 */
export class SseUsageParser {
  private decoder = new TextDecoder();
  private buffer = "";
  private state: SseParseState = {
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    sawUsage: false,
    sawAnyChunk: false,
    sawErrorEvent: false,
    sawDone: false,
  };

  getState(): SseParseState {
    return { ...this.state };
  }

  /** Feed a decoded text chunk (string form, used by tests and flush). */
  pushText(text: string): void {
    if (text.length === 0) return;
    this.state.sawAnyChunk = true;
    this.buffer += text;
    this.drainFrames();
  }

  /** Feed raw provider bytes. */
  pushBytes(bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    this.state.sawAnyChunk = true;
    this.buffer += this.decoder.decode(bytes, { stream: true });
    this.drainFrames();
  }

  /** Flush the decoder and parse any trailing frame without a blank line. */
  finish(): void {
    try {
      this.buffer += this.decoder.decode();
    } catch {
      // decoder flush failures are non-fatal for billing
    }
    this.drainFrames();
    const trailing = this.buffer.trim();
    this.buffer = "";
    if (trailing) this.parseFrame(trailing);
  }

  private drainFrames(): void {
    // SSE frames are separated by a blank line; support LF and CRLF framing.
    let match = /\r?\n\r?\n/.exec(this.buffer);
    while (match) {
      const frame = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      this.parseFrame(frame);
      match = /\r?\n\r?\n/.exec(this.buffer);
    }
  }

  private parseFrame(frame: string): void {
    for (const rawLine of frame.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      if (payload === "[DONE]") {
        this.state.sawDone = true;
        continue;
      }
      try {
        const event = JSON.parse(payload);
        if (isTerminalErrorEvent(event)) {
          this.state.sawErrorEvent = true;
          continue;
        }
        const usage = extractUsageFromEvent(event);
        if (usage) {
          this.state.sawUsage = true;
          this.state.inputTokens = usage.inputTokens;
          this.state.outputTokens = usage.outputTokens;
          this.state.cachedInputTokens = usage.cachedInputTokens;
        }
      } catch {
        // Partial / keep-alive frames are expected mid-stream; ignore.
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Billing decision for streamed runs
// ---------------------------------------------------------------------------

export type StreamChargeReason =
  | "exact_usage"
  | "partial_estimate"
  | "no_bytes_no_charge"
  | "error_event_no_charge";

export interface StreamChargeDecision {
  shouldCharge: boolean;
  credits: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reason: StreamChargeReason;
}

/**
 * Decide what a finished (or aborted) stream is billed.
 *
 *  - Terminal usage seen          -> exact usage credits (floor of 1).
 *  - Bytes consumed but no usage  -> conservative pre-flight estimate: the
 *                                    provider generated partial output, so
 *                                    spend must never be silently free.
 *  - Zero bytes from the provider -> NO charge (connection failed before any
 *                                    provider usage).
 *  - Terminal error event         -> NO charge (provider error responses are
 *                                    never billed).
 */
export function decideStreamCharge(input: {
  parserState: SseParseState;
  model: string;
  estimatedCredits: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}): StreamChargeDecision {
  const state = input.parserState;

  if (state.sawUsage) {
    const usageCredits = calculateUsageCredits(
      input.model,
      state.inputTokens,
      state.outputTokens,
    );
    return {
      shouldCharge: true,
      credits: Math.max(usageCredits, 1),
      inputTokens: state.inputTokens,
      outputTokens: state.outputTokens,
      cachedInputTokens: state.cachedInputTokens,
      reason: "exact_usage",
    };
  }

  if (state.sawErrorEvent) {
    return {
      shouldCharge: false,
      credits: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      reason: "error_event_no_charge",
    };
  }

  if (!state.sawAnyChunk) {
    return {
      shouldCharge: false,
      credits: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      reason: "no_bytes_no_charge",
    };
  }

  return {
    shouldCharge: true,
    credits: input.estimatedCredits,
    inputTokens: input.estimatedInputTokens,
    outputTokens: input.estimatedOutputTokens,
    cachedInputTokens: 0,
    reason: "partial_estimate",
  };
}

// ---------------------------------------------------------------------------
// Billing tee
// ---------------------------------------------------------------------------

export interface StreamBill {
  credits: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reason: StreamChargeReason;
}

/**
 * Tee an SSE stream: every chunk is forwarded to the client byte-for-byte
 * FIRST (billing must never delay output) while `SseUsageParser` watches for
 * the terminal usage event. The stream is charged exactly once, on flush
 * (normal end) or cancel (client disconnect), via the injected `charge`
 * callback. The synchronous `settled` flag guarantees flush+cancel races can
 * never double-bill.
 */
export function createBillingTee(params: {
  charge: (bill: StreamBill) => void | Promise<void>;
  model: string;
  estimatedCredits: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  onDecision?: (decision: StreamChargeDecision) => void;
}): TransformStream<Uint8Array, Uint8Array> {
  const parser = new SseUsageParser();
  let settled = false;

  const finalize = async (): Promise<void> => {
    if (settled) return;
    settled = true;

    parser.finish();
    const decision = decideStreamCharge({
      parserState: parser.getState(),
      model: params.model,
      estimatedCredits: params.estimatedCredits,
      estimatedInputTokens: params.estimatedInputTokens,
      estimatedOutputTokens: params.estimatedOutputTokens,
    });
    params.onDecision?.(decision);

    if (!decision.shouldCharge || decision.credits <= 0) return;

    await params.charge({
      credits: decision.credits,
      inputTokens: decision.inputTokens,
      outputTokens: decision.outputTokens,
      cachedInputTokens: decision.cachedInputTokens,
      reason: decision.reason,
    });
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Forward to the client first: billing must never delay output.
      controller.enqueue(chunk);
      parser.pushBytes(chunk);
    },

    async flush() {
      await finalize();
    },

    async cancel() {
      // Client disconnected early (or upstream errored): still settle billing
      // exactly once for whatever the provider actually consumed.
      await finalize();
    },
  });
}

// ---------------------------------------------------------------------------
// Deduction (atomic RPC contract)
// ---------------------------------------------------------------------------

/** Minimal RPC surface: `credits`-schema PostgREST `.rpc()`. */
export type RpcCaller = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ error?: { message?: string } | null } | null>;

export interface DeductUsageCreditsParams {
  rpc: RpcCaller;
  userId: string;
  appId: string;
  appSlug: string;
  model: string;
  credits: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  source?: string;
  /** Ledger idempotency/audit key; defaults to `${appSlug}:${nowMs}`. */
  sourceId?: string;
  nowMs?: number;
  log?: (message: string) => void;
}

/**
 * Deduct credits for a completed call through the atomic `deduct_credits`
 * RPC. Never throws: a ledger outage is logged loudly (and reported to the
 * caller as a zero deduction) so billing failures cannot take down the
 * user-facing response. Atomicity under concurrency is the RPC's job — this
 * function issues exactly ONE RPC call per billable run and performs no
 * read-modify-write of its own.
 *
 * Returns the credits actually charged (0 when nothing was charged).
 */
export async function deductUsageCredits(
  params: DeductUsageCreditsParams,
): Promise<number> {
  if (!Number.isFinite(params.credits) || params.credits <= 0) return 0;

  const log = params.log ?? ((message: string) => console.error(message));
  const sourceId =
    params.sourceId ?? `${params.appSlug}:${params.nowMs ?? Date.now()}`;

  try {
    const { error } = (await params.rpc("deduct_credits", {
      p_user_id: params.userId,
      p_app_id: params.appId,
      p_amount: Math.round(params.credits),
      p_type: "api_usage",
      p_source: params.source ?? "run_ai_app",
      p_source_id: sourceId,
      p_metadata: {
        app_slug: params.appSlug,
        model: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cached_input_tokens: params.cachedInputTokens ?? 0,
      },
    })) ?? {};

    if (error) {
      const message = error.message ?? "unknown error";
      if (/insufficient/i.test(message)) {
        // The balance could not cover this bill (concurrency drained it, or
        // the pre-flight estimate was optimistic). Spend already happened, so
        // this must be reconciled from the ledger — log it loudly.
        log(
          `CREDIT_SHORTFALL user=${params.userId} app=${params.appSlug} ` +
            `model=${params.model} credits=${params.credits} rpc_error=${message}`,
        );
      } else {
        log(`Failed to deduct credits: ${message}`);
      }
      return 0;
    }

    return Math.round(params.credits);
  } catch (err) {
    log(`deductUsageCredits error: ${err instanceof Error ? err.message : String(err)}`);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Realtime session billing
// ---------------------------------------------------------------------------

/**
 * Credits for one realtime voice session window (billed per connected
 * minute, rounded up). Returns 0 for degenerate windows (never-opened or
 * clock-skewed sessions) so a socket that never really connected is free.
 */
export function computeRealtimeCreditsFromWindow(
  startedAtMs: number | null,
  endedAtMs: number,
): number {
  if (startedAtMs === null || !Number.isFinite(startedAtMs)) return 0;
  const seconds = (endedAtMs - startedAtMs) / 1000;
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return calculateRealtimeCredits(seconds);
}
