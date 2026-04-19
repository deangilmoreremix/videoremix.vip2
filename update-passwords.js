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

async function updateAllPasswords() {
  console.log('🔐 Updating passwords for all auth users to "VideoRemix2026"...\n');

  // Get all auth users
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000 // Get all users
  });

  if (listError) {
    console.error('Error fetching auth users:', listError);
    return;
  }

  console.log(`Found ${authUsers.users.length} auth users to update`);

  let updated = 0;
  let errors = 0;

  for (const user of authUsers.users) {
    try {
      // Update password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'VideoRemix2026'
      });

      if (updateError) {
        console.error(`❌ Failed to update password for ${user.email}:`, updateError.message);
        errors++;
      } else {
        console.log(`✅ Updated password for ${user.email}`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Exception updating ${user.email}:`, err.message);
      errors++;
    }
  }

  console.log(`\n📊 Password Update Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${authUsers.users.length}`);

  if (errors === 0) {
    console.log('\n🎉 All passwords successfully updated to "VideoRemix2026"!');
  } else {
    console.log(`\n⚠️  ${errors} passwords failed to update`);
  }

  // Test login with one user
  console.log('\n🔍 Testing login with updated password...');
  const testEmail = authUsers.users[0]?.email;
  if (testEmail) {
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'VideoRemix2026'
      });

      if (loginError) {
        console.log(`❌ Test login failed for ${testEmail}: ${loginError.message}`);
      } else {
        console.log(`✅ Test login successful for ${testEmail}`);
      }
    } catch (err) {
      console.log(`❌ Test login exception: ${err.message}`);
    }
  }
}

updateAllPasswords().catch(console.error);