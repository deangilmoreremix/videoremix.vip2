/**
 * tests/credit-concurrency.test.ts
 *
 * Concurrency proofs for credit enforcement. The Supabase layer is mocked the
 * same way tests/proxy-openai.test.ts does it, but here the mocked
 * `deduct_credits` RPC emulates what the database MUST guarantee:
 *   - deductions for one balance row are serialized (row lock),
 *   - a deduction is rejected when the balance cannot cover it,
 *   - the `CHECK (balance_credits >= 0)` constraint can never be violated.
 *
 * The suites prove:
 *   1. N parallel runs against an exact balance bill exactly N times, the
 *      balance never goes negative, and total deducted == billed usage.
 *   2. A single stream (flush + cancel races, client aborts mid-stream,
 *      zero-byte connections, provider error events) is billed at most once.
 *   3. Deduction is delegated to exactly ONE atomic RPC call per billable
 *      run — the edge layer performs no read-modify-write of its own.
 *   4. A detector for the known DB-side gap (see
 *      docs/completion/runtime-credit-audit.md): the CURRENT
 *      credits.add_credits/deduct_credits SQL body is a read-then-write with
 *      no row lock, so concurrent deductions CAN lose updates. When the
 *      migration owner applies the row-lock fix, this detector must be
 *      flipped to assert atomicity instead.
 *
 * No network, no paid API calls, no real Supabase project.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  SseUsageParser,
  createBillingTee,
  deductUsageCredits,
  evaluateCreditGate,
  type RpcCaller,
  type StreamBill,
} from '../supabase/functions/run-ai-app/credit-core.ts';

const APP_ID = 'videoremixvip';
const APP_SLUG = 'ai-sales-intelligence-pro';
const MODEL = 'gpt-5.5';
const RUN_COST = 100; // credits per run (estimate == exact cost in these tests)

interface LedgerRow {
  user_id: string;
  app_id: string;
  amount_credits: number;
  balance_after_credits: number;
  source: string;
}

/**
 * Mocked credits-schema Supabase client. `rpc('deduct_credits')` behaves the
 * way an ATOMIC database function must: per-row serialization + conditional
 * balance check + non-negative backstop.
 */
function createAtomicCreditBackend() {
  const rows = new Map<string, { balance: number }>();
  const transactions: LedgerRow[] = [];
  const shortfallLogs: string[] = [];
  const queues = new Map<string, Promise<void>>();
  const negativeBalanceAttempts: string[] = [];

  const rowKey = (userId: string, appId: string) => `${userId}:${appId}`;

  const ensureRow = (userId: string, appId: string) => {
    const key = rowKey(userId, appId);
    let row = rows.get(key);
    if (!row) {
      row = { balance: 0 };
      rows.set(key, row);
    }
    return row;
  };

  const backend = {
    rows,
    transactions,
    shortfallLogs,
    negativeBalanceAttempts,

    addCredits(userId: string, amount: number) {
      const row = ensureRow(userId, APP_ID);
      row.balance += amount;
    },

    getBalance(userId: string): number {
      return rows.get(rowKey(userId, APP_ID))?.balance ?? 0;
    },

    /** PostgREST-shaped balance read (no locking: preflight is advisory). */
    readBalance: vi.fn(async (userId: string): Promise<number> => {
      return backend.getBalance(userId);
    }),

    /**
     * Atomic deduct_credits RPC. Serialized per (user, app) row, rejects when
     * the balance cannot cover the amount, and can never drive a balance
     * negative (mirrors the SQL CHECK constraint).
     */
    rpc: vi.fn(async (fn: string, args: Record<string, any>): Promise<{ error: { message: string } | null }> => {
      if (fn !== 'deduct_credits') return { error: null };

      const key = rowKey(String(args.p_user_id), String(args.p_app_id));
      const previous = queues.get(key) ?? Promise.resolve();
      let release: () => void = () => {};
      const done = new Promise<void>((resolve) => {
        release = resolve;
      });
      queues.set(key, done);

      await previous; // row lock: wait for the prior deduction on this row
      try {
        const row = ensureRow(String(args.p_user_id), String(args.p_app_id));
        const amount = Number(args.p_amount);
        if (row.balance < amount) {
          return {
            error: {
              message: `Insufficient credits: current ${row.balance}, attempted to deduct ${amount}`,
            },
          };
        }
        const next = row.balance - amount;
        if (next < 0) {
          // CHECK (balance_credits >= 0) backstop
          negativeBalanceAttempts.push(`${key}:${next}`);
          return { error: { message: 'new row violates row-level security policy' } };
        }
        row.balance = next;
        transactions.push({
          user_id: String(args.p_user_id),
          app_id: String(args.p_app_id),
          amount_credits: amount,
          balance_after_credits: next,
          source: String(args.p_source),
        });
        return { error: null };
      } finally {
        release();
      }
    }) as RpcCaller,
  };

  return backend;
}

