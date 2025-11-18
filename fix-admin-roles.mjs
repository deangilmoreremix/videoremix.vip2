import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '99fb8e70-1e68-4b30-8bd8-688df6aa0bde';
const email = 'dev@videoremix.vip';

console.log('🔍 Checking and fixing admin roles for:', email);
console.log('User ID:', userId);

console.log('\n=== STEP 1: Check current roles ===');

const { data: userRoles, error: roleError } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

console.log('📋 Current user_roles:', userRoles);
if (roleError) console.error('Error:', roleError);

const { data: adminUsers, error: adminError } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', userId);

console.log('👤 Current admin_users:', adminUsers);
if (adminError) console.error('Error:', adminError);

console.log('\n=== STEP 2: Fix user_roles table ===');

if (!userRoles || userRoles.length === 0) {
  console.log('➕ Creating new role record...');
  const { data: newRole, error: insertError } = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role: 'super_admin' }])
    .select();

  if (insertError) {
    console.error('❌ Error inserting role:', insertError);
  } else {
    console.log('✅ Role created:', newRole);
  }
} else if (userRoles[0].role !== 'super_admin') {
  console.log('🔄 Updating role to super_admin...');
  const { data: updatedRole, error: updateError } = await supabase
    .from('user_roles')
    .update({ role: 'super_admin' })
    .eq('user_id', userId)
    .select();

  if (updateError) {
    console.error('❌ Error updating role:', updateError);
  } else {
    console.log('✅ Role updated:', updatedRole);
  }
} else {
  console.log('✅ Role already set to super_admin');
}

console.log('\n=== STEP 3: Fix admin_users table ===');

if (!adminUsers || adminUsers.length === 0) {
  console.log('➕ Creating admin_users record...');
  const { data: newAdmin, error: adminInsertError } = await supabase
    .from('admin_users')
    .insert([{
      user_id: userId,
      email: email,
      role: 'super_admin',
      permissions: ['all']
    }])
    .select();

  if (adminInsertError) {
    console.error('❌ Error inserting admin user:', adminInsertError);
  } else {
    console.log('✅ Admin user created:', newAdmin);
  }
} else {
  console.log('✅ Admin user record already exists');
}

console.log('\n=== STEP 4: Verify final state ===');

const { data: finalRoles } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

const { data: finalAdmin } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', userId);

console.log('📋 Final user_roles:', finalRoles);
console.log('👤 Final admin_users:', finalAdmin);

console.log('\n✅ Admin role fix complete!');
