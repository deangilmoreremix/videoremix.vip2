#!/usr/bin/env node
/**
 * Apply migration via Supabase Management API.
 * Usage: node scripts/apply-migration-via-api.mjs <path-to-sql-file>
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env for the access token
const envContent = readFileSync(join(projectRoot, '.env'), 'utf-8');
const envLines = envContent.split('\n');
let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
let projectRef = process.env.SUPABASE_PROJECT_REF || 'bzxohkrxcwodllketcpz';

for (const line of envLines) {
  const match = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/);
  if (match && !accessToken) {
    accessToken = match[1].trim();
  }
}

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is not set in environment or .env');
  process.exit(1);
}

const migrationFile = process.argv[2] || join(projectRoot, 'supabase/migrations/20260709040000_create_landing_page_tables.sql');

console.log(`🚀 Applying migration via Supabase Management API...`);
console.log(`   Project: ${projectRef}`);
console.log(`   File: ${migrationFile}`);
console.log('');

const sql = readFileSync(migrationFile, 'utf-8');

const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Migration failed:');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
