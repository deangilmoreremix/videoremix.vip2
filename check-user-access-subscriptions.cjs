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
    console.log(`\n=== Checking ${email} ===`);

    // Get user id
    const { data: users, error: userError } = await supabase
      .from('users') // Assuming there is a users table in public schema? Let's try auth via API first.
      .select('id')
      .eq('email', email);

    if (userError) {
      console.log(`Error fetching user via public.users: ${userError.message}`);
      // Fallback to auth API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      const user = authUsers.users.find(u => u.email === email);
      if (!user) {
        console.log(`User not found via auth API either.`);
        continue;
      }
      var userId = user.id;
    } else {
      if (users.length === 0) {
        console.log(`User not found in public.users.`);
        continue;
      }
      var userId = users[0].id;
    }

    console.log(`User ID: ${userId}`);

    // Check app access
    const { data: appAccess, error: appError } = await supabase
      .from('user_app_access')
      .select('*')
      .eq('user_id', userId);

    if (appError) {
      console.log(`Error fetching app access: ${appError.message}`);
    } else {
      console.log(`App access records: ${appAccess.length}`);
      if (appAccess.length > 0) {
        console.log(`  First record:`, appAccess[0]);
      }
    }

    // Check subscription access
    const { data: subAccess, error: subError } = await supabase
      .from('user_subscription_access')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.log(`Error fetching subscription access: ${subError.message}`);
    } else {
      console.log(`Subscription access records: ${subAccess.length}`);
      if (subAccess.length > 0) {
        console.log(`  First record:`, subAccess[0]);
      }
    }

    // Check purchases count
    const { data: purchases, error: purError } = await supabase
      .from('purchases')
      .select('id, product_name, status, is_subscription')
      .eq('email', email);

    if (purError) {
      console.log(`Error fetching purchases: ${purError.message}`);
    } else {
      console.log(`Purchase records: ${purchases.length}`);
    }
  }
}

main().catch(console.error);