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
  console.log('\nAll user emails:');
  users.forEach(u => {
    console.log(u.email);
  });
}

main().catch(console.error);