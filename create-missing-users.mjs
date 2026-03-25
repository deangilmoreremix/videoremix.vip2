#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function createMissingUsers() {
  console.log('🔧 Creating missing users...\n');

  // Define the missing users from CSV data
  const missingUsers = [
    {
      email: 'larrylawrence1@gmail.com',
      password: 'TempPass123!', // Temporary password - should be changed on first login
      user_metadata: {
        full_name: 'Larry Lawrence',
        first_name: 'Larry',
        last_name: 'Lawrence'
      }
    },
    {
      email: 'trcole3@theritegroup.com',
      password: 'TempPass123!',
      user_metadata: {
        full_name: 'Truman Cole',
        first_name: 'Truman',
        last_name: 'Cole'
      }
    },
    {
      email: 'ejo1ed@gmail.com',
      password: 'TempPass123!',
      user_metadata: {
        full_name: 'Edward Owens',
        first_name: 'Edward',
        last_name: 'Owens'
      }
    }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const userData of missingUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers.users.some(u => u.email === userData.email);

    if (userExists) {
      console.log(`   ⚠️  User already exists: ${userData.email}`);
      skippedCount++;
      continue;
    }

    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: userData.user_metadata
    });

    if (error) {
      console.log(`   ❌ Failed to create ${userData.email}: ${error.message}`);
    } else {
      console.log(`   ✅ Created user: ${userData.email} (ID: ${data.user.id})`);
      createdCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);

  if (createdCount > 0) {
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Run: node import-purchases.mjs (to process their transactions)`);
    console.log(`   2. Run: node grant-app-access.mjs (to grant app access)`);
    console.log(`   3. Run: node setup-subscriptions.mjs (to setup subscriptions)`);
  }
}

createMissingUsers().catch(console.error);