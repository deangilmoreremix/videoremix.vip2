#!/usr/bin/env node
// scripts/migration-verify-identities.mjs
//
// Verify/reconcile public.clerk_identities against the Clerk Backend API.
//
// This is the ONLY sanctioned way to flip an identity row to
// identity_verified = TRUE (besides the svix-verified clerk-webhook). Legacy
// data is NEVER mapped by guessing: a row is verified only when the Clerk
// Backend API confirms a user with the same email exists AND that email is
// verified in Clerk.
//
// Connection details are taken from the ENVIRONMENT ONLY (never .env files):
//   CLERK_SECRET_KEY        Clerk secret key (required)
//   SUPABASE_URL            (required)
//   SUPABASE_SERVICE_ROLE_KEY(required)
//   CLERK_API_BASE          Clerk API base (default https://api.clerk.com/v1)
//   DRY_RUN                 1 (default) = plan only, no writes
//   CONFIRM_VERIFY          must be "1" to perform any write
//
// Actions when CONFIRM_VERIFY=1 DRY_RUN=0:
//   * INSERT identity rows for Clerk users with a verified email that have no
//     row yet (identity_verified = TRUE, source clerk_api_reconciliation).
//   * UPDATE unverified placeholder rows (source app_users_backfill) whose
//     email matches a Clerk-verified user -> identity_verified = TRUE.
// Actions NEVER taken:
//   * Verifying an email that Clerk reports as unverified.
//   * Verifying when more than one Clerk user shares the email (ambiguous).
//   * Disabling existing verified rows (report only - a human decides).
//
// Usage:
//   CLERK_SECRET_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/migration-verify-identities.mjs                    # dry run
//   ... CONFIRM_VERIFY=1 DRY_RUN=0 node scripts/migration-verify-identities.mjs

