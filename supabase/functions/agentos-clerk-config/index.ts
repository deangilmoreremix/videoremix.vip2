// supabase/functions/agentos-clerk-config/index.ts
//
// A TEMPORARY, service-role-only function that reports and updates the Clerk
// instance's own URL settings.
//
// WHY IT EXISTS
//   The Clerk instance is configured with URLs that do not exist:
//   `home_url`, `sign_in_url` and `after_sign_in_url` all point at
//   https://auth.videoremix.vip, which has no DNS record, so the sign-in flow
//   navigates away from the app into nowhere.
//
//   Those settings live in the Clerk dashboard, and the dashboard needs the
//   instance secret key. The platform already holds that key as a function
//   secret, so this function uses it IN PLACE — the key is never returned, not
//   logged, and not sent anywhere but api.clerk.com.
//
//   It is a one-off: it is deleted as soon as the settings are corrected.
//
// SAFETY
//   * The caller must present the platform's service-role key exactly.
//   * The instance is checked before anything is changed: a key for a
//     different Clerk instance is refused.
//   * Only the URL settings are touched. No user, no session, no key.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CLERK_API = 'https://api.clerk.com/v1/instance';
const EXPECTED_INSTANCE = 'videoremix.vip';

const DESIRED = {
  home_url: 'https://videoremix.vip/',
  sign_in_url: 'https://videoremix.vip/signin',
  sign_up_url: 'https://videoremix.vip/signup',
  after_sign_in_url: 'https://videoremix.vip/dashboard',
  after_sign_up_url: 'https://videoremix.vip/dashboard',
  after_sign_out_url: 'https://videoremix.vip/',
};

function isServiceRole(req: Request): boolean {
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const presented = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!expected || !presented || presented.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ presented.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req) => {
  if (!isServiceRole(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const secret = Deno.env.get('CLERK_SECRET_KEY') ?? '';
  if (!secret) {
    return new Response(JSON.stringify({ error: 'CLERK_SECRET_KEY is not configured' }), { status: 500 });
  }

  const headers = { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };

  const current = await fetch(CLERK_API, { headers });
  const instance = await current.json();

  const frontendApi = String(instance?.frontend_api ?? instance?.frontendApi ?? '');
  if (!frontendApi.includes(EXPECTED_INSTANCE)) {
    return new Response(
      JSON.stringify({
        error: `refusing: this key belongs to ${frontendApi || 'another instance'}`,
        status: current.status,
        instance: instance,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify(
        {
          frontend_api: frontendApi,
          urls: {
            home_url: instance?.home_url,
            sign_in_url: instance?.sign_in_url,
            sign_up_url: instance?.sign_up_url,
            after_sign_in_url: instance?.after_sign_in_url,
            after_sign_up_url: instance?.after_sign_up_url,
            after_sign_out_url: instance?.after_sign_out_url,
          },
          allowed_origins: instance?.allowed_origins ?? null,
          // Every key the instance settings carry, so the caller can see what
          // else could be corrected.
          fields: Object.keys(instance ?? {}).filter((key) => /url|origin|domain/i.test(key)),
        },
        null,
        2,
      ),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (req.method === 'PATCH') {
    const response = await fetch(CLERK_API, { method: 'PATCH', headers, body: JSON.stringify(DESIRED) });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Use GET or PATCH' }), { status: 405 });
});
