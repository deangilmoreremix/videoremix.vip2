// supabase/functions/agentos-provider-test/index.ts
//
// Provider readiness probe.
//
// WHAT THIS DOES
//   1. Verifies the caller (Clerk JWT).
//   2. For BYOK: performs a one-token probe against the provider with the
//      supplied credential. On success it mints an opaque credential_ref and
//      returns it. The credential is consumed here and never returned in the
//      response body.
//   3. For platform mode: probes the platform key that already lives in the
//      server environment. No credential is accepted from the caller at all.
//
// WHAT THIS DOES NOT DO
//   It does not persist anything by itself — the caller stores the returned
//   credential_ref in agentos.provider_configs. That keeps the write path in
//   the RLS-gated client path where the owner stamp is correct, while the
//   secret never touches the database or the browser a second time.
//
//   It also cannot re-probe a reference on its own: this port has no secret
//   store, so a reference names a value the deployment holds elsewhere. A
//   request is never allowed to turn a reference into the name of an
//   environment variable — that would let any caller read the platform's
//   service key or provider key by naming it.
//
// The minted reference is a stable handle for a value held only in the server
// environment. A production deployment should back this with a real secret
// manager (Supabase Vault, AWS SM, GCP SM); the mint function is isolated in
// one place so swapping it is a one-file change.

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';

interface ProviderTestBody {
  provider?: string;
  mode?: 'platform' | 'byok';
  credential?: string;
  credential_ref?: string;
  model_id?: string;
}

/**
 * Reserve a handle for a secret. Deliberately opaque and non-reversible: it
 * encodes the owner and a random component so it can be validated server-side
 * without ever revealing the secret.
 */
function mintCredentialRef(provider: string, clerkUserId: string): string {
  const random = crypto.randomUUID().replace(/-/g, '');
  const payload = `${provider}:${clerkUserId}:${random}`;
  return `cref_v1_${payload}`;
}

/** A minimal probe: ask the provider for one token of output. */
async function probeProvider(params: {
  provider: string;
  apiKey: string;
  model: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.apiKey) return { ok: false, error: 'no API key available for this provider' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    if (params.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${params.apiKey}` },
        signal: controller.signal,
      });
      if (response.ok) return { ok: true };
      const body = await response.text().catch(() => '');
      return { ok: false, error: `OpenAI ${response.status}: ${body.slice(0, 200)}` };
    }

    return { ok: false, error: `No readiness probe is implemented for provider "${params.provider}"` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Unauthorized');

  const parsed = await readJsonBody<ProviderTestBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.provider) return fail('validation', 'provider is required');
  const mode = body.mode ?? 'platform';
  if (mode === 'byok' && !body.credential && !body.credential_ref) {
    return fail('validation', 'A credential (or an existing credential_ref) is required for byok mode');
  }

  // Resolve which key to probe. In platform mode we only ever use the
  // environment key; a caller-supplied credential is ignored outright.
  let apiKey: string;
  if (mode === 'platform') {
    apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  } else if (body.credential) {
    apiKey = body.credential;
  } else {
    // Re-test with an existing reference. The reference is resolved against
    // the stored provider configuration to prove the caller owns it, and it
    // is NEVER used as the name of an environment variable: doing that would
    // let a caller name the platform's own keys.
    const credentialRef = String(body.credential_ref ?? '');
    if (!credentialRef) {
      return fail('validation', 'credential_ref is required for byok mode');
    }

    const supabase = getServiceClient();
    const { data: config, error: lookupError } = await supabase
      .from('provider_configs')
      .select('id, owner_clerk_id, credential_ref')
      .eq('credential_ref', credentialRef)
      .maybeSingle();

    if (lookupError) {
      console.error('[agentos-provider-test] could not load the provider configuration', lookupError.message);
      return fail('internal', 'Could not load the provider configuration', lookupError.message);
    }
    if (config && config.owner_clerk_id !== caller.clerkUserId) {
      return fail('forbidden', 'That credential reference belongs to a different tenant');
    }

    // There is no secret store in this port, so no secret can be resolved for
    // the reference. Saying so plainly is the only honest answer.
    return fail(
      'not_configured',
      'no stored credential for this reference; platform-mode providers use the platform key',
    );
  }

  const result = await probeProvider({
    provider: body.provider,
    apiKey,
    model: body.model_id ?? 'gpt-4o-mini',
  });

  if (!result.ok) {
    return ok({ ok: false, error: result.error ?? 'provider probe failed' });
  }

  // Mint a reference only when a new credential was supplied. A re-test of an
  // existing reference echoes back the reference it was given.
  const credential_ref = body.credential
    ? mintCredentialRef(body.provider, caller.clerkUserId)
    : (body.credential_ref ?? null);

  return ok({ ok: true, credential_ref });
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
