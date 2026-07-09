#!/usr/bin/env node
/**
 * Apply the landing page content tables migration to the remote Supabase database.
 * Uses the pg package to connect via the connection string.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const directConn = 'postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres';
const poolerConn = 'postgresql://postgres.bzxohkrxcwodllketcpz:VideoRemix2026@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const migrationFile = join(projectRoot, 'supabase/migrations/20260709040000_create_landing_page_tables.sql');

console.log('🚀 Applying landing page tables migration...');
console.log(`   Project: bzxohkrxcwodllketcpz`);
console.log(`   File: ${migrationFile}`);
console.log('');

let client = null;
const tryConnections = [
  { conn: directConn, name: 'direct' },
  { conn: poolerConn, name: 'pooler' },
];

for (const { conn, name } of tryConnections) {
  try {
    client = new pg.Client({ connectionString: conn });
    await client.connect();
    console.log(`✅ Connected via ${name}`);
    break;
  } catch (err) {
    console.log(`   ${name} failed: ${err.message}`);
  }
}

if (!client) {
  console.error('');
  console.error('❌ Could not connect with either connection string.');
  console.error('');
  console.error('The database password may have changed. Check your Supabase dashboard:');
  console.error('  Settings → Database → Connection string');
  console.error('');
  console.error('Or apply the migration manually:');
  console.error('  1. Go to https://supabase.com/dashboard/project/bzxohkrxcwodllketcpz/sql');
  console.error('  2. Open a new query');
  console.error(`  3. Paste the contents of: ${migrationFile}`);
  console.error('  4. Run the query');
  process.exit(1);
}

console.log('');

try {
  const sql = readFileSync(migrationFile, 'utf-8');

  console.log('📝 Executing migration...');
  await client.query(sql);
  console.log('✅ Migration applied successfully!');
  console.log('');

  // Verify the tables exist
  const result = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('hero_content', 'testimonials', 'faqs', 'benefits_features', 'pricing_plans')
    ORDER BY tablename;
  `);

  console.log('📊 Tables created:');
  result.rows.forEach((row) => console.log(`   ✓ ${row.tablename}`));
  console.log('');

  // Check row counts
  for (const table of ['hero_content', 'testimonials', 'faqs', 'benefits_features', 'pricing_plans']) {
    const count = await client.query(`SELECT COUNT(*) FROM public.${table}`);
    console.log(`   ${table}: ${count.rows[0].count} rows`);
  }

  console.log('');
  console.log('🎉 All done! Reload your landing page to see the content.');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