type Backend = ReturnType<typeof createAtomicCreditBackend>;

/** One full run lifecycle: preflight gate -> (provider call) -> deduction. */
async function runOnce(
  backend: Backend,
  userId: string,
  counters: { providerCalls: number; billed: number; gateRejected: number; deductFailed: number },
): Promise<'billed' | 'gate_rejected' | 'deduct_failed'> {
  const balance = await backend.readBalance(userId);
  const gate = evaluateCreditGate({
    balance,
    requiredCredits: RUN_COST,
    model: MODEL,
    modelSupported: true,
  });
  if (!gate.ok) {
    counters.gateRejected += 1;
    return 'gate_rejected';
  }

  counters.providerCalls += 1; // provider spend only happens after the gate

  const charged = await deductUsageCredits({
    rpc: backend.rpc,
    userId,
    appId: APP_ID,
    appSlug: APP_SLUG,
    model: MODEL,
    credits: RUN_COST,
    inputTokens: 1000,
    outputTokens: 200,
    source: 'run_ai_app',
    log: (message) => backend.shortfallLogs.push(message),
  });

  if (charged > 0) {
    counters.billed += 1;
    return 'billed';
  }
  counters.deductFailed += 1;
  return 'deduct_failed';
}

function sseFrame(event: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

function makeStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function neverEndingStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      // intentionally never closes (upstream hang / client abort scenario)
    },
  });
}

