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

  // Check via auth admin API
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  // data is an object with a users array? Let's see.
  console.log('Response from listUsers:', JSON.stringify(data, null, 2));
  // Actually, the response is { users: Array, ... }? Let's assume data.users is the array.
  const usersArray = data.users || [];
  console.log(`Total users in auth.users: ${usersArray.length}`);

  for (const email of targetEmails) {
    const user = usersArray.find(u => u.email === email);
    if (user) {
      console.log(`Found in auth.users: ${email}`);
      console.log(user);
    } else {
      console.log(`Not found in auth.users: ${email}`);
    }
  }
}

main().catch(console.error);