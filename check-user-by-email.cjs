const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserByEmail(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({
    filters: { email: email }
  });

  if (error) {
    console.error(`Error fetching user ${email}:`, error.message);
    return null;
  }

  return users && users.length > 0 ? users[0] : null;
}

// Main function
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node check-user-by-email.cjs <email>');
    process.exit(1);
  }

  const user = await checkUserByEmail(email);
  if (user) {
    console.log(`User found: ${user.email} (ID: ${user.id})`);
    console.log('User metadata:', user.user_metadata);
  } else {
    console.log(`User not found: ${email}`);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});