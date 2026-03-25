const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureUser(email) {
  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // First, try to find the user by email (case-insensitive)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(`Error listing users: ${listError.message}`);
    return null;
  }

  const existingUser = users.find(u => u.email.trim().toLowerCase() === normalizedEmail);
  if (existingUser) {
    console.log(`✅ User already exists: ${email} (ID: ${existingUser.id})`);
    return existingUser;
  }

  // If not found, try to create
  console.log(`🔧 Creating user: ${email}`);
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: 'TempPass123!', // Temporary password, should be changed on first login
    email_confirm: true,
    user_metadata: {
      full_name: email.split('@')[0], // Placeholder
      first_name: email.split('@')[0],
      last_name: ''
    }
  });

  if (error) {
    // If error is that user already exists, try to fetch again
    if (error.message && error.message.includes('already been registered')) {
      console.log(`⚠️  User ${email} already exists according to error, refetching...`);
      // Refetch users
      const { data: { users: users2 }, error: listError2 } = await supabase.auth.admin.listUsers();
      if (listError2) {
        console.error(`Error listing users: ${listError2.message}`);
        return null;
      }
      const existingUser2 = users2.find(u => u.email.trim().toLowerCase() === normalizedEmail);
      if (existingUser2) {
        console.log(`✅ Found user after error: ${email} (ID: ${existingUser2.id})`);
        return existingUser2;
      } else {
        console.error(`❌ Still not found after error for ${email}`);
        return null;
      }
    } else {
      console.error(`❌ Failed to create ${email}:`, error.message);
      return null;
    }
  }

  console.log(`🎉 Created user: ${email} (ID: ${data.user.id})`);
  return data.user;
}

async function main() {
  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  const users = {};
  for (const email of targetEmails) {
    const user = await ensureUser(email);
    if (user) {
      users[email] = user;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Summary ===');
  for (const email of targetEmails) {
    if (users[email]) {
      console.log(`✅ ${email}: ID = ${users[email].id}`);
    } else {
      console.log(`❌ ${email}: Failed to obtain user`);
    }
  }

  // Return the users object for potential use
  return users;
}

main().catch(console.error);