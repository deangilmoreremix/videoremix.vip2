/**
 * Zaxxa (Zaxaa) ZPN webhook — end-to-end request handling with a mocked
 * Supabase client.
 *
 * The security contract under test:
 *   * a forged request (no hash_key) NEVER grants a purchase or app access
 *   * an altered or wrongly-signed payload NEVER grants anything
 *   * a missing API signature fails closed (no grant, 500)
 *   * a duplicate delivery is processed exactly once
 *   * a verified delivery grants exactly the purchased product's entitlements
 *     and nothing more, and only for a verified Clerk identity
 *   * no secret value ever reaches a log line or the webhook_logs audit row
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleZaxxaWebhook } from '../supabase/functions/webhook-zaxxa/handler';
import { computeZaxxaHashKey } from '../supabase/functions/webhook-zaxxa/verify';

// Obviously fake test values only. No real secret appears anywhere in this file.
const ZAXXA_SIGNATURE = 'test-secret-zaxxa-api-signature';
const WRONG_SIGNATURE = 'test-secret-zaxxa-attacker';
const SUPABASE_URL = 'https://test-project.supabase.co';
const SERVICE_ROLE_KEY = 'test-service-role-key';

type Row = Record<string, any>;

interface Tables {
  webhook_logs: Row[];
  purchases: Row[];
  user_app_access: Row[];
  subscription_status: Row[];
  products_catalog: Row[];
  platform_product_mappings: Row[];
  clerk_identities: Row[];
}

type Filter =
  | { kind: 'eq'; field: string; value: any }
  | { kind: 'ilike'; field: string; value: string }
  | { kind: 'in'; field: string; value: any[] }
  | { kind: 'contains'; field: string; value: Record<string, any> };

function likeToRegExp(pattern: string): RegExp {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '\\' && i + 1 < pattern.length) {
      source += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } else if (char === '%') {
      source += '.*';
    } else if (char === '_') {
      source += '.';
    } else {
      source += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`, 'i');
}

function passesFilter(row: Row, filter: Filter): boolean {
  const actual = row[filter.field];
  switch (filter.kind) {
    case 'eq':
      return actual === filter.value;
    case 'ilike':
      return typeof actual === 'string' && likeToRegExp(filter.value).test(actual);
    case 'in':
      return filter.value.includes(actual);
    case 'contains':
      return Object.entries(filter.value).every(([key, value]) => actual?.[key] === value);
    default:
      return false;
  }
}

interface MockOptions {
  catalog?: Row[];
  mappings?: Row[];
  identities?: Row[];
  existingPurchases?: Row[];
  existingSubscriptions?: Row[];
  failPurchaseInsert?: boolean;
  enforceWebhookLogUniqueness?: boolean;
}

interface MockHooks {
  grants: Row[];
  rpcCalls: Row[];
  lastPurchaseId?: string;
  uniqueWebhookLogs?: boolean;
  failPurchaseInsert?: boolean;
}

class MockQuery {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any;
  private filters: Filter[] = [];
  private limitCount: number | null = null;
  private selected = false;
  private onConflict: string | undefined;
  private terminal: 'none' | 'single' | 'maybeSingle' = 'none';

  constructor(
    private table: keyof Tables,
    private tables: Tables,
    private hooks: MockHooks,
  ) {}

  select(_fields?: string) {
    this.selected = true;
    return this;
  }

  insert(row: any) {
    this.op = 'insert';
    this.payload = row;
    return this;
  }

  update(row: any) {
    this.op = 'update';
    this.payload = row;
    return this;
  }

  upsert(row: any, options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = row;
    this.onConflict = options?.onConflict;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ kind: 'eq', field, value });
    return this;
  }

  ilike(field: string, value: string) {
    this.filters.push({ kind: 'ilike', field, value });
    return this;
  }

  in(field: string, value: any[]) {
    this.filters.push({ kind: 'in', field, value });
    return this;
  }

  contains(field: string, value: Record<string, any>) {
    this.filters.push({ kind: 'contains', field, value });
    return this;
  }

  order() {
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.terminal = 'single';
    return this;
  }

  maybeSingle() {
    this.terminal = 'maybeSingle';
    return this;
  }

  then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
    return Promise.resolve(this.execute()).then(onFulfilled, onRejected);
  }

  private matching(): Row[] {
    return this.tables[this.table].filter((row) =>
      this.filters.every((filter) => passesFilter(row, filter)),
    );
  }

  private execute(): { data: any; error: any } {
    const table = this.tables[this.table];

    switch (this.op) {
      case 'insert': {
        if (this.table === 'webhook_logs' && this.hooks.uniqueWebhookLogs) {
          const conflict = table.some(
            (existing) =>
              existing.platform === this.payload.platform &&
              existing.event_type === this.payload.event_type &&
              existing.webhook_payload?.trans_receipt === this.payload.webhook_payload?.trans_receipt,
          );
          if (conflict) {
            return {
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            };
          }
        }

        if (this.table === 'purchases') {
          const conflict = table.some(
            (existing) =>
              existing.platform === this.payload.platform &&
              existing.platform_transaction_id === this.payload.platform_transaction_id,
          );
          if (conflict) {
            return {
              data: null,
              error: {
                code: '23505',
                message:
                  'duplicate key value violates unique constraint "purchases_platform_platform_transaction_id_key"',
              },
            };
          }
          if (this.hooks.failPurchaseInsert) {
            return { data: null, error: { message: 'purchase insert disabled by test' } };
          }
        }

        const record: Row = { id: `${this.table}-${table.length + 1}`, ...this.payload };
        table.push(record);
        if (this.table === 'purchases') this.hooks.lastPurchaseId = record.id;
        return this.applyTerminal(this.selected ? [record] : null);
      }

      case 'update': {
        for (const row of this.matching()) Object.assign(row, this.payload);
        return { data: null, error: null };
      }

      case 'delete': {
        for (let i = table.length - 1; i >= 0; i--) {
          if (this.filters.every((filter) => passesFilter(table[i], filter))) table.splice(i, 1);
        }
        return { data: null, error: null };
      }

      case 'upsert': {
        const keys = (this.onConflict ?? '').split(',').map((key) => key.trim());
        const existingIndex = table.findIndex((row) =>
          keys.every((key) => row[key] === this.payload[key]),
        );
        if (existingIndex >= 0) {
          table[existingIndex] = { ...table[existingIndex], ...this.payload };
        } else {
          table.push({ id: `${this.table}-${table.length + 1}`, ...this.payload });
        }
        if (this.table === 'user_app_access') this.hooks.grants.push(this.payload);
        return { data: null, error: null };
      }

      default: {
        let rows = this.matching();
        if (this.limitCount !== null) rows = rows.slice(0, this.limitCount);
        return this.applyTerminal(rows);
      }
    }
  }

  private applyTerminal(rows: Row[] | null): { data: any; error: any } {
    if (rows === null) return { data: null, error: null };
    if (this.terminal === 'maybeSingle') return { data: rows[0] ?? null, error: null };
    if (this.terminal === 'single') {
      if (rows.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'no rows returned' } };
      }
      return { data: rows[0], error: null };
    }
    return { data: rows, error: null };
  }
}

function createMockSupabase(options: MockOptions = {}) {
  const tables: Tables = {
    webhook_logs: [],
    purchases: [...(options.existingPurchases ?? [])],
    user_app_access: [],
    subscription_status: [...(options.existingSubscriptions ?? [])],
    products_catalog: options.catalog ?? [],
    platform_product_mappings: options.mappings ?? [],
    clerk_identities: options.identities ?? [],
  };

  const hooks: MockHooks = {
    grants: [],
    rpcCalls: [],
    uniqueWebhookLogs: options.enforceWebhookLogUniqueness,
    failPurchaseInsert: options.failPurchaseInsert,
  };

  const client = {
    from: vi.fn((table: keyof Tables) => new MockQuery(table, tables, hooks)),
    rpc: vi.fn(async (fn: string, args: Row) => {
      hooks.rpcCalls.push({ fn, args });
      return { data: fn === 'pg_advisory_lock' ? true : null, error: null };
    }),
    auth: {
      admin: {
        // processPurchase must never fabricate an account: grants only ever
        // land on an already-verified Clerk identity.
        createUser: vi.fn(async () => {
          throw new Error('processPurchase must not fabricate a user account');
        }),
      },
    },
  };

  return { client, tables, hooks };
}

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

function catalogFixture() {
  return [
    {
      id: 'prod-vr-pro',
      name: 'VideoRemix Pro Lifetime',
      slug: 'videoremix-pro-lifetime',
      sku: 'VR-PRO-LIFETIME',
      apps_granted: ['app-alpha', 'app-beta'],
      is_active: true,
    },
    {
      id: 'prod-other',
      name: 'Unrelated Product',
      slug: 'unrelated-product',
      sku: 'OTHER-1',
      apps_granted: ['app-secret-internal'],
      is_active: true,
    },
  ];
}

function verifiedIdentity(email = 'buyer@example.com') {
  return [{ clerk_user_id: 'clerk-user-1', email, app_user_id: 'app-user-1', identity_verified: true }];
}

function zaxxaForm(overrides: Record<string, string> = {}, signature = ZAXXA_SIGNATURE) {
  const fields: Record<string, string> = {
    trans_type: 'SALE',
    trans_receipt: 'RCPT-0001',
    trans_amount: '47.00',
    seller_id: '12345',
    trans_date: '2026-10-11 20:00:11 UTC',
    trans_currency: 'USD',
    trans_gateway: 'STRIPE',
    trans_testmode: '0',
    seller_email: 'seller@example.com',
    cust_email: 'buyer@example.com',
    cust_firstname: 'Buyer',
    cust_lastname: 'Test',
    item_count: '1',
    'products[0][prod_number]': 'VR-PRO-LIFETIME',
    'products[0][prod_name]': 'VideoRemix Pro Lifetime',
    'products[0][amount]': '47.00',
    'products[0][payment_type]': 'onetime',
    ...overrides,
  };

  const hash_key = computeZaxxaHashKey(signature, {
    sellerId: fields.seller_id,
    transReceipt: fields.trans_receipt,
    transAmount: fields.trans_amount,
  });

  return new URLSearchParams({ ...fields, hash_key }).toString();
}

function zaxxaRequest(body: string, headers?: Record<string, string>, query = '') {
  return new Request(`https://test-project.supabase.co/functions/v1/webhook-zaxxa${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });
}

function deps(
  client: ReturnType<typeof createMockSupabase>['client'],
  apiSignature: string | undefined | null = ZAXXA_SIGNATURE,
) {
  return {
    apiSignature,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SERVICE_ROLE_KEY,
    createClient: () => client,
  };
}

/* -------------------------------------------------------------------------- */
/* Log-redaction guard                                                        */
/* -------------------------------------------------------------------------- */

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedText(): string {
  const captures = [
    logSpy.mock.calls,
    (console.log as any).mock?.calls ?? [],
    (console.warn as any).mock?.calls ?? [],
  ];
  return captures
    .flat()
    .map((call: unknown[]) => call.map((arg: unknown) => String(arg)).join(' '))
    .join('\n');
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('Zaxxa ZPN webhook handler', () => {
  describe('verified sales grant exactly the purchased entitlements', () => {
    it('grants the purchased product apps to the buying customer', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true });

      // Exactly one purchase row, for exactly the purchased product.
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.purchases[0]).toMatchObject({
        platform: 'zaxxa',
        platform_transaction_id: 'RCPT-0001',
        email: 'buyer@example.com',
        product_name: 'VideoRemix Pro Lifetime',
        product_sku: 'VR-PRO-LIFETIME',
        amount: 47,
        currency: 'USD',
        status: 'completed',
        processed: true,
      });

      // Exactly the purchased product's app list, nothing else.
      expect(supabase.tables.user_app_access).toHaveLength(2);
      expect(supabase.tables.user_app_access.map((row) => row.app_slug).sort()).toEqual([
        'app-alpha',
        'app-beta',
      ]);
      expect(supabase.tables.user_app_access.every((row) => row.user_id === 'clerk-user-1')).toBe(true);
      expect(supabase.tables.user_app_access.every((row) => row.access_type === 'lifetime')).toBe(true);
      expect(
        supabase.tables.user_app_access.every(
          (row) => row.purchase_id === supabase.tables.purchases[0].id,
        ),
      ).toBe(true);
      expect(
        supabase.tables.user_app_access.some((row) => row.app_slug === 'app-secret-internal'),
      ).toBe(false);

      // The audit row reaches a terminal state.
      expect(supabase.tables.webhook_logs).toHaveLength(1);
      expect(supabase.tables.webhook_logs[0]).toMatchObject({
        platform: 'zaxxa',
        event_type: 'SALE',
        processing_status: 'processed',
      });
    });

    it('never fabricates a customer account', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));

      expect(supabase.client.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('records an unverified buyer as pending and grants nothing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: [
          { clerk_user_id: 'clerk-user-1', email: 'buyer@example.com', app_user_id: 'app-user-1', identity_verified: false },
        ],
      });

      const response = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));

      // Fail closed at the shared processor: the purchase is kept for
      // reconciliation and no entitlement is created.
      expect(response.status).toBe(500);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.purchases[0]).toMatchObject({
        user_id: null,
        status: 'pending',
        processed: false,
      });
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(supabase.tables.webhook_logs[0].processing_status).toBe('failed');
    });

    it('grants nothing when the product is not in the catalog', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handleZaxxaWebhook(
        zaxxaRequest(
          zaxxaForm({
            'products[0][prod_name]': 'Mystery Product',
            'products[0][prod_number]': 'MYSTERY-1',
          }),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('does not fuzzy-match a look-alike product name', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      await handleZaxxaWebhook(
        zaxxaRequest(
          zaxxaForm({
            'products[0][prod_name]': 'VideoRemix Pro Lifetime % Deluxe VIP',
            'products[0][prod_number]': 'VR-PRO-LIFETIME-%',
          }),
        ),
        deps(supabase.client),
      );

      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('treats REBILL as a renewing charge rather than a duplicate sale', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const first = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));
      const second = await handleZaxxaWebhook(
        zaxxaRequest(
          zaxxaForm({
            // A rebill is a distinct charge with its own receipt number.
            trans_type: 'REBILL',
            trans_receipt: 'RCPT-0002',
            'products[0][payment_type]': 'subscription',
            'products[0][recurring_id]': 'SUB-1',
          }),
        ),
        deps(supabase.client),
      );

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      // Two distinct charges, but the entitlement itself is not duplicated.
      expect(supabase.tables.purchases).toHaveLength(2);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });

    it('creates a subscription row for a FIRST_BILL with a recurring id', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handleZaxxaWebhook(
        zaxxaRequest(
          zaxxaForm({
            trans_type: 'FIRST_BILL',
            'products[0][payment_type]': 'subscription',
            'products[0][recurring_id]': 'SUB-1',
          }),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases[0].is_subscription).toBe(true);
      expect(supabase.tables.subscription_status).toHaveLength(1);
      expect(supabase.tables.subscription_status[0]).toMatchObject({
        platform: 'zaxxa',
        platform_subscription_id: 'SUB-1',
        status: 'active',
      });
      expect(supabase.tables.user_app_access[0].access_type).toBe('subscription');
    });
  });

  describe('forged and tampered requests never grant anything', () => {
    it('rejects an unsigned request with 401 and grants nothing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(zaxxaForm());
      params.delete('hash_key');

      const response = await handleZaxxaWebhook(zaxxaRequest(params.toString()), deps(supabase.client));

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(ZAXXA_SIGNATURE);
    });

    it('rejects an empty body with 401', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const response = await handleZaxxaWebhook(zaxxaRequest(''), deps(supabase.client));

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
    });

    it('rejects a request signed with the wrong secret', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handleZaxxaWebhook(
        zaxxaRequest(zaxxaForm({}, WRONG_SIGNATURE)),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(WRONG_SIGNATURE);
      expect(loggedText()).not.toContain(ZAXXA_SIGNATURE);
    });

    it('rejects a payload altered after signing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });
      const params = new URLSearchParams(zaxxaForm());
      // Attacker keeps the valid hash_key but rewrites the receipt and amount.
      params.set('trans_receipt', 'RCPT-ATTACKER');
      params.set('trans_amount', '0.01');

      const response = await handleZaxxaWebhook(zaxxaRequest(params.toString()), deps(supabase.client));

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('rejects a receipt whose amount was changed to zero after signing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });
      const params = new URLSearchParams(zaxxaForm());
      params.set('trans_amount', '0.00');

      const response = await handleZaxxaWebhook(zaxxaRequest(params.toString()), deps(supabase.client));

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('documents that only seller_id, trans_receipt and trans_amount are signed', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });
      // Zaxxa's hash_key covers seller_id + signature + trans_receipt +
      // trans_amount only, so a mutated product name still verifies. The
      // entitlement binding is therefore enforced by exact catalog matching
      // and by trans_type:trans_receipt idempotency, not by the digest.
      const params = new URLSearchParams(zaxxaForm());
      params.set('products[0][prod_name]', 'Unrelated Product');
      params.set('products[0][prod_number]', 'OTHER-1');

      const response = await handleZaxxaWebhook(zaxxaRequest(params.toString()), deps(supabase.client));

      expect(response.status).toBe(200);
      expect(supabase.tables.user_app_access.map((row) => row.app_slug)).toEqual([
        'app-secret-internal',
      ]);
    });

    it('no longer accepts the old ?secret= / ?token= query-parameter bypass', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(zaxxaForm());
      params.delete('hash_key');

      // The previous implementation read the shared secret out of the query
      // string, so anyone who learned the URL could grant themselves access by
      // appending ?secret=<configured>. That path is gone: only a valid
      // hash_key authorises a grant.
      const response = await handleZaxxaWebhook(
        zaxxaRequest(
          params.toString(),
          undefined,
          `?secret=${encodeURIComponent(ZAXXA_SIGNATURE)}`,
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.client.from).not.toHaveBeenCalled();
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('fails closed when no API signature is configured', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client, null));

      expect(response.status).toBe(500);
      // Fail closed: no database work at all, so nothing can be granted.
      expect(supabase.client.from).not.toHaveBeenCalled();
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(ZAXXA_SIGNATURE);
    });

    it('fails closed when the configured signature is only whitespace', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const response = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client, '   '));

      expect(response.status).toBe(500);
      expect(supabase.client.from).not.toHaveBeenCalled();
    });

    it('rejects an unknown transaction type', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const response = await handleZaxxaWebhook(
        zaxxaRequest(zaxxaForm({ trans_type: 'MYSTERY' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.client.from).not.toHaveBeenCalled();
    });
  });

  describe('replay and duplicate deliveries', () => {
    it('processes a repeated delivery exactly once', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        enforceWebhookLogUniqueness: true,
      });

      const body = zaxxaForm();
      const first = await handleZaxxaWebhook(zaxxaRequest(body), deps(supabase.client));
      const second = await handleZaxxaWebhook(zaxxaRequest(body), deps(supabase.client));

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(await second.json()).toMatchObject({ success: true, message: 'Event already processed' });

      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(2);
      expect(supabase.tables.webhook_logs).toHaveLength(1);
    });

    it('detects a concurrent duplicate through the unique-violation path', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        enforceWebhookLogUniqueness: true,
      });

      const body = zaxxaForm();
      const [first, second] = await Promise.all([
        handleZaxxaWebhook(zaxxaRequest(body), deps(supabase.client)),
        handleZaxxaWebhook(zaxxaRequest(body), deps(supabase.client)),
      ]);

      // One delivery won the claim and one was rejected as a duplicate.
      expect([first.status, second.status].sort()).toEqual([200, 200]);
      expect(supabase.tables.webhook_logs).toHaveLength(1);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });

    it('does not treat a different transaction type on the same receipt as a duplicate', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const sale = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));
      const refund = await handleZaxxaWebhook(
        zaxxaRequest(zaxxaForm({ trans_type: 'REFUND' })),
        deps(supabase.client),
      );

      expect(sale.status).toBe(200);
      expect(refund.status).toBe(200);
      expect(supabase.tables.webhook_logs).toHaveLength(2);
    });

    it('records Zaxxa never signing a timestamp: trans_date is unauthenticated', async () => {
      // Zaxxa's signed material has no date, so a stale trans_date cannot be
      // used to reject a replay; idempotency on trans_type:trans_receipt is the
      // control. The body below is a month old and still verifies.
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const params = new URLSearchParams(zaxxaForm({ trans_date: '2026-09-11 20:00:11 UTC' }));

      const response = await handleZaxxaWebhook(zaxxaRequest(params.toString()), deps(supabase.client));

      expect(response.status).not.toBe(401);
    });
  });

  describe('cancellation and refund paths', () => {
    it('deactivates subscription access on CANCELED without granting', async () => {
      const supabase = createMockSupabase({
        existingSubscriptions: [
          { id: 'sub-1', user_id: 'clerk-user-1', platform_subscription_id: 'SUB-1' },
        ],
      });
      supabase.tables.user_app_access.push({
        id: 'access-1',
        user_id: 'clerk-user-1',
        app_slug: 'app-alpha',
        access_type: 'subscription',
        is_active: true,
      });

      const response = await handleZaxxaWebhook(
        zaxxaRequest(
          zaxxaForm({
            trans_type: 'CANCELED',
            'products[0][payment_type]': 'subscription',
            'products[0][recurring_id]': 'SUB-1',
          }),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.subscription_status[0].status).toBe('cancelled');
      expect(supabase.tables.user_app_access[0].is_active).toBe(false);
    });

    it('refunds a purchase and deactivates its access', async () => {
      const supabase = createMockSupabase({
        existingPurchases: [
          { id: 'purchase-1', platform: 'zaxxa', platform_transaction_id: 'RCPT-0001', status: 'completed' },
        ],
      });
      supabase.tables.user_app_access.push({
        id: 'access-1',
        user_id: 'clerk-user-1',
        app_slug: 'app-alpha',
        purchase_id: 'purchase-1',
        access_type: 'lifetime',
        is_active: true,
      });

      const response = await handleZaxxaWebhook(
        zaxxaRequest(zaxxaForm({ trans_type: 'REFUND' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases[0].status).toBe('refunded');
      expect(supabase.tables.user_app_access[0].is_active).toBe(false);
    });
  });

  describe('request hygiene', () => {
    it('rejects non-POST methods', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const request = new Request('https://test-project.supabase.co/functions/v1/webhook-zaxxa', {
        method: 'GET',
      });

      const response = await handleZaxxaWebhook(request, deps(supabase.client));

      expect(response.status).toBe(405);
      expect(supabase.client.from).not.toHaveBeenCalled();
    });

    it('answers CORS preflight', async () => {
      const supabase = createMockSupabase();
      const request = new Request('https://test-project.supabase.co/functions/v1/webhook-zaxxa', {
        method: 'OPTIONS',
      });

      const response = await handleZaxxaWebhook(request, deps(supabase.client));

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('still enforces hash_key when the body arrives as JSON', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const fields = {
        trans_type: 'SALE',
        trans_receipt: 'RCPT-0001',
        trans_amount: '47.00',
        seller_id: '12345',
        cust_email: 'buyer@example.com',
        products: [{ prod_number: 'VR-PRO-LIFETIME', prod_name: 'VideoRemix Pro Lifetime', amount: '47.00' }],
        hash_key: computeZaxxaHashKey(ZAXXA_SIGNATURE, {
          sellerId: '12345',
          transReceipt: 'RCPT-0001',
          transAmount: '47.00',
        }),
      };

      const request = new Request('https://test-project.supabase.co/functions/v1/webhook-zaxxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      const response = await handleZaxxaWebhook(request, deps(supabase.client));

      // The signature still has to hold; JSON delivery is not a bypass.
      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(1);

      const forged = new Request('https://test-project.supabase.co/functions/v1/webhook-zaxxa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, hash_key: 'A'.repeat(32), trans_amount: '0.01' }),
      });

      const forgedResponse = await handleZaxxaWebhook(forged, deps(supabase.client));
      expect(forgedResponse.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(1);
    });

    it('answers 500 for a processing failure so the platform retries', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        failPurchaseInsert: true,
      });

      const response = await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));

      expect(response.status).toBe(500);
      expect(supabase.tables.webhook_logs[0].processing_status).toBe('failed');
    });

    it('never writes a secret into webhook_logs or a log line', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client));
      await handleZaxxaWebhook(zaxxaRequest(zaxxaForm({}, WRONG_SIGNATURE)), deps(supabase.client));
      await handleZaxxaWebhook(zaxxaRequest(''), deps(supabase.client));
      await handleZaxxaWebhook(zaxxaRequest(zaxxaForm()), deps(supabase.client, undefined));

      const serialisedLogs = JSON.stringify(supabase.tables.webhook_logs);
      expect(serialisedLogs).not.toContain(ZAXXA_SIGNATURE);
      expect(serialisedLogs).not.toContain(WRONG_SIGNATURE);
      expect(loggedText()).not.toContain(ZAXXA_SIGNATURE);
      expect(loggedText()).not.toContain(WRONG_SIGNATURE);
      expect(loggedText()).not.toContain(SERVICE_ROLE_KEY);
    });
  });
});
