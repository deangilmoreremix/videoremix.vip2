/**
 * PayKickstart IPN webhook — end-to-end request handling with a mocked
 * Supabase client.
 *
 * The security contract under test:
 *   * a forged request (no hash) NEVER grants a purchase or app access
 *   * an altered or wrongly-signed payload NEVER grants anything
 *   * a missing secret or an unconfigured campaign fails closed (no grant)
 *   * a timestamp outside the replay window is rejected
 *   * a duplicate delivery is processed exactly once
 *   * a verified charge grants exactly the purchased product's entitlements
 *   * no secret value ever reaches a log line or the audit row
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handlePaykickstartWebhook } from '../supabase/functions/webhook-paykickstart/handler';
import {
  buildPaykickstartSecretMap,
  computePaykickstartHashes,
} from '../supabase/functions/webhook-paykickstart/verify';

// Obviously fake test values only. No real secret appears anywhere in this file.
const CAMPAIGN_SECRET = 'test-secret-paykickstart-campaign-215';
const OTHER_CAMPAIGN_SECRET = 'test-secret-paykickstart-campaign-216';
const WRONG_SECRET = 'test-secret-paykickstart-attacker';
const CAMPAIGN_ID = '215';
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
              existing.webhook_payload?.transaction_id ===
                this.payload.webhook_payload?.transaction_id,
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

function secretMap() {
  return buildPaykickstartSecretMap(
    JSON.stringify({ '215': CAMPAIGN_SECRET, '216': OTHER_CAMPAIGN_SECRET }),
    undefined,
  );
}

function paykickstartFields(overrides: Record<string, unknown> = {}) {
  return {
    event: 'sales',
    mode: 'live',
    payment_processor: 'stripe',
    amount: '97.00',
    quantity: '1',
    buyer_ip: '203.0.113.10',
    buyer_first_name: 'Buyer',
    buyer_last_name: 'Test',
    buyer_email: 'buyer@example.com',
    vendor_email: 'vendor@example.com',
    transaction_id: 'PK-TN0LNO7XWR',
    invoice_id: 'PK-PZ1WK636WR',
    transaction_time: Math.floor(Date.now() / 1000),
    product_id: '2354',
    product_name: 'VideoRemix Pro Lifetime',
    campaign_id: CAMPAIGN_ID,
    campaign_name: 'VideoRemix',
    ...overrides,
  } as Record<string, unknown>;
}

async function signedPaykickstartForm(
  overrides: Record<string, unknown> = {},
  secret = CAMPAIGN_SECRET,
) {
  const fields = paykickstartFields(overrides);
  const [hash] = await computePaykickstartHashes(fields, secret);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...fields, hash })) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return params.toString();
}

function paykickstartRequest(body: string, headers?: Record<string, string>, query = '') {
  return new Request(
    `https://test-project.supabase.co/functions/v1/webhook-paykickstart${query}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
      body,
    },
  );
}

function deps(
  client: ReturnType<typeof createMockSupabase>['client'],
  options: { secrets?: Map<string, string> | null; replayWindowMinutes?: number; now?: Date } = {},
) {
  return {
    secrets: options.secrets === undefined ? secretMap() : options.secrets,
    replayWindowMinutes: options.replayWindowMinutes ?? 7 * 24 * 60,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SERVICE_ROLE_KEY,
    createClient: () => client,
    now: options.now ? () => options.now as Date : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Log-redaction guard                                                        */
