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

async function createAdminUser() {
  const email = 'dev@videoremix.vip';
  const password = 'Admin123!@#';

  console.log(`🔍 Checking if user exists: ${email}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  let user = users.find(u => u.email === email);

  if (user) {
    console.log(`✅ User already exists:`, user.id);
  } else {
    console.log('📝 Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    user = newUser.user;
    console.log(`✅ User created:`, user.id);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
  }

  console.log('📝 Setting up admin role...');

  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRole) {
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role: 'super_admin' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating role:', updateError);
    } else {
      console.log('✅ Role updated to super_admin');
    }
  } else {
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'super_admin' });

    if (insertError) {
      console.error('❌ Error inserting role:', insertError);
    } else {
      console.log('✅ Role created: super_admin');
    }
  }

  console.log('📝 Setting up admin profile...');

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminProfile) {
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        user_id: user.id,
        is_active: true,
        permissions: {}
      });

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError);
    } else {
      console.log('✅ Admin profile created');
    }
  } else {
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .update({ is_active: true })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('❌ Error updating admin profile:', profileError);
    } else {
      console.log('✅ Admin profile updated');
    }
  }

  console.log('\n✅ ADMIN USER READY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 Role: super_admin');
  console.log('🆔 User ID:', user.id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createAdminUser().catch(console.error);
