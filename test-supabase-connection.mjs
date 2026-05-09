#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection\n');
console.log('URL:', supabaseUrl);
console.log('Service Key (first 20 chars):', supabaseServiceRoleKey?.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Test 1: List all users
    console.log('Test 1: Listing users via admin API...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error:', listError.message);
    } else {
      console.log(`✅ Found ${users.users.length} users`);
      users.users.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
      });
    }
    console.log('');

    // Test 2: Try to get specific user by ID
    console.log('Test 2: Getting specific user by ID...');
    const userId = '051c7e26-760d-44ed-b7e0-723cda0949ae';
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError) {
      console.error('❌ Error:', userError.message);
    } else {
      console.log('✅ Found user:', userData.user.email);
    }
    console.log('');

    // Test 3: Try signing in
    console.log('Test 3: Testing sign in with dev@videoremix.vip...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'dev@videoremix.vip',
      password: 'SuperAdmin2024!'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
