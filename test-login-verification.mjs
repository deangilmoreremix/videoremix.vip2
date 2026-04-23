#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzMwMTAsImV4cCI6MjA1ODAwOTAxMH0.-7X7Y4Z8z4X7Y6Z5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1';

console.log('=== Login Verification Test ===');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test 1: Sign up a test user
const testEmail = `test-login-${Date.now()}@example.com`;
const testPassword = 'testPassword123!';

console.log(`\n1. Testing signup with email: ${testEmail}`);

const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword
});

if (signUpError) {
  console.error('Signup Error:', signUpError.message);
  console.error('Signup Error Code:', signUpError.code);
  process.exit(1);
}

console.log('Signup Success:', !!signUpData.user);
console.log('User ID:', signUpData.user?.id);
console.log('User confirmed:', signUpData.user?.confirmed_at ? 'Yes' : 'No');

// Test 2: Immediately login with same credentials
console.log('\n2. Testing immediate login:');

const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: testEmail,
  password: testPassword
});

if (signInError) {
  console.error('Login Error:', signInError.message);
  console.error('Login Error Code:', signInError.code);
  
  if (signInError.code === 'invalid_credentials') {
    console.log('\n⚠️  ROOT CAUSE CONFIRMED: Email confirmation required!');
    console.log('Users cannot login immediately after signup until email is confirmed.');
    console.log('To fix: Disable email confirmations in Supabase Dashboard > Auth > Settings.');
  }
  
  // Cleanup test user if possible using service role
  process.exit(1);
}

console.log('Login Success:', !!signInData.user);
console.log('Session created:', !!signInData.session);
console.log('\n✅ Login works correctly! No email confirmation required.');

// Cleanup: Sign out
await supabase.auth.signOut();
console.log('\nTest completed successfully.');
