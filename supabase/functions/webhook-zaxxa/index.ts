// supabase/functions/webhook-zaxxa/index.ts
//
// Deno bootstrap for the Zaxxa (Zaxaa) ZPN webhook.
//
// All logic lives in ./handler.ts so the request path is unit-testable without
// a Deno runtime. Zaxxa delivers an `application/x-www-form-urlencoded` POST
// whose authenticity is proven by the `hash_key` field
// (UPPER(MD5(seller_id + api_signature + trans_receipt + trans_amount))), not
// by a request header — see ./verify.ts for the sourced specification.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { handleZaxxaWebhook } from './handler.ts';

serve(async (req) => {
  return await handleZaxxaWebhook(req, {
    apiSignature: Deno.env.get('ZAXXA_WEBHOOK_SECRET'),
    supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    createClient: (url, key) => createClient(url, key),
  });
});
