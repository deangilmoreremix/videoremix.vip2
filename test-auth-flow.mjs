import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window?.localStorage || {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    storageKey: "videoremix-auth",
    flowType: "pkce",
  },
});

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow\n');

  // Test 1: Check current session
  console.log('1. Checking current session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.log('   ❌ Session error:', sessionError.message);
  } else if (session) {
    console.log('   ✅ Active session found:', {
      userId: session.user.id,
      email: session.user.email,
      expires: new Date(session.expires_at * 1000).toISOString()
    });
  } else {
    console.log('   ℹ️  No active session');
  }

  // Test 2: Try to sign in with test credentials
  console.log('\n2. Attempting sign in...');
  const testEmail = 'test@example.com'; // Use a known test user or create one
  const testPassword = 'TestPass123!';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (error) {
    console.log('   ❌ Sign in failed:', error.message);
    console.log('   ℹ️  This might be expected if test user doesn\'t exist');

    // Try to create a test user
    console.log('\n3. Creating test user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Test User' },
        emailConfirm: false // Disable email confirmation for testing
      }
    });

    if (signupError) {
      console.log('   ❌ Signup failed:', signupError.message);
    } else {
      console.log('   ✅ Test user created:', signupData.user?.email);

      // Try sign in again
      console.log('\n4. Retrying sign in...');
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (retryError) {
        console.log('   ❌ Sign in still failed:', retryError.message);
      } else {
        console.log('   ✅ Sign in successful:', {
          userId: retryData.user?.id,
          email: retryData.user?.email
        });
      }
    }
  } else {
    console.log('   ✅ Sign in successful:', {
      userId: data.user?.id,
      email: data.user?.email
    });
  }

  // Test 3: Check session after operations
  console.log('\n5. Checking session after operations...');
  const { data: { session: finalSession } } = await supabase.auth.getSession();

  if (finalSession) {
    console.log('   ✅ Session established:', {
      userId: finalSession.user.id,
      expires: new Date(finalSession.expires_at * 1000).toISOString()
    });
  } else {
    console.log('   ❌ No session after sign in');
  }

  // Test 4: Test auth state listener (simulate what the frontend does)
  console.log('\n6. Testing auth state listener...');

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('   📡 Auth state change:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
    }
  );

  // Clean up
  setTimeout(() => {
    console.log('\n7. Cleaning up...');
    subscription?.unsubscribe();

    // Sign out if we have a session
    if (finalSession) {
      supabase.auth.signOut().then(() => {
        console.log('   ✅ Signed out');
      });
    }

    console.log('\n🏁 Test complete');
    process.exit(0);
  }, 2000);
}

testAuthFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});</content>
<parameter name="filePath">test-auth-flow.mjs