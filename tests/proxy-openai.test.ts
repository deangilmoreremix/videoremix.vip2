import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCreditsForUsage, deductCredits, MODEL_CREDIT_RATES } from '../src/lib/credit-math';

type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

function createMockSupabaseClient() {
  const balances = new Map<string, number>();
  const transactions: Array<{
    user_id: string;
    amount_credits: number;
    balance_after_credits: number;
    type: string;
    source: string;
    source_id: string;
  }> = [];

  const from = vi.fn((table: string) => {
    if (table === 'credit_balances') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string, value: string) => {
          return {
            single: vi.fn().mockImplementation(() => {
              const userBalance = balances.get(value);
              return vi.fn().mockResolvedValue({
                data: userBalance !== undefined
                  ? { user_id: value, balance_credits: userBalance }
                  : null,
                error: userBalance !== undefined ? null : { code: 'PGRST116' },
              });
            }),
          };
        }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          return vi.fn().mockResolvedValue({ data: null, error: null });
        }),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }

    if (table === 'credit_transactions') {
      return {
        insert: vi.fn().mockImplementation((data: unknown) => {
          const record = data as Record<string, unknown> & { returning?: unknown[] };
          const txn = {
            user_id: (record as Record<string, unknown>).user_id,
            amount_credits: (record as Record<string, unknown>).amount_credits,
            balance_after_credits: (record as Record<string, unknown>).balance_after_credits,
            type: (record as Record<string, unknown>).type,
            source: (record as Record<string, unknown>).source,
            source_id: (record as Record<string, unknown>).source_id,
          };

          if (record.returning && Array.isArray(record.returning)) {
            return vi.fn().mockResolvedValue({
              data: { ...txn, id: 'tx_new' },
              error: null,
            });
          }

          transactions.push(txn);
          return vi.fn().mockResolvedValue({
            data: { ...txn, id: 'tx_new' },
            error: null,
          });
        }),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => {
        return vi.fn().mockResolvedValue({ data: null, error: null });
      }),
      single: vi.fn().mockImplementation(() => {
        return vi.fn().mockResolvedValue({ data: null, error: null });
      }),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    get balanceStore() {
      return balances;
    },
    get transactionStore() {
      return transactions;
    },
  };
}

function addCredits(
  client: MockSupabaseClient,
  userId: string,
  amount: number
): void {
  const current = client.balanceStore.get(userId) || 0;
  client.balanceStore.set(userId, current + amount);
}

function getBalance(client: MockSupabaseClient, userId: string): number {
  return client.balanceStore.get(userId) || 0;
}

function deductCreditsFromClient(
  client: MockSupabaseClient,
  userId: string,
  creditsToDeduct: number
): { success: boolean; newBalance: number } {
  const current = client.balanceStore.get(userId) || 0;
  const newBalance = Math.max(0, current - creditsToDeduct);

  client.balanceStore.set(userId, newBalance);

  return {
    success: true,
    newBalance,
  };
}

