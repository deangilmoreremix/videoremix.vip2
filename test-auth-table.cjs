const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Try to query the auth.users table directly via SQL with schema
  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .order('id');

  if (error) {
    console.error('Error querying auth.users:', error.message);
  } else {
    console.log(`Found ${data.length} users in auth.users via REST API`);
    console.log(data);
  }
}

main().catch(console.error);