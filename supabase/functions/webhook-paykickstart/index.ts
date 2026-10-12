// supabase/functions/webhook-paykickstart/index.ts
//
// Deno bootstrap for the PayKickstart IPN webhook.
//
// All logic lives in ./handler.ts so the request path is unit-testable without
// a Deno runtime. PayKickstart delivers an `application/x-www-form-urlencoded`
// POST whose authenticity is proven by the `hash` field (HMAC-SHA1 over the
// sorted, filtered, pipe-joined form values, keyed with the PER-CAMPAIGN
// secret) — not by a request header. See ./verify.ts for the sourced
// specification.
//
// The IPN secret is per campaign (PayKickstart's own guidance), so campaigns
// are configured through PAYKICKSTART_WEBHOOK_SECRETS, a JSON object of
// { "<campaign_id>": "<secret>" }. A missing entry for an incoming campaign_id
// is a rejection, never a fallback to another campaign's secret.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { handlePaykickstartWebhook } from './handler.ts';
import { DEFAULT_REPLAY_WINDOW_MINUTES, buildPaykickstartSecretMap } from './verify.ts';

serve(async (req) => {
  const configuredWindow = Number(Deno.env.get('PAYKICKSTART_REPLAY_WINDOW_MINUTES') ?? '');

  return await handlePaykickstartWebhook(req, {
    secrets: buildPaykickstartSecretMap(
      Deno.env.get('PAYKICKSTART_WEBHOOK_SECRETS'),
      Deno.env.get('PAYKICKSTART_WEBHOOK_SECRET'),
    ),
    replayWindowMinutes: Number.isFinite(configuredWindow) && configuredWindow > 0
      ? configuredWindow
      : DEFAULT_REPLAY_WINDOW_MINUTES,
    supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    createClient: (url, key) => createClient(url, key),
  });
});
