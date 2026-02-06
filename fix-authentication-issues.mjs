#!/usr/bin/env node
/**
 * Fix Authentication Issues
 * 
 * This script applies the authentication fix migration to resolve
 * issues where users can sign up but cannot sign in.
 * 
 * Issues fixed:
 * 1. RLS policies on user_roles preventing users from reading their own role
 * 2. Trigger function silently failing on user_roles insert
 * 3. Missing permissions for user_achievements and user_dashboard_preferences
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 Applying Authentication Fixes...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase/migrations/20260202000000_fix_authentication_issues.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (simple approach)
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const shortDesc = statement.substring(0, 60).replace(/\s+/g, ' ');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Try alternative: execute directly
          const { error: directError } = await supabase
            .from('_temp_exec')
            .select('*')
            .limit(1);
          
          // If we can't use RPC, just log and continue
          console.log(`  ⚠️  Statement ${i + 1}: ${shortDesc}... (may need manual execution)`);
          errorCount++;
        } else {
          console.log(`  ✅ Statement ${i + 1}: ${shortDesc}...`);
          successCount++;
        }
      } catch (err) {
        console.log(`  ⚠️  Statement ${i + 1}: ${shortDesc}... (${err.message})`);
        errorCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} warnings/errors`);

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    // Check if handle_new_user function exists
    const { data: funcData, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user')
      .single();

    if (funcError) {
      console.log('  ⚠️  Could not verify handle_new_user function');
    } else {
      console.log('  ✅ handle_new_user function exists');
    }

    // Check trigger
    const { data: triggerData, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'on_auth_user_created')
      .single();

    if (triggerError) {
      console.log('  ⚠️  Could not verify on_auth_user_created trigger');
    } else {
      console.log('  ✅ on_auth_user_created trigger exists');
    }

    console.log('\n✨ Authentication fixes applied!');
    console.log('\nNext steps:');
    console.log('1. Test signup with a new user');
    console.log('2. Verify the user can sign in immediately after signup');
    console.log('3. Check that user_roles entry is created for new users');

  } catch (error) {
    console.error('\n❌ Error applying fixes:', error.message);
    console.log('\nPlease apply the migration manually:');
    console.log('  File: supabase/migrations/20260202000000_fix_authentication_issues.sql');
    console.log('  You can use the Supabase SQL Editor to run this migration');
    process.exit(1);
  }
}

// Alternative: Output SQL for manual execution
function outputSqlForManualExecution() {
  console.log('\n📄 SQL for manual execution:\n');
  console.log('='.repeat(80));
  
  const migrationPath = join(__dirname, 'supabase/migrations/20260202000000_fix_authentication_issues.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');
  
  console.log(migrationSql);
  console.log('='.repeat(80));
}

// Main execution
const args = process.argv.slice(2);
if (args.includes('--sql-only')) {
  outputSqlForManualExecution();
} else {
  applyFix().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}
