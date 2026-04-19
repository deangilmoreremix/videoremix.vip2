#!/usr/bin/env node

/**
 * Update Passwords for Imported Users
 *
 * This script updates passwords for all imported Personalizer users to "VideoRemix2026"
 * using the Supabase Admin API.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updatePasswords() {
  console.log('\n🔐 Updating passwords for all users\n');
  console.log('='.repeat(70));

  try {
    // Get all users
    console.log('\n👤 Fetching all users...');
    const { data: allUsers, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      throw userError;
    }

    const usersToUpdate = allUsers.users;

    console.log(`✅ Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log('⚠️  No users found to update. Exiting.');
      return;
    }

    // Update passwords in batches
    const batchSize = 10; // Conservative batch size for rate limits
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    console.log('\n🔄 Updating passwords in batches...');

    for (let i = 0; i < usersToUpdate.length; i += batchSize) {
      const batch = usersToUpdate.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)`);

      // Update each user in the batch
      for (const user of batch) {
        try {
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: 'VideoRemix2026'
          });

          if (updateError) {
            console.error(`❌ Failed to update ${user.email}:`, updateError.message);
            failureCount++;
            failures.push({ email: user.email, error: updateError.message });
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`💥 Error updating ${user.email}:`, err.message);
          failureCount++;
          failures.push({ email: user.email, error: err.message });
        }
      }

      // Small delay between batches to be gentle on rate limits
      if (i + batchSize < usersToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 UPDATE SUMMARY\n');
    console.log(`Total Users Processed: ${usersToUpdate.length}`);
    console.log(`✅ Successfully Updated: ${successCount}`);
    console.log(`❌ Failed:             ${failureCount}`);

    if (failures.length > 0) {
      console.log('\n❌ FAILURE DETAILS:');
      failures.forEach(f => console.log(`   • ${f.email}: ${f.error}`));
    }

    console.log('\n✨ Password update completed!\n');

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    throw error;
  }
}

// Run the script
updatePasswords()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });