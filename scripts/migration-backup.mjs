#!/usr/bin/env node
// scripts/migration-backup.mjs
//
// Backup the tables affected by the Clerk credit/identity migrations to local
// JSONL files, for use by migration-restore.mjs / migration-rollback.mjs.
//
// Connection details are taken from the ENVIRONMENT ONLY (this script never
// reads .env files):
//   SUPABASE_URL              e.g. https://<project-ref>.supabase.co   (required)
//   SUPABASE_SERVICE_ROLE_KEY service-role JWT                          (required)
//   BACKUP_DIR                output directory (default scripts/backups/<utc-timestamp>)
//   INCLUDE_WEBHOOK_LOGS      1 to include public.webhook_logs (default 0; can be large)
//   PAGE_SIZE                 rows per REST page (default 1000)
//
// Tables captured (default):
//   public.clerk_identities, public.app_users, public.purchases,
//   public.user_app_access, public.subscription_status,
//   credits.credit_products, credits.credit_balances, credits.credit_transactions
//
// Tables that do not exist yet (e.g. credits schema not migrated) are recorded
// as "missing" in the manifest and do not fail the backup.
//
// WARNING: backups contain customer PII (emails, purchase history). Keep them
// local, never commit them, and delete when the migration window closes.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migration-backup.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INCLUDE_WEBHOOK_LOGS = process.env.INCLUDE_WEBHOOK_LOGS === '1';
const PAGE_SIZE = Number(process.env.PAGE_SIZE ?? 1000);

const TABLES = [
  { schema: 'public', name: 'clerk_identities' },
  { schema: 'public', name: 'app_users' },
  { schema: 'public', name: 'purchases' },
  { schema: 'public', name: 'user_app_access' },
  { schema: 'public', name: 'subscription_status' },
  { schema: 'credits', name: 'credit_products' },
  { schema: 'credits', name: 'credit_balances' },
  { schema: 'credits', name: 'credit_transactions' },
  ...(INCLUDE_WEBHOOK_LOGS ? [{ schema: 'public', name: 'webhook_logs' }] : []),
];

function restHeaders(prefer = '') {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function fetchPage(schema, table, offset) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${PAGE_SIZE}&offset=${offset}`;
  const res = await fetch(url, {
    headers: {
      ...restHeaders('count=exact'),
      ...(schema !== 'public' ? { 'Accept-Profile': schema } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`HTTP ${res.status} for ${schema}.${table}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const rows = await res.json();
  const range = res.headers.get('content-range') ?? '';
  const total = range.includes('/') ? Number(range.split('/')[1]) : null;
  return { rows: Array.isArray(rows) ? rows : [], total };
}

async function backupTable(table, backupDir) {
  const file = path.join(backupDir, `${table.schema}.${table.name}.jsonl`);
  let offset = 0;
  let total = null;
  let count = 0;
  const hash = crypto.createHash('sha256');
  const stream = fs.createWriteStream(file);

  try {
    try {
      for (;;) {
        const page = await fetchPage(table.schema, table.name, offset);
        total = page.total;
        for (const row of page.rows) {
          const line = `${JSON.stringify(row)}\n`;
          stream.write(line);
          hash.update(line);
          count += 1;
        }
        if (page.rows.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
    } finally {
      stream.end();
      await new Promise((resolve, reject) => {
        stream.on('close', resolve);
        stream.on('error', reject);
      });
    }
  } catch (err) {
    // Remove the partial file so a failed table cannot be mistaken for a
    // valid (empty) backup.
    try {
      fs.rmSync(file, { force: true });
    } catch {
      /* best effort */
    }
    throw err;
  }

  return {
    table: `${table.schema}.${table.name}`,
    file: path.basename(file),
    rows: count,
    expectedTotal: total,
    sha256: hash.digest('hex'),
  };
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.env.BACKUP_DIR ?? path.join('scripts', 'backups', stamp));
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Backup directory: ${backupDir}`);

  const manifest = {
    createdAt: new Date().toISOString(),
    supabaseHost: new URL(SUPABASE_URL).host,
    pageSize: PAGE_SIZE,
    tables: {},
    missing: [],
  };

  for (const table of TABLES) {
    const key = `${table.schema}.${table.name}`;
    try {
      const entry = await backupTable(table, backupDir);
      manifest.tables[key] = entry;
      console.log(`  backed up ${key}: ${entry.rows} rows`);
    } catch (err) {
      if (err.status === 404 || /does not exist|not find/i.test(err.message)) {
        manifest.missing.push({ table: key, reason: 'table_not_found' });
        console.warn(`  skipped ${key}: table not found (recorded in manifest)`);
        continue;
      }
      console.error(`Backup failed for ${key}: ${err.message}`);
      process.exit(2);
    }
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Manifest written: ${manifestPath}`);
  console.log('Backup complete. Do not commit this directory (contains customer PII).');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
