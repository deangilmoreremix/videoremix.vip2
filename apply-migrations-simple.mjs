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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Create a PostgreSQL connection string from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];
const dbPassword = envVars.SUPABASE_DB_PASSWORD || 'YOUR_DB_PASSWORD';

console.log('🚀 Migration Application Script\n');
console.log('⚠️  IMPORTANT: This script cannot automatically apply SQL migrations.');
console.log('   Supabase requires migrations to be applied through:');
console.log('   1. Supabase Dashboard SQL Editor (Recommended)');
console.log('   2. Supabase CLI');
console.log('   3. Direct PostgreSQL connection\n');

console.log('📋 Migrations to apply:\n');
console.log('1. supabase/migrations/20251003151741_create_purchase_management_system.sql');
console.log('   Creates: products_catalog, purchases, user_app_access, subscription_status, etc.\n');

console.log('2. supabase/migrations/20251007000001_setup_personalizer_products.sql');
console.log('   Populates: Product catalog with Personalizer products\n');

console.log('3. supabase/migrations/20251007000002_subscription_expiration_checker.sql');
console.log('   Creates: Function to automatically expire old subscriptions\n');

console.log('📝 To apply migrations manually:\n');
console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
console.log('   2. Click "New Query"');
console.log('   3. Copy contents of each migration file');
console.log('   4. Paste and click "Run"\n');

console.log('📖 See MANUAL_MIGRATION_GUIDE.md for detailed instructions.\n');

// Check if tables already exist
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTables() {
  console.log('🔍 Checking current database status...\n');

  const tables = [
    'products_catalog',
    'purchases',
    'user_app_access',
    'subscription_status'
  ];

  let allExist = true;

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);

    if (error) {
      console.log(`   ❌ ${table}: NOT CREATED`);
      allExist = false;
    } else {
      console.log(`   ✅ ${table}: EXISTS`);
    }
  }

  console.log('');

  if (allExist) {
    console.log('✅ All tables exist! Migrations have been applied.\n');
    console.log('Next steps:');
    console.log('   1. Run: node import-purchases.mjs');
    console.log('   2. Run: node grant-app-access.mjs');
    console.log('   3. Run: node setup-subscriptions.mjs\n');
  } else {
    console.log('⚠️  Tables missing. Please apply migrations using Supabase Dashboard.\n');
    console.log('Quick link: https://supabase.com/dashboard/project/' + projectRef + '/sql\n');
  }
}

checkTables().catch(console.error);
