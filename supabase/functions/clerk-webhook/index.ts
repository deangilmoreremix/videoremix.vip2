// supabase/functions/clerk-webhook/index.ts
//
// Deno bootstrap for the Clerk (svix) webhook.
//
// All logic lives in ./handler.ts so the request path is unit-testable without
// a Deno runtime. This file owns the only Deno-specific dependency: the svix
// verifier (`npm:svix@1`), injected into the handler as a dependency.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'npm:svix@1';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { handleClerkWebhook } from './handler.ts';

serve(async (req) => {
  return await handleClerkWebhook(req, {
    svixSecret: Deno.env.get('CLERK_WEBHOOK_SECRET'),
    supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    createClient: (url, key) => createClient(url, key),
    verifyWebhook: (payload, headers, secret) => {
      // Throws on any signature mismatch; the handler converts that into a
      // fail-closed 400.
      new Webhook(secret).verify(payload, headers);
    },
  });
});
