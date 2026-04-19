#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSQL(sql) {
  const { error } = await supabase.rpc('exec_sql', { sql });
  // Since exec_sql might not exist, use fetch directly
  const response = await fetch(`${envVars.VITE_SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': envVars.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL Error: ${response.status} - ${text}`);
  }
  return response.json();
}

// Actually easier: use supabase-js to execute queries via from() trick
// But better: just use psql if available. Let's try a simpler approach using the postgres connection.

// Since we have service key, we can call the Postgres REST endpoint if we had it. Actually we can use the pool directly via supabase-js?

// Actually, simplest: use node-postgres
import { Client } from 'pg';

const client = new Client({
  connectionString: envVars.VITE_SUPABASE_URL.replace('https://', 'postgres://') + `?sslmode=require&supabase_auth=${envVars.SUPABASE_SERVICE_ROLE_KEY}`
});

// But connection string is not that simple. The service role key is not the DB password.

// Let's just read the SQL file and execute via supabase.from('dummy')? Not possible.

// Alternative: Use the built-in `exec_sql` function if it exists in the DB.
// Or create it, then call.

// Actually, supabase-js can run raw SQL via:
// supabase.from('products_catalog').select('*').limit(1) // not arbitrary SQL

// The correct approach: supabase.rpc('exec', { query: sql }) if we have an exec function.

// Let's just write the SQL to a migration and push via CLI.
console.log('This script should be replaced by creating a migration file and running: supabase db push');
console.log('See seed-missing-products.sql and grant-bulk-product-access.sql');
process.exit(0);