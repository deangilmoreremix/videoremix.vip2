#!/usr/bin/env node

/**
 * Remove User Access Script
 *
 * This script helps you remove or revoke access for unauthorized users.
 *
 * Usage:
 *   node remove-user-access.mjs <email>
 *   node remove-user-access.mjs <email> --delete
 *   node remove-user-access.mjs <email> --revoke-only
 *
 * Examples:
 *   node remove-user-access.mjs user@example.com
 *   node remove-user-access.mjs user@example.com --delete
 *   node remove-user-access.mjs user@example.com --revoke-only
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const email = process.argv[2];
const deleteUser = process.argv.includes('--delete');
const revokeOnly = process.argv.includes('--revoke-only');

if (!email) {
  console.log(`
Usage:
  node remove-user-access.mjs <email> [options]

Options:
  --revoke-only   Only revoke app access, don't delete user
  --delete        Permanently delete the user account

Examples:
  node remove-user-access.mjs user@example.com --revoke-only
  node remove-user-access.mjs spammer@test.com --delete
`);
  process.exit(1);
}

async function findUser(email) {
  console.log(`\n🔍 Searching for user: ${email}`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return null;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return null;
  }

  console.log(`✅ Found user:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
  console.log(`   Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);

  return user;
}

async function getUserDetails(userId) {
  console.log('\n📊 Fetching user details...');

  // Get app access
  const { data: appAccess, error: accessError } = await supabase
    .from('user_app_access')
    .select('*')
    .eq('user_id', userId);

  if (accessError) {
    console.error('⚠️  Error fetching app access:', accessError.message);
  } else {
    const activeAccess = appAccess?.filter(a => a.is_active) || [];
    console.log(`   Active app access: ${activeAccess.length}`);
    if (activeAccess.length > 0) {
      activeAccess.forEach(access => {
        console.log(`     - ${access.app_slug} (${access.access_type})`);
      });
    }
  }

  // Get purchases
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId);

  if (purchasesError) {
    console.error('⚠️  Error fetching purchases:', purchasesError.message);
  } else {
    const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];
    console.log(`   Total purchases: ${purchases?.length || 0} (${completedPurchases.length} completed)`);

    if (completedPurchases.length > 0) {
      const totalSpent = completedPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      console.log(`   Total spent: $${totalSpent.toFixed(2)}`);
    }
  }

  // Get role
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!roleError && roleData) {
    console.log(`   Role: ${roleData.role}`);

    if (roleData.role === 'super_admin') {
      console.log('\n⚠️  WARNING: This is a SUPER ADMIN account!');
      return { isSuperAdmin: true, appAccess, purchases };
    }
  }

  return { isSuperAdmin: false, appAccess, purchases };
}

async function revokeAccess(userId) {
  console.log('\n🔒 Revoking app access...');

  const { data, error } = await supabase
    .from('user_app_access')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error revoking access:', error.message);
    return false;
  }

  console.log('✅ All app access has been revoked');
  return true;
}

async function deleteUserAccount(userId, email) {
  console.log('\n🗑️  Deleting user account...');
  console.log('⚠️  This will permanently delete:');
  console.log('   - User account');
  console.log('   - All purchases');
  console.log('   - All app access');
  console.log('   - All subscriptions');
  console.log('   - All user preferences');

  // Wait for confirmation (5 seconds)
  console.log('\n⏳ Waiting 5 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('❌ Error deleting user:', error.message);
    return false;
  }

  console.log(`✅ User account deleted: ${email}`);
  return true;
}

async function main() {
  console.log('🚀 VideoRemix.vip - Remove User Access Tool');
  console.log('==========================================');

  // Find user
  const user = await findUser(email);
  if (!user) {
    process.exit(1);
  }

  // Get details
  const details = await getUserDetails(user.id);

  // Check if super admin
  if (details.isSuperAdmin && deleteUser) {
    console.log('\n❌ Cannot delete super admin accounts!');
    console.log('Please remove super admin role first or contact system administrator.');
    process.exit(1);
  }

  // Perform action
  if (deleteUser) {
    console.log('\n⚠️  DELETE MODE: User will be permanently removed');

    // First revoke access
    await revokeAccess(user.id);

    // Then delete account
    const success = await deleteUserAccount(user.id, user.email);

    if (success) {
      console.log('\n✅ User successfully removed from the system');
    } else {
      console.log('\n❌ Failed to remove user');
      process.exit(1);
    }
  } else if (revokeOnly) {
    console.log('\n🔒 REVOKE MODE: Only removing app access');

    const success = await revokeAccess(user.id);

    if (success) {
      console.log('\n✅ App access successfully revoked');
      console.log('   User account still exists but cannot access any apps');
    } else {
      console.log('\n❌ Failed to revoke access');
      process.exit(1);
    }
  } else {
    // Default: just show info
    console.log('\n💡 No action specified. To remove access, use:');
    console.log(`   node remove-user-access.mjs ${email} --revoke-only`);
    console.log(`   node remove-user-access.mjs ${email} --delete`);
  }

  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
