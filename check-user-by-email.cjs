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

  for (const email of targetEmails) {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    if (error) {
      console.error(`Error fetching user for ${email}:`, error.message);
      // If the error is that the user is not found, we can try to create
      if (error.status === 404) {
        console.log(`User ${email} not found. We can create it.`);
      } else {
        console.log(`Unexpected error for ${email}:`, error);
      }
    } else {
      console.log(`User ${email} exists:`, data);
    }
  }
}

main().catch(console.error);