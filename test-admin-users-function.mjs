#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminUsersFunction() {
  console.log('🔍 Testing Admin Users Function...\n');

  // Test 1: Sign in as dean@videoremix.vip
  console.log('📧 Step 1: Signing in as dean@videoremix.vip');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dean@videoremix.vip',
    password: 'your-password-here', // You need to provide the actual password
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    console.log('\n💡 To fix this, you need to:');
    console.log('   1. Know the password for dean@videoremix.vip');
    console.log('   2. OR reset the password using Supabase Dashboard');
    console.log('   3. OR use the reset-admin-password edge function\n');
    process.exit(1);
  }

  console.log('✅ Signed in successfully');
  console.log(`   User ID: ${authData.user.id}`);
  console.log(`   Email: ${authData.user.email}\n`);

  // Test 2: Get session token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('❌ No session found');
    process.exit(1);
  }

  console.log('✅ Session obtained');
  const token = session.access_token;

  // Test 3: Call admin-users function
  console.log('📡 Step 2: Calling admin-users edge function...\n');

  const apiUrl = `${supabaseUrl}/functions/v1/admin-users`;
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error('Response:', errorText);
    process.exit(1);
  }

  const data = await response.json();

  if (data.success) {
    console.log('✅ Successfully fetched users!\n');
    console.log(`📊 Total Users: ${data.data.length}\n`);

    console.log('👥 Users List:');
    console.log('─'.repeat(80));

    data.data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Check for super admins
    const superAdmins = data.data.filter(u => u.role === 'super_admin');
    console.log('─'.repeat(80));
    console.log(`\n🔐 Super Admins (${superAdmins.length}):`);
    superAdmins.forEach(admin => {
      console.log(`   • ${admin.email}`);
    });

    console.log('\n✅ All tests passed! The admin-users function is working correctly.\n');
  } else {
    console.error('❌ Function returned error:', data.error);
    process.exit(1);
  }

  // Sign out
  await supabase.auth.signOut();
  console.log('🔓 Signed out successfully\n');
}

// Run the test
testAdminUsersFunction().catch(error => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});
