import { createClient } from '@supabase/supabase-js';
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserAccess() {
  console.log('Testing user access for deanvideoremix.io@gmail.com...\n');

  const email = 'deanvideoremix.io@gmail.com';
  const password = 'VideoRemix2025';

  try {
    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      process.exit(1);
    }

    console.log('✅ Login successful');

    // Get session token
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      console.error('❌ No session token');
      process.exit(1);
    }

    // Test user access function
    console.log('Testing resolve-user-access function...');
    const response = await fetch(
      `${supabaseUrl}/functions/v1/resolve-user-access`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ User access function working!');
      console.log('Has access:', result.data.hasAccess);
      console.log('Apps count:', result.data.apps.length);
      console.log('Products count:', result.data.products.length);
    } else {
      console.error('❌ User access function failed:', result.error);
      process.exit(1);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testUserAccess();