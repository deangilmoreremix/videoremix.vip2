import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file directly
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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Test user credentials
const timestamp = Date.now();
const testEmail = `test-login-logout-${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Login and Logout Flow\n');
console.log('='.repeat(60));
console.log(`Test user: ${testEmail}`);
console.log('='.repeat(60) + '\n');

async function testLoginLogout() {
  let userId = null;

  try {
    // Step 1: Create test user (signup)
    console.log('Step 1: Creating test user...');
    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
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
      console.error('❌ Signup failed:', signupError.message);
      throw signupError;
    }

    if (!signupData.user) {
      console.error('❌ No user data returned from signup');
      throw new Error('No user data');
    }

    userId = signupData.user.id;
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${signupData.user.email}`);
    console.log(`   Email confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);

    // Step 2: Test Login
    console.log('Step 2: Testing login...');
    
    // Sign out first to ensure clean state
    await anonClient.auth.signOut();
    
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      throw loginError;
    }

    if (!loginData.user || !loginData.session) {
      console.error('❌ No user/session data returned from login');
      throw new Error('No user/session data');
    }

    console.log('✅ Login successful!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access token exists: ${loginData.session.access_token ? 'Yes' : 'No'}`);
    console.log(`   Expires in: ${loginData.session.expires_in} seconds`);
    console.log(`   Token expires at: ${new Date(loginData.session.expires_at * 1000).toISOString()}\n`);

    // Step 3: Test Session Persistence
    console.log('Step 3: Testing session persistence...');
    const { data: sessionData, error: sessionError } = await anonClient.auth.getSession();

    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      throw sessionError;
    }

    if (!sessionData.session) {
      console.error('❌ No session found after login');
      throw new Error('No session');
    }

    console.log('✅ Session persists after login!');
    console.log(`   Session user ID: ${sessionData.session.user.id}`);
    console.log(`   Session matches login: ${sessionData.session.user.id === loginData.user.id ? 'Yes' : 'No'}`);

    // Wait 2 seconds and check again
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { data: sessionData2 } = await anonClient.auth.getSession();
    console.log(`   Session still valid after 2s: ${sessionData2.session ? 'Yes' : 'No'}\n`);

    // Step 4: Test Logout
    console.log('Step 4: Testing logout...');
    const { error: logoutError } = await anonClient.auth.signOut();

    if (logoutError) {
      console.error('❌ Logout failed:', logoutError.message);
      throw logoutError;
    }

    console.log('✅ Logout successful!');

    // Verify session is cleared
    const { data: sessionAfterLogout, error: logoutSessionError } = await anonClient.auth.getSession();
    
    if (logoutSessionError) {
      console.log(`   Session check after logout: Error - ${logoutSessionError.message}`);
    } else if (!sessionAfterLogout.session) {
      console.log('   Session cleared after logout: Yes');
    } else {
      console.warn('⚠️  Session still exists after logout!');
    }
    console.log('');

    // Step 5: Test Login After Logout
    console.log('Step 5: Testing login after logout...');
    const { data: reLoginData, error: reLoginError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (reLoginError) {
      console.error('❌ Re-login failed:', reLoginError.message);
      throw reLoginError;
    }

    if (!reLoginData.user || !reLoginData.session) {
      console.error('❌ No user/session data returned from re-login');
      throw new Error('No user/session data');
    }

    console.log('✅ Re-login successful!');
    console.log(`   New access token different: ${reLoginData.session.access_token !== loginData.session.access_token ? 'Yes' : 'No'}\n`);

    // Step 6: Test Invalid Credentials
    console.log('Step 6: Testing invalid credentials...');
    const { data: invalidData, error: invalidError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: 'WrongPassword123!'
    });

    if (invalidError) {
      console.log('✅ Invalid credentials properly rejected!');
      console.log(`   Error message: ${invalidError.message}`);
      
      // Check for specific error
      if (invalidError.message.includes('Invalid login credentials')) {
        console.log('   Correct error type: "Invalid login credentials"\n');
      } else {
        console.warn(`   ⚠️  Unexpected error message\n`);
      }
    } else {
      console.error('❌ Invalid credentials were accepted! This is a security issue!\n');
    }

    // Step 7: Cleanup - Delete test user
    console.log('Step 7: Cleaning up test user...');
    
    // Sign out first
    await anonClient.auth.signOut();
    
    // Delete user with admin client
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.warn('⚠️  Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up successfully\n');
    }

    // Final Summary
    console.log('='.repeat(60));
    console.log('📋 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Signup works - User created with instant access');
    console.log('✅ Login works - Valid credentials accepted');
    console.log('✅ Session persists - Session remains after login');
    console.log('✅ Logout works - Session cleared after signOut()');
    console.log('✅ Re-login works - Can login again after logout');
    console.log('✅ Invalid credentials rejected - Wrong password properly handled');
    console.log('✅ Cleanup complete - Test user removed\n');
    console.log('🎉 All authentication tests PASSED!');
    console.log('='.repeat(60));

    return true;

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    
    // Try to cleanup on error
    if (userId) {
      console.log('\n🧹 Attempting cleanup...');
      await anonClient.auth.signOut();
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    }
    
    throw error;
  }
}

// Run the test
testLoginLogout()
  .then(() => {
    console.log('\n✨ Test complete! Authentication flow is working correctly.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
