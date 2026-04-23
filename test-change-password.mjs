#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Change Password Test ===');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testEmail = 'test-login-1776843857544@example.com';
const oldPassword = 'testPassword123!';
const newPassword = 'newPassword123!';

// Test 1: Change password via edge function
console.log(`\n1. Changing password for ${testEmail}`);

const { data, error } = await supabase.functions.invoke('change-user-password', {
  body: {
    email: testEmail,
    newPassword: newPassword
  }
});

if (error) {
  console.error('Change password error:', error);
  process.exit(1);
}

console.log('Change password result:', data);

// Test 2: Login with new password
console.log('\n2. Testing login with new password:');

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: testEmail,
  password: newPassword
});

if (signInError) {
  console.error('Login with new password failed:', signInError.message);
  process.exit(1);
}

console.log('✅ Login with new password succeeded!');

// Test 3: Verify old password no longer works
console.log('\n3. Testing login with OLD password (should fail):');

const { data: oldSignInData, error: oldSignInError } = await supabase.auth.signInWithPassword({
  email: testEmail,
  password: oldPassword
});

if (oldSignInError) {
  console.log('✅ Old password correctly rejected:', oldSignInError.message);
} else {
  console.error('❌ Old password still works! Security issue.');
}

console.log('\nAll tests passed.');
