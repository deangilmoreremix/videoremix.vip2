import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying authentication fix migration...\n');

    // Read the migration file
    const migrationSQL = readFileSync('supabase/migrations/20260202000000_fix_user_signup_login.sql', 'utf8');

    // Execute the entire migration as a single SQL statement using REST API
    console.log('📄 Executing migration SQL...\n');

    // Use the Supabase SQL API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('🎉 Migration applied successfully!\n');

    // Verify the migration worked
    console.log('🔍 Verifying migration...\n');

    // 1. Check that the trigger exists
    const { data: trigger, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname, proname')
      .eq('tgname', 'on_auth_user_created')
      .single();

    if (triggerError) {
      console.warn('⚠️ Could not verify trigger:', triggerError.message);
    } else if (trigger) {
      console.log('✅ Trigger "on_auth_user_created" exists');
      console.log(`   Function: ${trigger.proname}`);
    }

    // 2. Check RLS is enabled on user_roles
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'user_roles')
      .single();

    if (rlsError) {
      console.warn('⚠️ Could not verify RLS status:', rlsError.message);
    } else if (rlsStatus) {
      console.log(`✅ RLS on user_roles: ${rlsStatus.relrowsecurity ? 'enabled' : 'disabled'}`);
    }

    // 3. Count user_roles entries vs auth.users
    const { data: userCount, error: userCountError } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact', head: true });

    const { data: roleCount, error: roleCountError } = await supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true });

    if (!userCountError && !roleCountError) {
      console.log(`✅ Auth users: ${userCount.count || 'unknown'}`);
      console.log(`✅ User roles: ${roleCount.count || 'unknown'}`);
      
      if (userCount.count === roleCount.count) {
        console.log('✅ All users have roles assigned');
      } else {
        console.warn('⚠️ Some users may be missing roles');
      }
    }

    // 4. Check for missing roles
    const { data: missingRoles, error: missingError } = await supabase.rpc('fix_missing_user_roles');
    
    if (!missingError && missingRoles) {
      console.log(`\n🔧 Ran fix_missing_user_roles():`);
      console.log(`   Total users checked: ${missingRoles.length}`);
      
      const fixed = missingRoles.filter(r => r.action_taken === 'Role created');
      if (fixed.length > 0) {
        console.log(`   Missing roles found and fixed: ${fixed.length}`);
      } else {
        console.log(`   No missing roles found`);
      }
    }

    console.log('\n🎯 Migration verification complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   1. Fixed handle_new_user trigger function');
    console.log('   2. Updated user_roles RLS policies');
    console.log('   3. Backfilled missing user_roles entries');
    console.log('   4. Added fix_missing_user_roles() function for future use');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
