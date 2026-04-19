import { config } from "dotenv";
config();
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 USER IMPORT DIAGNOSTIC REPORT\n');

// 1. Check CSV files
console.log('📁 CSV FILES FOUND:');
const csvFiles = [
  'users_to_import.csv',
  'src/data/top_500_customers.csv', 
  'src/data/VR User List - PKS.csv',
  'src/data/user_contacts_clean.csv'
];

let totalCsvUsers = 0;
for (const file of csvFiles) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(line => line.trim());
    const userCount = lines.length - 1; // Subtract header
    totalCsvUsers += userCount;
    console.log(`  ✅ ${file}: ${userCount} users`);
  } else {
    console.log(`  ❌ ${file}: FILE NOT FOUND`);
  }
}
console.log(`  📊 TOTAL CSV USERS: ${totalCsvUsers}\n`);

// 2. Check database state
console.log('🗄️  DATABASE STATE:');

try {
  // Auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;
  console.log(`  ✅ Auth users: ${authUsers.users.length}`);
  
  // Profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,user_id,email');
  if (profilesError) throw profilesError;
  console.log(`  ✅ Profiles: ${profiles.length}`);
  
  // User roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id,role');
  if (rolesError) throw rolesError;
  console.log(`  ✅ User roles: ${userRoles.length}`);
  
  // Import records
  const { data: csvImports, error: csvError } = await supabase
    .from('csv_imports')
    .select('*');
  if (csvError) throw csvError;
  console.log(`  ✅ CSV imports: ${csvImports.length}`);
  
  const { data: importRecords, error: importError } = await supabase
    .from('import_user_records')
    .select('*');
  if (importError) throw importError;
  console.log(`  ✅ Import user records: ${importRecords.length}`);
  
  // Purchases
  const { data: purchases, error: purchaseError } = await supabase
    .from('purchases')
    .select('id');
  if (purchaseError) throw purchaseError;
  console.log(`  ✅ Purchases: ${purchases.length}`);
  
  console.log('\n🔍 ANALYSIS:');
  
  // Find inconsistencies
  const authUserIds = new Set(authUsers.users.map(u => u.id));
  const profileUserIds = new Set(profiles.map(p => p.user_id));
  const roleUserIds = new Set(userRoles.map(r => r.user_id));
  
  const profilesWithoutAuth = profiles.filter(p => !authUserIds.has(p.user_id));
  const authWithoutProfiles = authUsers.users.filter(u => !profileUserIds.has(u.id));
  
  console.log(`  ⚠️  Profiles without auth users: ${profilesWithoutAuth.length}`);
  console.log(`  ⚠️  Auth users without profiles: ${authWithoutProfiles.length}`);
  console.log(`  📊 Import success rate: ${importRecords.length}/${totalCsvUsers} (${((importRecords.length/totalCsvUsers)*100).toFixed(1)}%)`);
  
  if (profilesWithoutAuth.length > 0) {
    console.log('\n🔧 PROFILES MISSING AUTH USERS:');
    profilesWithoutAuth.slice(0, 5).forEach(p => {
      console.log(`  - ${p.email} (ID: ${p.user_id})`);
    });
    if (profilesWithoutAuth.length > 5) {
      console.log(`  ... and ${profilesWithoutAuth.length - 5} more`);
    }
  }
  
  if (authWithoutProfiles.length > 0) {
    console.log('\n🔧 AUTH USERS MISSING PROFILES:');
    authWithoutProfiles.slice(0, 5).forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
    });
  }
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}

console.log('\n🎯 CONCLUSION:');
const authUserCount = authUsers?.users?.length || 0;
console.log(`  📊 You have ${totalCsvUsers} users in CSV files but only ${authUserCount} in the database`);
console.log(`  🔧 ${profilesWithoutAuth?.length || 0} profiles need auth users created`);
console.log(`  🚀 Ready to import ${totalCsvUsers - (authUsers?.users?.length || 0)} missing users`);

console.log('\n📋 NEXT STEPS:');
console.log('  1. Run: node repair-database.mjs (fix existing inconsistencies)');
console.log('  2. Run: node comprehensive-user-import.mjs (import all CSV users)');
console.log('  3. Run: node verify-user-import.mjs (confirm success)');
