import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow for Regular Users\n');

  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Step 1: Sign up a new user
    console.log('1. Signing up new user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError);
      return;
    }

    console.log('✅ Sign up successful for:', testEmail);

    // Step 2: Check if user has session
    console.log('\n2. Checking session after signup...');
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      console.log('⚠️  No session after signup (expected for email confirmation disabled)');
    } else {
      console.log('✅ Session exists after signup');
    }

    // Step 3: Sign in
    console.log('\n3. Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }

    console.log('✅ Sign in successful');

    // Step 4: Check if user has 'user' role
    console.log('\n4. Checking user role...');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id)
      .single();

    if (roleError) {
      console.error('❌ Error checking user role:', roleError);
    } else if (roleData?.role === 'user') {
      console.log('✅ User has correct "user" role');
    } else {
      console.error('❌ User does not have "user" role:', roleData);
    }

    // Step 5: Test accessing user_app_access (should work for regular users)
    console.log('\n5. Testing access to user_app_access table...');
    const { data: accessData, error: accessError } = await supabase
      .from('user_app_access')
      .select('*')
      .eq('user_id', signInData.user.id)
      .limit(5);

    if (accessError) {
      console.error('❌ Error accessing user_app_access:', accessError);
    } else {
      console.log('✅ Successfully accessed user_app_access (returned', accessData.length, 'records)');
    }

    // Step 6: Test accessing videos table
    console.log('\n6. Testing access to videos table...');
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', signInData.user.id)
      .limit(5);

    if (videosError) {
      console.error('❌ Error accessing videos:', videosError);
    } else {
      console.log('✅ Successfully accessed videos (returned', videosData.length, 'records)');
    }

    // Step 7: Test that user stays logged in (no immediate logout)
    console.log('\n7. Testing session persistence...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const { data: finalSession } = await supabase.auth.getSession();
    if (finalSession.session) {
      console.log('✅ Session persists after 2 seconds');
    } else {
      console.error('❌ Session was lost immediately');
    }

    // Cleanup: Sign out
    console.log('\n8. Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAuthFlow();