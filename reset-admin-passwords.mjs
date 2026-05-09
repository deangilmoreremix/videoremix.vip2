#!/usr/bin/env node

/**
 * Reset Admin Passwords Script
 *
 * This script resets passwords for your super admin accounts.
 * Run: node reset-admin-passwords.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('   Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPasswords() {
  console.log('🔐 Admin Password Reset Tool\n');
  console.log('═'.repeat(60));

  const admins = [
    { email: 'dean@videoremix.vip', newPassword: 'Admin123!VideoRemix' },
    { email: 'samuel@videoremix.vip', newPassword: 'Admin123!VideoRemix' },
    { email: 'victor@videoremix.vip', newPassword: 'Admin123!VideoRemix' }
  ];

  console.log('⚠️  NEW PASSWORD FOR ALL ADMINS: Admin123!VideoRemix');
  console.log('   (Change this after first login!)\n');
  console.log('═'.repeat(60));
  console.log('');

  for (const admin of admins) {
    try {
      console.log(`🔄 Resetting password for ${admin.email}...`);

      // Get user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`   ❌ Error listing users: ${listError.message}`);
        continue;
      }

      const user = users.users.find(u => u.email === admin.email);

      if (!user) {
        console.error(`   ❌ User not found`);
        continue;
      }

      // Update password using admin API
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: admin.newPassword }
      );

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      } else {
        console.log(`   ✅ Password reset successfully`);
        console.log(`      User ID: ${user.id}`);
      }

    } catch (err) {
      console.error(`   ❌ Unexpected error: ${err.message}`);
    }
    console.log('');
  }

  console.log('═'.repeat(60));
  console.log('\n✅ Password reset complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Go to: https://videoremix.vip/admin/login');
  console.log('   2. Sign in with:');
  console.log('      • Email: dean@videoremix.vip (or samuel/victor)');
  console.log('      • Password: Admin123!VideoRemix');
  console.log('   3. Change your password in profile settings');
  console.log('');
  console.log('🔐 IMPORTANT: Change this temporary password after first login!\n');
}

// Run the script
resetAdminPasswords().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
