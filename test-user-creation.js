import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function testUserCreation() {
  console.log('🧪 Testing user creation on REMOTE Supabase...\n');

  // Test with a clearly NEW email that shouldn't exist
  const testEmail = `test.new.user.${Date.now()}@example.com`;

  console.log(`Trying to create user: ${testEmail}`);

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'VideoRemix2026',
    email_confirm: true,
    user_metadata: { test: true }
  });

  if (createError) {
    console.log(`❌ Create error: ${createError.message}`);
    console.log(`   Code: ${createError.code}`);
    console.log(`   Status: ${createError.status}`);
  } else {
    console.log(`✅ User created successfully!`);
    console.log(`   User ID: ${newUser.user.id}`);
  }

  // Now test with an email that DOES exist
  console.log('\n---\nTesting with existing email: bruce.chinn@icloud.com');

  const { data: existingUser, error: existingError } = await supabase.auth.admin.createUser({
    email: 'bruce.chinn@icloud.com',
    password: 'VideoRemix2026',
    email_confirm: true,
    user_metadata: { test: true }
  });

  if (existingError) {
    console.log(`❌ Create error: ${existingError.message}`);
    console.log(`   Code: ${existingError.code}`);
    console.log(`   Status: ${existingError.status}`);
  } else {
    console.log(`✅ User created (shouldn't happen for existing email)`);
  }
}

testUserCreation().catch(console.error);