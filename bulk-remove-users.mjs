#!/usr/bin/env node

/**
 * Bulk Remove Users Script
 *
 * This script helps you remove multiple unauthorized users at once.
 *
 * Usage:
 *   node bulk-remove-users.mjs --dry-run
 *   node bulk-remove-users.mjs --test-accounts
 *   node bulk-remove-users.mjs --inactive-days 180
 *   node bulk-remove-users.mjs --no-purchases
 *   node bulk-remove-users.mjs --email-pattern "spam-domain.com"
 *
 * Examples:
 *   node bulk-remove-users.mjs --dry-run --test-accounts
 *   node bulk-remove-users.mjs --inactive-days 365 --revoke-only
 *   node bulk-remove-users.mjs --email-pattern "test.com" --delete
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
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const testAccounts = args.includes('--test-accounts');
const noPurchases = args.includes('--no-purchases');
const deleteUsers = args.includes('--delete');
const revokeOnly = args.includes('--revoke-only');

const inactiveDaysIndex = args.indexOf('--inactive-days');
const inactiveDays = inactiveDaysIndex !== -1 ? parseInt(args[inactiveDaysIndex + 1]) : null;

const emailPatternIndex = args.indexOf('--email-pattern');
const emailPattern = emailPatternIndex !== -1 ? args[emailPatternIndex + 1] : null;

if (args.length === 0 || args.includes('--help')) {
  console.log(`
🚀 VideoRemix.vip - Bulk Remove Users Tool

Usage:
  node bulk-remove-users.mjs [criteria] [options]

Criteria (choose one):
  --test-accounts              Remove accounts with test/demo emails
  --no-purchases              Remove users without any purchases
  --inactive-days <days>      Remove users inactive for X days
  --email-pattern <pattern>   Remove users matching email pattern

Options:
  --dry-run                   Show what would be removed (no changes)
  --revoke-only              Only revoke access, don't delete
  --delete                   Permanently delete users

Examples:
  node bulk-remove-users.mjs --dry-run --test-accounts
  node bulk-remove-users.mjs --inactive-days 180 --revoke-only
  node bulk-remove-users.mjs --no-purchases --delete
  node bulk-remove-users.mjs --email-pattern "spam.com" --delete
`);
  process.exit(0);
}

async function findTestAccounts() {
  console.log('\n🔍 Finding test accounts...');

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }

  const testUsers = users.filter(user => {
    const email = user.email.toLowerCase();
    return email.includes('test') ||
           email.includes('demo') ||
           email.includes('+test') ||
           email.includes('example.com') ||
           email.includes('temp') ||
           email.includes('fake');
  });

  console.log(`✅ Found ${testUsers.length} test accounts`);
  return testUsers;
}

async function findUsersWithoutPurchases() {
  console.log('\n🔍 Finding users without purchases...');

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return [];
  }

  const usersWithoutPurchases = [];

  for (const user of users) {
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!purchasesError && (!purchases || purchases.length === 0)) {
      // Check if created more than 7 days ago
      const createdDate = new Date(user.created_at);
      const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreated > 7) {
        usersWithoutPurchases.push(user);
      }
    }
  }

  console.log(`✅ Found ${usersWithoutPurchases.length} users without purchases (older than 7 days)`);
  return usersWithoutPurchases;
}

async function findInactiveUsers(days) {
  console.log(`\n🔍 Finding users inactive for ${days} days...`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const inactiveUsers = users.filter(user => {
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date(user.created_at);
    return lastSignIn < cutoffDate;
  });

  console.log(`✅ Found ${inactiveUsers.length} inactive users`);
  return inactiveUsers;
}

async function findUsersByEmailPattern(pattern) {
  console.log(`\n🔍 Finding users matching email pattern: ${pattern}...`);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }

  const matchingUsers = users.filter(user => user.email.includes(pattern));

  console.log(`✅ Found ${matchingUsers.length} matching users`);
  return matchingUsers;
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return 'user';
  return data.role;
}

async function revokeUserAccess(userId) {
  const { error } = await supabase
    .from('user_app_access')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);

  return !error;
}

async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  return !error;
}

async function processUsers(users) {
  if (users.length === 0) {
    console.log('\n✅ No users to process');
    return;
  }

  console.log(`\n📋 Users to process (${users.length}):`);
  console.log('=====================================');

  // Filter out super admins
  const safeUsers = [];
  for (const user of users) {
    const role = await getUserRole(user.id);
    if (role === 'super_admin') {
      console.log(`⚠️  Skipping super admin: ${user.email}`);
    } else {
      safeUsers.push(user);
      console.log(`   - ${user.email} (${role})`);
    }
  }

  if (safeUsers.length === 0) {
    console.log('\n⚠️  No users to process after filtering out super admins');
    return;
  }

  console.log(`\n📊 Total users to process: ${safeUsers.length}`);

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made');
    console.log(`   Would ${deleteUsers ? 'delete' : 'revoke access for'} ${safeUsers.length} users`);
    return;
  }

  if (!revokeOnly && !deleteUsers) {
    console.log('\n⚠️  No action specified. Use --revoke-only or --delete');
    console.log('   Or use --dry-run to preview changes');
    return;
  }

  // Confirm action
  console.log(`\n⚠️  WARNING: About to ${deleteUsers ? 'DELETE' : 'REVOKE ACCESS for'} ${safeUsers.length} users`);
  console.log('⏳ Waiting 10 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('\n🚀 Processing users...');

  let successCount = 0;
  let failCount = 0;

  for (const user of safeUsers) {
    process.stdout.write(`   Processing ${user.email}... `);

    try {
      if (deleteUsers) {
        // First revoke access
        await revokeUserAccess(user.id);
        // Then delete
        const success = await deleteUser(user.id);
        if (success) {
          console.log('✅ DELETED');
          successCount++;
        } else {
          console.log('❌ FAILED');
          failCount++;
        }
      } else if (revokeOnly) {
        const success = await revokeUserAccess(user.id);
        if (success) {
          console.log('✅ ACCESS REVOKED');
          successCount++;
        } else {
          console.log('❌ FAILED');
          failCount++;
        }
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failCount++;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total processed: ${safeUsers.length}`);
}

async function main() {
  console.log('🚀 VideoRemix.vip - Bulk Remove Users Tool');
  console.log('==========================================');

  let usersToProcess = [];

  if (testAccounts) {
    usersToProcess = await findTestAccounts();
  } else if (noPurchases) {
    usersToProcess = await findUsersWithoutPurchases();
  } else if (inactiveDays) {
    usersToProcess = await findInactiveUsers(inactiveDays);
  } else if (emailPattern) {
    usersToProcess = await findUsersByEmailPattern(emailPattern);
  } else {
    console.log('\n❌ No criteria specified. Use --help for options.');
    process.exit(1);
  }

  await processUsers(usersToProcess);

  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
