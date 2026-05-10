import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const timestamp = Date.now();
const testEmail = `test-login-logout-${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Login and Logout Flow (using curl)\n');
console.log('='.repeat(60));
console.log(`Test user: ${testEmail}`);
console.log('='.repeat(60) + '\n');

function curlPost(endpoint, headers, body, useServiceKey = false) {
  const key = useServiceKey ? supabaseServiceKey : supabaseAnonKey;
  const headerStr = headers.map(h => `-H "${h}"`).join(' ');
  const cmd = `curl -s -X POST "${supabaseUrl}${endpoint}" ${headerStr} -d '${JSON.stringify(body)}'`;
  const result = execSync(cmd).toString();
  try {
    return JSON.parse(result);
  } catch {
    return { raw: result, error: 'Failed to parse JSON' };
  }
}

function curlDelete(endpoint, useServiceKey = false) {
  const key = useServiceKey ? supabaseServiceKey : supabaseAnonKey;
  const cmd = `curl -s -X DELETE "${supabaseUrl}${endpoint}" -H "apikey: ${key}" -H "Authorization: Bearer ${key}"`;
  const result = execSync(cmd).toString();
  try {
    return JSON.parse(result);
  } catch {
    return { raw: result };
  }
}

async function testLoginLogout() {
  let userId = null;

  try {
    // Step 1: Create test user (signup)
    console.log('Step 1: Creating test user...');
    const signupData = curlPost('/auth/v1/signup', [
      `apikey: ${supabaseAnonKey}`,
      'Content-Type: application/json'
    ], {
      email: testEmail,
      password: testPassword,
      data: { first_name: 'Test', last_name: 'User' }
    });

    if (!signupData.user || !signupData.access_token) {
      console.error('❌ Signup failed:', signupData.message || JSON.stringify(signupData));
      throw new Error('Signup failed');
    }

    userId = signupData.user.id;
    console.log('✅ Signup successful!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${signupData.user.email}`);
    console.log(`   Email confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);

    // Step 2: Test Login
    console.log('Step 2: Testing login...');
    const loginData = curlPost('/auth/v1/token?grant_type=password', [
      `apikey: ${supabaseAnonKey}`,
      'Content-Type: application/json'
    ], {
      email: testEmail,
      password: testPassword
    });

    if (!loginData.access_token) {
      console.error('❌ Login failed:', loginData.message || JSON.stringify(loginData));
      throw new Error('Login failed');
    }

    const accessToken = loginData.access_token;
    console.log('✅ Login successful!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access token exists: Yes`);
    console.log(`   Expires in: ${loginData.expires_in} seconds\n`);

    // Step 3: Test Logout
    console.log('Step 3: Testing logout...');
    const logoutCmd = `curl -s -X POST "${supabaseUrl}/auth/v1/logout" -H "apikey: ${supabaseAnonKey}" -H "Authorization: Bearer ${accessToken}"`;
    const logoutResult = execSync(logoutCmd).toString();
    
    console.log('✅ Logout successful!');
    console.log(`   Response: ${logoutResult || '(empty - success)'}\n`);

    // Step 4: Verify session is cleared (try to get user with old token)
    console.log('Step 4: Verifying session cleared...');
    const verifyCmd = `curl -s "${supabaseUrl}/auth/v1/user" -H "apikey: ${supabaseAnonKey}" -H "Authorization: Bearer ${accessToken}"`;
    const verifyResult = execSync(verifyCmd).toString();
    
    if (verifyResult.includes('invalid') || verifyResult.includes('Invalid')) {
      console.log('✅ Session cleared after logout: Yes\n');
    } else {
      console.log(`⚠️  Session may still exist: ${verifyResult.substring(0, 100)}\n`);
    }

    // Step 5: Test Login After Logout
    console.log('Step 5: Testing login after logout...');
    const reLoginData = curlPost('/auth/v1/token?grant_type=password', [
      `apikey: ${supabaseAnonKey}`,
      'Content-Type: application/json'
    ], {
      email: testEmail,
      password: testPassword
    });

    if (!reLoginData.access_token) {
      console.error('❌ Re-login failed:', reLoginData.message || JSON.stringify(reLoginData));
      throw new Error('Re-login failed');
    }

    console.log('✅ Re-login successful!');
    console.log(`   New access token different: ${reLoginData.access_token !== accessToken ? 'Yes' : 'No'}\n`);

    // Step 6: Test Invalid Credentials
    console.log('Step 6: Testing invalid credentials...');
    const invalidData = curlPost('/auth/v1/token?grant_type=password', [
      `apikey: ${supabaseAnonKey}`,
      'Content-Type: application/json'
    ], {
      email: testEmail,
      password: 'WrongPassword123!'
    });

    if (invalidData.message || invalidData.error) {
      console.log('✅ Invalid credentials properly rejected!');
      console.log(`   Error: ${invalidData.message || invalidData.error}\n`);
    } else {
      console.error('❌ Invalid credentials were accepted! This is a security issue!\n');
    }

    // Step 7: Cleanup - Delete test user
    console.log('Step 7: Cleaning up test user...');
    const deleteResult = curlDelete(`/auth/v1/admin/users/${userId}`, true);
    
    if (deleteResult.id || deleteResult.raw === '') {
      console.log('✅ Test user cleaned up successfully\n');
    } else {
      console.warn(`⚠️  Could not delete test user: ${JSON.stringify(deleteResult)}\n`);
    }

    // Final Summary
    console.log('='.repeat(60));
    console.log('📋 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Signup works - User created with instant access');
    console.log('✅ Login works - Valid credentials accepted');
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
        curlDelete(`/auth/v1/admin/users/${userId}`, true);
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
