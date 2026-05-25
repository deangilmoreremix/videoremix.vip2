import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDashboardAccess() {
  console.log('🧪 Testing Dashboard Access for Regular Users\n');

  const testEmail = `dashboard-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Sign up and sign in
    console.log('1. Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError);
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }

    console.log('✅ User authenticated');

    // Simulate useUserStats hook
    console.log('\n2. Testing user stats access...');
    const [appsResult, videosResult] = await Promise.all([
      supabase
        .from('user_app_access')
        .select('app_slug', { count: 'exact', head: false })
        .eq('user_id', signInData.user.id)
        .eq('is_active', true),
      supabase
        .from('videos')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', signInData.user.id)
    ]);

    if (appsResult.error) {
      console.error('❌ Error accessing user_app_access:', appsResult.error);
    } else {
      console.log(`✅ User can access user_app_access (${appsResult.data?.length || 0} records)`);
    }

    if (videosResult.error) {
      console.error('❌ Error accessing videos:', videosResult.error);
    } else {
      console.log(`✅ User can access videos (${videosResult.data?.length || 0} records)`);
    }

    // Simulate useUserAccess hook
    console.log('\n3. Testing user access resolution...');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/resolve-user-access`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ User can access resolve-user-access function');
          console.log(`   Has access: ${data.data.hasAccess}, Apps: ${data.data.apps.length}`);
        } else {
          console.log('⚠️  resolve-user-access returned success=false');
        }
      } else {
        console.error('❌ Error accessing resolve-user-access:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Network error accessing resolve-user-access:', error);
    }

    // Test session persistence over time
    console.log('\n4. Testing session persistence...');
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (sessionCheck.session) {
        console.log(`✅ Session persists after ${i} seconds`);
      } else {
        console.error(`❌ Session lost after ${i} seconds`);
        break;
      }
    }

    // Test that user can access protected routes (simulated)
    console.log('\n5. Testing protected route access simulation...');
    const { data: userCheck } = await supabase.auth.getUser();
    if (userCheck.user) {
      console.log('✅ User authentication verified for protected routes');
    } else {
      console.error('❌ User authentication failed');
    }

    // Cleanup
    await supabase.auth.signOut();
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardAccess();