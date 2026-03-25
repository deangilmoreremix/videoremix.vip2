const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try to query the auth.users table using the schema method
  const { data, error } = await supabase
    .schema('auth')
    .from('users')
    .select('id, email')
    .order('id');

  if (error) {
    console.error('Error querying auth.users:', error.message);
  } else {
    console.log(`Found ${data.length} users in auth.users via schema method`);
    console.log('First 5 users:', data.slice(0, 5));
    const targetEmails = [
      'larrylawrence1@gmail.com',
      'trcole3@theritegroup.com',
      'ejo1ed@gmail.com'
    ];
    for (const email of targetEmails) {
      const user = data.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log(`Found in auth.users: ${email}`);
      } else {
        console.log(`Not found in auth.users: ${email}`);
      }
    }
  }
}

main().catch(console.error);