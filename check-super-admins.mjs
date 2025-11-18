import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('========================================');
console.log('CHECKING SUPER ADMIN ACCOUNTS');
console.log('========================================');
console.log();

const expectedAdmins = [
  { email: 'dean@videoremix.vip', name: 'Dean' },
  { email: 'samuel@videoremix.vip', name: 'Samuel' },
  { email: 'victor@videoremix.vip', name: 'Victor' }
];

for (const admin of expectedAdmins) {
  console.log('Checking ' + admin.email + '...');

  // Check if user exists in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  const user = authData?.users?.find(u => u.email === admin.email);

  if (!user) {
    console.log('  ❌ NOT FOUND in auth.users');
    console.log();
    continue;
  }

  console.log('  ✅ Found in auth.users (ID: ' + user.id + ')');

  // Check user_roles table
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (roleError || !roleData) {
    console.log('  ❌ NOT FOUND in user_roles table');
    console.log('     Error:', roleError?.message);
  } else {
    console.log('  ✅ Role: ' + roleData.role);
  }

  // Check profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.log('  ❌ NOT FOUND in profiles table');
    console.log('     Error:', profileError?.message);
  } else {
    console.log('  ✅ Profile exists (Name: ' + (profileData.full_name || 'Not set') + ')');
  }

  console.log();
}

console.log('========================================');
