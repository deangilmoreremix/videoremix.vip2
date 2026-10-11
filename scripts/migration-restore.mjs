#!/usr/bin/env node
// scripts/migration-restore.mjs
//
// Restore tables from a directory produced by scripts/migration-backup.mjs.
//
// Connection details are taken from the ENVIRONMENT ONLY (never .env files):
//   SUPABASE_URL              (required)
//   SUPABASE_SERVICE_ROLE_KEY (required)
//   BACKUP_DIR                backup directory containing manifest.json (required)
//   DRY_RUN                   1 (default) = verify + plan only, no writes
//   CONFIRM_RESTORE           must be "1" to perform any write
//   RESTORE_MONEY_TABLES      1 to also restore public.purchases /
//                             public.user_app_access / public.subscription_status
//                             (default 0 - these carry revenue records and are
//                             restored only on explicit operator decision)
//
// Restore semantics: the target table's rows are DELETED and re-inserted from
// the backup snapshot (snapshot-exact restore, which is what a rollback
// needs). The credits + identity tables are always restorable; the "money"
// tables are opt-in. public.app_users and public.webhook_logs are captured by
// the backup for forensics but intentionally NOT restorable here: app_users
// is re-synced by the Clerk webhook / verify-identities script, and
// webhook_logs only grows.
//
// Delete/insert order is FK-safe (children before parents on delete, parents
// before children on insert).
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... BACKUP_DIR=scripts/backups/<stamp> \
//     node scripts/migration-restore.mjs            # dry run
//   ... CONFIRM_RESTORE=1 DRY_RUN=0 node scripts/migration-restore.mjs

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
const DRY_RUN = process.env.DRY_RUN !== '0';
const CONFIRM_RESTORE = process.env.CONFIRM_RESTORE === '1';
const RESTORE_MONEY_TABLES = process.env.RESTORE_MONEY_TABLES === '1';
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 500);

const ALWAYS_RESTORABLE = [
  'credits.credit_products',
  'credits.credit_balances',
  'credits.credit_transactions',
  'public.clerk_identities',
];

const MONEY_TABLES = ['public.purchases', 'public.user_app_access', 'public.subscription_status'];

const DELETE_ORDER = [
  'public.user_app_access',
  'public.subscription_status',
  'public.purchases',
  'public.clerk_identities',
  'credits.credit_transactions',
  'credits.credit_balances',
  'credits.credit_products',
];

const INSERT_ORDER = [
  'credits.credit_products',
  'credits.credit_balances',
  'credits.credit_transactions',
  'public.purchases',
  'public.user_app_access',
  'public.subscription_status',
  'public.clerk_identities',
];

function loadManifest() {
  const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`No manifest.json in ${BACKUP_DIR}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  for (const [key, entry] of Object.entries(manifest.tables)) {
    const file = path.join(BACKUP_DIR, entry.file);
    if (!fs.existsSync(file)) {
      console.error(`Backup file missing for ${key}: ${entry.file}`);
      process.exit(1);
    }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (actual !== entry.sha256) {
      console.error(`Checksum mismatch for ${key}: backup is corrupt`);
      process.exit(1);
    }
  }
  return manifest;
}

function readRows(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function restCall(method, schema, table, { query = '', body = null, headers = {} }) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  return fetch(url, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(schema !== 'public' ? { 'Accept-Profile': schema, 'Content-Profile': schema } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function deleteAllRows(schema, table) {
  // Every backed-up table has a NOT NULL created_at column.
  const res = await restCall('DELETE', schema, table, { query: '?created_at=not.is.null' });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DELETE ${schema}.${table} failed: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
}

async function insertRows(schema, table, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await restCall('POST', schema, table, { body: batch });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `INSERT ${schema}.${table} failed at row ${i}: HTTP ${res.status} ${body.slice(0, 200)}`,
      );
    }
  }
}

async function countRows(schema, table) {
  const res = await restCall('GET', schema, table, {
    query: '?select=*&limit=1',
    headers: { Prefer: 'count=exact' },
  });
  if (!res.ok) return null;
  const range = res.headers.get('content-range') ?? '';
  return range.includes('/') ? Number(range.split('/')[1]) : null;
}

async function main() {
  const manifest = loadManifest();
  console.log(`Restore from: ${BACKUP_DIR} (manifest created ${manifest.createdAt})`);

  const available = Object.keys(manifest.tables);
  const restorable = available.filter(
    (t) => ALWAYS_RESTORABLE.includes(t) || (RESTORE_MONEY_TABLES && MONEY_TABLES.includes(t)),
  );
  const skipped = available.filter((t) => !restorable.includes(t));

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (verify + plan only)' : 'LIVE RESTORE'}`);
  if (!DRY_RUN && !CONFIRM_RESTORE) {
    console.error('Refusing to write: set CONFIRM_RESTORE=1 together with DRY_RUN=0.');
    process.exit(1);
  }
  if (skipped.length > 0) {
    console.log(
      `Skipping (set RESTORE_MONEY_TABLES=1 to include): ${skipped.join(', ') || '(none)'}`,
    );
  }

  // Preflight: current row counts, so the operator sees what is being replaced.
  for (const key of restorable) {
    const [schema, table] = key.split('.');
    const current = await countRows(schema, table);
    const backupRows = manifest.tables[key].rows;
    console.log(`  ${key}: current=${current ?? 'n/a'} backup=${backupRows}`);
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run with DRY_RUN=0 CONFIRM_RESTORE=1 to execute.');
    return;
  }

  // Delete children first.
  for (const key of DELETE_ORDER) {
    if (!restorable.includes(key)) continue;
    const [schema, table] = key.split('.');
    await deleteAllRows(schema, table);
    console.log(`  cleared ${key}`);
  }

  // Insert parents first.
  for (const key of INSERT_ORDER) {
    if (!restorable.includes(key)) continue;
    const [schema, table] = key.split('.');
    const rows = readRows(path.join(BACKUP_DIR, manifest.tables[key].file));
    await insertRows(schema, table, rows);
    console.log(`  restored ${key}: ${rows.length} rows`);
  }

  // Verify.
  let ok = true;
  for (const key of restorable) {
    const [schema, table] = key.split('.');
    const current = await countRows(schema, table);
    const expected = manifest.tables[key].rows;
    if (current !== expected) {
      console.error(`  VERIFY FAILED ${key}: current=${current} expected=${expected}`);
      ok = false;
    } else {
      console.log(`  verified ${key}: ${current} rows`);
    }
  }

  if (!ok) {
    console.error('Restore completed with verification failures - investigate before proceeding.');
    process.exit(3);
  }
  console.log('Restore complete and verified.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(2);
});
