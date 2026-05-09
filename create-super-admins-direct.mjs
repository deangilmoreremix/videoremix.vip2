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

const admins = [
  { email: 'dean@videoremix.vip', password: 'VideoRemix2025', full_name: 'Dean' },
  { email: 'samuel@videoremix.vip', password: 'VideoRemix2025', full_name: 'Samuel' },
  { email: 'victor@videoremix.vip', password: 'VideoRemix2025', full_name: 'Victor' }
];

console.log('========================================');
console.log('CREATING SUPER ADMIN ACCOUNTS DIRECTLY');
console.log('========================================');
console.log();

for (const admin of admins) {
  console.log('Creating ' + admin.email + '...');

  try {
    // 1. Create user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: {
        full_name: admin.full_name
      }
    });

    if (userError) {
      console.log('  ❌ Failed to create auth user');
      console.log('     Error:', userError.message);
      console.log();
      continue;
    }

    console.log('  ✅ Created auth user (ID: ' + userData.user.id + ')');

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: admin.email,
        full_name: admin.full_name,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.log('  ⚠️  Profile creation warning:', profileError.message);
    } else {
      console.log('  ✅ Created profile');
    }

    // 3. Create super admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userData.user.id,
        role: 'super_admin'
      });

    if (roleError) {
      console.log('  ❌ Failed to create role');
      console.log('     Error:', roleError.message);
    } else {
      console.log('  ✅ Created super_admin role');
    }

    console.log('  ✅ COMPLETE');

  } catch (error) {
    console.log('  ❌ FAILED');
    console.log('     Error:', error.message);
  }

  console.log();
}

console.log('========================================');
console.log('FINAL VERIFICATION');
console.log('========================================');
console.log();

// Verify all accounts
for (const admin of admins) {
  console.log('Verifying ' + admin.email + '...');

  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData?.users?.find(u => u.email === admin.email);

  if (!user) {
    console.log('  ❌ Not found');
    console.log();
    continue;
  }

  console.log('  ✅ Auth user exists');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData) {
    console.log('  ✅ Role: ' + roleData.role);
  }

  // Test login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: admin.password
  });

  if (loginError) {
    console.log('  ❌ Login test FAILED:', loginError.message);
  } else {
    console.log('  ✅ Login test PASSED');
    // Sign out after test
    await supabase.auth.signOut();
  }

  console.log();
}

console.log('========================================');
console.log('ALL SUPER ADMINS CREATED');
console.log('========================================');
