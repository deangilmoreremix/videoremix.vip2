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

async function grantAdminAccess() {
  const email = 'dev@videoremix.vip';

  console.log(`🔍 Looking for user: ${email}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found:', email);
    return;
  }

  console.log(`✅ Found user:`, user.id);

  const { data: existingRole, error: checkError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRole) {
    console.log('📝 Updating existing role...');
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role: 'super_admin' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating role:', updateError);
      return;
    }
  } else {
    console.log('📝 Creating new role...');
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'super_admin' });

    if (insertError) {
      console.error('❌ Error inserting role:', insertError);
      return;
    }
  }

  const { data: adminProfile, error: profileCheckError } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminProfile) {
    console.log('📝 Creating admin profile...');
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        user_id: user.id,
        is_active: true,
        permissions: {}
      });

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError);
      return;
    }
  } else {
    console.log('📝 Updating admin profile...');
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .update({ is_active: true })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('❌ Error updating admin profile:', profileError);
      return;
    }
  }

  console.log('✅ Admin access granted successfully!');
  console.log('User:', email);
  console.log('Role: super_admin');
  console.log('Status: active');
}

grantAdminAccess().catch(console.error);
