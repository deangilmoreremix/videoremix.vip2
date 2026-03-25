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
    if (!user) {
      console.log(`User ${email} not found`);
      continue;
    }

    console.log(`\n=== ${email} (ID: ${user.id}) ===`);
    
    // Get app access with purchase details
    const { data: appAccess, error: appError } = await supabase
      .from('user_app_access')
      .select('app_slug, access_type, is_active, expires_at, purchases!inner(product_name, amount, status, purchase_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (appError) {
      console.log(`Error fetching app access: ${appError.message}`);
      continue;
    }

    if (appAccess.length === 0) {
      console.log('No app access records found.');
      continue;
    }

    console.log(`Found ${appAccess.length} app access records:`);
    appAccess.forEach((grant, index) => {
      const purchase = grant.purchases;
      console.log(`  ${index + 1}. App: ${grant.app_slug}`);
      console.log(`     Type: ${grant.access_type}`);
      console.log(`     Status: ${grant.is_active ? 'Active' : 'Expired'}`);
      if (grant.expires_at) {
        console.log(`     Expires: ${grant.expires_at}`);
      }
      console.log(`     Based on purchase: ${purchase.product_name} ($${purchase.amount}) on ${purchase.purchase_date}`);
      console.log(`     Purchase status: ${purchase.status}`);
      console.log('');
    });
  }
}

main().catch(console.error);