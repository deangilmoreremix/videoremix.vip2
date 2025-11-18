#!/usr/bin/env node

/**
 * Reset dev@videoremix.vip Password
 *
 * Resets the password for dev@videoremix.vip to SuperAdmin2024!
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetDevPassword() {
  console.log('🔐 Resetting password for dev@videoremix.vip...\n');

  try {
    // Get user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`❌ Error listing users: ${listError.message}`);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === 'dev@videoremix.vip');

    if (!user) {
      console.error('❌ User dev@videoremix.vip not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log('');

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: 'SuperAdmin2024!' }
    );

    if (error) {
      console.error(`❌ Failed to reset password: ${error.message}`);
      process.exit(1);
    }

    console.log('✅ Password reset successfully!\n');
    console.log('📋 Login Details:');
    console.log('   Email: dev@videoremix.vip');
    console.log('   Password: SuperAdmin2024!');
    console.log('');

  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

resetDevPassword();
