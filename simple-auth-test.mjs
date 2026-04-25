import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAuth() {
  console.log('Testing basic auth...');

  // Check if we can connect
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.log('Connection error:', error.message);
  } else {
    console.log('Connection OK, session:', !!data.session);
  }

  console.log('Test complete');
}

testAuth();