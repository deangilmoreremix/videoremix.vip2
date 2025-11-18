#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminAccounts = [
  {
    email: 'dean@videoremix.vip',
    password: 'VideoRemix2025',
    fullName: 'Dean'
  },
  {
    email: 'victor@videoremix.vip',
    password: 'VideoRemix2025',
    fullName: 'Victor'
  },
  {
    email: 'samuel@videoremix.vip',
    password: 'VideoRemix2025',
    fullName: 'Samuel'
  }
];

async function createOrUpdateAdminUser(email, password, fullName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Processing: ${email}`);
  console.log(`${'='.repeat(60)}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    return { success: false, email, error: listError.message };
  }

  let user = users.find(u => u.email === email);

  if (user) {
    console.log(`✅ User already exists with ID: ${user.id}`);
  } else {
    console.log('📝 Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return { success: false, email, error: createError.message };
    }

    user = newUser.user;
    console.log(`✅ User created with ID: ${user.id}`);
  }

  console.log('📝 Setting up super_admin role...');

  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRole) {
    if (existingRole.role === 'super_admin') {
      console.log('✅ Role already set to super_admin');
    } else {
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'super_admin', updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Error updating role:', updateError);
        return { success: false, email, error: updateError.message };
      }
      console.log('✅ Role updated to super_admin');
    }
  } else {
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'super_admin' });

    if (insertError) {
      console.error('❌ Error inserting role:', insertError);
      return { success: false, email, error: insertError.message };
    }
    console.log('✅ Role created: super_admin');
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
        email: email,
        full_name: fullName
      });

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError);
      return { success: false, email, error: profileError.message };
    }
    console.log('✅ Admin profile created');
  } else {
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .update({
        email: email,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('❌ Error updating admin profile:', profileError);
      return { success: false, email, error: profileError.message };
    }
    console.log('✅ Admin profile updated');
  }

  return {
    success: true,
    email,
    password,
    userId: user.id,
    fullName,
    role: 'super_admin'
  };
}

async function createAllAdmins() {
  console.log('\n🚀 Starting Admin Account Creation Process');
  console.log('━'.repeat(60));

  const results = [];

  for (const account of adminAccounts) {
    const result = await createOrUpdateAdminUser(
      account.email,
      account.password,
      account.fullName
    );
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successfully processed: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('✅ SUCCESSFUL ADMIN ACCOUNTS');
    console.log('─'.repeat(60));

    successful.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.fullName}`);
      console.log(`   📧 Email: ${result.email}`);
      console.log(`   🔑 Password: ${result.password}`);
      console.log(`   👤 Role: ${result.role}`);
      console.log(`   🆔 User ID: ${result.userId}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('❌ FAILED ACCOUNTS');
    console.log('─'.repeat(60));

    failed.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.email}`);
      console.log(`   Error: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔐 LOGIN INFORMATION');
  console.log('='.repeat(60));
  console.log('Login URL: /admin/login');
  console.log('All accounts have super_admin privileges');
  console.log('='.repeat(60));

  console.log('\n✅ Admin account creation process completed!\n');
}

createAllAdmins().catch(console.error);
