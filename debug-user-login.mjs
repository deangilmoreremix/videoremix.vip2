import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserLogin() {
  console.log('🔍 Debugging user login issue for thebiz4u@aol.com\n');

  try {
    // Check if user exists in profiles
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', 'thebiz4u@aol.com')
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    if (!profile) {
      console.log('❌ User profile not found');
      return;
    }

    console.log('✅ User profile found:');
    console.log(`   User ID: ${profile.user_id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Full Name: ${profile.full_name}`);

    // Check user role
    const { data: userRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    if (roleError) {
      console.error('❌ Error fetching user role:', roleError);
    } else {
      console.log('✅ User role found:');
      console.log(`   Role: ${userRole.role}`);
      console.log(`   Active: ${userRole.is_active}`);
    }

    // Check if user exists in auth.users (try to get some info)
    console.log('\n🔍 Checking auth user details...');

    // Try to get user by email from profiles table
    const { data: authUser, error: authError } = await adminClient
      .from('profiles')
      .select('user_id, email, created_at')
      .eq('email', 'thebiz4u@aol.com')
      .single();

    if (authError) {
      console.error('❌ Error with auth user check:', authError);
    } else {
      console.log('✅ Auth user reference found');
      console.log(`   Created: ${authUser.created_at}`);
    }

    // Test the actual login flow
    console.log('\n🧪 Testing login flow...');

    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'thebiz4u@aol.com',
      password: 'VideoRemix2026'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError);
      return;
    }

    console.log('✅ Login successful');
    console.log(`   User ID: ${loginData.user?.id}`);
    console.log(`   Email: ${loginData.user?.email}`);

    // Check session immediately after login
    const { data: sessionData, error: sessionError } = await anonClient.auth.getSession();

    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (sessionData.session) {
      console.log('✅ Session exists after login');
      console.log(`   Access token: ${sessionData.session.access_token ? 'Present' : 'Missing'}`);
      console.log(`   Expires at: ${new Date(sessionData.session.expires_at * 1000).toISOString()}`);
    } else {
      console.log('❌ No session found after login');
    }

    // Test accessing user data
    console.log('\n🔍 Testing data access...');

    if (sessionData.session) {
      const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        }
      });

      // Test user_app_access
      const { data: appsData, error: appsError } = await testClient
        .from('user_app_access')
        .select('*')
        .eq('user_id', loginData.user.id)
        .limit(1);

      if (appsError) {
        console.error('❌ Error accessing user_app_access:', appsError);
      } else {
        console.log('✅ Can access user_app_access');
      }

      // Test videos
      const { data: videosData, error: videosError } = await testClient
        .from('videos')
        .select('*')
        .eq('user_id', loginData.user.id)
        .limit(1);

      if (videosError) {
        console.error('❌ Error accessing videos:', videosError);
      } else {
        console.log('✅ Can access videos');
      }
    }

    // Test resolve-user-access function
    console.log('\n🔍 Testing resolve-user-access function...');

    if (sessionData.session) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/resolve-user-access`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ resolve-user-access function works');
          console.log(`   Has access: ${data.data?.hasAccess}`);
          console.log(`   Apps count: ${data.data?.apps?.length || 0}`);
        } else {
          console.error('❌ resolve-user-access function failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Network error with resolve-user-access:', error);
      }
    }

    // Cleanup
    await anonClient.auth.signOut();
    console.log('\n✅ Debug test completed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUserLogin();