// supabase/functions/clerk-webhook/handler.ts
//
// Clerk (svix) webhook handler: mirrors Clerk user records into Supabase and
// provisions the VERIFIED identity used by purchase resolution.
//
// Kept free of Deno-only imports (and free of the `npm:svix@1` import) so the
// whole request path can be driven by the vitest suite in
// tests/clerk-webhook-identity.test.ts. `index.ts` is the thin Deno bootstrap
// that wires this to `serve()` and the real svix verifier.
//
// SECURITY CONTRACT
//   1. NOTHING is read from the payload before the svix signature over the raw
//      body passes. An unsigned/forged payload can never create, update or
//      delete an identity row (which is what purchase grants key off).
//   2. FAIL CLOSED. Unconfigured secret -> 500 (operator must notice); missing
//      or bad signature -> 400 with no database access; identity write failure
//      -> 500 so the platform retries (both writes are idempotent upserts, so
//      a retry converges).
//   3. IDENTITY ROWS ARE ONLY WRITTEN HERE FROM SIGNED EVENTS
//      (verification_source = 'clerk_webhook', identity_verified = TRUE). The
//      alternative verified path is scripts/migration-verify-identities.mjs
//      against the Clerk Backend API. Unverified placeholder rows grant
//      nothing.
//   4. No secret value is ever logged or persisted.

import {
  deleteIdentityForClerkUser,
  upsertIdentityFromClerkEvent,
} from '../_shared/identity.ts';

export interface ClerkWebhookDeps {
  /** CLERK_WEBHOOK_SECRET (svix signing secret). Undefined = misconfigured. */
  svixSecret: string | undefined | null;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Injected so the handler can be exercised without a live project. */
  createClient: (url: string, key: string) => any;
  /**
   * svix verification. Throws (or resolves false) when the signature does not
   * match. Injected so tests can drive the handler without the svix module;
   * index.ts supplies the real implementation.
   */
  verifyWebhook: (
    payload: string,
    headers: Record<string, string>,
    secret: string,
  ) => void | boolean | Promise<void | boolean>;
}

interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: { status?: string } | null;
}

interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Clerk user -> app_users row (defensive: never trusts payload beyond Clerk's shape). */
function buildAppUser(data: ClerkUserData) {
  const emails = data.email_addresses ?? [];
  const primary =
    emails.find((e) => e.id === data.primary_email_address_id) ?? emails[0];

  return {
    id: data.id, // app_users.id carries the Clerk user id
    clerk_user_id: data.id, // explicit Clerk id column (see migration 20260709050000)
    email: primary?.email_address || '',
    first_name: (data as any).first_name || '',
    last_name: (data as any).last_name || '',
    image_url: (data as any).image_url || '',
    updated_at: new Date().toISOString(),
  };
}

export async function handleClerkWebhook(
  req: Request,
  deps: ClerkWebhookDeps,
): Promise<Response> {
  // 1. Configuration check first: fail closed when misconfigured.
  if (!deps.svixSecret) {
    console.error('Clerk webhook rejected: CLERK_WEBHOOK_SECRET is not configured');
    return json({ error: 'Webhook secret not configured' }, 500);
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 2. Svix headers are mandatory.
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return json({ error: 'Missing svix headers' }, 400);
  }

  const payload = await req.text();

  // 3. Signature verification BEFORE any parsing of the payload for business
  //    decisions. Only the verifier's own outcome decides what happens next.
  let verified = false;
  try {
    const outcome = await deps.verifyWebhook(
      payload,
      {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      },
      deps.svixSecret,
    );
    verified = outcome !== false;
  } catch {
    verified = false;
  }

  if (!verified) {
    console.error(`Clerk webhook ${svixId}: signature verification failed`);
    return json({ error: 'Invalid signature' }, 400);
  }

  // 4. Only now is the payload trusted enough to parse and act on.
  const event = JSON.parse(payload) as ClerkWebhookEvent;
  const eventType = event.type;
  const userData = event.data;

  const supabase = deps.createClient(deps.supabaseUrl, deps.supabaseServiceRoleKey);

  // user.created / user.updated: sync app_users, then provision the verified
  // identity (ordering matters: the identity row links into app_users).
  if (eventType === 'user.created' || eventType === 'user.updated') {
    // Sync user to app_users table
    const appUser = buildAppUser(userData);

    const { error: appUserError } = await supabase
      .from('app_users')
      .upsert(appUser, {
        onConflict: 'clerk_user_id',
      });

    if (appUserError) {
      console.error('Failed to sync user to app_users:', appUserError.message);
    }

    // Provision the verified identity. This is the row purchase resolution
    // trusts, so a write failure MUST surface as a retryable error: answering
    // 200 would let the platform drop a delivery that leaves the customer
    // without a resolvable identity (every later purchase would fail closed).
    const identityResult = await upsertIdentityFromClerkEvent(supabase, userData);
    if (!identityResult.ok) {
      if (identityResult.reason === 'missing_email') {
        // A Clerk user with no email address can never be resolved by email,
        // so there is nothing to provision. Purchases for such an account
        // still fail closed (no verified identity exists), which is the safe
        // outcome - this is bookkeeping, not a grant.
        console.log(
          `Clerk user ${userData.id} has no email address; identity row skipped`,
        );
      } else {
        console.error(
          `Failed to sync identity for Clerk user ${userData.id} (${identityResult.reason})`,
        );
        return json({ error: 'Failed to sync identity' }, 500);
      }
    }

    return json({ success: true, message: 'User synced' }, 200);
  }

  // user.deleted: remove both records. app_users delete keeps existing
  // behaviour; the identity delete is best-effort (a stale identity row is a
  // reconciliation item, never a grant failure).
  if (eventType === 'user.deleted') {
    const { error: deleteError } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userData.id);

    if (deleteError) {
      console.error('Failed to delete user from app_users:', deleteError.message);
    }

    await deleteIdentityForClerkUser(supabase, userData.id);

    return json({ success: true, message: 'User deleted' }, 200);
  }

  // Ignore other event types
  return json({ success: true, message: 'Unhandled event type' }, 200);
}
