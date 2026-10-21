// supabase/functions/_shared/agentos-client.ts
//
// Service-role Supabase client + Clerk JWT verification for AgentOS edge
// functions.
//
// WHY A SERVICE-ROLE CLIENT
//   The durable queue lives in the `agentos` schema and is owned by SECURITY
//   DEFINER functions that must move tasks across tenants as a scheduler.
//   The client the browser uses is RLS-scoped to one Clerk user and cannot
//   claim another tenant's work. The service-role client is therefore used
//   ONLY inside these functions, and it is never returned to a caller.
//
// IDENTITY
//   The same pattern as supabase/functions/run-ai-app/index.ts: the caller's
//   Clerk user id comes ONLY from the verified JWT. It is never read from the
//   request body. An unauthenticated request fails closed.
//
// SCHEMA
//   Every AgentOS table, function and RPC lives in the `agentos` schema, while
//   the project also exposes `public` (and `graphql_public`) to PostgREST.
//   An unqualified `.from('tasks')` resolves against the exposed schemas, so it
//   would never reach `agentos.tasks` — and on this project `public.tasks`
//   exists, so it would silently read the WRONG table. The client below is
//   therefore pinned to the `agentos` schema, which supabase-js sends as the
//   `Accept-Profile` / `Content-Profile` header.
//
//   The schema must be exposed to PostgREST for this to work; see
//   supabase/migrations/20261012120700_agentos_expose_schema.sql and
//   scripts/agentos-verify-exposure.sh.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { createSupabaseContext } from 'npm:@supabase/server';

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = any;

/** The schema every AgentOS object lives in. */
export const AGENTOS_SCHEMA = 'agentos';

let cachedClient: AnySupabaseClient | null = null;

export function getServiceClient(): AnySupabaseClient {
  if (cachedClient) return cachedClient;

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: AGENTOS_SCHEMA },
  });
  return cachedClient;
}

/**
 * A client pinned to the `credits` schema.
 *
 * WHY A SEPARATE SCHEMA
 *   The credit ledger lives in the `credits` schema, not in `agentos`, and
 *   the shared service client is pinned to `agentos`. The billing RPC
 *   (`credits.deduct_credits`) therefore has to be addressed against its own
 *   schema, exactly like run-ai-app does.
 */
export function getCreditsClient(): AnySupabaseClient {
  return getServiceClient().schema('credits');
}

/**
 * A client that acts as the CALLER (the request's own JWT) while still
 * resolving AgentOS objects in the `agentos` schema. The service-role key
 * carries no `sub`, so the SECURITY DEFINER RPCs that re-derive the acting
 * user refuse it; the caller's verified token has to be forwarded instead.
 */
export function getCallerClient(req: Request): AnySupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('authorization') ?? '' },
      },
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: AGENTOS_SCHEMA },
    },
  );
}

export interface VerifiedCaller {
  /** The Clerk user id (JWT `sub`). */
  clerkUserId: string;
}

export async function verifyCaller(req: Request): Promise<VerifiedCaller | null> {
  try {
    // `auth: "user"` verifies a USER JWT (Clerk-issued on this platform). Anon
    // keys and service keys do not match this mode.
    const { data: ctx, error } = await createSupabaseContext(req, { auth: 'user' });
    if (error || !ctx) return null;

    const sub = (ctx as { user?: { id?: string } }).user?.id
      ?? (ctx as { sub?: string }).sub
      ?? null;
    if (!sub) return null;

    return { clerkUserId: sub };
  } catch (err) {
    console.error('[agentos] caller verification failed:', err);
    return null;
  }
}

/**
 * True when the request carries a SERVICE credential (the service-role key).
 *
 * WHY NOT A SUBSTRING CHECK
 *   The check used to be `authorization.includes('service_role')`, which looks
 *   for the literal text in the header. A real service-role key is a JWT, and
 *   the base64 of its payload does NOT contain that substring — so the
 *   scheduler's own calls were rejected with "Unauthorized" and the sweep and
 *   the executor could never run. It is also the wrong shape for a security
 *   check: a substring can be forged.
 *
 *   The platform's own helper verifies the credential properly (against the
 *   project's key set and JWT secret) and accepts both key formats: the
 *   legacy `service_role` JWT and the new `sb_secret_…` key.
 */
export async function isServiceRoleRequest(req: Request): Promise<boolean> {
  // 1. The new key format: the platform verifies it against the project's
  //    secret key set. It expects the key in the `apikey` header, which is
  //    where the Supabase SDK puts it.
  try {
    const { data: ctx, error } = await createSupabaseContext(req, { auth: 'secret' });
    if (!error && ctx) return true;
  } catch (err) {
    console.error('[agentos] secret credential verification failed:', err);
  }

  // 2. The legacy `service_role` JWT: it is not a "secret key" in the new
  //    key system, so the mode above does not match it. The platform's admin
  //    endpoint accepts ONLY service-level credentials, so asking it is a
  //    verification, not a guess — a user token or an anon key is refused.
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const url = Deno.env.get('SUPABASE_URL');
  if (!token || !url) return false;

  try {
    const response = await fetch(`${url}/auth/v1/admin/users?limit=1`, {
      headers: { apikey: token, Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (err) {
    console.error('[agentos] service credential check failed:', err);
    return false;
  }
}

/** True when the request carries a caller whose tenant owns the row. */
export function tenantMatches(ownerClerkId: string | null | undefined, caller: VerifiedCaller): boolean {
  if (!ownerClerkId) return false;
  return ownerClerkId === caller.clerkUserId;
}
