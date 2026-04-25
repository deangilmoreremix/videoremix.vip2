import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing service key!');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggers() {
  console.log('🔍 Checking database triggers...\n');

  try {
    // Check if handle_new_user trigger exists
    const { data: triggers, error } = await adminClient
      .from('pg_trigger')
      .select('tgname, tgrelid::regclass as table_name')
      .eq('tgname', 'on_auth_user_created');

    if (error) {
      console.error('❌ Error checking triggers:', error);
    } else if (triggers.length > 0) {
      console.log('✅ handle_new_user trigger exists');
    } else {
      console.log('❌ handle_new_user trigger does not exist');
    }

    // Check if handle_new_user function exists
    const { data: functions, error: funcError } = await adminClient
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user');

    if (funcError) {
      console.error('❌ Error checking functions:', funcError);
    } else if (functions.length > 0) {
      console.log('✅ handle_new_user function exists');
    } else {
      console.log('❌ handle_new_user function does not exist');
    }

    // Check recent auth.users entries
    console.log('\nChecking recent auth.users entries...');
    const { data: recentUsers, error: usersError } = await adminClient
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('Recent users:');
      recentUsers.forEach(user => {
        console.log(`  ${user.id}: ${user.email} (${user.created_at})`);
      });
    }

    // Check if profiles were created for recent users
    if (recentUsers && recentUsers.length > 0) {
      const userIds = recentUsers.map(u => u.id);
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
      } else {
        console.log(`\nProfiles found: ${profiles.length} out of ${userIds.length} users`);
        profiles.forEach(profile => {
          console.log(`  ${profile.user_id}: ${profile.email}`);
        });
      }

      // Check user roles
      const { data: roles, error: rolesError } = await adminClient
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError);
      } else {
        console.log(`\nUser roles found: ${roles.length} out of ${userIds.length} users`);
        roles.forEach(role => {
          console.log(`  ${role.user_id}: ${role.role}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTriggers();