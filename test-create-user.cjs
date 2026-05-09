const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const testEmail = `test${Date.now()}@example.com`;
  console.log(`Creating test user: ${testEmail}`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TempPass123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User',
      first_name: 'Test',
      last_name: 'User'
    }
  });

  if (error) {
    console.error('Error creating test user:', error.message);
  } else {
    console.log('Test user created:', data.user.id);
    // Clean up: delete the test user
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('Test user deleted');
  }
}

main().catch(console.error);