#!/usr/bin/env node

/**
 * Create dev@videoremix.vip admin user in bzxohkrxcwodllketcpz project
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Creating dev@videoremix.vip in', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDevAdmin() {
  try {
    // Step 1: Create the user
    console.log('📝 Step 1: Creating user account...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'dev@videoremix.vip',
      password: 'SuperAdmin2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dev Admin',
        role: 'super_admin'
      }
    });

    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log('   User ID:', newUser.user.id);
    console.log('   Email:', newUser.user.email);
    console.log('');

    // Step 2: Add super_admin role
    console.log('📝 Step 2: Adding super_admin role...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'super_admin'
      });

    if (roleError) {
      console.error('❌ Failed to add role:', roleError.message);
      console.log('   You may need to add the role manually in Supabase dashboard');
    } else {
      console.log('✅ Super admin role assigned!');
    }
    console.log('');

    // Step 3: Create admin profile
    console.log('📝 Step 3: Creating admin profile...');
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        user_id: newUser.user.id,
        full_name: 'Dev Admin',
        avatar_url: null,
        department: 'Development',
        bio: 'Super administrator account for development'
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      console.log('   You may need to create the profile manually');
    } else {
      console.log('✅ Admin profile created!');
    }
    console.log('');

    console.log('═'.repeat(60));
    console.log('✅ SUCCESS! Dev admin account created\n');
    console.log('📋 Login Credentials:');
    console.log('   Email: dev@videoremix.vip');
    console.log('   Password: SuperAdmin2024!');
    console.log('');
    console.log('🔗 Login URL: https://videoremix.vip/admin/login');
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

createDevAdmin();
