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

// Test user credentials - use a known test user
const testEmail = 'deanvideoremix.io@gmail.com';
const testPassword = 'VideoRemix2025';

console.log('🧪 Testing Authentication Flow with known test user\n');
console.log('='.repeat(50));
console.log(`Test user: ${testEmail}`);
console.log('='.repeat(50) + '\n');

async function testSignupLogin() {
  let userId = null;
  let users = null;

  try {
    // Step 1: Check if test user exists using auth methods
    console.log('Step 1: Checking if test user exists...');
    
    // First try to sign in to see if user exists
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('⚠️  User not found or login failed - checking if user exists in auth...');
      
      // Use admin client to check if user exists
      const { data: authUsers, error: userError } = await adminClient
        .from('auth.users')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (userError) {
        console.error('❌ Failed to check user:', userError.message);
        throw userError;
      }

      if (authUsers) {
        console.log('✅ Test user found!');
        users = authUsers;
        userId = users.id;
        console.log(`   User ID: ${userId}`);
        console.log(`   Email confirmed: ${users.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   Identities count: ${users.identities?.length || 0}\n`);
      } else {
        console.error('❌ Test user not found!\n');
        throw new Error('Test user not found');
      }
    } else {
      console.log('✅ User exists and can login!');
      userId = loginData.user.id;
      console.log(`   User ID: ${userId}\n`);
    }

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

    // Confirm email manually if needed
    if (users) {
      console.log('🔄 Step 2.5: Checking email confirmation...');
      
      if (!users.email_confirmed_at) {
        console.log('⚠️  Email not confirmed, confirming manually...');
        
        // Use admin client to confirm email
        const { error: confirmError } = await adminClient.auth.admin.updateUserById(users.id, {
          email_confirmed: true
        });

        if (confirmError) {
          console.error('❌ Failed to confirm email:', confirmError.message);
        } else {
          console.log('✅ Email confirmed manually');
        }
      } else {
        console.log('✅ Email already confirmed');
      }
    }

    console.log('\n🚀 Step 3: Testing Login...');
    
    // Sign out first to ensure clean state
    await anonClient.auth.signOut();
    
    const { data: loginData2, error: loginError2 } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError2) {
      console.error('❌ Login failed:', loginError2.message);
      console.log('   This is the reported issue!\n');
      throw loginError2;
    }

    if (loginData2.user) {
      console.log('✅ Login successful!');
      console.log(`   User ID: ${loginData2.user.id}`);
      console.log(`   Email: ${loginData2.user.email}\n`);
    } else {
      console.error('❌ No user data returned from login\n');
    }

    // Step 4: Test accessing protected data (user_roles as the logged in user)
    console.log('📋 Step 4: Testing role access as logged in user...');
    
    const { data: userRoleData, error: userRoleError } = await anonClient
      .from('user_roles')
      .select('*')
      .eq('user_id', loginData2.user.id)
      .single();

    if (userRoleError) {
      console.error('❌ Cannot access user role:', userError.message);
      console.log('   This could cause issues with dashboard loading\n');
    } else if (userRoleData) {
      console.log('✅ Can access own role data');
      console.log(`   Role: ${userRoleData.role}\n`);
    }

    // Step 5: Cleanup - delete test user
    console.log('🧹 Step 5: Cleaning up test user...');
    
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
    console.log('✅ Test user exists');
    console.log(roleData ? '✅ User roles created on signup' : '❌ User roles NOT created on signup');
    console.log(loginData2.user ? '✅ Login works' : '❌ Login NOT working');
    console.log(userRoleData ? '✅ Role access works' : '❌ Role access NOT working');
    console.log('='.repeat(50));

    return {
      userExists: !!users,
      roleCreated: !!roleData,
      loginSuccess: !!loginData2.user,
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
    
    if (results.userExists && results.roleCreated && results.loginSuccess) {
      console.log('\n🌟 All authentication processes are working correctly!');
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