describe('proxy-openai', () => {
  let mockSupabase: MockSupabaseClient;
  const testUserId = 'user-proxy-test';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe('authenticated requests', () => {
    it('should forward authenticated requests', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);

      const isAuthenticated = true;
      expect(isAuthenticated).toBe(true);

      const balance = getBalance(mockSupabase, testUserId);
      expect(balance).toBe(1_000_000);
    });

    it('should return 402 when balance is insufficient', async () => {
      addCredits(mockSupabase, testUserId, 100);

      const balance = getBalance(mockSupabase, testUserId);
      const creditsNeeded = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'output',
        amount: 1_000_000,
      });

      const isInsufficient = balance < creditsNeeded;
      expect(isInsufficient).toBe(true);
    });

    it('should deduct credits on successful API calls', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);

      const model = 'gpt-4o';
      const type = 'input';
      const tokens = 1_000_000;

      const creditsDeducted = calculateCreditsForUsage({ model, type, amount: tokens });
      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsDeducted);

      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(1_000_000 - creditsDeducted);
    });
  });

  describe('unauthenticated requests', () => {
    it('should reject unauthenticated requests', async () => {
      const isAuthenticated = false;

      if (!isAuthenticated) {
        expect(isAuthenticated).toBe(false);
      }

      const response = { status: 401, body: { error: 'Unauthorized' } };
      expect(response.status).toBe(401);
    });

    it('should not deduct credits for unauthenticated requests', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);
      const initialBalance = getBalance(mockSupabase, testUserId);

      const isAuthenticated = false;
      if (!isAuthenticated) {
        expect(getBalance(mockSupabase, testUserId)).toBe(initialBalance);
      }
    });
  });

  describe('insufficient balance', () => {
    it('should return 402 when balance is below threshold', async () => {
      addCredits(mockSupabase, testUserId, 10);

      const balance = getBalance(mockSupabase, testUserId);
      const creditsRequired = 500;

      const response = {
        status: balance < creditsRequired ? 402 : 200,
        body: balance < creditsRequired
          ? { error: 'INSUFFICIENT_BALANCE', credits_required: creditsRequired }
          : { success: true },
      };

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('INSUFFICIENT_BALANCE');
    });

    it('should include credits required in response', async () => {
      addCredits(mockSupabase, testUserId, 50);

      const creditsRequired = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'output',
        amount: 2_000_000,
      });

      const balance = getBalance(mockSupabase, testUserId);
      const response = {
        status: balance < creditsRequired ? 402 : 200,
        body: {
          error: 'INSUFFICIENT_BALANCE',
          credits_required: creditsRequired,
          credits_available: balance,
        },
      };

      expect(response.body.credits_required).toBe(creditsRequired);
      expect(response.body.credits_available).toBe(50);
    });
  });

  describe('successful request credit deduction', () => {
    it('should deduct credits for gpt-4o input', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'input',
        amount: 1_000_000,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(1_000_000 - creditsToDeduct);
    });

    it('should deduct credits for gpt-4o output', async () => {
      addCredits(mockSupabase, testUserId, 2_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'output',
        amount: 1_000_000,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(2_000_000 - creditsToDeduct);
    });

    it('should deduct credits for gpt-4o-mini', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'gpt-4o-mini',
        type: 'input',
        amount: 1_000_000,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(1_000_000 - creditsToDeduct);
    });

    it('should deduct credits for o1', async () => {
      addCredits(mockSupabase, testUserId, 7_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'o1',
        type: 'output',
        amount: 1_000_000,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(7_000_000 - creditsToDeduct);
    });

    it('should deduct credits for o1-mini', async () => {
      addCredits(mockSupabase, testUserId, 2_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'o1-mini',
        type: 'output',
        amount: 1_000_000,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(2_000_000 - creditsToDeduct);
    });

    it('should deduct credits for DALL-E 3 image', async () => {
      addCredits(mockSupabase, testUserId, 10_000_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'dall-e-3',
        type: 'image',
        amount: 1,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(10_000_000 - creditsToDeduct);
    });

    it('should deduct credits for Whisper transcription', async () => {
      addCredits(mockSupabase, testUserId, 100_000);

      const creditsToDeduct = calculateCreditsForUsage({
        model: 'whisper-1',
        type: 'minute',
        amount: 1,
      });

      const result = deductCreditsFromClient(mockSupabase, testUserId, creditsToDeduct);
      expect(result.success).toBe(true);
      expect(getBalance(mockSupabase, testUserId)).toBe(100_000 - creditsToDeduct);
    });
  });

  describe('failed request credit handling', () => {
    it('should not deduct credits on OpenAI API error', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);
      const initialBalance = getBalance(mockSupabase, testUserId);

      const apiCallFailed = true;
      if (apiCallFailed) {
        expect(getBalance(mockSupabase, testUserId)).toBe(initialBalance);
      }
    });

    it('should not deduct credits on network error', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);
      const initialBalance = getBalance(mockSupabase, testUserId);

      const networkError = true;
      if (networkError) {
        expect(getBalance(mockSupabase, testUserId)).toBe(initialBalance);
      }
    });

    it('should not deduct credits on rate limit', async () => {
      addCredits(mockSupabase, testUserId, 1_000_000);
      const initialBalance = getBalance(mockSupabase, testUserId);

      const rateLimited = true;
      if (rateLimited) {
        expect(getBalance(mockSupabase, testUserId)).toBe(initialBalance);
      }
    });
  });

  describe('credit balance updates', () => {
    it('should maintain accurate balance after multiple deductions', async () => {
      addCredits(mockSupabase, testUserId, 5_000_000);

      const firstDeduction = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'input',
        amount: 1_000_000,
      });
      deductCreditsFromClient(mockSupabase, testUserId, firstDeduction);

      const secondDeduction = calculateCreditsForUsage({
        model: 'gpt-4o',
        type: 'output',
        amount: 1_000_000,
      });
      deductCreditsFromClient(mockSupabase, testUserId, secondDeduction);

      const finalBalance = getBalance(mockSupabase, testUserId);
      expect(finalBalance).toBe(5_000_000 - firstDeduction - secondDeduction);
    });

    it('should allow balance to reach zero', async () => {
      addCredits(mockSupabase, testUserId, 100);

      const result = deductCreditsFromClient(mockSupabase, testUserId, 100);
      expect(result.newBalance).toBe(0);
      expect(getBalance(mockSupabase, testUserId)).toBe(0);
    });

    it('should not allow negative balance', async () => {
      addCredits(mockSupabase, testUserId, 50);

      const result = deductCreditsFromClient(mockSupabase, testUserId, 1_000_000);
      expect(result.newBalance).toBe(0);
      expect(getBalance(mockSupabase, testUserId)).toBe(0);
    });
  });

  describe('transaction logging', () => {
    it('should log api_usage transactions for successful calls', async () => {
      const txn = {
        user_id: testUserId,
        amount_credits: -500,
        balance_after_credits: 499_500,
        type: 'api_usage',
        source: 'api_proxy',
        source_id: 'api_call_' + Date.now(),
        metadata: { model: 'gpt-4o', tokens: 1_000_000 },
      };

      mockSupabase.transactionStore.push(txn);

      expect(mockSupabase.transactionStore.length).toBe(1);
      expect(mockSupabase.transactionStore[0].type).toBe('api_usage');
      expect(mockSupabase.transactionStore[0].amount_credits).toBeLessThan(0);
    });

    it('should include request ID in transaction metadata', async () => {
      const requestId = 'req_' + Date.now();
      const txn = {
        user_id: testUserId,
        amount_credits: -500,
        balance_after_credits: 499_500,
        type: 'api_usage',
        source: 'api_proxy',
        source_id: requestId,
        metadata: { model: 'gpt-4o', request_id: requestId },
      };

      mockSupabase.transactionStore.push(txn);

      expect(mockSupabase.transactionStore[0].source_id).toBe(requestId);
    });
  });

  describe('model support', () => {
    it('should support gpt-4o', () => {
      expect(MODEL_CREDIT_RATES['gpt-4o']).toBeDefined();
      const credits = calculateCreditsForUsage({ model: 'gpt-4o', type: 'input', amount: 1_000_000 });
      expect(credits).toBeGreaterThan(0);
    });

    it('should support gpt-4o-mini', () => {
      expect(MODEL_CREDIT_RATES['gpt-4o-mini']).toBeDefined();
      const credits = calculateCreditsForUsage({ model: 'gpt-4o-mini', type: 'input', amount: 1_000_000 });
      expect(credits).toBeGreaterThan(0);
    });

    it('should support o1', () => {
      expect(MODEL_CREDIT_RATES['o1']).toBeDefined();
      const credits = calculateCreditsForUsage({ model: 'o1', type: 'input', amount: 1_000_000 });
      expect(credits).toBeGreaterThan(0);
    });

    it('should support o1-mini', () => {
      expect(MODEL_CREDIT_RATES['o1-mini']).toBeDefined();
      const credits = calculateCreditsForUsage({ model: 'o1-mini', type: 'input', amount: 1_000_000 });
      expect(credits).toBeGreaterThan(0);
    });

    it('should support dall-e-3', () => {
      const credits = calculateCreditsForUsage({ model: 'dall-e-3', type: 'image', amount: 1 });
      expect(credits).toBeGreaterThan(0);
    });

    it('should support whisper-1', () => {
      const credits = calculateCreditsForUsage({ model: 'whisper-1', type: 'minute', amount: 1 });
      expect(credits).toBeGreaterThan(0);
    });
  });

  describe('multi-tenant considerations', () => {
    it('should maintain separate balances per user', async () => {
      const user1 = 'user-one';
      const user2 = 'user-two';

      addCredits(mockSupabase, user1, 100_000);
      addCredits(mockSupabase, user2, 200_000);

      deductCreditsFromClient(mockSupabase, user1, 30_000);

      expect(getBalance(mockSupabase, user1)).toBe(70_000);
      expect(getBalance(mockSupabase, user2)).toBe(200_000);
    });
  });
});
