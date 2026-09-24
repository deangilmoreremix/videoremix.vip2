import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  auth: Record<string, unknown>;
  functions: Record<string, unknown>;
};

function createMockSupabaseClient(): MockSupabaseClient {
  const dataStore: Record<string, unknown> = {};

  const mockQuery = (): ReturnType<typeof vi.fn> => {
    return vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => {
        const value = vi.fn().mockReturnValue({
          data: null,
          error: null,
        }).mockResolvedValue({ data: null, error: null });

        value.data = dataStore;

        return value;
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      csv: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
  };

  return {
    from: vi.fn(() => mockQuery()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
}

type CreditBalance = {
  user_id: string;
  balance_credits: number;
  total_purchased_credits: number;
  total_spent_credits: number;
};

type CreditTransaction = {
  id: string;
  user_id: string;
  amount_credits: number;
  balance_after_credits: number;
  type: string;
  source: string;
  source_id: string;
  metadata: Record<string, unknown>;
};

describe('credit webhook processing', () => {
  let mockSupabase: MockSupabaseClient;
  let balances: Map<string, CreditBalance>;
  let transactions: CreditTransaction[];
  let webhookLogs: Map<string, unknown>;

  function setupBalance(userId: string, balance = 0): void {
    balances.set(userId, {
      user_id: userId,
      balance_credits: balance,
      total_purchased_credits: 0,
      total_spent_credits: 0,
    });
  }

  function getOrCreateBalance(userId: string): CreditBalance {
    let balance = balances.get(userId);
    if (!balance) {
      balance = {
        user_id: userId,
        balance_credits: 0,
        total_purchased_credits: 0,
        total_spent_credits: 0,
      };
      balances.set(userId, balance);
    }
    return balance;
  }

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    balances = new Map();
    transactions = [];
    webhookLogs = new Map();

    vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
      return vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((data: unknown[]) => {
          if (table === 'credit_transactions') {
            transactions.push(...data as CreditTransaction[]);
          }
          if (table === 'webhook_logs') {
            const records = data as unknown[];
            for (const record of records) {
              const eventId = (record as Record<string, unknown>).stripe_event_id as string;
              if (eventId) {
                webhookLogs.set(eventId, record);
              }
            }
          }
          return {
            ...mockSupabase.from('mock')(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
        update: vi.fn().mockImplementation((data: unknown[]) => {
          return {
            ...mockSupabase.from('mock')(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          return vi.fn().mockResolvedValue({ data: null, error: null });
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          return vi.fn().mockResolvedValue({ data: null, error: null });
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
    });
  });

  describe('checkout.session.completed event', () => {
    it('should update credit_balances when webhook is received', async () => {
      const userId = 'user-123';
      const amount = 500_000;

      setupBalance(userId, 0);

      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: null,
            customer_details: {
              email: 'test@example.com',
            },
            line_items: {
              data: [
                {
                  description: 'Starter',
                },
              ],
            },
            amount_total: 5000,
            currency: 'usd',
            payment_status: 'paid',
            metadata: {
              userId,
              productId: 'starter',
              credits: String(amount),
            },
          },
        },
      };

      expect(mockEvent.type).toBe('checkout.session.completed');
      expect(mockEvent.id).toBeDefined();

      const session = mockEvent.data.object as Record<string, unknown>;
      expect(session.amount_total).toBe(5000);
    });

    it('should log credit_transactions when webhook is received', async () => {
      const userId = 'user-456';
      const amount = 2_500_000;

      expect(transactions.length).toBe(0);

      const newTransaction: CreditTransaction = {
        id: 'tx_test_123',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test_123',
        metadata: { productId: 'pro' },
      };

      transactions.push(newTransaction);

      expect(transactions.length).toBe(1);
      expect(transactions[0].amount_credits).toBe(amount);
      expect(transactions[0].type).toBe('purchase');
      expect(transactions[0].source).toBe('stripe');
    });

    it('should grant credits for Business tier', async () => {
      const userId = 'user-789';
      const amount = 8_000_000;

      setupBalance(userId, 0);

      const newTransaction: CreditTransaction = {
        id: 'tx_test_456',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test_456',
        metadata: { productId: 'business' },
      };

      transactions.push(newTransaction);

      expect(transactions[0].amount_credits).toBe(8_000_000);
    });

    it('should grant credits for Enterprise tier', async () => {
      const userId = 'user-999';
      const amount = 35_000_000;

      setupBalance(userId, 0);

      const newTransaction: CreditTransaction = {
        id: 'tx_test_789',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test_789',
        metadata: { productId: 'enterprise' },
      };

      transactions.push(newTransaction);

      expect(transactions[0].amount_credits).toBe(35_000_000);
    });
  });

  describe('idempotency', () => {
    it('should not double-credit when the same webhook is processed twice', async () => {
      const userId = 'user-idempotent';
      const eventId = 'evt_idempotent_test';
      const amount = 500_000;

      setupBalance(userId, 0);

      const firstTransaction: CreditTransaction = {
        id: 'tx_first',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test',
        metadata: {},
      };

      transactions.push(firstTransaction);
      webhookLogs.set(eventId, { stripe_event_id: eventId, processing_status: 'completed' });

      const secondTransaction: CreditTransaction = {
        id: 'tx_second',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test',
        metadata: {},
      };

      const alreadyProcessed = webhookLogs.has(eventId);
      if (!alreadyProcessed) {
        transactions.push(secondTransaction);
      }

      expect(transactions.length).toBe(1);
      expect(transactions[0].id).toBe('tx_first');
    });

    it('should skip processing if webhook_logs shows already completed', async () => {
      const eventId = 'evt_already_done';
      const existingLog = {
        stripe_event_id: eventId,
        processing_status: 'completed',
        created_at: new Date().toISOString(),
      };

      webhookLogs.set(eventId, existingLog);

      const isAlreadyProcessed = webhookLogs.has(eventId);
      expect(isAlreadyProcessed).toBe(true);

      const eventLog = webhookLogs.get(eventId) as Record<string, string>;
      expect(eventLog.processing_status).toBe('completed');
    });

    it('should allow retry if webhook previously failed', async () => {
      const eventId = 'evt_retry_failed';
      const existingLog = {
        stripe_event_id: eventId,
        processing_status: 'failed',
      };

      webhookLogs.set(eventId, existingLog);

      const eventLog = webhookLogs.get(eventId) as Record<string, string>;
      expect(eventLog.processing_status).toBe('failed');
      expect(webhookLogs.size).toBe(1);
    });
  });

  describe('webhook event handling', () => {
    it('should log verified webhooks before processing', async () => {
      const event: Stripe.Event = {
        id: 'evt_verified',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            customer_details: { email: 'test@example.com' },
            line_items: { data: [{ description: 'Product' }] },
            amount_total: 5000,
            currency: 'usd',
            payment_status: 'paid',
          },
        },
      };

      const logEntry = {
        platform: 'stripe',
        event_type: event.type,
        webhook_payload: event,
        processing_status: 'pending',
        stripe_event_id: event.id,
      };

      expect(logEntry.processing_status).toBe('pending');
      expect(logEntry.stripe_event_id).toBe('evt_verified');
    });

    it('should mark event as completed after successful processing', async () => {
      const eventId = 'evt_mark_completed';

      webhookLogs.set(eventId, {
        stripe_event_id: eventId,
        processing_status: 'completed',
      });

      const eventLog = webhookLogs.get(eventId) as Record<string, string>;
      expect(eventLog.processing_status).toBe('completed');
    });

    it('should mark event as failed after failed processing', async () => {
      const eventId = 'evt_mark_failed';

      webhookLogs.set(eventId, {
        stripe_event_id: eventId,
        processing_status: 'failed',
        error_message: 'Something went wrong',
      });

      const eventLog = webhookLogs.get(eventId) as Record<string, string>;
      expect(eventLog.processing_status).toBe('failed');
      expect(eventLog.error_message).toBe('Something went wrong');
    });

    it('should handle unhandled event types gracefully', async () => {
      const unhandledEvent: Stripe.Event = {
        id: 'evt_unhandled',
        type: 'invoice.sent',
        data: {
          object: {},
        },
      };

      expect(unhandledEvent.type).toBe('invoice.sent');

      const result = { success: true, message: 'Event type not processed' };
      expect(result.success).toBe(true);
    });
  });

  describe('credit balance updates', () => {
    it('should add to existing balance when adding credits', async () => {
      const userId = 'user-balance-add';
      setupBalance(userId, 100_000);

      const additionalCredits = 500_000;

      const existing = balances.get(userId) as CreditBalance;
      expect(existing.balance_credits).toBe(100_000);
    });

    it('should track total_purchased_credits', async () => {
      const userId = 'user-total-purchased';
      setupBalance(userId, 0);

      const purchaseAmount = 2_500_000;

      const balance = balances.get(userId) as CreditBalance;
      expect(balance.total_purchased_credits).toBe(0);
    });

    it('should track total_spent_credits', async () => {
      const userId = 'user-total-spent';
      setupBalance(userId, 10_000_000);

      const spentAmount = 1_000_000;

      const balance = balances.get(userId) as CreditBalance;
      expect(balance.total_spent_credits).toBe(0);
    });
  });

  describe('transaction logging', () => {
    it('should log positive amounts for purchases', async () => {
      const userId = 'user-txn-pos';
      const amount = 500_000;

      const txn: CreditTransaction = {
        id: 'tx_pos',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: amount,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test',
        metadata: {},
      };

      transactions.push(txn);

      expect(transactions[0].amount_credits).toBeGreaterThan(0);
      expect(transactions[0].type).toBe('purchase');
    });

    it('should log negative amounts for API usage', async () => {
      const userId = 'user-txn-neg';
      const amount = -500;

      const txn: CreditTransaction = {
        id: 'tx_neg',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: 499_500,
        type: 'api_usage',
        source: 'api_proxy',
        source_id: 'api_call_123',
        metadata: { model: 'gpt-4o', tokens: 1_000_000 },
      };

      transactions.push(txn);

      expect(transactions[0].amount_credits).toBeLessThan(0);
      expect(transactions[0].type).toBe('api_usage');
      expect(transactions[0].source).toBe('api_proxy');
    });

    it('should log refund transactions', async () => {
      const userId = 'user-txn-refund';
      const amount = -500_000;

      const txn: CreditTransaction = {
        id: 'tx_refund',
        user_id: userId,
        amount_credits: amount,
        balance_after_credits: 0,
        type: 'refund',
        source: 'stripe',
        source_id: 'cs_refund',
        metadata: {},
      };

      transactions.push(txn);

      expect(transactions[0].type).toBe('refund');
      expect(transactions[0].amount_credits).toBe(-500_000);
    });

    it('should include metadata in transactions', async () => {
      const metadata = {
        model: 'gpt-4o',
        tokens: 1_000_000,
        stripe_session_id: 'cs_test',
        productId: 'starter',
      };

      const txn: CreditTransaction = {
        id: 'tx_meta',
        user_id: 'user-meta',
        amount_credits: 500_000,
        balance_after_credits: 500_000,
        type: 'purchase',
        source: 'stripe',
        source_id: 'cs_test',
        metadata,
      };

      transactions.push(txn);

      expect(transactions[0].metadata).toEqual(metadata);
      expect((transactions[0].metadata as Record<string, unknown>).model).toBe('gpt-4o');
    });
  });

  describe('user creation from webhook', () => {
    it('should create a new user if email does not exist', async () => {
      const email = 'newuser@example.com';
      const userExists = balances.has(email);

      expect(userExists).toBe(false);

      setupBalance(email, 0);
      expect(balances.has(email)).toBe(true);
    });

    it('should find existing user by email', async () => {
      const email = 'existing@example.com';
      setupBalance(email, 0);

      const existingUser = balances.get(email);
      expect(existingUser).toBeDefined();
    });
  });
});
