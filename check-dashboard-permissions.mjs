import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserDashboardPermissions() {
  console.log('🔍 Checking user dashboard permissions for thebiz4u@aol.com\n');

  try {
    // Get user info
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', 'thebiz4u@aol.com')
      .single();

    if (!profile) {
      console.log('❌ User profile not found');
      return;
    }

    console.log('✅ User found:', profile.user_id);

    // Check if user has dashboard preferences
    const { data: prefs, error: prefsError } = await adminClient
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', profile.user_id);

    console.log('📊 Dashboard preferences:', prefs);
    if (prefsError) {
      console.log('❌ Preferences error:', prefsError);
    }

    // Test RLS policies with anon client (simulating user access)
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    // Sign in user
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: 'thebiz4u@aol.com',
      password: 'VideoRemix2026'
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError);
      return;
    }

    console.log('✅ User signed in, testing permissions...');

    // Test reading preferences
    const { data: readPrefs, error: readError } = await anonClient
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', signInData.user.id);

    console.log('📖 Read preferences result:', { data: readPrefs, error: readError });

    // Test inserting preferences
    const { data: insertPrefs, error: insertError } = await anonClient
      .from('user_dashboard_preferences')
      .insert({
        user_id: signInData.user.id,
        theme: 'dark',
        layout_density: 'comfortable'
      })
      .select();

    console.log('📝 Insert preferences result:', { data: insertPrefs, error: insertError });

    // Clean up
    await anonClient.auth.signOut();

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserDashboardPermissions();