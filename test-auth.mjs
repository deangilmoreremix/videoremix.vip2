#!/usr/bin/env node

/**
 * Authentication Testing Script
 *
 * This script tests the Supabase authentication flow programmatically.
 * Run with: node test-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate unique test email
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
const testPassword = 'Test123456!';
const testUser = {
  firstName: 'Test',
  lastName: 'User'
};

console.log('🧪 Starting Supabase Authentication Tests\n');
console.log('═══════════════════════════════════════════\n');

// Test 1: Sign Up
async function testSignUp() {
  console.log('📝 TEST 1: Sign Up Flow');
  console.log('   Testing user registration...');

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        },
      },
    });

    if (error) {
      console.error('   ❌ FAILED: Sign up error:', error.message);
      return false;
    }

    if (data.user) {
      console.log('   ✅ PASSED: User created successfully');
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   🆔 User ID: ${data.user.id}`);

      // Check if email confirmation is required
      if (data.user.email_confirmed_at) {
        console.log('   ✉️  Email auto-confirmed (confirmation disabled)');
      } else {
        console.log('   ⏳ Email confirmation required (check inbox)');
      }

      return data.user;
    }

    console.error('   ❌ FAILED: No user data returned');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 2: Sign In
async function testSignIn() {
  console.log('\n📝 TEST 2: Sign In Flow');
  console.log('   Testing user authentication...');

  // First, sign out to ensure clean state
  await supabase.auth.signOut();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error('   ❌ FAILED: Sign in error:', error.message);
      return false;
    }

    if (data.user && data.session) {
      console.log('   ✅ PASSED: User signed in successfully');
      console.log(`   📧 Email: ${data.user.email}`);
      console.log(`   🔑 Session token: ${data.session.access_token.substring(0, 20)}...`);
      console.log(`   ⏰ Session expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
      return data.session;
    }

    console.error('   ❌ FAILED: No session data returned');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 3: Get Current Session
async function testGetSession() {
  console.log('\n📝 TEST 3: Session Retrieval');
  console.log('   Testing session persistence...');

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('   ❌ FAILED: Get session error:', error.message);
      return false;
    }

    if (data.session) {
      console.log('   ✅ PASSED: Session retrieved successfully');
      console.log(`   👤 User: ${data.session.user.email}`);
      console.log(`   🔑 Token valid: ${data.session.access_token ? 'Yes' : 'No'}`);
      return data.session;
    }

    console.error('   ❌ FAILED: No active session found');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 4: Get Current User
async function testGetUser() {
  console.log('\n📝 TEST 4: User Data Retrieval');
  console.log('   Testing user profile fetch...');

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('   ❌ FAILED: Get user error:', error.message);
      return false;
    }

    if (data.user) {
      console.log('   ✅ PASSED: User data retrieved successfully');
      console.log(`   📧 Email: ${data.user.email}`);
      console.log(`   🆔 ID: ${data.user.id}`);
      console.log(`   👤 First Name: ${data.user.user_metadata?.first_name || 'N/A'}`);
      console.log(`   👤 Last Name: ${data.user.user_metadata?.last_name || 'N/A'}`);
      console.log(`   📅 Created: ${new Date(data.user.created_at).toLocaleString()}`);
      return data.user;
    }

    console.error('   ❌ FAILED: No user data returned');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 5: Update User Profile
async function testUpdateUser() {
  console.log('\n📝 TEST 5: User Profile Update');
  console.log('   Testing profile update...');

  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: 'Updated',
        last_name: 'TestUser',
        test_field: 'Additional metadata'
      },
    });

    if (error) {
      console.error('   ❌ FAILED: Update user error:', error.message);
      return false;
    }

    if (data.user) {
      console.log('   ✅ PASSED: User profile updated successfully');
      console.log(`   👤 First Name: ${data.user.user_metadata?.first_name}`);
      console.log(`   👤 Last Name: ${data.user.user_metadata?.last_name}`);
      console.log(`   📝 Test Field: ${data.user.user_metadata?.test_field}`);
      return data.user;
    }

    console.error('   ❌ FAILED: No user data returned');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 6: Invalid Credentials
async function testInvalidCredentials() {
  console.log('\n📝 TEST 6: Invalid Credentials Handling');
  console.log('   Testing error handling...');

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'WrongPassword123!',
    });

    if (error) {
      console.log('   ✅ PASSED: Invalid credentials correctly rejected');
      console.log(`   🚫 Error: ${error.message}`);
      return true;
    }

    console.error('   ❌ FAILED: Invalid credentials were accepted!');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Test 7: Sign Out
async function testSignOut() {
  console.log('\n📝 TEST 7: Sign Out Flow');
  console.log('   Testing session termination...');

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('   ❌ FAILED: Sign out error:', error.message);
      return false;
    }

    // Verify session is cleared
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      console.log('   ✅ PASSED: User signed out successfully');
      console.log('   🔓 Session cleared');
      return true;
    }

    console.error('   ❌ FAILED: Session still exists after sign out');
    return false;
  } catch (err) {
    console.error('   ❌ FAILED: Unexpected error:', err.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 7
  };

  // Run all tests
  const signUpResult = await testSignUp();
  if (signUpResult) results.passed++; else results.failed++;

  const signInResult = await testSignIn();
  if (signInResult) results.passed++; else results.failed++;

  const sessionResult = await testGetSession();
  if (sessionResult) results.passed++; else results.failed++;

  const userResult = await testGetUser();
  if (userResult) results.passed++; else results.failed++;

  const updateResult = await testUpdateUser();
  if (updateResult) results.passed++; else results.failed++;

  const invalidCredsResult = await testInvalidCredentials();
  if (invalidCredsResult) results.passed++; else results.failed++;

  const signOutResult = await testSignOut();
  if (signOutResult) results.passed++; else results.failed++;

  // Print summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Authentication is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
