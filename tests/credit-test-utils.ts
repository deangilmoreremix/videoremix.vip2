import { vi } from 'vitest';
import { calculateCreditsForUsage, MODEL_CREDIT_RATES, DALLE_CREDITS_PER_IMAGE, WHISPER_CREDITS_PER_MINUTE } from '../src/lib/credit-math';

export interface CreditTestUser {
  id: string;
  email: string;
  balance: number;
}

export interface CreditProduct {
  id: string;
  name: string;
  slug: string;
  creditsAmount: number;
  priceUsd: number;
  stripePriceId: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amountCredits: number;
  balanceAfterCredits: number;
  type: 'purchase' | 'api_usage' | 'refund' | 'bonus' | 'adjustment';
  source: string;
  sourceId: string;
  metadata: Record<string, unknown>;
}

export const CREDIT_PRODUCTS: CreditProduct[] = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    creditsAmount: 500_000,
    priceUsd: 5.00,
    stripePriceId: 'price_starter_test',
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    creditsAmount: 2_500_000,
    priceUsd: 20.00,
    stripePriceId: 'price_pro_test',
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    creditsAmount: 8_000_000,
    priceUsd: 50.00,
    stripePriceId: 'price_business_test',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    creditsAmount: 35_000_000,
    priceUsd: 200.00,
    stripePriceId: 'price_enterprise_test',
  },
];

export const MODEL_PRICING = {
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'o1': { input: 15.00, output: 60.00 },
  'o1-mini': { input: 3.00, output: 12.00 },
  'dall-e-3': { price: 40.00 },
  'whisper-1': { price: 0.006 },
} as const;

export function createTestUser(overrides: Partial<CreditTestUser> = {}): CreditTestUser {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    email: `test-${Date.now()}@example.com`,
    balance: 0,
    ...overrides,
  };
}

export function createTestProduct(overrides: Partial<CreditProduct> = {}): CreditProduct {
  return {
    id: `product-${Date.now()}`,
    name: 'Test Product',
    slug: `product-${Date.now()}`,
    creditsAmount: 100_000,
    priceUsd: 10.00,
    stripePriceId: `price_${Date.now()}`,
    ...overrides,
  };
}

export function createTestTransaction(overrides: Partial<CreditTransaction> = {}): CreditTransaction {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId: `user-${Date.now()}`,
    amountCredits: 100_000,
    balanceAfterCredits: 100_000,
    type: 'purchase',
    source: 'test',
    sourceId: `src-${Date.now()}`,
    metadata: {},
    ...overrides,
  };
}

export function addCreditsToUser(user: CreditTestUser, amount: number): CreditTestUser {
  return {
    ...user,
    balance: user.balance + amount,
  };
}

export function deductCreditsFromUser(user: CreditTestUser, amount: number): { user: CreditTestUser; deducted: number } {
  const deducted = Math.min(user.balance, amount);
  return {
    user: { ...user, balance: user.balance - deducted },
    deducted,
  };
}

export function calculateUsageCredits(
  model: string,
  type: 'input' | 'output' | 'image' | 'minute',
  amount: number
): number {
  return calculateCreditsForUsage({ model, type, amount });
}

export function verifyCreditsDeducted(
  initialBalance: number,
  model: string,
  type: 'input' | 'output' | 'image' | 'minute',
  amount: number,
  expectedFinalBalance?: number
): { deducted: number; finalBalance: number } {
  const deducted = calculateUsageCredits(model, type, amount);
  const finalBalance = Math.max(0, initialBalance - deducted);

  if (expectedFinalBalance !== undefined) {
    expect(finalBalance).toBe(expectedFinalBalance);
  }

  return { deducted, finalBalance };
}

export function mockStripeWebhook(eventType: string, metadata: Record<string, unknown> = {}) {
  const baseEvent: Record<string, unknown> = {
    id: `evt_test_${Date.now()}`,
    type: eventType,
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        customer_details: {
          email: metadata.userEmail || `user-${Date.now()}@example.com`,
        },
        line_items: {
          data: [{ description: metadata.productName || 'Test Product' }],
        },
        amount_total: metadata.amount || 5000,
        currency: 'usd',
        payment_status: 'paid',
        metadata: {
          userId: metadata.userId || `user-${Date.now()}`,
          productId: metadata.productId || 'starter',
          credits: String(metadata.credits || 500_000),
          ...metadata,
        },
      },
    },
  };

  return baseEvent;
}

export function mockOpenAIResponse(
  content: string = 'Mocked AI response',
  model: string = 'gpt-4o'
) {
  return {
    id: `chatcmpl_test_${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  };
}

export function mockOpenAIError(
  message: string = 'Mocked error',
  type: string = 'invalid_request_error',
  statusCode: number = 400
) {
  return {
    statusCode,
    error: {
      message,
      type,
      param: null,
      code: null,
    },
  };
}

export function mockOpenAIRateLimit() {
  return {
    statusCode: 429,
    headers: {
      'retry-after': '2',
      'x-ratelimit-remaining-requests': '0',
      'x-ratelimit-remaining-tokens': '0',
      'x-ratelimit-limit-requests': '500',
      'x-ratelimit-limit-tokens': '150000',
    },
    error: {
      message: 'Rate limit exceeded',
      type: 'rate_limit_exceeded',
    },
  };
}

export function mockCreditBalance(userId: string, balance: number) {
  return {
    user_id: userId,
    balance_credits: balance,
    total_purchased_credits: balance,
    total_spent_credits: 0,
    updated_at: new Date().toISOString(),
  };
}

export function mockCreditTransaction(overrides: Partial<CreditTransaction> = {}) {
  return createTestTransaction(overrides);
}

export function mockSupabaseClient() {
  const balances = new Map<string, number>();
  const transactions: CreditTransaction[] = [];

  const from = vi.fn((table: string) => {
    if (table === 'credit_balances') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((_field: string, value: string) => ({
          single: vi.fn().mockResolvedValue({
            data: balances.has(value) ? { user_id: value, balance_credits: balances.get(value) } : null,
            error: balances.has(value) ? null : { code: 'PGRST116' },
          }),
        })),
        insert: vi.fn().mockImplementation((data: unknown) => {
          const record = data as CreditTransaction[];
          if (record[0]?.userId) {
            balances.set(record[0].userId, record[0].balanceAfterCredits);
          }
          return { data: { ...record[0], id: 'tx_new' }, error: null };
        }),
        update: vi.fn().mockImplementation((data: unknown) => {
          const record = data as Partial<CreditTransaction> & { userId?: string };
          if (record.userId && balances.has(record.userId)) {
            balances.set(record.userId, record.balanceAfterCredits ?? balances.get(record.userId)!);
          }
          return { data: null, error: null };
        }),
        upsert: vi.fn().mockImplementation((data: unknown) => {
          const record = data as CreditTransaction;
          if (record.userId) {
            balances.set(record.userId, record.balanceAfterCredits ?? balances.get(record.userId)!);
          }
          return { data: null, error: null };
        }),
      };
    }

    if (table === 'credit_transactions') {
      return {
        insert: vi.fn().mockImplementation((data: unknown) => {
          const record = data as CreditTransaction;
          transactions.push(record);
          return { data: { ...record, id: 'tx_new_' + Date.now() }, error: null };
        }),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    _setBalance: (userId: string, balance: number) => balances.set(userId, balance),
    _getBalance: (userId: string) => balances.get(userId) ?? 0,
    _getTransactions: () => transactions,
    _reset: () => { balances.clear(); transactions.length = 0; },
  };
}

export function viMockCreditMath() {
  vi.mock('../src/lib/credit-math', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('../src/lib/credit-math');
    return {
      ...actual,
      calculateCreditsForUsage: vi.fn(actual.calculateCreditsForUsage),
      calculateModelCredits: vi.fn(actual.calculateModelCredits),
      deductCredits: vi.fn(actual.deductCredits),
    };
  });
}
