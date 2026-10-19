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

/** True when the request carries a caller whose tenant owns the row. */
export function tenantMatches(ownerClerkId: string | null | undefined, caller: VerifiedCaller): boolean {
  if (!ownerClerkId) return false;
  return ownerClerkId === caller.clerkUserId;
}
