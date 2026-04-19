import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAuthUsers() {
  console.log('🔍 Checking actual auth.users count...\n');

  // Check auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log(`👤 Auth users: ${authUsers.users.length}`);
    console.log(`📧 Sample auth users:`);
    authUsers.users.slice(0, 5).forEach(user => {
      console.log(`   - ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
    });
    if (authUsers.users.length > 5) {
      console.log(`   ... and ${authUsers.users.length - 5} more`);
    }
  }

  // Check profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name', { count: 'exact' });

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  } else {
    console.log(`\n👥 Profiles: ${profiles.length}`);
    console.log(`📧 Sample profiles:`);
    profiles.slice(0, 5).forEach(profile => {
      console.log(`   - ${profile.email}: ${profile.full_name || 'No name'}`);
    });
  }

  // Check if there are any users with the specific password
  const { data: testUser, error: testError } = await supabase.auth.signInWithPassword({
    email: 'harveydenv@gmail.com', // Test with one of our imported users
    password: 'VideoRemix2026'
  });

  if (testError) {
    console.log(`\n❌ Test login failed: ${testError.message}`);
  } else {
    console.log(`\n✅ Test login successful for harveydenv@gmail.com`);
  }

  console.log('\n✅ Auth user check complete!');
}

checkAuthUsers().catch(console.error);