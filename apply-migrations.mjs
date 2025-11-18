#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration(filePath, name) {
  console.log(`\n📦 Applying migration: ${name}`);
  console.log(`   File: ${filePath}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative approach - direct query
      console.log('   Trying direct execution...');
      const response = await fetch(`${envVars.VITE_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': envVars.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log('   ✅ Migration applied successfully (direct)');
      return true;
    }

    console.log('   ✅ Migration applied successfully');
    return true;
  } catch (err) {
    console.error(`   ❌ Error applying migration: ${err.message}`);

    // Check if tables already exist
    if (err.message.includes('already exists')) {
      console.log('   ℹ️  Tables already exist, skipping...');
      return true;
    }

    return false;
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables exist...');

  const tables = [
    'products_catalog',
    'platform_product_mappings',
    'purchases',
    'user_app_access',
    'subscription_status',
    'webhook_logs'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`   ❌ ${table}: Does not exist`);
    } else {
      console.log(`   ✅ ${table}: Exists`);
    }
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');

  const migrations = [
    {
      file: join(__dirname, 'supabase/migrations/20251003151741_create_purchase_management_system.sql'),
      name: 'Purchase Management System'
    },
    {
      file: join(__dirname, 'supabase/migrations/20251007000001_setup_personalizer_products.sql'),
      name: 'Personalizer Products Setup'
    },
    {
      file: join(__dirname, 'supabase/migrations/20251007000002_subscription_expiration_checker.sql'),
      name: 'Subscription Expiration Checker'
    }
  ];

  let successCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.name);
    if (success) successCount++;
  }

  await verifyTables();

  console.log(`\n✨ Complete! ${successCount}/${migrations.length} migrations applied successfully.\n`);

  if (successCount < migrations.length) {
    console.log('⚠️  Some migrations failed. Please apply them manually using Supabase SQL Editor.');
    console.log('   See MANUAL_MIGRATION_GUIDE.md for instructions.\n');
    process.exit(1);
  }
}

main().catch(console.error);
