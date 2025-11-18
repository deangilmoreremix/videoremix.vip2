#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SUPER_ADMINS = [
  { email: 'dean@smartcrm.vip', name: 'Dean' },
  { email: 'samuel@smartcrm.vip', name: 'Samuel' },
  { email: 'victor@smartcrm.vip', name: 'Victor' },
];

const DEFAULT_PASSWORD = 'TempPassword2024!';

async function setupSuperAdmin(email, name) {
  console.log(`\n🔄 Setting up super admin: ${email}`);

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId;

    if (existingUser) {
      console.log(`   ✓ User already exists: ${email}`);
      userId = existingUser.id;
    } else {
      // Create the user
      console.log(`   → Creating user account...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: name,
        },
      });

      if (authError) {
        console.error(`   ❌ Failed to create user: ${authError.message}`);
        return false;
      }

      userId = authData.user.id;
      console.log(`   ✓ User created with ID: ${userId}`);
    }

    // Check if role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRole) {
      // Update existing role to super_admin
      console.log(`   → Updating role to super_admin...`);
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          role: 'super_admin',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`   ❌ Failed to update role: ${updateError.message}`);
        return false;
      }
    } else {
      // Insert new role
      console.log(`   → Assigning super_admin role...`);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'super_admin',
        });

      if (roleError) {
        console.error(`   ❌ Failed to assign role: ${roleError.message}`);
        return false;
      }
    }

    console.log(`   ✓ Super admin role assigned`);

    // Create or update admin profile
    const { data: existingProfile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .update({
          full_name: name,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) {
        console.log(`   ⚠️  Could not update profile: ${profileError.message}`);
      } else {
        console.log(`   ✓ Profile updated`);
      }
    } else {
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          user_id: userId,
          full_name: name,
        });

      if (profileError) {
        console.log(`   ⚠️  Could not create profile: ${profileError.message}`);
      } else {
        console.log(`   ✓ Profile created`);
      }
    }

    console.log(`✅ Successfully set up ${email} as super_admin`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting up ${email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Super Admin Accounts');
  console.log('===================================');
  console.log(`\nConfiguring ${SUPER_ADMINS.length} super admin accounts...`);

  const results = [];

  for (const admin of SUPER_ADMINS) {
    const success = await setupSuperAdmin(admin.email, admin.name);
    results.push({ email: admin.email, success });
  }

  console.log('\n===================================');
  console.log('📊 Summary');
  console.log('===================================');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log('\nFailed accounts:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.email}`);
    });
  }

  console.log('\n===================================');
  console.log('📝 Login Credentials');
  console.log('===================================');
  console.log(`\nDefault password for all accounts: ${DEFAULT_PASSWORD}`);
  console.log('\n⚠️  IMPORTANT: Users should change their password on first login!');
  console.log('\nLogin URL: https://videoremix.vip/admin');

  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
