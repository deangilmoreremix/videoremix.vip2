#!/usr/bin/env node
// scripts/migration-rollback.mjs
//
// Rollback planning for the Clerk credit/identity migrations.
//
// WHAT ROLLBACK MEANS (read this first)
//   The credit-system migration WIDENS credits.credit_balances.user_id,
//   credits.credit_transactions.user_id and public.ai_app_usage.user_id from
//   UUID to TEXT. Widening is one-way: ALTER COLUMN TYPE UUID only succeeds
//   when EVERY value in the column is a valid UUID. As soon as one Clerk sub
//   ("user_...") exists, the schema itself cannot be reverted - the only
//   correct rollback is a DATA restore from the pre-migration backup (the
//   schema stays TEXT, which is harmless: UUID values fit in text columns).
//   This script decides which of the two rollback shapes applies and writes
//   the exact SQL the operator must apply.
//
// Connection details are taken from the ENVIRONMENT ONLY (never .env files):
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   BACKUP_DIR                backup directory containing manifest.json (required)
//
// What it does:
//   1. Verifies the backup checksums and that current credits row counts still
//      match the backup (a stale backup would roll back to the wrong state).
//   2. Classifies current user_id values in credits.credit_balances /
//      credit_transactions.
//   3. Writes <BACKUP_DIR>/rollback-plan.json and <BACKUP_DIR>/rollback.sql.
//
// What it deliberately does NOT do:
//   * Execute any SQL (operators apply rollback.sql with psql against
//     SUPABASE_DB_URL, in a maintenance window, after review).
//   * Perform the data restore (run scripts/migration-restore.mjs for that).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... BACKUP_DIR=scripts/backups/<stamp> \
//     node scripts/migration-rollback.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BACKUP_DIR'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR);

const CLERK_SUB_RE = /^user_[A-Za-z0-9]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function restCall(method, schema, table, { query = '', headers = {} }) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(schema !== 'public' ? { 'Accept-Profile': schema } : {}),
      ...headers,
    },
  });
}

async function fetchAll(schema, table) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await restCall('GET', schema, table, {
      query: `?select=user_id&limit=1000&offset=${offset}`,
    });
    if (!res.ok) {
      const body = await res.text();
      if (res.status === 404) return null; // table missing pre-migration state
      throw new Error(`HTTP ${res.status} for ${schema}.${table}: ${body.slice(0, 200)}`);
    }
    const page = await res.json();
    rows.push(...(Array.isArray(page) ? page : []));
    if (!Array.isArray(page) || page.length < 1000) break;
  }
  return rows;
}

async function exactCount(schema, table) {
  const res = await restCall('GET', schema, table, {
    query: '?select=*&limit=1',
    headers: { Prefer: 'count=exact' },
  });
  if (!res.ok) return null;
  const range = res.headers.get('content-range') ?? '';
  return range.includes('/') ? Number(range.split('/')[1]) : null;
}

const FULL_ROLLBACK_SQL = `-- Rollback of 20261011120000_clerk_credit_system_alignment.sql
-- (schema-level rollback; ONLY valid when no Clerk-sub values exist - see plan)
BEGIN;
DROP FUNCTION IF EXISTS credits.add_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS credits.deduct_credits(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, JSONB);
ALTER TABLE credits.credit_balances ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE credits.credit_transactions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE public.ai_app_usage ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
DROP FUNCTION IF EXISTS record_ai_app_run(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_ai_app_usage(TEXT);
DROP FUNCTION IF EXISTS get_ai_app_remaining_runs(TEXT, INTEGER);
DROP TABLE IF EXISTS public.clerk_identities;
-- Recreate the ORIGINAL UUID-signature functions from
-- 20260924000002_credit_system_functions.sql and the ORIGINAL policies from
-- 20260924000001_credit_system_rls.sql / 20260523050000_add_ai_app_usage.sql
-- (copy the original bodies; then re-apply REVOKE of the F5 lockdown ONLY if
-- the credits schema is being retired with this platform).
COMMIT;
`;

const DATA_ONLY_ROLLBACK_SQL = `-- Rollback of 20261011120000_clerk_credit_system_alignment.sql (DATA ONLY)
-- The schema stays TEXT (one-way widening). Restore the pre-migration data:
--   1. node scripts/migration-restore.mjs   (BACKUP_DIR from the plan below)
--   2. Re-run scripts/migration-verify-identities.mjs if identities were
--      rolled back from the backup.
-- The TEXT schema is fully compatible with UUID values; do NOT attempt
-- ALTER COLUMN TYPE UUID while any user_id is a Clerk sub.
`;