describe('credit concurrency: parallel runs racing one balance', () => {
  it('5 parallel runs vs an exact balance: all 5 bill, balance never negative, total == billed', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_race_exact';
    backend.addCredits(userId, 5 * RUN_COST); // balance covers exactly 5 runs

    const counters = { providerCalls: 0, billed: 0, gateRejected: 0, deductFailed: 0 };
    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () => runOnce(backend, userId, counters)),
    );

    expect(outcomes.every((o) => o === 'billed')).toBe(true);
    expect(counters.billed).toBe(5);
    expect(counters.deductFailed).toBe(0);
    expect(backend.getBalance(userId)).toBe(0);
    expect(backend.negativeBalanceAttempts).toEqual([]);
    expect(backend.transactions).toHaveLength(5);
    expect(backend.transactions.every((t) => t.amount_credits === RUN_COST)).toBe(true);

    const totalDeducted = backend.transactions.reduce((sum, t) => sum + t.amount_credits, 0);
    expect(totalDeducted).toBe(5 * RUN_COST); // == billed usage
    expect(backend.getBalance(userId) + totalDeducted).toBe(5 * RUN_COST); // conservation
  });

  it('5 parallel runs vs a balance covering 2: exactly 2 succeed, never negative', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_race_short';
    backend.addCredits(userId, 2 * RUN_COST);

    const counters = { providerCalls: 0, billed: 0, gateRejected: 0, deductFailed: 0 };
    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () => runOnce(backend, userId, counters)),
    );

    expect(counters.billed).toBe(2);
    expect(counters.billed + counters.gateRejected + counters.deductFailed).toBe(5);
    expect(backend.getBalance(userId)).toBe(0);
    expect(backend.negativeBalanceAttempts).toEqual([]);
    expect(backend.transactions).toHaveLength(2);

    const totalDeducted = backend.transactions.reduce((sum, t) => sum + t.amount_credits, 0);
    expect(totalDeducted).toBe(2 * RUN_COST);

    // Every unbilled run is logged for reconciliation (spend already happened
    // or the run never started).
    if (counters.deductFailed > 0) {
      expect(backend.shortfallLogs.join('\n')).toContain('CREDIT_SHORTFALL');
    }
  });

  it('50 parallel deductions of 1 credit vs a balance of 25: exactly 25 succeed', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_race_drain';
    backend.addCredits(userId, 25);

    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        deductUsageCredits({
          rpc: backend.rpc,
          userId,
          appId: APP_ID,
          appSlug: APP_SLUG,
          model: MODEL,
          credits: 1,
          inputTokens: 10,
          outputTokens: 2,
          log: (m) => backend.shortfallLogs.push(m),
        }),
      ),
    );

    expect(results.filter((r) => r === 1)).toHaveLength(25);
    expect(results.filter((r) => r === 0)).toHaveLength(25);
    expect(backend.getBalance(userId)).toBe(0);
    expect(backend.transactions).toHaveLength(25);
    expect(backend.transactions.reduce((s, t) => s + t.amount_credits, 0)).toBe(25);
    expect(backend.shortfallLogs.length).toBe(25);
  });

  it('concurrent users never touch each other balances', async () => {
    const backend = createAtomicCreditBackend();
    backend.addCredits('user_a', 300);
    backend.addCredits('user_b', 1_000);

    const counters = { providerCalls: 0, billed: 0, gateRejected: 0, deductFailed: 0 };
    const runs = [
      ...Array.from({ length: 5 }, () => runOnce(backend, 'user_a', counters)),
      ...Array.from({ length: 5 }, () => runOnce(backend, 'user_b', counters)),
    ];
    await Promise.all(runs);

    expect(backend.getBalance('user_a')).toBe(0);
    expect(backend.getBalance('user_b')).toBe(500);
    expect(backend.transactions.filter((t) => t.user_id === 'user_a')).toHaveLength(3);
    expect(backend.transactions.filter((t) => t.user_id === 'user_b')).toHaveLength(5);
  });

  it('no provider call and no deduction happen when the gate rejects', async () => {
    const backend = createAtomicCreditBackend();
    const counters = { providerCalls: 0, billed: 0, gateRejected: 0, deductFailed: 0 };
    backend.addCredits('user_broke', RUN_COST - 1);

    const outcome = await runOnce(backend, 'user_broke', counters);

    expect(outcome).toBe('gate_rejected');
    expect(counters.providerCalls).toBe(0);
    expect(backend.rpc).not.toHaveBeenCalled();
    expect(backend.transactions).toHaveLength(0);
    expect(backend.getBalance('user_broke')).toBe(RUN_COST - 1);
  });

  it('a ledger outage returns 0 charged, never throws, and is logged', async () => {
    const logs: string[] = [];
    const rpc: RpcCaller = vi.fn(async () => ({ error: { message: 'connection reset' } }));
    const charged = await deductUsageCredits({
      rpc,
      userId: 'user_outage',
      appId: APP_ID,
      appSlug: APP_SLUG,
      model: MODEL,
      credits: RUN_COST,
      inputTokens: 1,
      outputTokens: 1,
      log: (m) => logs.push(m),
    });
    expect(charged).toBe(0);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(logs.join('\n')).toContain('Failed to deduct credits');
  });
});

