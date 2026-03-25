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

  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  console.log('Checking for containment (either way)...');
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
    } else {
      console.log(`\nNo containment matches for "${target}"`);
    }
  });

  // Also, let's check for exact match after trimming and lowercasing
  console.log('\n\nChecking for exact match (trimmed, lowercase):');
  targetEmails.forEach(target => {
    const targetNormalized = target.trim().toLowerCase();
    const match = users.find(user => user.email.trim().toLowerCase() === targetNormalized);
    if (match) {
      console.log(`\nExact match for "${target}":`);
      console.log(`  - ${match.email} (ID: ${match.id})`);
    } else {
      console.log(`\nNo exact match for "${target}"`);
    }
  });
}

main().catch(console.error);