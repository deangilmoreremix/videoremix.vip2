import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('\n' + '='.repeat(70));
console.log('ADMIN ACCOUNT CREATION GUIDE');
console.log('='.repeat(70));

console.log('\n⚠️  IMPORTANT: The SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('   does not match your current Supabase project.');
console.log('\n📋 To create admin accounts, please follow these steps:\n');

console.log('OPTION 1: Update Service Role Key (Recommended)');
console.log('─'.repeat(70));
console.log('1. Go to: https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/settings/api');
console.log('2. Copy the "service_role" secret key');
console.log('3. Update SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('4. Run this script again: node create-three-admins.mjs\n');

console.log('OPTION 2: Create Via Supabase Dashboard');
console.log('─'.repeat(70));
console.log('1. Go to: https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/auth/users');
console.log('2. Click "Add User" and create each account:');
console.log('');

const accounts = [
  {
    email: 'dean@videoremix.vip',
    password: 'VideoRemix2025!Dean',
    name: 'Dean'
  },
  {
    email: 'victor@videoremix.vip',
    password: 'VideoRemix2025!Victor',
    name: 'Victor'
  },
  {
    email: 'samuel@videoremix.vip',
    password: 'VideoRemix2025!Samuel',
    name: 'Samuel'
  }
];

accounts.forEach((account, index) => {
  console.log(`   ${index + 1}. Email: ${account.email}`);
  console.log(`      Password: ${account.password}`);
  console.log(`      Auto Confirm: YES`);
  console.log('');
});

console.log('3. After creating each user, go to SQL Editor:');
console.log('   https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/sql/new');
console.log('');
console.log('4. Run this SQL for EACH user (replace the email):');
console.log('');
console.log('   -- Update role to super_admin');
console.log('   UPDATE user_roles');
console.log('   SET role = \'super_admin\'');
console.log('   WHERE user_id = (');
console.log('     SELECT id FROM auth.users');
console.log('     WHERE email = \'dean@videoremix.vip\'  -- Change this for each user');
console.log('   );');
console.log('');
console.log('   -- Update admin profile');
console.log('   UPDATE admin_profiles');
console.log('   SET full_name = \'Dean\'  -- Change this for each user');
console.log('   WHERE user_id = (');
console.log('     SELECT id FROM auth.users');
console.log('     WHERE email = \'dean@videoremix.vip\'  -- Change this for each user');
console.log('   );\n');

console.log('OPTION 3: Use Admin Sign Up Page');
console.log('─'.repeat(70));
console.log('1. Go to: /admin/signup (when your app is running)');
console.log('2. Create each account using the form');
console.log('3. After creating, you\'ll need to manually update their role to');
console.log('   super_admin using SQL Editor (see Option 2, step 4)\n');

console.log('='.repeat(70));
console.log('📋 ACCOUNT CREDENTIALS TO CREATE');
console.log('='.repeat(70));

accounts.forEach((account, index) => {
  console.log(`\n${index + 1}. ${account.name}`);
  console.log(`   Email: ${account.email}`);
  console.log(`   Password: ${account.password}`);
  console.log(`   Role: super_admin`);
});

console.log('\n' + '='.repeat(70));
console.log('Once accounts are created, users can login at: /admin/login');
console.log('='.repeat(70) + '\n');