describe('credit concurrency: concurrent streamed runs', () => {
  const teeParams = {
    model: MODEL,
    estimatedCredits: 12_345,
    estimatedInputTokens: 400,
    estimatedOutputTokens: 1_000,
  };

  function teeCharging(backend: Backend, userId: string, charges: StreamBill[]) {
    return createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        charges.push(bill);
        await deductUsageCredits({
          rpc: backend.rpc,
          userId,
          appId: APP_ID,
          appSlug: APP_SLUG,
          model: MODEL,
          credits: bill.credits,
          inputTokens: bill.inputTokens,
          outputTokens: bill.outputTokens,
          cachedInputTokens: bill.cachedInputTokens,
          source: 'run_ai_app',
          log: (m) => backend.shortfallLogs.push(m),
        });
      },
    });
  }

  it('10 concurrent completed streams vs an exact balance: each billed once, balance 0', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_streams_exact';

    // gpt-5.5: 1000 input @500k/M + 200 output @3M/M = 1100 credits per run.
    const expectedCredits =
      Math.ceil((1000 * 500_000) / 1_000_000) + Math.ceil((200 * 3_000_000) / 1_000_000);
    backend.addCredits(userId, 10 * expectedCredits); // exact balance for 10 runs
    const charges: StreamBill[] = [];
    const streams = Array.from({ length: 10 }, () =>
      makeStream([
        sseFrame({ type: 'response.output_text.delta', delta: 'chunk' }),
        sseFrame({
          type: 'response.completed',
          response: {
            usage: {
              input_tokens: 1000,
              output_tokens: 200,
              input_tokens_details: { cached_tokens: 600 },
            },
          },
        }),
        sseFrame('[DONE]'),
      ]).pipeThrough(teeCharging(backend, userId, charges)),
    );

    // Drain every stream (this runs flush -> final billing).
    await Promise.all(
      streams.map(async (stream) => {
        const reader = stream.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }),
    );

    expect(charges).toHaveLength(10);
    expect(charges.every((c) => c.reason === 'exact_usage')).toBe(true);
    expect(charges.every((c) => c.credits === expectedCredits)).toBe(true);
    expect(charges.every((c) => c.cachedInputTokens === 600)).toBe(true);
    expect(backend.getBalance(userId)).toBe(0);
    expect(backend.negativeBalanceAttempts).toEqual([]);
    const totalDeducted = backend.transactions.reduce((s, t) => s + t.amount_credits, 0);
    expect(totalDeducted).toBe(10 * expectedCredits);
  });

  it('a client abort mid-stream is billed once with the estimate; empty and error streams are free', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_streams_mixed';
    backend.addCredits(userId, 50_000); // comfortably covers the 12,345 estimate

    const charges: StreamBill[] = [];

    // (a) aborted mid-stream: content seen, no terminal usage -> estimate, once.
    const abortedReader = neverEndingStream([
      sseFrame({ type: 'response.output_text.delta', delta: 'partial' }),
    ])
      .pipeThrough(teeCharging(backend, userId, charges))
      .getReader();
    await abortedReader.read();
    await abortedReader.cancel();
    await new Promise((r) => setTimeout(r, 20));

    // (b) zero-byte stream (connection failure before provider usage): free.
    const emptyReader = makeStream([]).pipeThrough(teeCharging(backend, userId, charges)).getReader();
    while (true) {
      const { done } = await emptyReader.read();
      if (done) break;
    }

    // (c) terminal error event: free.
    const errorReader = makeStream([
      sseFrame({ type: 'error', message: 'rate limited' }),
    ])
      .pipeThrough(teeCharging(backend, userId, charges))
      .getReader();
    while (true) {
      const { done } = await errorReader.read();
      if (done) break;
    }
    await new Promise((r) => setTimeout(r, 20));

    expect(charges).toHaveLength(1);
    expect(charges[0].reason).toBe('partial_estimate');
    expect(charges[0].credits).toBe(12_345);
    expect(backend.transactions).toHaveLength(1);
    expect(backend.getBalance(userId)).toBe(50_000 - 12_345);
  });

  it('concurrent flush+cancel on the same stream cannot double-bill', async () => {
    const backend = createAtomicCreditBackend();
    const userId = 'user_streams_race';
    backend.addCredits(userId, 50_000);

    const charges: StreamBill[] = [];
    let unblock: () => void = () => {};
    const blocked = new Promise<void>((resolve) => {
      unblock = resolve;
    });

    const tee = createBillingTee({
      ...teeParams,
      charge: async (bill) => {
        await blocked; // hold the charge so cancel can interleave
        charges.push(bill);
        await deductUsageCredits({
          rpc: backend.rpc,
          userId,
          appId: APP_ID,
          appSlug: APP_SLUG,
          model: MODEL,
          credits: bill.credits,
          inputTokens: bill.inputTokens,
          outputTokens: bill.outputTokens,
          source: 'run_ai_app',
        });
      },
    });

    // The write is not awaited before the read (TransformStream backpressure:
    // a write settles only once its chunk is consumed).
    const writer = tee.writable.getWriter();
    const reader = tee.readable.getReader();
    const writePromise = writer.write(
      sseFrame({
        type: 'response.completed',
        response: { usage: { input_tokens: 1000, output_tokens: 200 } },
      }),
    );
    await reader.read();
    await writePromise;

    const cancelPromise = reader.cancel(); // cancel -> finalize (blocked in charge)
    const closePromise = writer.close(); // flush -> finalize (already settled)
    unblock();
    await Promise.all([cancelPromise, closePromise]);

    expect(charges).toHaveLength(1);
    expect(backend.transactions).toHaveLength(1);
  });
});

