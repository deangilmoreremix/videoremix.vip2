import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create two clients - one for anon user interactions, one for admin operations
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Test user credentials
const testEmail = `test-signup-${Date.now()}@videoremix.vip`;
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Authentication Flow\n');
console.log('='.repeat(50));
console.log(`Test user: ${testEmail}`);
console.log('='.repeat(50) + '\n');

async function testSignupLogin() {
  let userId = null;

  try {
    // Step 1: Test Signup
    console.log('Step 1: Testing Signup...');
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
    console.log(`   Email confirmed: ${signupData.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Identities count: ${signupData.user.identities?.length || 0}\n`);

    // Step 2: Check if user_roles entry was created
    console.log('Step 2: Checking user_roles entry...');
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('❌ Failed to fetch user role:', roleError.message);
      console.log('   This is the main issue - user_roles not created!\n');
    } else if (roleData) {
      console.log('✅ User role found!');
      console.log(`   Role: ${roleData.role}`);
      console.log(`   Created at: ${roleData.created_at}\n`);
    } else {
      console.error('❌ No user role found!\n');
    }

    // Step 3: Test Login with fresh anonymous client
    console.log('Step 3: Testing Login...');
    
    // Sign out first to ensure clean state
    await anonClient.auth.signOut();
    
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      console.log('   This is the reported issue!\n');
      throw loginError;
    }

    if (loginData.user) {
      console.log('✅ Login successful!');
      console.log(`   User ID: ${loginData.user.id}`);
      console.log(`   Email: ${loginData.user.email}\n`);
    } else {
      console.error('❌ No user data returned from login\n');
    }

    // Step 4: Test accessing protected data (user_roles as the logged in user)
    console.log('Step 4: Testing role access as logged in user...');

    const { data: userRoleData, error: userRoleError } = await anonClient
      .from('user_roles')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();

    if (userRoleError) {
      console.error('❌ Cannot access user role:', userRoleError.message);
      console.log('   This could cause issues with dashboard loading\n');
    } else if (userRoleData) {
      console.log('✅ Can access own role data');
      console.log(`   Role: ${userRoleData.role}\n`);
    }

    // Step 4.5: Test app access (should be denied without purchases)
    console.log('Step 4.5: Testing app access...');

    const { data: purchasesData, error: purchasesError } = await anonClient
      .from('purchases')
      .select('*')
      .eq('user_id', loginData.user.id);

    if (purchasesError) {
      console.error('❌ Cannot check purchases:', purchasesError.message);
    } else {
      console.log(`   User has ${purchasesData.length} purchases`);
      if (purchasesData.length === 0) {
        console.log('✅ No purchases - app access correctly denied\n');
      } else {
        console.log('⚠️ User has purchases unexpectedly\n');
      }
    }

    // Step 5: Cleanup - delete test user
    console.log('Step 5: Cleaning up test user...');
    
    // First delete user_roles entry
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    // Then delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up\n');
    }

    // Final Summary
    console.log('='.repeat(50));
    console.log('📋 Test Summary');
    console.log('='.repeat(50));
    console.log('✅ Signup works');
    console.log(roleData ? '✅ User roles created on signup' : '❌ User roles NOT created on signup');
    console.log(loginData.user ? '✅ Login works' : '❌ Login NOT working');
    console.log(userRoleData ? '✅ Role access works' : '❌ Role access NOT working');
    console.log('='.repeat(50));

    return {
      signupSuccess: !!signupData.user,
      roleCreated: !!roleData,
      loginSuccess: !!loginData.user,
      roleAccessSuccess: !!userRoleData
    };

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    
    // Try to cleanup on error
    if (userId) {
      console.log('\n🧹 Attempting cleanup...');
      await adminClient.from('user_roles').delete().eq('user_id', userId);
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    }
    
    throw error;
  }
}

// Run the test
testSignupLogin()
  .then((results) => {
    console.log('\n🎯 Test complete!');
    
    if (results.roleCreated && results.loginSuccess) {
      console.log('\n✨ All authentication processes are working correctly!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some authentication issues were found.');
      console.log('   Check the migration to fix these issues.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
