import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRoles() {
  console.log('🔍 Checking user_roles table...\n');

  // Check if table exists and has data
  const { data: rolesData, error: rolesError } = await adminClient
    .from('user_roles')
    .select('*')
    .limit(5);

  if (rolesError) {
    console.error('❌ Error fetching user_roles:', rolesError);
  } else {
    console.log(`Found ${rolesData.length} user roles`);
    if (rolesData.length > 0) {
      console.log('Sample roles:', rolesData.slice(0, 3));
    }
  }

  // Check if there are any users in auth.users
  console.log('\nChecking auth.users...');
  const { data: authUsers, error: authError } = await adminClient
    .from('auth.users')
    .select('id, email')
    .limit(5);

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
  } else {
    console.log(`Found ${authUsers.length} auth users`);
  }

  // Check profiles table
  console.log('\nChecking profiles table...');
  const { data: profilesData, error: profilesError } = await adminClient
    .from('profiles')
    .select('user_id, email')
    .limit(5);

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  } else {
    console.log(`Found ${profilesData.length} profiles`);
  }

  // Check recent auth users
  const { data: usersData, error: usersError } = await adminClient
    .from('auth.users')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (usersError) {
    console.error('❌ Error fetching auth users:', usersError);
  } else {
    console.log('\nRecent auth users:');
    usersData.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (${user.created_at})`);
    });
  }
}

checkUserRoles();