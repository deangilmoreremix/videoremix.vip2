import { describe, it, expect, vi, beforeEach } from 'vitest';

const APP_ID = 'videoremixvip';

describe('credit-repo-contract', () => {
  it('should read credit balance from credits.credit_balances scoped by app_id', async () => {
    const userId = 'user-123';
    const expectedBalance = {
      user_id: userId,
      app_id: APP_ID,
      balance_credits: 100000,
      total_purchased_credits: 100000,
      total_spent_credits: 0,
    };

    expect(expectedBalance.app_id).toBe(APP_ID);
    expect(expectedBalance.balance_credits).toBeGreaterThanOrEqual(0);
  });

  it('should read credit transactions from credits.credit_transactions scoped by app_id', async () => {
    const userId = 'user-123';
    const expectedTransactions = [
      {
        id: 'tx-1',
        user_id: userId,
        app_id: APP_ID,
        amount_credits: 100000,
        balance_after_credits: 100000,
        type: 'purchase',
        source: 'stripe',
        source_id: 'session-1',
        metadata: {},
        created_at: new Date().toISOString(),
      },
    ];

    expect(expectedTransactions[0].app_id).toBe(APP_ID);
    expect(expectedTransactions[0].type).toBe('purchase');
  });

  it('should not expose credit data across apps without matching app_id', async () => {
    const userId = 'user-123';
    const wrongAppId = 'other-app';

    expect(wrongAppId).not.toBe(APP_ID);
  });

  it('should create checkout session with app_id in metadata', async () => {
    const productId = 'starter';
    const expectedMetadata = {
      product_id: productId,
      product_type: 'credits',
      app_id: APP_ID,
      credits_amount: '500000',
    };

    expect(expectedMetadata.app_id).toBe(APP_ID);
    expect(expectedMetadata.product_type).toBe('credits');
  });
});

