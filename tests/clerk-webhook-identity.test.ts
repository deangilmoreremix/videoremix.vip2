/**
 * Clerk webhook -> Supabase identity wiring, end-to-end at the handler level
 * with a mocked Supabase client and an injected verifier.
 *
 * The security contract under test:
 *   * a forged event (verifier throws) NEVER writes app_users or
 *     clerk_identities - and never reaches the database client at all
 *   * an unconfigured signing secret fails closed (500, no writes)
 *   * a signed user.created/user.updated syncs app_users AND provisions a
 *     VERIFIED identity row (identity_verified = TRUE, source clerk_webhook),
 *     in that order (the identity links into app_users)
 *   * an identity write failure answers 500 so the platform retries - it is
 *     never reported as success
 *   * a Clerk user with no email is a logged no-op (purchases still fail
 *     closed because no verified identity exists)
 *   * a signed user.deleted removes both records
 *   * the signing secret never reaches a log line
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleClerkWebhook } from '../supabase/functions/clerk-webhook/handler';

// Obviously fake test values only. No real secret appears anywhere in this file.
const CLERK_WEBHOOK_SECRET = 'test-secret-clerk-webhook-signing';
const SVIX_ID = 'msg_2fakeTestId';
const SVIX_TIMESTAMP = '2026-10-11T00:00:00.000Z';
const SVIX_SIGNATURE = 'v1a,test-signature-not-real';
const SUPABASE_URL = 'https://test-project.supabase.co';
const SERVICE_ROLE_KEY = 'test-service-role-key';

type Row = Record<string, any>;

interface Store {
  app_users: Row[];
  clerk_identities: Row[];
  calls: string[];
}

interface Hooks {
  failAppUsersUpsert?: boolean;
  failIdentityUpsert?: boolean;
}

class MockQuery {
  private op: 'select' | 'upsert' | 'delete' = 'select';
  private payload: any;
  private filters: Array<{ field: string; value: any }> = [];

  constructor(
    private table: 'app_users' | 'clerk_identities',
    private store: Store,
    private hooks: Hooks,
  ) {}

  select() {
    return this;
  }

  upsert(row: any, options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = row;
    this.store.calls.push(`${this.table}:upsert:${options?.onConflict ?? ''}`);
    return this;
  }

  delete() {
    this.op = 'delete';
    this.store.calls.push(`${this.table}:delete`);
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  maybeSingle() {
    return this;
  }

  then(onFulfilled: (value: any) => any) {
    return Promise.resolve(this.execute()).then(onFulfilled);
  }

  private matches(row: Row): boolean {
    return this.filters.every((filter) => row[filter.field] === filter.value);
  }

  private execute(): { data: any; error: any } {
    const table = this.store[this.table];

    if (this.op === 'upsert') {
      if (this.table === 'app_users' && this.hooks.failAppUsersUpsert) {
        return { data: null, error: { message: 'app_users write disabled by test' } };
      }
      if (this.table === 'clerk_identities' && this.hooks.failIdentityUpsert) {
        return { data: null, error: { message: 'clerk_identities write disabled by test' } };
      }
      // Both tables upsert on clerk_user_id.
      const index = table.findIndex(
        (row) => row.clerk_user_id === this.payload.clerk_user_id,
      );
      if (index >= 0) table[index] = { ...table[index], ...this.payload };
      else table.push({ id: `${this.table}-${table.length + 1}`, ...this.payload });
      return { data: null, error: null };
    }

    if (this.op === 'delete') {
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.matches(table[i])) table.splice(i, 1);
      }
      return { data: null, error: null };
    }

    return { data: table.find((row) => this.matches(row)) ?? null, error: null };
  }
}

function makeStore(): Store {
  return { app_users: [], clerk_identities: [], calls: [] };
}

function verifier(outcome: 'valid' | 'invalid' | 'throw') {
  return vi.fn(async () => {
    if (outcome === 'throw') throw new Error('signature verification failed');
    if (outcome === 'invalid') return false;
    return true;
  });
}

function makeRequest(body: string, withSvixHeaders = true): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (withSvixHeaders) {
    headers['svix-id'] = SVIX_ID;
    headers['svix-timestamp'] = SVIX_TIMESTAMP;
    headers['svix-signature'] = SVIX_SIGNATURE;
  }
  return new Request('https://test-project.supabase.co/functions/v1/clerk-webhook', {
    method: 'POST',
    headers,
    body,
  });
}

function userCreatedEvent(email: string | null = 'Buyer@Example.com', id = 'user_2AAA'): string {
  return JSON.stringify({
    type: 'user.created',
    data: {
      id,
      email_addresses:
        email === null
          ? []
          : [{ id: 'e1', email_address: email, verification: { status: 'verified' } }],
      primary_email_address_id: 'e1',
      first_name: 'Test',
      last_name: 'Buyer',
      image_url: 'https://example.com/avatar.png',
    },
  });
}

function drive(
  req: Request,
  store: Store,
  hooks: Hooks = {},
  overrides: Record<string, any> = {},
) {
  return handleClerkWebhook(req, {
    svixSecret: CLERK_WEBHOOK_SECRET,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SERVICE_ROLE_KEY,
    createClient: () => ({
      from: (table: string) => new MockQuery(table as any, store, hooks),
    }),
    verifyWebhook: verifier('valid'),
    ...overrides,
  });
}

let logs: string[] = [];

beforeEach(() => {
  logs = [];
  vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
    logs.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    logs.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('clerk-webhook identity wiring', () => {
  it('provisions a VERIFIED identity row on a signed user.created event', async () => {
    const store = makeStore();
    const response = await drive(makeRequest(userCreatedEvent()), store);

    expect(response.status).toBe(200);
    expect(store.clerk_identities).toHaveLength(1);
    const identity = store.clerk_identities[0];
    expect(identity.clerk_user_id).toBe('user_2AAA');
    expect(identity.email).toBe('buyer@example.com'); // lower-cased for resolution
    expect(identity.identity_verified).toBe(true);
    expect(identity.verification_source).toBe('clerk_webhook');
    expect(identity.app_user_id).toBe('user_2AAA');
    expect(store.app_users).toHaveLength(1);
    expect(store.app_users[0].clerk_user_id).toBe('user_2AAA');

    // app_users is synced BEFORE the identity row (identity links into it).
    expect(store.calls).toEqual([
      'app_users:upsert:clerk_user_id',
      'clerk_identities:upsert:clerk_user_id',
    ]);
  });

  it('refreshes (not duplicates) the identity on a signed user.updated event', async () => {
    const store = makeStore();
    await drive(makeRequest(userCreatedEvent()), store);

    const response = await drive(
      makeRequest(
        JSON.stringify({
          type: 'user.updated',
          data: {
            id: 'user_2AAA',
            email_addresses: [
              { id: 'e1', email_address: 'buyer@example.com', verification: { status: 'verified' } },
            ],
            primary_email_address_id: 'e1',
          },
        }),
      ),
      store,
    );

    expect(response.status).toBe(200);
    expect(store.clerk_identities).toHaveLength(1);
    expect(store.clerk_identities[0].identity_verified).toBe(true);
  });

  it('deletes both records on a signed user.deleted event', async () => {
    const store = makeStore();
    await drive(makeRequest(userCreatedEvent()), store);
    expect(store.clerk_identities).toHaveLength(1);

    const response = await drive(
      makeRequest(JSON.stringify({ type: 'user.deleted', data: { id: 'user_2AAA' } })),
      store,
    );

    expect(response.status).toBe(200);
    expect(store.app_users).toHaveLength(0);
    expect(store.clerk_identities).toHaveLength(0);
  });

  it('fails closed with 500 when the identity write fails (platform must retry)', async () => {
    const store = makeStore();
    const response = await drive(makeRequest(userCreatedEvent()), store, {
      failIdentityUpsert: true,
    });

    expect(response.status).toBe(500);
    expect(store.clerk_identities).toHaveLength(0);
    // app_users may already have been synced (idempotent upsert; a retry converges).
  });

  it('writes NOTHING when the signature is invalid', async () => {
    const store = makeStore();
    const response = await drive(makeRequest(userCreatedEvent()), store, {}, {
      verifyWebhook: verifier('throw'),
    });

    expect(response.status).toBe(400);
    expect(store.app_users).toHaveLength(0);
    expect(store.clerk_identities).toHaveLength(0);
    expect(store.calls).toEqual([]);
  });

  it('writes NOTHING when svix headers are missing', async () => {
    const store = makeStore();
    const check = verifier('valid');
    const response = await drive(makeRequest(userCreatedEvent(), false), store, {}, {
      verifyWebhook: check,
    });

    expect(response.status).toBe(400);
    expect(check).not.toHaveBeenCalled();
    expect(store.calls).toEqual([]);
  });

  it('fails closed with 500 when the signing secret is not configured', async () => {
    const store = makeStore();
    const check = verifier('valid');
    const response = await drive(makeRequest(userCreatedEvent()), store, {}, {
      svixSecret: '',
      verifyWebhook: check,
    });

    expect(response.status).toBe(500);
    expect(check).not.toHaveBeenCalled();
    expect(store.calls).toEqual([]);
  });

  it('treats a Clerk user without an email as a logged no-op (still no identity)', async () => {
    const store = makeStore();
    const response = await drive(makeRequest(userCreatedEvent(null)), store);

    expect(response.status).toBe(200);
    expect(store.clerk_identities).toHaveLength(0);
    expect(store.app_users).toHaveLength(1); // app_users sync still happens
  });

  it('ignores unrelated event types without any database write', async () => {
    const store = makeStore();
    const response = await drive(
      makeRequest(JSON.stringify({ type: 'session.created', data: { id: 'sess_1' } })),
      store,
    );

    expect(response.status).toBe(200);
    expect(store.calls).toEqual([]);
  });

  it('never logs the signing secret or the svix signature', async () => {
    const store = makeStore();
    await drive(makeRequest(userCreatedEvent()), store);
    await drive(makeRequest(userCreatedEvent()), store, { failIdentityUpsert: true });
    await drive(makeRequest(userCreatedEvent()), store, {}, {
      verifyWebhook: verifier('throw'),
    });

    for (const line of logs) {
      expect(line).not.toContain(CLERK_WEBHOOK_SECRET);
      expect(line).not.toContain(SVIX_SIGNATURE);
    }
  });
});
