#!/usr/bin/env node
// scripts/migration-reconcile.mjs
//
// Post-migration reconciliation report for the Clerk credit/identity work.
// READ-ONLY: this script never writes to the database.
//
// Connection details are taken from the ENVIRONMENT ONLY (never .env files):
//   SUPABASE_URL                (required)
//   SUPABASE_SERVICE_ROLE_KEY   (required)
//   CLERK_SECRET_KEY            (optional; enables live Clerk cross-check of
//                                unresolved purchase emails)
//   CLERK_API_BASE              Clerk API base (default https://api.clerk.com/v1)
//   SPOT_CHECK_EMAILS           comma-separated emails for per-customer spot checks
//   REPORT_PATH                 write the JSON report to this file (default: stdout)
//
// Checks performed:
//   1. Row counts per affected table (public: clerk_identities, app_users,
//      purchases, user_app_access, subscription_status; credits: credit_products,
//      credit_balances, credit_transactions).
//   2. user_id shape classification in credits tables:
//        clerk-sub  = /^user_[A-Za-z0-9]+$/          (expected after migration)
//        legacy-uuid= UUID shape (pre-Clerk identities) -> NEVER deleted, but
//                     they are stranded until an audited mapping exists
//        other/null = anything else (data quality issue)
//   3. Credit balance sums, split by shape (money on books must reconcile).
//   4. Ledger drift: balance_credits vs SUM(amount_credits) per (user, app).
//   5. Identity coverage: Clerk-sub balance rows with no clerk_identities row.
//   6. Purchases needing attention: user_id NULL or legacy-uuid user_id.
//   7. Verified vs unverified identity rows.
//   8. Optional: Clerk cross-check for unresolved purchase emails.
//   9. Per-customer spot checks (SPOT_CHECK_EMAILS).
//
// Exit codes: 0 = report produced, 2 = API error.

import fs from 'node:fs';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_SECRET = process.env.CLERK_SECRET_KEY ?? null;
const CLERK_API_BASE = (process.env.CLERK_API_BASE ?? 'https://api.clerk.com/v1').replace(/\/+$/, '');
const REPORT_PATH = process.env.REPORT_PATH ?? null;
const SPOT_CHECK_EMAILS = (process.env.SPOT_CHECK_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const CLERK_SUB_RE = /^user_[A-Za-z0-9]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TABLES = [
  { schema: 'public', name: 'clerk_identities' },
  { schema: 'public', name: 'app_users' },
  { schema: 'public', name: 'purchases' },
  { schema: 'public', name: 'user_app_access' },
  { schema: 'public', name: 'subscription_status' },
  { schema: 'credits', name: 'credit_products' },
  { schema: 'credits', name: 'credit_balances' },
  { schema: 'credits', name: 'credit_transactions' },
];

async function fetchAll(schema, table) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...(schema !== 'public' ? { 'Accept-Profile': schema } : {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 404 || /does not exist|not find/i.test(body)) {
        return { missing: true };
      }
      throw new Error(`HTTP ${res.status} for ${schema}.${table}: ${body.slice(0, 200)}`);
    }
    const page = await res.json();
    rows.push(...(Array.isArray(page) ? page : []));
    if (!Array.isArray(page) || page.length < pageSize) break;
  }
  return { rows };
}

function classify(value) {
  if (value === null || value === undefined || value === '') return 'null';
  if (CLERK_SUB_RE.test(value)) return 'clerk_sub';
  if (UUID_RE.test(value)) return 'legacy_uuid';
  return 'other';
}

async function clerkLookup(email) {
  const res = await fetch(
    `${CLERK_API_BASE}/users?email_address=${encodeURIComponent(email)}&limit=5`,
    {
      headers: { Authorization: `Bearer ${CLERK_SECRET}`, 'Content-Type': 'application/json' },
    },
  );
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const users = await res.json();
  if (!Array.isArray(users) || users.length === 0) return { found: false };
  const matches = users.filter((u) =>
    (u.email_addresses ?? []).some((e) => e.email_address?.toLowerCase() === email),
  );
  if (matches.length === 0) return { found: false };
  return {
    found: true,
    ambiguous: matches.length > 1,
    verified: matches.some((u) =>
      (u.email_addresses ?? []).some(
        (e) => e.email_address?.toLowerCase() === email && e.verification?.status === 'verified',
      ),
    ),
  };
}

