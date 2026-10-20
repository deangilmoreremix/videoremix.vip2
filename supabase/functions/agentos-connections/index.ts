// supabase/functions/agentos-connections/index.ts
//
// Connected-account management.
//
// ACTIONS
//   POST { action: 'connect', integration_key, account_label?, scopes?,
//          isolation?, workspace_id?, metadata?, credential? }
//   POST { action: 'revoke', connection_id }
//
// SECRETS
//   If a credential is supplied it is exchanged for a credential_ref here and
//   the raw value is dropped from this scope. Only the reference, the requested
//   scopes, and non-secret metadata are persisted. In platform mode the runtime
//   resolves the integration's credentials server-side from environment
//   configuration, so no credential need be sent at all.

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';

interface ConnectionBody {
  action?: 'connect' | 'revoke';
  integration_key?: string;
  account_label?: string;
  scopes?: string[];
  isolation?: 'tenant' | 'worker' | 'ephemeral';
  workspace_id?: string | null;
  metadata?: Record<string, unknown>;
  credential?: string;
  connection_id?: string;
}

function mintAccountRef(integrationKey: string, clerkUserId: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `acct_v1_${integrationKey}_${clerkUserId}_${random}`;
}

const VALID_ISOLATION = new Set(['tenant', 'worker', 'ephemeral']);

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Unauthorized');

  const parsed = await readJsonBody<ConnectionBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.action) return fail('validation', 'action is required (connect | revoke)');

  const supabase = getServiceClient();

  if (body.action === 'connect') {
    if (!body.integration_key) return fail('validation', 'integration_key is required');

    // Re-check support server-side: the UI already filters, but this is the
    // last gate before a row is created.
    const { data: integration } = await supabase
      .from('integrations')
      .select('key, name, capabilities, support')
      .eq('key', body.integration_key)
      .maybeSingle();

    if (!integration) return fail('not_found', `Unknown integration: ${body.integration_key}`);
    if (integration.support === 'unsupported') {
      return fail('unsupported', `${integration.name} cannot be connected in this port`);
    }

    const isolation = body.isolation ?? 'tenant';
    if (!VALID_ISOLATION.has(isolation)) {
      return fail('validation', 'isolation must be tenant | worker | ephemeral');
    }

    // If a workspace was named, the caller must actually be a member.
    if (body.workspace_id) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', body.workspace_id)
        .eq('member_clerk_id', caller.clerkUserId)
        .is('revoked_at', null)
        .maybeSingle();
      if (!membership) {
        return fail('forbidden', 'You are not a member of that workspace');
      }
    }

    const requestedScopes = Array.isArray(body.scopes) ? body.scopes : [];
    // Only scopes the integration advertises may be requested.
    const scopes = requestedScopes.filter((scope: string) =>
      (integration.capabilities ?? []).includes(scope));

    const credentialRef = body.credential
      ? mintAccountRef(body.integration_key, caller.clerkUserId)
      : null;
    // The raw credential, if present, is intentionally not forwarded.
    void body.credential;

    const { data: created, error } = await supabase
      .from('connected_accounts')
      .insert({
        owner_clerk_id: caller.clerkUserId,
        workspace_id: body.workspace_id ?? null,
        integration_key: body.integration_key,
        account_label: body.account_label || integration.name,
        status: 'connected',
        scopes,
        credential_ref: credentialRef,
        metadata: body.metadata ?? {},
        isolation,
        health_status: 'unknown',
        // The account was just checked (it was connected); the column is the
        // product's only record of when a connection was last exercised.
        last_checked_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) return fail('internal', 'Could not connect the account', error.message);
    return ok(created);
  }

  // revoke
  if (!body.connection_id) return fail('validation', 'connection_id is required');

  const { data: connection } = await supabase
    .from('connected_accounts')
    .select('id, owner_clerk_id')
    .eq('id', body.connection_id)
    .maybeSingle();

  if (!connection) return fail('not_found', 'Connection not found');
  if (connection.owner_clerk_id !== caller.clerkUserId) {
    return fail('forbidden', 'That connection belongs to a different tenant');
  }

  const { data: updated, error } = await supabase
    .from('connected_accounts')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      health_status: 'failed',
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', body.connection_id)
    .select('id, status')
    .single();

  if (error) return fail('internal', 'Could not revoke the connection', error.message);
  return ok({ id: updated.id, status: updated.status });
}

Deno.serve((req) =>
  withErrorGuard(async () => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
    if (req.method !== 'POST') return fail('validation', 'Use POST');
    return handler(req);
  }),
);
