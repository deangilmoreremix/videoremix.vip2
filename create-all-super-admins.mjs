import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admins = [
  { email: 'dean@videoremix.vip', password: 'VideoRemix2025', full_name: 'Dean' },
  { email: 'samuel@videoremix.vip', password: 'VideoRemix2025', full_name: 'Samuel' },
  { email: 'victor@videoremix.vip', password: 'VideoRemix2025', full_name: 'Victor' }
];

console.log('========================================');
console.log('CREATING SUPER ADMIN ACCOUNTS');
console.log('========================================');
console.log();

for (const admin of admins) {
  console.log('Creating ' + admin.email + '...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-super-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(admin)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('  ✅ SUCCESS');
      console.log('     User ID:', result.userId);
    } else {
      console.log('  ❌ FAILED');
      console.log('     Error:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.log('  ❌ FAILED');
    console.log('     Error:', error.message);
  }

  console.log();
}

console.log('========================================');
console.log('VERIFICATION');
console.log('========================================');
console.log();

// Wait a moment for the database to update
await new Promise(resolve => setTimeout(resolve, 2000));

// Now verify they were created
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

for (const admin of admins) {
  console.log('Verifying ' + admin.email + '...');

  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData?.users?.find(u => u.email === admin.email);

  if (!user) {
    console.log('  ❌ Not found in auth.users');
    continue;
  }

  console.log('  ✅ Found in auth.users');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData) {
    console.log('  ✅ Role:', roleData.role);
  } else {
    console.log('  ❌ Role not found');
  }

  console.log();
}

console.log('========================================');
console.log('COMPLETE');
console.log('========================================');