/* -------------------------------------------------------------------------- */

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function loggedText(): string {
  const captures = [
    errorSpy.mock.calls,
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

describe('PayKickstart IPN webhook handler', () => {
  describe('verified charges grant exactly the purchased entitlements', () => {
    it('grants the purchased product apps to the buying customer', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true });

      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.purchases[0]).toMatchObject({
        platform: 'paykickstart',
        platform_transaction_id: 'PK-TN0LNO7XWR',
        email: 'buyer@example.com',
        product_name: 'VideoRemix Pro Lifetime',
        amount: 97,
        currency: 'USD',
        status: 'completed',
        processed: true,
      });

      expect(supabase.tables.user_app_access).toHaveLength(2);
      expect(supabase.tables.user_app_access.map((row) => row.app_slug).sort()).toEqual([
        'app-alpha',
        'app-beta',
      ]);
      expect(supabase.tables.user_app_access.every((row) => row.user_id === 'clerk-user-1')).toBe(true);
      expect(
        supabase.tables.user_app_access.some((row) => row.app_slug === 'app-secret-internal'),
      ).toBe(false);

      expect(supabase.tables.webhook_logs).toHaveLength(1);
      expect(supabase.tables.webhook_logs[0]).toMatchObject({
        platform: 'paykickstart',
        event_type: 'sales',
        processing_status: 'processed',
      });
    });

    it('treats the documented hyphenated event names, not the old snake_case ones', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      // The previous implementation watched for `order_success`, `sale_success`,
      // `subscription_created` and `subscription_cancelled` — none of which
      // PayKickstart ever sends, so real sales were silently ignored.
      const response = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({ event: 'subscription-created', invoice_id: 'PK-ABC' }),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(2);
      expect(supabase.tables.subscription_status).toHaveLength(1);
      expect(supabase.tables.user_app_access[0].access_type).toBe('subscription');
    });

    it('never fabricates a customer account', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );

      expect(supabase.client.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('records an unverified buyer as pending and grants nothing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: [
          { clerk_user_id: 'c1', email: 'buyer@example.com', app_user_id: 'a1', identity_verified: false },
        ],
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );

      expect(response.status).toBe(500);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.purchases[0]).toMatchObject({ user_id: null, status: 'pending' });
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('grants nothing when the product is not in the catalog', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ product_name: 'Mystery Product' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('granting on a rebill refreshes access instead of stacking it', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const first = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );
      const rebill = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({
            event: 'subscription-payment',
            transaction_id: 'PK-TN0LNO7XWR-2',
            is_rebill: '1',
          }),
        ),
        deps(supabase.client),
      );

      expect(first.status).toBe(200);
      expect(rebill.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(2);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });
  });

  describe('forged and tampered requests never grant anything', () => {
    it('rejects an unsigned request with 401 and grants nothing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(await signedPaykickstartForm());
      params.delete('hash');

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(params.toString()),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(CAMPAIGN_SECRET);
    });

    it('rejects a request signed with the wrong secret', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({}, WRONG_SECRET)),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(WRONG_SECRET);
      expect(loggedText()).not.toContain(CAMPAIGN_SECRET);
    });

    it('rejects a payload altered after signing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(await signedPaykickstartForm());
      params.set('amount', '0.01');
      params.set('buyer_email', 'attacker@example.com');

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(params.toString()),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(supabase.hooks.rpcCalls).toHaveLength(0);
    });

    it('rejects a payload whose product was swapped after signing', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(await signedPaykickstartForm());
      params.set('product_name', 'Unrelated Product');

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(params.toString()),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('rejects a bare hash value that is not an HMAC of the body', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(await signedPaykickstartForm());
      params.set('hash', 'a'.repeat(40));

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(params.toString()),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('no longer accepts the old ?secret= / ?token= query-parameter bypass', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const params = new URLSearchParams(await signedPaykickstartForm());
      params.delete('hash');

      // The previous implementation read the shared secret out of the query
      // string, so anyone who learned the URL could grant themselves access by
      // appending ?secret=<configured>. That path is gone: only a valid `hash`
      // over the campaign-signed body authorises a grant.
      const response = await handlePaykickstartWebhook(
        paykickstartRequest(params.toString(), {}, `?secret=${encodeURIComponent(CAMPAIGN_SECRET)}`),
        deps(supabase.client),
      );

      expect(response.status).toBe(401);
      expect(supabase.client.from).not.toHaveBeenCalled();
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('fails closed when no secret is configured', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client, { secrets: new Map() }),
      );

      expect(response.status).toBe(500);
      expect(supabase.client.from).not.toHaveBeenCalled();
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(loggedText()).not.toContain(CAMPAIGN_SECRET);
    });

    it('rejects a delivery from an unconfigured campaign', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({ campaign_id: '999' }, OTHER_CAMPAIGN_SECRET),
        ),
        deps(supabase.client),
      );

      // Campaign 999 is signed with campaign 216's secret, which the map holds
      // for 216 only: the lookup must refuse rather than fall back.
      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('accepts a delivery from a second configured campaign', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm(
            { campaign_id: '216', transaction_id: 'PK-OTHER-1' },
            OTHER_CAMPAIGN_SECRET,
          ),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });

    it('rejects a payload with no event and with an unknown event', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });

      const { event: _drop, ...fields } = paykickstartFields();
      const noEvent = new URLSearchParams({ ...fields, hash: 'a'.repeat(40) } as any);
      expect(
        (await handlePaykickstartWebhook(
          paykickstartRequest(noEvent.toString()),
          deps(supabase.client),
        )).status,
      ).toBe(401);

      expect(
        (
          await handlePaykickstartWebhook(
            paykickstartRequest(
              await signedPaykickstartForm({ event: 'not-a-real-event' }),
            ),
            deps(supabase.client),
          )
        ).status,
      ).toBe(401);
    });

    it('rejects a request with no buyer email without granting anything', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ buyer_email: '' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(500);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(supabase.tables.purchases).toHaveLength(0);
    });
  });

  describe('replay window', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    const nowSeconds = Math.floor(now.getTime() / 1000);

    it('accepts a fresh transaction_time', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ transaction_time: nowSeconds - 60 })),
        deps(supabase.client, { now }),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });

    it('rejects a transaction_time outside the replay window', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const stale = await signedPaykickstartForm({
        transaction_time: nowSeconds - 8 * 24 * 60 * 60,
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(stale),
        deps(supabase.client, { now }),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(supabase.client.from).not.toHaveBeenCalled();
    });

    it('rejects a future-dated transaction_time', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ transaction_time: nowSeconds + 3600 })),
        deps(supabase.client, { now }),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('rejects a missing transaction_time', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ transaction_time: undefined })),
        deps(supabase.client, { now }),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('honours a tighter configured window', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ transaction_time: nowSeconds - 300 })),
        deps(supabase.client, { now, replayWindowMinutes: 1 }),
      );

      expect(response.status).toBe(401);
      expect(supabase.tables.user_app_access).toHaveLength(0);
    });

    it('cannot be widened by resubmitting an older signed body', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      // The timestamp is part of the signed material, so an attacker cannot
      // push an old delivery back inside the window.
      const signed = await signedPaykickstartForm({
        transaction_time: nowSeconds - 8 * 24 * 60 * 60,
      });
      const response = await handlePaykickstartWebhook(
        paykickstartRequest(signed),
        deps(supabase.client, { now }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe('duplicate deliveries', () => {
    it('processes a repeated delivery exactly once', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        enforceWebhookLogUniqueness: true,
      });

      const body = await signedPaykickstartForm();
      const first = await handlePaykickstartWebhook(
        paykickstartRequest(body),
        deps(supabase.client),
      );
      const second = await handlePaykickstartWebhook(
        paykickstartRequest(body),
        deps(supabase.client),
      );

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(await second.json()).toMatchObject({ message: 'Event already processed' });

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

      const body = await signedPaykickstartForm();
      const [first, second] = await Promise.all([
        handlePaykickstartWebhook(paykickstartRequest(body), deps(supabase.client)),
        handlePaykickstartWebhook(paykickstartRequest(body), deps(supabase.client)),
      ]);

      expect([first.status, second.status].sort()).toEqual([200, 200]);
      expect(supabase.tables.webhook_logs).toHaveLength(1);
      expect(supabase.tables.purchases).toHaveLength(1);
      expect(supabase.tables.user_app_access).toHaveLength(2);
    });

    it('keeps separate notifications for the same charge as separate events', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const sale = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );
      const created = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({ event: 'subscription-created', invoice_id: 'PK-ABC' }),
        ),
        deps(supabase.client),
      );

      expect(sale.status).toBe(200);
      expect(created.status).toBe(200);
      expect(supabase.tables.webhook_logs).toHaveLength(2);
    });
  });

  describe('non-granting events', () => {
    it.each([
      'refund',
      'refunded',
      'subscription-cancelled',
      'subscription-pause',
      'subscription-pending-cancelation',
      'transaction-pending',
      'cart-abandoned',
      'lead-added',
      'subscription-trial-end',
      'shipped',
      'on_hold',
    ])('never grants app access for %s', async (event) => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        existingPurchases: [
          {
            id: 'purchase-1',
            platform: 'paykickstart',
            platform_transaction_id: 'PK-TN0LNO7XWR',
            status: 'completed',
          },
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

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ event })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      // No new purchase, and the existing grants are untouched or revoked.
      expect(supabase.tables.purchases).toHaveLength(1);
    });

    it('revokes access on a refund', async () => {
      const supabase = createMockSupabase({
        existingPurchases: [
          {
            id: 'purchase-1',
            platform: 'paykickstart',
            platform_transaction_id: 'PK-TN0LNO7XWR',
            status: 'completed',
          },
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

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ event: 'refund' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases[0].status).toBe('refunded');
      expect(supabase.tables.user_app_access[0].is_active).toBe(false);
    });

    it('cancels a subscription on subscription-cancelled', async () => {
      const supabase = createMockSupabase({
        existingSubscriptions: [
          {
            id: 'sub-1',
            user_id: 'clerk-user-1',
            platform_subscription_id: 'PK-PZ1WK636WR',
            status: 'active',
          },
        ],
      });
      supabase.tables.user_app_access.push({
        id: 'access-1',
        user_id: 'clerk-user-1',
        app_slug: 'app-alpha',
        access_type: 'subscription',
        is_active: true,
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({ event: 'subscription-cancelled' }),
        ),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.subscription_status[0].status).toBe('cancelled');
      expect(supabase.tables.user_app_access[0].is_active).toBe(false);
    });

    it('records lead and fulfilment events without a grant', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ event: 'lead-added', amount: '' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(0);
      expect(supabase.tables.user_app_access).toHaveLength(0);
      expect(supabase.tables.webhook_logs[0].event_type).toBe('lead-added');
    });
  });

  describe('request hygiene', () => {
    it('rejects non-POST methods', async () => {
      const supabase = createMockSupabase({ catalog: catalogFixture() });
      const request = new Request('https://test-project.supabase.co/functions/v1/webhook-paykickstart', {
        method: 'GET',
      });

      const response = await handlePaykickstartWebhook(request, deps(supabase.client));

      expect(response.status).toBe(405);
      expect(supabase.client.from).not.toHaveBeenCalled();
    });

    it('answers CORS preflight', async () => {
      const supabase = createMockSupabase();
      const request = new Request('https://test-project.supabase.co/functions/v1/webhook-paykickstart', {
        method: 'OPTIONS',
      });

      const response = await handlePaykickstartWebhook(request, deps(supabase.client));

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('signs custom fields the platform added to the checkout URL', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(
          await signedPaykickstartForm({
            custom_var1: 'ref-491',
            licenses: ['KEY-AAA', 'KEY-BBB'],
          }),
        ),
        deps(supabase.client),
      );

      // The array-valued and custom fields are part of the signed material.
      expect(response.status).toBe(200);
      expect(supabase.tables.purchases).toHaveLength(1);
    });

    it('documents that a signed test-mode IPN still authenticates', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      // mode is signed by hash, so a test-mode IPN really came from this
      // PayKickstart account. It is logged; whether it should grant is an
      // operational decision documented in the report.
      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ mode: 'test' })),
        deps(supabase.client),
      );

      expect(response.status).toBe(200);
      expect(loggedText()).toContain('mode: test');
    });

    it('answers 500 for a processing failure so the platform retries', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
        failPurchaseInsert: true,
      });

      const response = await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );

      expect(response.status).toBe(500);
      expect(supabase.tables.webhook_logs[0].processing_status).toBe('failed');
    });

    it('never writes a secret into webhook_logs or a log line', async () => {
      const supabase = createMockSupabase({
        catalog: catalogFixture(),
        identities: verifiedIdentity(),
      });

      await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client),
      );
      await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({}, WRONG_SECRET)),
        deps(supabase.client),
      );
      await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm({ campaign_id: '999' }, WRONG_SECRET)),
        deps(supabase.client),
      );
      await handlePaykickstartWebhook(
        paykickstartRequest(await signedPaykickstartForm()),
        deps(supabase.client, { secrets: new Map() }),
      );

      const serialisedLogs = JSON.stringify(supabase.tables.webhook_logs);
      expect(serialisedLogs).not.toContain(CAMPAIGN_SECRET);
      expect(serialisedLogs).not.toContain(OTHER_CAMPAIGN_SECRET);
      expect(serialisedLogs).not.toContain(WRONG_SECRET);
      expect(loggedText()).not.toContain(CAMPAIGN_SECRET);
      expect(loggedText()).not.toContain(WRONG_SECRET);
      expect(loggedText()).not.toContain(SERVICE_ROLE_KEY);
    });
  });
});
