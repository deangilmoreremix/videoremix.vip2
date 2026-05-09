const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  console.log(`Total users: ${users.length}`);

  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  // Normalize target emails
  const normalizedTargets = targetEmails.map(email => email.trim().toLowerCase());

  // Check each user
  const foundUsers = [];
  users.forEach(user => {
    const normalizedEmail = user.email.trim().toLowerCase();
    if (normalizedTargets.includes(normalizedEmail)) {
      foundUsers.push({ user, normalizedEmail });
    }
  });

  if (foundUsers.length > 0) {
    console.log('\nFound matching users:');
    foundUsers.forEach(({ user, normalizedEmail }) => {
      console.log(`  Email: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created at: ${user.created_at}`);
      console.log('---');
    });
  } else {
    console.log('\nNo matching users found for:');
    targetEmails.forEach(email => {
      console.log(`  ${email}`);
    });
  }

  // Also, let's see if there are any users with similar email addresses (contains)
  console.log('\nSearching for users with similar email addresses (contains):');
  targetEmails.forEach(target => {
    const targetLower = target.trim().toLowerCase();
    const matches = users.filter(user => {
      const emailLower = user.email.trim().toLowerCase();
      return emailLower.includes(targetLower) || targetLower.includes(emailLower);
    });
    if (matches.length > 0) {
      console.log(`\nFor target "${target}":`);
      matches.forEach(m => {
        console.log(`  - ${m.email} (ID: ${m.id})`);
      });
    }
  });
}

main().catch(console.error);