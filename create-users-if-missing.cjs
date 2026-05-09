const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  // Normalize target emails
  const normalizedTargets = new Set(targetEmails.map(email => email.trim().toLowerCase()));

  // Fetch all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  console.log(`Total users in system: ${users.length}`);

  // Build a map of normalized email to user object
  const emailToUser = new Map();
  users.forEach(user => {
    const normalized = user.email.trim().toLowerCase();
    emailToUser.set(normalized, user);
  });

  let createdCount = 0;
  let existsCount = 0;
  let errorCount = 0;

  for (const email of targetEmails) {
    const normalized = email.trim().toLowerCase();
    if (emailToUser.has(normalized)) {
      console.log(`✅ User already exists: ${email}`);
      existsCount++;
    } else {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: email,
          password: 'TempPass123!',
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0], // Use the part before @ as placeholder
            first_name: email.split('@')[0],
            last_name: ''
          }
        });

        if (error) {
          console.error(`❌ Failed to create ${email}:`, error.message);
          errorCount++;
        } else {
          console.log(`🎉 Created user: ${email} (ID: ${data.user.id})`);
          createdCount++;
        }
      } catch (err) {
        console.error(`❌ Exception creating ${email}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Created: ${createdCount}`);
  console.log(`👤 Already existed: ${existsCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (createdCount > 0) {
    console.log('\nNext steps:');
    console.log('  1. Run: node import-purchases.mjs');
    console.log('  2. Run: node grant-app-access.mjs');
    console.log('  3. Run: node setup-subscriptions.mjs');
  }
}

main().catch(console.error);