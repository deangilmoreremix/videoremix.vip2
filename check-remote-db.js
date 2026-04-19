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

async function checkRemoteDatabase() {
  console.log('🔍 Checking REMOTE Supabase database...\n');
  console.log(`   URL: ${process.env.VITE_SUPABASE_URL}`);

  // Check auth.users count on REMOTE
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log(`👤 Auth users in REMOTE database: ${authUsers.users.length}`);
    console.log(`📧 Sample users:`);
    authUsers.users.slice(0, 10).forEach(user => {
      console.log(`   - ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
    });
    if (authUsers.users.length > 10) {
      console.log(`   ... and ${authUsers.users.length - 10} more`);
    }
  }

  // Check profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email', { count: 'exact' });

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
  } else {
    console.log(`\n👥 Profiles in REMOTE database: ${profiles.length}`);
  }

  // Test login with one of our imported users
  console.log('\n🔐 Testing login with "VideoRemix2026" password...');
  const testEmails = [
    'harveydenv@gmail.com',
    'hartmut-weidner@mail.de',
    'zhimtechsolutions@gmail.com'
  ];

  for (const email of testEmails) {
    try {
      const { data: user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'VideoRemix2026'
      });

      if (error) {
        console.log(`❌ ${email}: ${error.message}`);
      } else {
        console.log(`✅ ${email}: Login successful!`);
      }
    } catch (err) {
      console.log(`❌ ${email}: Exception - ${err.message}`);
    }
  }
}

checkRemoteDatabase().catch(console.error);