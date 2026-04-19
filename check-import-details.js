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

async function checkImportRecords() {
  console.log('🔍 Checking import records status...\n');

  // Check import_user_records
  const { data: importRecords, error: importError } = await supabase
    .from('import_user_records')
    .select('processing_status, user_id, customer_email', { count: 'exact' })
    .limit(10);

  if (importError) {
    console.error('Error fetching import records:', importError);
  } else {
    console.log(`📋 Import records: ${importRecords.length}`);
    const statusCounts = {};
    importRecords.forEach(record => {
      statusCounts[record.processing_status] = (statusCounts[record.processing_status] || 0) + 1;
    });
    console.log('📊 Status breakdown:', statusCounts);
  }

  // Check how many users have both auth account and profile
  const { data: profilesWithAuth, error: authProfileError } = await supabase
    .from('profiles')
    .select('email', { count: 'exact' });

  if (authProfileError) {
    console.error('Error fetching profiles:', authProfileError);
  } else {
    console.log(`\n👤 Profiles with emails: ${profilesWithAuth.length}`);
  }

  // Check if users can login with the correct password
  console.log('\n🔐 Testing password for existing users...');

  // Test a few users that should exist
  const testEmails = [
    'harveydenv@gmail.com',
    'hartmut-weidner@mail.de',
    'bruce.chinn@icloud.com'
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
        console.log(`✅ ${email}: Login successful`);
      }
    } catch (err) {
      console.log(`❌ ${email}: Exception - ${err.message}`);
    }
  }

  console.log('\n✅ Import record check complete!');
}

checkImportRecords().catch(console.error);