const REQUIRED = ['CLERK_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const CLERK_API_BASE = (process.env.CLERK_API_BASE ?? 'https://api.clerk.com/v1').replace(/\/+$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN !== '0';
const CONFIRM_VERIFY = process.env.CONFIRM_VERIFY === '1';

async function clerkFetch(pathname) {
  const res = await fetch(`${CLERK_API_BASE}${pathname}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clerk API HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchAllClerkUsers() {
  const users = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await clerkFetch(`/users?limit=${limit}&offset=${offset}&order_by=-created_at`);
    if (!Array.isArray(page) || page.length === 0) break;
    users.push(...page);
    if (page.length < limit) break;
  }
  return users;
}

async function supabaseFetch(method, table, { query = '', body = null, headers = {} }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Supabase REST HTTP ${res.status} for ${table}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (plan only)' : 'LIVE VERIFY'}`);
  if (!DRY_RUN && !CONFIRM_VERIFY) {
    console.error('Refusing to write: set CONFIRM_VERIFY=1 together with DRY_RUN=0.');
    process.exit(1);
  }

  console.log('Fetching Clerk users...');
  const clerkUsers = await fetchAllClerkUsers();
  // email(lower) -> candidates
  const clerkByEmail = new Map();
  for (const u of clerkUsers) {
    for (const e of u.email_addresses ?? []) {
      const email = e.email_address?.toLowerCase();
      if (!email) continue;
      if (!clerkByEmail.has(email)) clerkByEmail.set(email, []);
      clerkByEmail.get(email).push({
        id: u.id,
        email,
        emailVerified: e.verification?.status === 'verified',
      });
    }
  }
  console.log(`  Clerk users: ${clerkUsers.length}; distinct emails: ${clerkByEmail.size}`);

  console.log('Fetching clerk_identities...');
  let identities;
  try {
    identities = (await supabaseFetch('GET', 'clerk_identities', { query: '?select=*&limit=10000' })) ?? [];
  } catch (err) {
    if (err.status === 404) {
      console.error(
        'public.clerk_identities does not exist. Apply supabase/migrations/20261011160000_clerk_identity_table.sql first.',
      );
      process.exit(2);
    }
    throw err;
  }
  console.log(`  identity rows: ${identities.length}`);

  const plan = {
    toInsert: [],
    toVerify: [],
    alreadyVerified: [],
    ambiguousClerk: [],
    unverifiedClerkEmail: [],
    verifiedButNoClerkUser: [],
    noClerkUserForPlaceholder: [],
  };

  const identityByClerkId = new Map(identities.map((i) => [i.clerk_user_id, i]));

  // Clerk users that should have an identity row.
  for (const [email, candidates] of clerkByEmail) {
    if (candidates.length > 1) {
      plan.ambiguousClerk.push({ email, clerkUserIds: candidates.map((c) => c.id) });
      continue;
    }
    const candidate = candidates[0];
    if (!candidate.emailVerified) {
      plan.unverifiedClerkEmail.push({ email, clerkUserId: candidate.id });
      continue;
    }
    const existing = identityByClerkId.get(candidate.id);
    if (existing) {
      if (existing.identity_verified === true) {
        plan.alreadyVerified.push({ email, clerkUserId: candidate.id });
      } else {
        plan.toVerify.push({ email, clerkUserId: candidate.id });
      }
    } else {
      plan.toInsert.push({ email, clerkUserId: candidate.id });
    }
  }

  // Identity rows whose email matches no Clerk user.
  for (const identity of identities) {
    const email = (identity.email ?? '').toLowerCase();
    const candidates = clerkByEmail.get(email) ?? [];
    if (candidates.length === 0) {
      if (identity.identity_verified === true) {
        plan.verifiedButNoClerkUser.push({
          email,
          clerkUserId: identity.clerk_user_id,
          source: identity.verification_source,
        });
      } else {
        plan.noClerkUserForPlaceholder.push({ email, clerkUserId: identity.clerk_user_id });
      }
    }
  }

  console.log('\n=== VERIFICATION PLAN ===');
  console.log(`insert (new verified identities):        ${plan.toInsert.length}`);
  console.log(`verify (flip existing placeholders):     ${plan.toVerify.length}`);
  console.log(`already verified:                        ${plan.alreadyVerified.length}`);
  console.log(`ambiguous Clerk emails (skipped):        ${plan.ambiguousClerk.length}`);
  console.log(`Clerk emails not verified (skipped):     ${plan.unverifiedClerkEmail.length}`);
  console.log(`VERIFIED rows with no Clerk user:        ${plan.verifiedButNoClerkUser.length}  <- investigate`);
  console.log(`placeholders with no Clerk user:         ${plan.noClerkUserForPlaceholder.length}  <- will grant nothing`);

  if (plan.verifiedButNoClerkUser.length > 0) {
    console.warn(
      'WARNING: verified identity rows whose email has no Clerk user. Investigate BEFORE proceeding (possible tampering or stale data).',
    );
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run with DRY_RUN=0 CONFIRM_VERIFY=1 to apply.');
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const now = new Date().toISOString();
  let applied = 0;
  for (const item of [...plan.toInsert, ...plan.toVerify]) {
    try {
      await supabaseFetch('POST', 'clerk_identities', {
        query: '?on_conflict=clerk_user_id',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: [
          {
            clerk_user_id: item.clerkUserId,
            app_user_id: item.clerkUserId,
            email: item.email,
            email_verified: true,
            identity_verified: true,
            verification_source: 'clerk_api_reconciliation',
            verified_at: now,
            updated_at: now,
          },
        ],
      });
      applied += 1;
    } catch (err) {
      console.error(`Failed to verify ${item.email}: ${err.message ?? err}`);
    }
  }

  console.log(`\nDone. Inserted/verified ${applied} of ${plan.toInsert.length + plan.toVerify.length} planned rows.`);
  if (applied !== plan.toInsert.length + plan.toVerify.length) {
    process.exit(3);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(2);
});
