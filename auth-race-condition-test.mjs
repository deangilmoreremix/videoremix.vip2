#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];
const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql`;

console.log('🚀 Authentication Race Condition Fix & Test Suite\n');
console.log('='.repeat(60));

// Step 1: Check if the fix is already applied
async function checkFixStatus() {
  console.log('🔍 Step 1: Checking current authentication system status...\n');

  try {
    // Check if trigger exists
    const { data: triggerData, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'on_auth_user_created');

    const triggerExists = !triggerError && triggerData && triggerData.length > 0;

    // Check if function exists
    const { data: functionData, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user');

    const functionExists = !functionError && functionData && functionData.length > 0;

    // Check user/role counts
    const { count: userCount, error: userError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    const { count: roleCount, error: roleError } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    console.log(`   Trigger exists: ${triggerExists ? '✅' : '❌'}`);
    console.log(`   Function exists: ${functionExists ? '✅' : '❌'}`);
    console.log(`   Users: ${userError ? 'unknown' : userCount}`);
    console.log(`   Roles: ${roleError ? 'unknown' : roleCount}`);

    const fixApplied = triggerExists && functionExists;

    if (fixApplied) {
      console.log('\n✅ Authentication fix is already applied!\n');
      return true;
    } else {
      console.log('\n⚠️  Authentication fix needs to be applied.\n');
      return false;
    }

  } catch (error) {
    console.log(`   ❌ Error checking status: ${error.message}\n`);
    return false;
  }
}

// Step 2: Guide user to apply the fix
function applyFix() {
  console.log('🔧 Step 2: Applying the authentication fix...\n');

  console.log('📋 MANUAL APPLICATION REQUIRED');
  console.log('Since Supabase requires manual SQL execution for security,\nplease apply the fix through the Supabase Dashboard:\n');

  console.log(`🔗 Dashboard URL: ${dashboardUrl}`);
  console.log('📝 Steps:');
  console.log('   1. Click the link above');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy the SQL below and paste it');
  console.log('   4. Click "Run"');
  console.log('   5. Run: node auth-race-condition-test.mjs again\n');

  console.log('📄 SQL to apply:');
  console.log('-'.repeat(40));

  // Read and display the SQL
  const sqlContent = readFileSync('CRITICAL_AUTH_FIXES.sql', 'utf8');
  console.log(sqlContent);

  console.log('-'.repeat(40));
  console.log('\n⚠️  After applying the SQL, run this script again to verify and test.');

  process.exit(0);
}

// Step 3: Run comprehensive test suite
async function runTestSuite() {
  console.log('🧪 Step 3: Running Comprehensive Authentication Test Suite\n');
  console.log('='.repeat(60));

  const results = {
    signupSuccess: false,
    roleCreated: false,
    loginSuccess: false,
    roleAccessSuccess: false,
    raceConditionFixed: false
  };

  try {
    // Test 1: Signup
    console.log('Test 1: User Signup...');
    const testEmail = `test-race-condition-${Date.now()}@videoremix.vip`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (signupError) {
      console.error(`   ❌ Signup failed: ${signupError.message}`);
      throw signupError;
    }

    if (!signupData.user) {
      console.error('   ❌ No user data returned');
      throw new Error('No user data');
    }

    results.signupSuccess = true;
    const userId = signupData.user.id;
    console.log('   ✅ Signup successful');
    console.log(`   User ID: ${userId}`);

    // Test 2: Check if user_roles was created immediately (race condition test)
    console.log('\nTest 2: Race Condition Check (user_roles creation)...');

    // Wait a moment for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error(`   ❌ user_roles not created: ${roleError.message}`);
      console.log('   🚨 RACE CONDITION STILL EXISTS!');
    } else {
      results.roleCreated = true;
      results.raceConditionFixed = true;
      console.log('   ✅ user_roles created immediately');
      console.log(`   Role: ${roleData.role}`);
    }

    // Test 3: Check profiles creation
    console.log('\nTest 3: Profile Creation Check...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error(`   ❌ profiles not created: ${profileError.message}`);
    } else {
      console.log('   ✅ profiles created');
      console.log(`   Email: ${profileData.email}`);
      console.log(`   Name: ${profileData.full_name}`);
    }

    // Test 4: Email confirmation and login
    console.log('\nTest 4: Login Test...');

    // Manually confirm email for testing
    const { error: confirmError } = await supabase.auth.admin.updateUserById(userId, {
      email_confirmed: true
    });

    if (confirmError) {
      console.warn(`   ⚠️  Could not confirm email: ${confirmError.message}`);
    } else {
      console.log('   ✅ Email confirmed');
    }

    // Sign out and sign in
    await supabase.auth.signOut();

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error(`   ❌ Login failed: ${loginError.message}`);
      console.log('   🚨 This indicates the race condition fix is incomplete!');
    } else {
      results.loginSuccess = true;
      console.log('   ✅ Login successful');
    }

    // Test 5: Role access as authenticated user
    if (loginData?.user) {
      console.log('\nTest 5: Role Access Test (as authenticated user)...');

      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', loginData.user.id)
        .single();

      if (userRoleError) {
        console.error(`   ❌ Cannot access role: ${userRoleError.message}`);
      } else {
        results.roleAccessSuccess = true;
        console.log('   ✅ Can access own role data');
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log('   ✅ Test user cleaned up');

  } catch (error) {
    console.error(`\n💥 Test suite failed: ${error.message}`);
  }

  // Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));

  console.log(`Signup Success: ${results.signupSuccess ? '✅' : '❌'}`);
  console.log(`Role Created (Race Condition): ${results.roleCreated ? '✅ FIXED' : '❌ STILL BROKEN'}`);
  console.log(`Login Success: ${results.loginSuccess ? '✅' : '❌'}`);
  console.log(`Role Access: ${results.roleAccessSuccess ? '✅' : '❌'}`);

  console.log('\n🎯 VERDICT:');
  if (results.signupSuccess && results.roleCreated && results.loginSuccess && results.roleAccessSuccess) {
    console.log('🌟 ALL TESTS PASSED - Authentication race condition is 100% FIXED!');
    console.log('\n🎉 The authentication system is now working perfectly.');
    console.log('   Users can sign up and log in without issues.');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED - Issues remain.');

    if (!results.roleCreated) {
      console.log('\n🚨 CRITICAL: Race condition still exists!');
      console.log('   user_roles are not being created on signup.');
      console.log('   Please check that the trigger was created correctly.');
    }

    if (!results.loginSuccess) {
      console.log('\n🚨 CRITICAL: Login is failing!');
      console.log('   This usually means user_roles or profiles are missing.');
    }

    process.exit(1);
  }
}

// Main execution
async function main() {
  const fixApplied = await checkFixStatus();

  if (fixApplied) {
    console.log('✅ Fix already applied. Running test suite...\n');
    await runTestSuite();
  } else {
    applyFix();
  }
}

main().catch(console.error);