async function main() {
  const data = {};
  for (const t of TABLES) {
    const result = await fetchAll(t.schema, t.name);
    data[`${t.schema}.${t.name}`] = result;
    const status = result.missing ? 'MISSING' : `${result.rows.length} rows`;
    console.log(`fetched ${t.schema}.${t.name}: ${status}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    supabaseHost: new URL(SUPABASE_URL).host,
    counts: {},
    user_idShapes: {},
    balanceSums: {},
    ledgerDrift: [],
    missingIdentityForBalanceRows: [],
    purchasesNeedingAttention: [],
    identityVerification: null,
    clerkCrossCheck: [],
    spotChecks: {},
  };

  for (const [key, result] of Object.entries(data)) {
    report.counts[key] = result.missing ? null : result.rows.length;
  }

  // ---- user_id shapes + balance sums (credits tables) ----------------------
  const balances = data['credits.credit_balances'].rows ?? [];
  const transactions = data['credits.credit_transactions'].rows ?? [];

  for (const table of ['credit_balances', 'credit_transactions']) {
    const rows = table === 'credit_balances' ? balances : transactions;
    const shapes = { clerk_sub: 0, legacy_uuid: 0, null: 0, other: 0 };
    for (const row of rows) shapes[classify(row.user_id)] += 1;
    report.user_idShapes[`credits.${table}`] = shapes;
  }

  const sums = { clerk_sub: 0, legacy_uuid: 0, other: 0, purchased: 0, spent: 0 };
  for (const row of balances) {
    const shape = classify(row.user_id);
    sums[shape] = (sums[shape] ?? 0) + (row.balance_credits ?? 0);
    sums.purchased += row.total_purchased_credits ?? 0;
    sums.spent += row.total_spent_credits ?? 0;
  }
  report.balanceSums = sums;

  // ---- ledger drift ---------------------------------------------------------
  const ledger = new Map();
  for (const tx of transactions) {
    const key = `${tx.user_id}::${tx.app_id}`;
    ledger.set(key, (ledger.get(key) ?? 0) + (tx.amount_credits ?? 0));
  }
  for (const bal of balances) {
    const key = `${bal.user_id}::${bal.app_id}`;
    const txSum = ledger.get(key) ?? 0;
    if (txSum !== (bal.balance_credits ?? 0)) {
      report.ledgerDrift.push({
        user_id: bal.user_id,
        app_id: bal.app_id,
        balance_credits: bal.balance_credits,
        ledger_sum: txSum,
      });
    }
  }

  // ---- identity coverage ----------------------------------------------------
  const identities = data['public.clerk_identities'].rows ?? [];
  const identityByClerkId = new Map(identities.map((i) => [i.clerk_user_id, i]));
  for (const bal of balances) {
    if (classify(bal.user_id) === 'clerk_sub' && !identityByClerkId.has(bal.user_id)) {
      report.missingIdentityForBalanceRows.push({ user_id: bal.user_id, app_id: bal.app_id });
    }
  }

  const verified = identities.filter((i) => i.identity_verified === true);
  const unverified = identities.filter((i) => i.identity_verified !== true);
  report.identityVerification = {
    total: identities.length,
    verified: verified.length,
    unverifiedPlaceholders: unverified.length,
    bySource: identities.reduce((acc, i) => {
      acc[i.verification_source ?? 'unknown'] = (acc[i.verification_source ?? 'unknown'] ?? 0) + 1;
      return acc;
    }, {}),
  };

  // ---- purchases needing attention ------------------------------------------
  const purchases = data['public.purchases'].rows ?? [];
  for (const p of purchases) {
    const shape = classify(p.user_id);
    if (shape === 'null' || shape === 'legacy_uuid' || shape === 'other') {
      report.purchasesNeedingAttention.push({
        id: p.id,
        email: p.email,
        platform: p.platform,
        platform_transaction_id: p.platform_transaction_id,
        amount: p.amount,
        status: p.status,
        processed: p.processed,
        user_id_shape: shape,
      });
    }
  }

  // ---- optional Clerk cross-check -------------------------------------------
  if (CLERK_SECRET && report.purchasesNeedingAttention.length > 0) {
    const seen = new Set();
    for (const p of report.purchasesNeedingAttention) {
      const email = (p.email ?? '').toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      const lookup = await clerkLookup(email);
      report.clerkCrossCheck.push({ email, ...lookup });
    }
  }

  // ---- per-customer spot checks ---------------------------------------------
  if (SPOT_CHECK_EMAILS.length > 0) {
    const identityByEmail = new Map(identities.map((i) => [i.email?.toLowerCase(), i]));
    for (const email of SPOT_CHECK_EMAILS) {
      const identity = identityByEmail.get(email) ?? null;
      const userPurchases = purchases.filter((p) => p.email?.toLowerCase() === email);
      const access = (data['public.user_app_access'].rows ?? []).filter(
        (a) => a.user_id && (a.user_id === identity?.clerk_user_id || a.user_id === email),
      );
      const userBalances = balances.filter(
        (b) => identity && b.user_id === identity.clerk_user_id,
      );
      report.spotChecks[email] = {
        identity: identity
          ? {
              clerk_user_id: identity.clerk_user_id,
              identity_verified: identity.identity_verified,
              verification_source: identity.verification_source,
            }
          : null,
        purchases: userPurchases.length,
        purchasesUnresolved: userPurchases.filter(
          (p) => p.user_id === null || classify(p.user_id) !== 'clerk_sub',
        ).length,
        appAccessRows: access.length,
        activeAppAccess: access.filter((a) => a.is_active).length,
        creditBalanceRows: userBalances.length,
        creditBalanceTotal: userBalances.reduce((s, b) => s + (b.balance_credits ?? 0), 0),
      };
    }
  }

  // ---- summary ---------------------------------------------------------------
  const summary = [
    '',
    '=== RECONCILIATION SUMMARY ===',
    `credits.credit_balances: ${report.user_idShapes['credits.credit_balances'] ? JSON.stringify(report.user_idShapes['credits.credit_balances']) : 'n/a'}`,
    `credits.credit_transactions: ${report.user_idShapes['credits.credit_transactions'] ? JSON.stringify(report.user_idShapes['credits.credit_transactions']) : 'n/a'}`,
    `balance sums: ${JSON.stringify(report.balanceSums)}`,
    `identities: ${JSON.stringify(report.identityVerification)}`,
    `ledger drift rows: ${report.ledgerDrift.length}`,
    `clerk-sub balances without identity row: ${report.missingIdentityForBalanceRows.length}`,
    `purchases needing attention: ${report.purchasesNeedingAttention.length}`,
  ];
  if (report.clerkCrossCheck.length > 0) {
    summary.push(`clerk cross-check entries: ${report.clerkCrossCheck.length}`);
  }
  console.log(summary.join('\n'));

  const json = JSON.stringify(report, null, 2);
  if (REPORT_PATH) {
    fs.writeFileSync(REPORT_PATH, `${json}\n`);
    console.log(`JSON report written: ${REPORT_PATH}`);
  } else {
    console.log('\n(full JSON report follows)');
    console.log(json);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(2);
});
