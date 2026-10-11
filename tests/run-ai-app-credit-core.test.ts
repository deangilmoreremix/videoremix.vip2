/**
 * tests/run-ai-app-credit-core.test.ts
 *
 * Unit proofs for the pure credit-enforcement core shared by the run-ai-app
 * and proxy-openai edge functions (supabase/functions/run-ai-app/credit-core.ts)
 * plus the credit rate tables (supabase/functions/_shared/creditRates.ts vs
 * src/lib/credit-math.ts).
 *
 * The Deno entrypoints themselves (`serve(...)`, `Deno.env`,
 * `npm:@supabase/server`) cannot be imported under vitest, so every
 * money-critical decision is exercised here through the pure core with
 * injected side effects. Supabase/OpenAI are fully mocked; no network.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  INSUFFICIENT_CREDITS_CODE,
  MODEL_NOT_PRICED_CODE,
  SseUsageParser,
  classifyIncomingRequest,
  computeRealtimeCreditsFromWindow,
  createBillingTee,
  decideStreamCharge,
  deductUsageCredits,
  deriveUserIdFromVerifiedContext,
  evaluateCreditGate,
  extractUpgradeToken,
  extractUsageFromEvent,
  insufficientCreditsBody,
  isTerminalErrorEvent,
  type RpcCaller,
  type SseParseState,
} from '../supabase/functions/run-ai-app/credit-core.ts';
import {
  CREDITS_PER_DOLLAR,
  DALLE_CREDITS_PER_IMAGE,
  MODEL_CREDIT_RATES,
  REALTIME_CREDITS_PER_MINUTE,
  WHISPER_CREDITS_PER_MINUTE,
  calculateRealtimeCredits,
  calculateUsageCredits,
  creditsForTokens,
  estimateRequestCredits,
  isSupportedModel,
} from '../supabase/functions/_shared/creditRates.ts';
import {
  MODEL_CREDIT_RATES as CLIENT_MODEL_CREDIT_RATES,
  CREDITS_PER_DOLLAR as CLIENT_CREDITS_PER_DOLLAR,
  DALLE_CREDITS_PER_IMAGE as CLIENT_DALLE_CREDITS_PER_IMAGE,
  WHISPER_CREDITS_PER_MINUTE as CLIENT_WHISPER_CREDITS_PER_MINUTE,
  calculateCreditsForUsage,
} from '../src/lib/credit-math';

const MODEL = 'gpt-5.5';

function encodeSse(frames: string[]): Uint8Array {
  return new TextEncoder().encode(frames.map((f) => `data: ${f}\n\n`).join(''));
}

function baseParserState(overrides: Partial<SseParseState> = {}): SseParseState {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    sawUsage: false,
    sawAnyChunk: false,
    sawErrorEvent: false,
    sawDone: false,
    ...overrides,
  };
}

describe('run-ai-app credit core: verified identity', () => {
  it('derives the billed user id from the verified JWT sub only', () => {
    expect(deriveUserIdFromVerifiedContext({ jwtClaims: { sub: 'user_2abc' } })).toBe('user_2abc');
  });

  it('falls back to userClaims.id when jwtClaims.sub is absent', () => {
    expect(deriveUserIdFromVerifiedContext({ userClaims: { id: 'user_2xyz' } })).toBe('user_2xyz');
  });

  it('returns null when no verified claim exists (caller must refuse)', () => {
    expect(deriveUserIdFromVerifiedContext(null)).toBeNull();
    expect(deriveUserIdFromVerifiedContext({})).toBeNull();
    expect(deriveUserIdFromVerifiedContext({ jwtClaims: {} })).toBeNull();
    expect(deriveUserIdFromVerifiedContext({ jwtClaims: { sub: '' } })).toBeNull();
    expect(deriveUserIdFromVerifiedContext({ jwtClaims: { sub: 42 } })).toBeNull();
    expect(deriveUserIdFromVerifiedContext({ userClaims: { id: null } })).toBeNull();
  });

  it('never trusts unverified fields such as a request body or user_id echo', () => {
    // Even if some upstream object echoes client-supplied values, only claims
    // are read: a body-supplied `userId` must not become the billed identity.
    const ctx = {
      jwtClaims: { sub: 'user_verified' },
      userClaims: { id: 'user_verified' },
      body: { userId: 'user_attacker' },
      userId: 'user_attacker',
    } as unknown as Parameters<typeof deriveUserIdFromVerifiedContext>[0];
    expect(deriveUserIdFromVerifiedContext(ctx)).toBe('user_verified');
  });
});

describe('run-ai-app credit core: WebSocket upgrade classification', () => {
  const url = (search = '') => new URL(`https://example.com/functions/v1/run-ai-app${search}`);

  it('treats plain HTTP requests as http', () => {
    expect(classifyIncomingRequest({ upgradeHeader: null, url: url() })).toEqual({ kind: 'http' });
  });

  it('refuses non-realtime WebSocket upgrades (426 spend-bypass guard)', () => {
    expect(classifyIncomingRequest({ upgradeHeader: 'websocket', url: url() })).toEqual({
      kind: 'ws_unsupported',
    });
    expect(
      classifyIncomingRequest({ upgradeHeader: 'websocket', url: url('?mode=chat') }),
    ).toEqual({ kind: 'ws_unsupported' });
  });

  it('allows only mode=realtime upgrades through to the verified-identity path', () => {
    expect(
      classifyIncomingRequest({ upgradeHeader: 'WebSocket', url: url('?mode=realtime') }),
    ).toEqual({ kind: 'ws_realtime' });
    expect(
      classifyIncomingRequest({ upgradeHeader: 'websocket', url: url('?mode=REALTIME') }),
    ).toEqual({ kind: 'ws_unsupported' });
  });

  it('extracts the WS verification token from the query string only', () => {
    expect(extractUpgradeToken(url('?mode=realtime&access_token=tok_1'))).toBe('tok_1');
    expect(extractUpgradeToken(url('?mode=realtime&token=tok_2'))).toBe('tok_2');
    expect(extractUpgradeToken(url('?mode=realtime'))).toBeNull();
  });
});

describe('run-ai-app credit core: preflight credit gate (402 before any provider call)', () => {
  it('passes when the balance covers the conservative estimate', () => {
    const gate = evaluateCreditGate({
      balance: 100_000,
      requiredCredits: 10_000,
      model: MODEL,
      modelSupported: true,
    });
    expect(gate.ok).toBe(true);
  });

  it('refuses with a machine-readable 402 body when the balance is insufficient', () => {
    const gate = evaluateCreditGate({
      balance: 500,
      requiredCredits: 10_000,
      model: MODEL,
      modelSupported: true,
    });
    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.status).toBe(402);
    expect(gate.body.error).toBe(INSUFFICIENT_CREDITS_CODE);
    expect(gate.body).toMatchObject({ required: 10_000, balance: 500, model: MODEL });
    expect(typeof gate.body.message).toBe('string');
    expect(gate.headers['X-Credits-Balance']).toBe('500');
    expect(gate.headers['X-Credits-Required']).toBe('10000');
  });

  it('refuses unpriced models before any spend (500 MODEL_NOT_PRICED)', () => {
    const gate = evaluateCreditGate({
      balance: 10_000_000,
      requiredCredits: 1,
      model: 'gpt-3.5-turbo',
      modelSupported: false,
      appSlug: 'some-app',
    });
    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.status).toBe(500);
    expect(gate.body.error).toBe(MODEL_NOT_PRICED_CODE);
    expect(gate.body.model).toBe('gpt-3.5-turbo');
  });

  it('fails closed (500) when the balance cannot be read', () => {
    const gate = evaluateCreditGate({
      balanceError: 'connection reset',
      balance: 0,
      requiredCredits: 10,
      model: MODEL,
      modelSupported: true,
    });
    expect(gate.ok).toBe(false);
    if (gate.ok) return;
    expect(gate.status).toBe(500);
    expect(gate.body.error).toBe('CREDIT_BALANCE_UNAVAILABLE');
  });

  it('a zero balance can never pass: the estimate floor is at least 1 credit', () => {
    expect(estimateRequestCredits(MODEL, 0, 0)).toBeGreaterThanOrEqual(1);
    const gate = evaluateCreditGate({
      balance: 0,
      requiredCredits: estimateRequestCredits(MODEL, 0, 0),
      model: MODEL,
      modelSupported: true,
    });
    expect(gate.ok).toBe(false);
  });

  it('insufficientCreditsBody exposes a stable machine-readable error code', () => {
    const body = insufficientCreditsBody({ required: 42, balance: 7, model: MODEL });
    expect(body.error).toBe(INSUFFICIENT_CREDITS_CODE);
    expect(body).toEqual({
      error: INSUFFICIENT_CREDITS_CODE,
      message: expect.any(String),
      required: 42,
      balance: 7,
      model: MODEL,
    });
  });
});

describe('run-ai-app credit core: provider usage extraction', () => {
  it('maps Responses API response.completed usage', () => {
    const usage = extractUsageFromEvent({
      type: 'response.completed',
      response: { usage: { input_tokens: 1200, output_tokens: 340 } },
    });
    expect(usage).toEqual({ inputTokens: 1200, outputTokens: 340, cachedInputTokens: 0 });
  });

  it('maps chat-completions final-chunk usage', () => {
    const usage = extractUsageFromEvent({
      usage: { prompt_tokens: 90, completion_tokens: 12 },
    });
    expect(usage).toEqual({ inputTokens: 90, outputTokens: 12, cachedInputTokens: 0 });
  });

  it('captures cached input tokens without double counting them on top of input_tokens', () => {
    const usage = extractUsageFromEvent({
      type: 'response.completed',
      response: {
        usage: {
          input_tokens: 1000,
          output_tokens: 200,
          input_tokens_details: { cached_tokens: 800 },
        },
      },
    });
    expect(usage).toEqual({ inputTokens: 1000, outputTokens: 200, cachedInputTokens: 800 });
    // Billing uses input_tokens (which already includes the cached 800):
    // cached tokens must never be added again.
    const billed = calculateUsageCredits(MODEL, usage!.inputTokens, usage!.outputTokens);
    const doubleCounted = calculateUsageCredits(
      MODEL,
      usage!.inputTokens + usage!.cachedInputTokens,
      usage!.outputTokens,
    );
    expect(billed).toBe(creditsForTokens(1000, 500_000) + creditsForTokens(200, 3_000_000));
    expect(doubleCounted).toBeGreaterThan(billed);
  });

  it('ignores non-terminal events (deltas, keep-alives, in-progress)', () => {
    expect(extractUsageFromEvent({ type: 'response.output_text.delta', delta: 'hi' })).toBeNull();
    expect(
      extractUsageFromEvent({ type: 'response.in_progress', response: { usage: null } }),
    ).toBeNull();
    expect(extractUsageFromEvent({ type: 'response.created' })).toBeNull();
    expect(extractUsageFromEvent(null)).toBeNull();
    expect(extractUsageFromEvent('not an object')).toBeNull();
  });

  it('never treats terminal error events as billable usage', () => {
    expect(isTerminalErrorEvent({ type: 'error', message: 'rate limited' })).toBe(true);
    expect(isTerminalErrorEvent({ type: 'response.failed' })).toBe(true);
    // Chat Completions streams errors as a top-level `error` object.
    expect(isTerminalErrorEvent({ error: { message: 'rate limited' } })).toBe(true);
    expect(isTerminalErrorEvent({ type: 'response.completed' })).toBe(false);
    expect(isTerminalErrorEvent({ usage: { prompt_tokens: 1 } })).toBe(false);
    expect(isTerminalErrorEvent({ error: null })).toBe(false);
    expect(
      extractUsageFromEvent({ type: 'error', message: 'boom', response: { usage: { input_tokens: 5 } } }),
    ).toBeNull();
    expect(
      extractUsageFromEvent({
        type: 'response.failed',
        response: { usage: { input_tokens: 5, output_tokens: 5 } },
      }),
    ).toBeNull();
    expect(
      extractUsageFromEvent({ error: { message: 'boom' }, usage: { prompt_tokens: 5 } }),
    ).toBeNull();
  });

  it('tolerates missing/zero usage fields', () => {
    const usage = extractUsageFromEvent({ type: 'response.completed', response: { usage: {} } });
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 });
  });
});

describe('run-ai-app credit core: SSE parser', () => {
  it('parses usage split across arbitrary chunk boundaries', () => {
    const parser = new SseUsageParser();
    const bytes = encodeSse([
      JSON.stringify({ type: 'response.output_text.delta', delta: 'hello' }),
      JSON.stringify({
        type: 'response.completed',
        response: { usage: { input_tokens: 700, output_tokens: 150 } },
      }),
      '[DONE]',
    ]);
    // Feed one byte at a time to exercise frame reassembly.
    for (const byte of bytes) parser.pushBytes(new Uint8Array([byte]));
    parser.finish();

    const state = parser.getState();
    expect(state.sawUsage).toBe(true);
    expect(state.inputTokens).toBe(700);
    expect(state.outputTokens).toBe(150);
    expect(state.sawAnyChunk).toBe(true);
    expect(state.sawDone).toBe(true);
    expect(state.sawErrorEvent).toBe(false);
  });

  it('parses CRLF-framed streams and records terminal error events', () => {
    const parser = new SseUsageParser();
    parser.pushText(
      'event: error\r\ndata: {"type":"error","message":"rate limit"}\r\n\r\n',
    );
    parser.finish();
    const state = parser.getState();
    expect(state.sawErrorEvent).toBe(true);
    expect(state.sawUsage).toBe(false);
  });

  it('records that bytes arrived even when no usage event is present', () => {
    const parser = new SseUsageParser();
    parser.pushText('data: {"type":"response.output_text.delta","delta":"partial"}\n\n');
    parser.finish();
    const state = parser.getState();
    expect(state.sawAnyChunk).toBe(true);
    expect(state.sawUsage).toBe(false);
    expect(state.sawErrorEvent).toBe(false);
  });

  it('flags chat-completions style error frames as terminal errors', () => {
    const parser = new SseUsageParser();
    parser.pushText('data: {"error":{"message":"rate limited","type":"rate_limit"}}\n\n');
    parser.finish();
    const state = parser.getState();
    expect(state.sawErrorEvent).toBe(true);
    expect(state.sawUsage).toBe(false);
  });

  it('ignores malformed JSON frames without throwing', () => {
    const parser = new SseUsageParser();
    expect(() => {
      parser.pushText('data: {"type":"response.completed"\n\n'); // truncated JSON
      parser.finish();
    }).not.toThrow();
    expect(parser.getState().sawUsage).toBe(false);
  });
});

describe('run-ai-app credit core: streamed billing decision', () => {
  const base = {
    model: MODEL,
    estimatedCredits: 12_345,
    estimatedInputTokens: 400,
    estimatedOutputTokens: 1_000,
  };

  it('bills exact usage when the terminal usage event arrived', () => {
    const decision = decideStreamCharge({
      ...base,
      parserState: baseParserState({
        sawUsage: true,
        sawAnyChunk: true,
        inputTokens: 1000,
        outputTokens: 200,
      }),
    });
    expect(decision.reason).toBe('exact_usage');
    expect(decision.shouldCharge).toBe(true);
    expect(decision.credits).toBe(
      Math.max(calculateUsageCredits(MODEL, 1000, 200), 1),
    );
    expect(decision.inputTokens).toBe(1000);
    expect(decision.outputTokens).toBe(200);
  });

  it('bills the conservative estimate when a partial stream was consumed (abort mid-stream)', () => {
    const decision = decideStreamCharge({
      ...base,
      parserState: baseParserState({ sawAnyChunk: true }),
    });
    expect(decision.reason).toBe('partial_estimate');
    expect(decision.shouldCharge).toBe(true);
    expect(decision.credits).toBe(12_345);
  });

  it('charges nothing when the provider delivered zero bytes (connection failure)', () => {
    const decision = decideStreamCharge({
      ...base,
      parserState: baseParserState(),
    });
    expect(decision.reason).toBe('no_bytes_no_charge');
    expect(decision.shouldCharge).toBe(false);
    expect(decision.credits).toBe(0);
  });

  it('charges nothing when the stream ended with a terminal error event', () => {
    const decision = decideStreamCharge({
      ...base,
      parserState: baseParserState({ sawAnyChunk: true, sawErrorEvent: true }),
    });
    expect(decision.reason).toBe('error_event_no_charge');
    expect(decision.shouldCharge).toBe(false);
  });

  it('prefers exact usage if usage arrived before any later error marker', () => {
    const decision = decideStreamCharge({
      ...base,
      parserState: baseParserState({ sawUsage: true, sawAnyChunk: true, sawErrorEvent: true, inputTokens: 10, outputTokens: 5 }),
    });
    expect(decision.reason).toBe('exact_usage');
  });
});

describe('run-ai-app credit core: billing tee', () => {
  async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let out = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    out += decoder.decode();
    return out;
  }

  const teeParams = {
    model: MODEL,
    estimatedCredits: 9_999,
    estimatedInputTokens: 300,
    estimatedOutputTokens: 800,
  };

  it('forwards the provider stream byte-for-byte and bills exact usage once', async () => {
    const charges: Array<{ credits: number; reason: string }> = [];
    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        charges.push({ credits: bill.credits, reason: bill.reason });
      },
    });

    const frames = [
      'data: {"type":"response.output_text.delta","delta":"hello"}\n\n',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":1000,"output_tokens":200}}}\n\n',
      'data: [DONE]\n\n',
    ];
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) controller.enqueue(new TextEncoder().encode(frame));
        controller.close();
      },
    });

    const forwarded = await readAll(source.pipeThrough(tee));
    expect(forwarded).toBe(frames.join(''));

    // flush has run by the time the readable closed
    expect(charges).toHaveLength(1);
    expect(charges[0].reason).toBe('exact_usage');
    expect(charges[0].credits).toBe(calculateUsageCredits(MODEL, 1000, 200));
  });

  it('bills exactly once when flush and cancel race', async () => {
    const charges: number[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        await gate; // hold the first charge open so cancel can interleave
        charges.push(bill.credits);
      },
    });

    // NOTE: the write is not awaited before the read — a TransformStream's
    // write promise only settles once its chunk is consumed (backpressure).
    const writer = tee.writable.getWriter();
    const reader = tee.readable.getReader();
    const writePromise = writer.write(
      new TextEncoder().encode(
        'data: {"type":"response.completed","response":{"usage":{"input_tokens":10,"output_tokens":2}}}\n\n',
      ),
    );
    await reader.read();
    await writePromise;

    const cancelPromise = reader.cancel(); // cancel -> finalize (blocked in charge)
    const closePromise = writer.close(); // flush -> finalize (already settled)
    release();
    await Promise.all([cancelPromise, closePromise]);

    expect(charges).toHaveLength(1);
  });

  it('bills the estimate exactly once when the client aborts mid-stream', async () => {
    const charges: number[] = [];
    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        charges.push(bill.credits);
      },
    });

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"type":"response.output_text.delta","delta":"par"}\n\n'),
        );
        // never closes: simulates an aborted upstream
      },
    });

    const reader = source.pipeThrough(tee).getReader();
    await reader.read();
    await reader.cancel(); // client disconnects mid-stream
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(charges).toEqual([9_999]);
  });

  it('does not charge when the upstream never delivered a byte', async () => {
    const charges: number[] = [];
    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        charges.push(bill.credits);
      },
    });

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close(); // connection failed before any provider usage
      },
    });

    await readAll(source.pipeThrough(tee));
    expect(charges).toEqual([]);
  });

  it('does not charge when the stream ends with a provider error event', async () => {
    const charges: number[] = [];
    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        charges.push(bill.credits);
      },
    });

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"type":"error","message":"rate limited"}\n\n'),
        );
        controller.close();
      },
    });

    await readAll(source.pipeThrough(tee));
    expect(charges).toEqual([]);
  });
});

describe('run-ai-app credit core: deduction contract (atomic RPC)', () => {
  function createRpcSpy(result: { error?: { message: string } | null } = { error: null }) {
    const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
    const rpc: RpcCaller = vi.fn(async (fn, args) => {
      calls.push({ fn, args });
      return result;
    });
    return { rpc, calls };
  }

  const baseParams = {
    userId: 'user_1',
    appId: 'videoremixvip',
    appSlug: 'ai-sales-intelligence-pro',
    model: MODEL,
    credits: 4_200,
    inputTokens: 1000,
    outputTokens: 200,
    source: 'run_ai_app',
  };

  it('issues exactly one atomic deduct_credits RPC call with the billed identity', async () => {
    const { rpc, calls } = createRpcSpy();
    const charged = await deductUsageCredits({ ...baseParams, rpc, nowMs: 1_700_000_000_000 });

    expect(charged).toBe(4_200);
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe('deduct_credits');
    expect(calls[0].args).toMatchObject({
      p_user_id: 'user_1',
      p_app_id: 'videoremixvip',
      p_amount: 4_200,
      p_type: 'api_usage',
      p_source: 'run_ai_app',
      p_source_id: 'ai-sales-intelligence-pro:1700000000000',
      p_metadata: {
        app_slug: 'ai-sales-intelligence-pro',
        model: MODEL,
        input_tokens: 1000,
        output_tokens: 200,
        cached_input_tokens: 0,
      },
    });
  });

  it('records cached input tokens in the ledger metadata without re-billing them', async () => {
    const { rpc, calls } = createRpcSpy();
    await deductUsageCredits({ ...baseParams, rpc, cachedInputTokens: 800 });
    expect((calls[0].args.p_metadata as Record<string, unknown>).cached_input_tokens).toBe(800);
  });

  it('charges nothing for a zero/negative credit amount (early return, no RPC)', async () => {
    const { rpc, calls } = createRpcSpy();
    expect(await deductUsageCredits({ ...baseParams, rpc, credits: 0 })).toBe(0);
    expect(await deductUsageCredits({ ...baseParams, rpc, credits: -5 })).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it('returns 0 and logs when the RPC fails (never throws)', async () => {
    const { rpc } = createRpcSpy({ error: { message: 'connection reset' } });
    const logs: string[] = [];
    const charged = await deductUsageCredits({
      ...baseParams,
      rpc,
      log: (m) => logs.push(m),
    });
    expect(charged).toBe(0);
    expect(logs.join('\n')).toContain('Failed to deduct credits');
  });

  it('logs a CREDIT_SHORTFALL when the balance could not cover the bill', async () => {
    const { rpc } = createRpcSpy({
      error: { message: 'Insufficient credits: current 10, attempted to deduct 4000' },
    });
    const logs: string[] = [];
    const charged = await deductUsageCredits({
      ...baseParams,
      rpc,
      log: (m) => logs.push(m),
    });
    expect(charged).toBe(0);
    expect(logs.join('\n')).toContain('CREDIT_SHORTFALL');
  });

  it('survives an RPC that throws', async () => {
    const rpc: RpcCaller = vi.fn(async () => {
      throw new Error('network down');
    });
    const logs: string[] = [];
    await expect(
      deductUsageCredits({ ...baseParams, rpc, log: (m) => logs.push(m) }),
    ).resolves.toBe(0);
    expect(logs.join('\n')).toContain('deductUsageCredits error');
  });
});

describe('run-ai-app credit core: realtime session billing', () => {
  it('bills per connected minute, rounded up', () => {
    expect(computeRealtimeCreditsFromWindow(0, 30_000)).toBe(3_000);
    expect(computeRealtimeCreditsFromWindow(0, 60_000)).toBe(REALTIME_CREDITS_PER_MINUTE);
    expect(computeRealtimeCreditsFromWindow(0, 61_000)).toBe(6_100);
  });

  it('bills nothing for degenerate windows (never-opened or clock-skewed sockets)', () => {
    expect(computeRealtimeCreditsFromWindow(null, 60_000)).toBe(0);
    expect(computeRealtimeCreditsFromWindow(10_000, 10_000)).toBe(0);
    expect(computeRealtimeCreditsFromWindow(10_000, 9_000)).toBe(0);
  });

  it('agrees with the shared rate helper', () => {
    expect(computeRealtimeCreditsFromWindow(0, 90_000)).toBe(calculateRealtimeCredits(90));
  });
});

describe('credit rate tables: edge-function vs client parity', () => {
  it('MODEL_CREDIT_RATES are identical in both files', () => {
    expect(MODEL_CREDIT_RATES).toEqual(CLIENT_MODEL_CREDIT_RATES);
    expect(Object.keys(MODEL_CREDIT_RATES).sort()).toEqual(Object.keys(CLIENT_MODEL_CREDIT_RATES).sort());
  });

  it('CREDITS_PER_DOLLAR, DALL-E and Whisper constants match', () => {
    expect(CREDITS_PER_DOLLAR).toBe(CLIENT_CREDITS_PER_DOLLAR);
    expect(DALLE_CREDITS_PER_IMAGE).toBe(CLIENT_DALLE_CREDITS_PER_IMAGE);
    expect(WHISPER_CREDITS_PER_MINUTE).toBe(CLIENT_WHISPER_CREDITS_PER_MINUTE);
  });

  it('per-token credit math matches for every priced model and both directions', () => {
    for (const model of Object.keys(MODEL_CREDIT_RATES)) {
      for (const tokens of [0, 1, 999, 1_000, 12_345, 1_000_000]) {
        const edgeInput = creditsForTokens(tokens, MODEL_CREDIT_RATES[model].input);
        const clientInput = calculateCreditsForUsage({ model, type: 'input', amount: tokens });
        expect(clientInput).toBe(edgeInput);

        const edgeOutput = creditsForTokens(tokens, MODEL_CREDIT_RATES[model].output);
        const clientOutput = calculateCreditsForUsage({ model, type: 'output', amount: tokens });
        expect(clientOutput).toBe(edgeOutput);

        expect(calculateUsageCredits(model, tokens, tokens)).toBe(edgeInput + edgeOutput);
      }
    }
  });

  it('unsupported models cost 0 in both tables and are refused by the gate', () => {
    expect(isSupportedModel('gpt-3.5-turbo')).toBe(false);
    expect(calculateUsageCredits('gpt-3.5-turbo', 1_000_000, 1_000_000)).toBe(0);
    expect(
      calculateCreditsForUsage({ model: 'gpt-3.5-turbo', type: 'input', amount: 1_000_000 }),
    ).toBe(0);
  });

  it('the pre-flight estimate is conservative (>= exact usage for the same tokens)', () => {
    const estimate = estimateRequestCredits(MODEL, 1000, 1800);
    const exact = calculateUsageCredits(MODEL, 1000, 900);
    expect(estimate).toBeGreaterThanOrEqual(exact);
  });
});