async function main() {
  const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`No manifest.json in ${BACKUP_DIR}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 1. Verify backup integrity.
  for (const [key, entry] of Object.entries(manifest.tables)) {
    const file = path.join(BACKUP_DIR, entry.file);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (actual !== entry.sha256) {
      console.error(`Checksum mismatch for ${key}: backup is corrupt. Aborting.`);
      process.exit(2);
    }
  }
  console.log('Backup checksums verified.');

  // 2. Stale-backup check on the credits tables.
  const stale = [];
  for (const key of ['credits.credit_balances', 'credits.credit_transactions']) {
    const entry = manifest.tables[key];
    if (!entry) continue;
    const [schema, table] = key.split('.');
    const current = await exactCount(schema, table);
    if (current !== null && current !== entry.rows) {
      stale.push({ table: key, current, backupRows: entry.rows });
    }
  }
  if (stale.length > 0) {
    console.error(
      'Backup is STALE relative to the live credits tables. Rolling back to a stale snapshot loses post-backup rows. Take a fresh backup first. Aborting.',
    );
    console.error(JSON.stringify(stale, null, 2));
    process.exit(3);
  }
  console.log('Backup is current for the credits tables.');

  // 3. Classify current user_id values.
  const shapes = {};
  let clerkSubsExist = false;
  for (const key of ['credits.credit_balances', 'credits.credit_transactions', 'public.ai_app_usage']) {
    const [schema, table] = key.split('.');
    const rows = await fetchAll(schema, table);
    if (rows === null) {
      shapes[key] = 'missing';
      continue;
    }
    const shape = { clerk_sub: 0, legacy_uuid: 0, other: 0, null: 0 };
    for (const row of rows) {
      const v = row.user_id;
      if (v === null || v === undefined || v === '') shape.null += 1;
      else if (CLERK_SUB_RE.test(v)) shape.clerk_sub += 1;
      else if (UUID_RE.test(v)) shape.legacy_uuid += 1;
      else shape.other += 1;
    }
    shapes[key] = shape;
    if (shape.clerk_sub > 0 || shape.other > 0) clerkSubsExist = true;
  }
  console.log('Current user_id shapes:', JSON.stringify(shapes, null, 2));

  // 4. Emit the plan + SQL.
  const plan = {
    generatedAt: new Date().toISOString(),
    backupDir: BACKUP_DIR,
    backupCreatedAt: manifest.createdAt,
    shapes,
    rollbackShape: clerkSubsExist ? 'data_only' : 'schema_and_data',
    reason: clerkSubsExist
      ? 'Clerk-sub (or non-UUID) values exist in the re-keyed columns; TEXT->UUID is impossible. Restore data only; keep the TEXT schema.'
      : 'All values are UUID-shaped; the schema can be reverted to UUID and data restored.',
    steps: [
      '1. Freeze writes (maintenance window): set the edge functions to a maintenance mode or scale to zero.',
      '2. Apply the SQL in rollback.sql with psql "$SUPABASE_DB_URL" -f rollback.sql (schema rollback only when rollbackShape = schema_and_data).',
      '3. node scripts/migration-restore.mjs (BACKUP_DIR below) to restore pre-migration data.',
      '4. node scripts/migration-reconcile.mjs to verify counts and sums.',
      '5. Redeploy the previous function versions (git revert of the run-ai-app/proxy-openai/purchaseProcessor deploy).',
    ],
  };

  const sql = clerkSubsExist ? DATA_ONLY_ROLLBACK_SQL : FULL_ROLLBACK_SQL;
  fs.writeFileSync(path.join(BACKUP_DIR, 'rollback-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
  fs.writeFileSync(path.join(BACKUP_DIR, 'rollback.sql'), sql);

  console.log(`\nRollback shape: ${plan.rollbackShape}`);
  console.log(`Plan:  ${path.join(BACKUP_DIR, 'rollback-plan.json')}`);
  console.log(`SQL:   ${path.join(BACKUP_DIR, 'rollback.sql')}`);
  console.log('\nThis script did NOT modify the database. Apply the plan manually.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(2);
});
