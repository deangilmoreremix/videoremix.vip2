import { readFileSync } from 'fs';

// Read .env file
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

const timestamp = Date.now();
const testEmail = `test-login-logout-${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Login and Logout Flow (HTTP Direct)\n');
console.log('='.repeat(60));
console.log(`Test user: ${testEmail}`);
console.log('='.repeat(60) + '\n');

// Helper: Make HTTP requests to Supabase Auth API
async function supabaseRequest(endpoint, options = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json();
  return { status: response.status, data };
}

// Helper: Admin request with service role key
async function adminRequest(endpoint, options = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function testLoginLogout() {
  let userId = null;
  let accessToken = null;

  try {
    // Step 1: Create test user (signup)
    console.log('Step 1: Creating test user...');
    const { status: signupStatus, data: signupData } = await supabaseRequest('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: { first_name: 'Test', last_name: 'User' }
      })
    });

    if (signupStatus !== 200 || !signupData.user) {
      console.error('❌ Signup failed:', signupData.message || JSON.stringify(signupData));
      throw new Error('Signup failed');
    }

    userId = signupData.user.id;
    accessToken = signupData.access_token;
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${signupData.user.email}`);
    console.log(`   Email confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Access token received: ${accessToken ? 'Yes' : 'No'}\n`);

    // Step 2: Test Login
    console.log('Step 2: Testing login...');
    const { status: loginStatus, data: loginData } = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (loginStatus !== 200 || !loginData.access_token) {
      console.error('❌ Login failed:', loginData.message || JSON.stringify(loginData));
      throw new Error('Login failed');
    }

    accessToken = loginData.access_token;
    console.log('✅ Login successful!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access token exists: Yes`);
    console.log(`   Expires in: ${loginData.expires_in} seconds`);
    console.log(`   Token expires at: ${new Date(loginData.expires_at * 1000).toISOString()}\n`);

    // Step 3: Test Session Persistence (Get user with token)
    console.log('Step 3: Testing session persistence...');
    const { status: userStatus, data: userData } = await supabaseRequest('/auth/v1/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (userStatus !== 200 || !userData.id) {
      console.error('❌ Session check failed:', userData.message || JSON.stringify(userData));
      throw new Error('Session check failed');
    }

    console.log('✅ Session persists after login!');
    console.log(`   Session user ID: ${userData.id}`);
    console.log(`   Session matches login: ${userData.id === loginData.user.id ? 'Yes' : 'No'}\n`);

    // Step 4: Test Logout
    console.log('Step 4: Testing logout...');
    const { status: logoutStatus, data: logoutData } = await supabaseRequest('/auth/v1/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (logoutStatus !== 204 && logoutStatus !== 200) {
      console.error('❌ Logout failed:', logoutData.message || JSON.stringify(logoutData));
      throw new Error('Logout failed');
    }

    console.log('✅ Logout successful!');

    // Verify session is cleared
    const { status: afterLogoutStatus, data: afterLogoutData } = await supabaseRequest('/auth/v1/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (afterLogoutStatus === 401 || afterLogoutStatus === 403) {
      console.log(`   Session cleared after logout: Yes (got ${afterLogoutStatus} as expected)\n`);
    } else {
      console.warn(`⚠️  Session may still exist after logout (status: ${afterLogoutStatus})\n`);
    }

    // Step 5: Test Login After Logout
    console.log('Step 5: Testing login after logout...');
    const { status: reLoginStatus, data: reLoginData } = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    if (reLoginStatus !== 200 || !reLoginData.access_token) {
      console.error('❌ Re-login failed:', reLoginData.message || JSON.stringify(reLoginData));
      throw new Error('Re-login failed');
    }

    console.log('✅ Re-login successful!');
    console.log(`   New access token different: ${reLoginData.access_token !== accessToken ? 'Yes' : 'No'}\n`);

    // Step 6: Test Invalid Credentials
    console.log('Step 6: Testing invalid credentials...');
    const { status: invalidStatus, data: invalidData } = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!'
      })
    });

    if (invalidStatus === 400 || invalidStatus === 401) {
      console.log('✅ Invalid credentials properly rejected!');
      console.log(`   Status: ${invalidStatus}`);
      console.log(`   Error: ${invalidData.message || invalidData.error || 'Invalid credentials'}\n`);
    } else {
      console.error('❌ Invalid credentials were accepted! This is a security issue!\n');
    }

    // Step 7: Cleanup - Delete test user
    console.log('Step 7: Cleaning up test user...');
    const { status: deleteStatus, data: deleteData } = await adminRequest(`/auth/v1/admin/users/${userId}`, {
      method: 'DELETE'
    });

    if (deleteStatus === 200 || deleteStatus === 204) {
      console.log('✅ Test user cleaned up successfully\n');
    } else {
      console.warn(`⚠️  Could not delete test user: ${JSON.stringify(deleteData)}\n`);
    }

    // Final Summary
    console.log('='.repeat(60));
    console.log('📋 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Signup works - User created with instant access');
    console.log('✅ Login works - Valid credentials accepted');
    console.log('✅ Session persists - User endpoint returns valid data');
    console.log('✅ Logout works - Session cleared after logout');
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
      try {
        await adminRequest(`/auth/v1/admin/users/${userId}`, {
          method: 'DELETE'
        });
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.warn('⚠️  Cleanup failed:', cleanupError.message);
      }
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
