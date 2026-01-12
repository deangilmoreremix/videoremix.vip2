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
  console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login for deanvideoremix.io@gmail.com...\n');

  const email = 'deanvideoremix.io@gmail.com';
  const password = 'VideoRemix2025';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('❌ Login failed!');
      console.error('Error:', error.message);
      process.exit(1);
    }

    if (data.user) {
      console.log('✅ Login successful!');
      console.log(`User ID: ${data.user.id}`);
      console.log(`Email: ${data.user.email}`);
      console.log(`Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    } else {
      console.error('❌ No user data returned');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testLogin();