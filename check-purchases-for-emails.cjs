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
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error(`Error checking purchases for ${email}:`, error.message);
    } else {
      console.log(`Purchases for ${email}: ${data.length} rows`);
      if (data.length > 0) {
        console.log('  First purchase:', data[0]);
      }
    }
  }
}

main().catch(console.error);