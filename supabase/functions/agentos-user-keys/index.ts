// supabase/functions/agentos-user-keys/index.ts
//
// "Let my agents use this key": save, check and remove the owner's own
// provider key for the agents that run while they are away.
//
//   POST { action: "status" }                         → { openai: { saved, hint, updated_at } }
//   POST { action: "save", provider: "openai", key }  → checks the key with OpenAI, then stores it
//   POST { action: "delete", provider: "openai" }     → removes it
//   POST { action: "check", provider: "openai", key } → checks a key with OpenAI and stores nothing
//
// SECURITY
//   * The caller is verified (Clerk JWT); the owner is always the caller,
//     never a value from the body.
//   * The key is checked with one free call (GET /v1/models) before it is
//     stored, and is stored only in Supabase Vault through
//     agentos.store_user_key (service_role only). It is never returned, and
//     never logged: the response carries a four-character hint.

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';

interface UserKeysBody {
  action?: 'status' | 'save' | 'delete' | 'check';
  provider?: string;
  key?: string;
}

const PROVIDERS = new Set(['openai']);

async function checkOpenAIKey(key: string): Promise<{ ok: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    if (response.ok) return { ok: true };
    if (response.status === 401) return { ok: false, error: 'OpenAI did not accept this key.' };
    return { ok: false, error: `OpenAI answered ${response.status}. Try again in a moment.` };
  } catch {
    return { ok: false, error: 'Could not reach OpenAI to check the key. Try again in a moment.' };
  } finally {
    clearTimeout(timer);
  }
}

async function status(supabase: any, owner: string) {
  const { data, error } = await supabase
    .from('user_provider_keys')
    .select('provider, key_hint, updated_at')
    .eq('owner_clerk_id', owner);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ provider: string; key_hint: string; updated_at: string }>;
  const openai = rows.find((row) => row.provider === 'openai');
  return {
    openai: openai
      ? { saved: true, hint: openai.key_hint, updated_at: openai.updated_at }
      : { saved: false, hint: null, updated_at: null },
  };
}

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Sign in to manage your key.');

  const parsed = await readJsonBody<UserKeysBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const owner = caller.clerkUserId;
  const supabase = getServiceClient();

  const action = body.action ?? 'status';
  if (action === 'status') return ok(await status(supabase, owner));

  const provider = String(body.provider ?? 'openai');
  if (!PROVIDERS.has(provider)) return fail('validation', `Unsupported provider: ${provider}`);

  if (action === 'delete') {
    const { error } = await supabase.rpc('delete_user_key', { p_owner: owner, p_provider: provider });
    if (error) return fail('internal', 'Could not remove the key.');
    return ok(await status(supabase, owner));
  }

  if (action === 'check') {
    const key = String(body.key ?? '').trim();
    if (key.length < 20 || /\s/.test(key)) {
      return fail('validation', 'That does not look like an OpenAI API key.');
    }
    const check = await checkOpenAIKey(key);
    if (!check.ok) return fail('validation', check.error ?? 'OpenAI did not accept this key.');
    return ok({ works: true });
  }

  if (action === 'save') {
    const key = String(body.key ?? '').trim();
    if (key.length < 20 || /\s/.test(key)) {
      return fail('validation', 'That does not look like an OpenAI API key.');
    }
    const check = await checkOpenAIKey(key);
    if (!check.ok) return fail('validation', check.error ?? 'OpenAI did not accept this key.');

    const { error } = await supabase.rpc('store_user_key', {
      p_owner: owner,
      p_provider: provider,
      p_key: key,
    });
    if (error) return fail('internal', 'Could not save the key.');
    return ok(await status(supabase, owner));
  }

  return fail('validation', `Unknown action: ${action}`);
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
