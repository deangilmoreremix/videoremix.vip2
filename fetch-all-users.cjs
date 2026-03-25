const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchAllUsers() {
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50
    });
    if (error) {
      console.error('Error fetching users:', error.message);
      break;
    }
    const users = data.users || [];
    allUsers = allUsers.concat(users);
    console.log(`Fetched page ${page}, got ${users.length} users, total so far: ${allUsers.length}`);
    hasMore = data.nextPage !== null && data.nextPage !== undefined;
    page++;
  }

  return allUsers;
}

async function main() {
  const users = await fetchAllUsers();
  console.log(`Total users fetched: ${users.length}`);

  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  for (const email of targetEmails) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      console.log(`Found: ${email} (ID: ${user.id})`);
    } else {
      console.log(`Not found: ${email}`);
    }
  }
}

main().catch(console.error);