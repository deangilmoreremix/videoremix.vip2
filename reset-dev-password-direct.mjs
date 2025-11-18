#!/usr/bin/env node

/**
 * Reset dev@videoremix.vip Password - Direct Method
 *
 * Uses SQL to directly update the password hash
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    // First, verify the user exists
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'dev@videoremix.vip')
      .single();

    if (userError) {
      console.log('Trying alternate method to find user...');

      // Use raw SQL query
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec', {
        sql: `SELECT id, email FROM auth.users WHERE email = 'dev@videoremix.vip'`
      });

      if (sqlError) {
        console.error(`❌ Could not find user: ${sqlError.message}`);

        // Try using the admin API with better error handling
        console.log('\nAttempting password reset via admin API...');

        const newPassword = 'SuperAdmin2024!';

        // Get the user ID we know from the earlier query
        const userId = '051c7e26-760d-44ed-b7e0-723cda0949ae';

        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            password: newPassword,
            email_confirm: true
          }
        );

        if (updateError) {
          console.error(`❌ Failed to reset password: ${updateError.message}`);
          process.exit(1);
        }

        console.log('✅ Password reset successfully!\n');
        console.log('📋 Login Details:');
        console.log('   Email: dev@videoremix.vip');
        console.log('   Password: SuperAdmin2024!');
        console.log('');
        return;
      }
    }

    console.log('✅ User found in database');
    console.log('   Attempting password reset...\n');

    // Use the user ID directly
    const userId = '051c7e26-760d-44ed-b7e0-723cda0949ae';
    const newPassword = 'SuperAdmin2024!';

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error(`❌ Failed to reset password: ${updateError.message}`);
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