describe('credit concurrency: delegation contract + known DB-side gap detector', () => {
  it('issues exactly one RPC call per billable run (no read-modify-write in the edge layer)', async () => {
    const backend = createAtomicCreditBackend();
    backend.addCredits('user_delegation', 1_000);

    await Promise.all(
      Array.from({ length: 5 }, () =>
        deductUsageCredits({
          rpc: backend.rpc,
          userId: 'user_delegation',
          appId: APP_ID,
          appSlug: APP_SLUG,
          model: MODEL,
          credits: RUN_COST,
          inputTokens: 10,
          outputTokens: 2,
        }),
      ),
    );

    // 5 runs -> exactly 5 atomic RPC calls, nothing else.
    expect(backend.rpc).toHaveBeenCalledTimes(5);
    expect(backend.transactions).toHaveLength(5);
    expect(backend.getBalance('user_delegation')).toBe(500);
  });

  it('DETECTOR: the current SQL RPC body (read-then-write, no row lock) can lose deductions', async () => {
    // Emulates credits.add_credits as it exists TODAY (see
    // supabase/migrations/20261011120000_clerk_credit_system_alignment.sql:
    // SELECT balance -> compute -> unconditional UPDATE, no FOR UPDATE).
    // Two concurrent deductions both read the same balance and both write the
    // same new value: one deduction is silently lost.
    let balance = 500;
    let readsDone = 0;
    let releaseWrites: () => void = () => {};
    const allRead = new Promise<void>((resolve) => {
      releaseWrites = resolve;
    });

    const racyRpc: RpcCaller = async (_fn, args) => {
      const current = balance; // unlocked read
      readsDone += 1;
      if (readsDone === 2) releaseWrites();
      await allRead; // both reads land before either write
      const next = current - Number(args.p_amount);
      balance = next; // unconditional UPDATE ... SET balance_credits = next
      return { error: null };
    };

    const results = await Promise.all([
      deductUsageCredits({
        rpc: racyRpc,
        userId: 'user_gap',
        appId: APP_ID,
        appSlug: APP_SLUG,
        model: MODEL,
        credits: 100,
        inputTokens: 1,
        outputTokens: 1,
      }),
      deductUsageCredits({
        rpc: racyRpc,
        userId: 'user_gap',
        appId: APP_ID,
        appSlug: APP_SLUG,
        model: MODEL,
        credits: 100,
        inputTokens: 1,
        outputTokens: 1,
      }),
    ]);

    // Both runs report success (200 credits billed) but only 100 was removed:
    // the platform eats 100 credits of OpenAI spend. This is exactly the
    // double-spend the DB-side row lock must prevent.
    expect(results).toEqual([100, 100]);
    expect(balance).toBe(400);
  });
});
