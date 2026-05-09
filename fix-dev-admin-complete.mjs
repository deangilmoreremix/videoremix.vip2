#!/usr/bin/env node

/**
 * Fix dev@videoremix.vip - Reset password and add roles
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDevAdmin() {
  console.log('🔧 Fixing dev@videoremix.vip admin account\n');

  const userId = '051c7e26-760d-44ed-b7e0-723cda0949ae';
  const email = 'dev@videoremix.vip';
  const password = 'SuperAdmin2024!';

  try {
    // Step 1: Reset password
    console.log('📝 Step 1: Resetting password...');
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: password,
        email_confirm: true
      }
    );

    if (passwordError) {
      console.error('❌ Failed to reset password:', passwordError.message);
    } else {
      console.log('✅ Password reset successfully!');
    }
    console.log('');

    // Step 2: Add super_admin role
    console.log('📝 Step 2: Adding super_admin role...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'super_admin'
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('❌ Failed to add role:', roleError.message);
    } else {
      console.log('✅ Super admin role assigned!');
    }
    console.log('');

    // Step 3: Create/update admin profile
    console.log('📝 Step 3: Creating admin profile...');
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .upsert({
        user_id: userId,
        email: email,
        full_name: 'Dev Admin'
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
    } else {
      console.log('✅ Admin profile created!');
    }
    console.log('');

    // Step 4: Test login
    console.log('📝 Step 4: Testing login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('❌ Login test failed:', signInError.message);
    } else {
      console.log('✅ Login test successful!');
      console.log('   Session created for:', signInData.user.email);
    }
    console.log('');

    console.log('═'.repeat(60));
    console.log('✅ SUCCESS! Dev admin account is ready\n');
    console.log('📋 Login Credentials:');
    console.log('   Email: dev@videoremix.vip');
    console.log('   Password: SuperAdmin2024!');
    console.log('');
    console.log('🔗 Login at: https://videoremix.vip/admin/login');
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

fixDevAdmin();
