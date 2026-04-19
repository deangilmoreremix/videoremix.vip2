#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCompleteUserImport() {
  console.log('✅ Verifying complete user import...\n');

  // 1. Check final counts
  console.log('1️⃣ Checking final user counts...');

  // Auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message);
    return;
  }
  const authCount = authUsers?.users?.length || 0;

  // Profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id');
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    return;
  }
  const profilesCount = profiles.length;

  // User roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id');
  if (rolesError) {
    console.error('❌ Error fetching user roles:', rolesError.message);
    return;
  }
  const rolesCount = userRoles.length;

  console.log(`   Auth users: ${authCount}`);
  console.log(`   Profiles: ${profilesCount}`);
  console.log(`   User roles: ${rolesCount}`);

  // 2. Verify consistency
  console.log('\n2️⃣ Verifying data consistency...');

  const authIds = new Set(authUsers.users.map(u => u.id));
  const profileIds = new Set(profiles.map(p => p.id));
  const roleIds = new Set(userRoles.map(r => r.user_id));

  const authWithoutProfiles = [...authIds].filter(id => !profileIds.has(id));
  const profilesWithoutAuth = [...profileIds].filter(id => !authIds.has(id));
  const authWithoutRoles = [...authIds].filter(id => !roleIds.has(id));

  console.log(`   Auth users without profiles: ${authWithoutProfiles.length}`);
  console.log(`   Profiles without auth users: ${profilesWithoutAuth.length}`);
  console.log(`   Auth users without roles: ${authWithoutRoles.length}`);

  // 3. Check CSV data vs database
  console.log('\n3️⃣ Comparing with CSV data...');

  const csvFiles = [
    { path: 'src/data/VR User List - PKS.csv', emailField: 'Customer Email' },
    { path: 'users_to_import_clean.csv', emailField: 'email' },
    { path: 'src/data/top_500_customers.csv', emailField: 'email' },
    { path: 'src/data/user_contacts_clean.csv', emailField: 'email' }
  ];

  let totalCsvUsers = 0;
  const csvEmails = new Set();

  for (const csv of csvFiles) {
    try {
      const content = fs.readFileSync(path.join(__dirname, csv.path), 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const email = values[0]?.toLowerCase().trim();
        if (email && email.includes('@')) {
          csvEmails.add(email);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read ${csv.path}: ${error.message}`);
    }
  }

  totalCsvUsers = csvEmails.size;
  console.log(`   Total unique emails in CSV files: ${totalCsvUsers}`);
  console.log(`   Auth users in database: ${authCount}`);

  // Check coverage
  const authEmails = new Set(authUsers.users.map(u => u.email.toLowerCase()));
  const csvEmailsInDb = [...csvEmails].filter(email => authEmails.has(email));
  const missingFromDb = [...csvEmails].filter(email => !authEmails.has(email));

  console.log(`   CSV emails found in database: ${csvEmailsInDb.length}`);
  console.log(`   CSV emails missing from database: ${missingFromDb.length}`);

  // 4. Sample verification
  console.log('\n4️⃣ Sample user verification...');

  const sampleUsers = authUsers.users.slice(0, 5);
  for (const user of sampleUsers) {
    const hasProfile = profileIds.has(user.id);
    const hasRole = roleIds.has(user.id);

    console.log(`   ${user.email}: Auth✓ Profile${hasProfile ? '✓' : '❌'} Role${hasRole ? '✓' : '❌'}`);
  }

  // 5. Final assessment
  console.log('\n' + '='.repeat(80));
  console.log('🎯 IMPORT VERIFICATION RESULTS');
  console.log('='.repeat(80));

  const isConsistent = authWithoutProfiles.length === 0 &&
                      profilesWithoutAuth.length === 0 &&
                      authWithoutRoles.length === 0;

  const coveragePercent = totalCsvUsers > 0 ? ((csvEmailsInDb.length / totalCsvUsers) * 100).toFixed(1) : 0;

  console.log(`\n📊 Data Consistency: ${isConsistent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📊 CSV Coverage: ${coveragePercent}% (${csvEmailsInDb.length}/${totalCsvUsers})`);
  console.log(`📊 Total Users: ${authCount}`);

  if (isConsistent && coveragePercent >= 95) {
    console.log('\n🎉 SUCCESS: User import completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run purchase import for product access');
    console.log('   2. Send password reset emails to users');
    console.log('   3. Test user login and app access');
  } else {
    console.log('\n⚠️  ISSUES FOUND:');

    if (!isConsistent) {
      console.log('   - Database inconsistencies remain');
      console.log('   - Run repair-database.mjs again');
    }

    if (coveragePercent < 95) {
      console.log(`   - Only ${coveragePercent}% of CSV users imported`);
      console.log('   - Check import logs for failures');
      console.log(`   - Missing users: ${missingFromDb.slice(0, 5).join(', ')}${missingFromDb.length > 5 ? '...' : ''}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

verifyCompleteUserImport().catch(console.error);