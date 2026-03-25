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
  console.log(`Total users in system: ${users.length}\n`);

  // Get all app access grants with user and purchase details
  const { data: allGrants, error: grantsError } = await supabase
    .from('user_app_access')
    .select(`
      user_id,
      app_slug,
      access_type,
      is_active,
      expires_at,
      purchases!inner (
        user_id,
        email,
        product_name,
        amount,
        status,
        purchase_date
      )
    `)
    .order('created_at', { ascending: false });

  if (grantsError) {
    console.error('Error fetching grants:', grantsError.message);
    return;
  }

  console.log(`Total app access grants in system: ${allGrants.length}\n`);

  // Group by user
  const grantsByUser = {};
  allGrants.forEach(grant => {
    const userEmail = grant.purchases.email.toLowerCase();
    if (!grantsByUser[userEmail]) {
      grantsByUser[userEmail] = [];
    }
    grantsByUser[userEmail].push(grant);
  });

  console.log(`Users with app access grants: ${Object.keys(grantsByUser).length}\n`);

  // Show top 10 users with most grants
  const sortedUsers = Object.entries(grantsByUser)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);

  console.log('Top 10 users with most app access grants:');
  sortedUsers.forEach(([email, grants], index) => {
    const activeGrants = grants.filter(g => g.is_active).length;
    console.log(`  ${index + 1}. ${email}: ${grants.length} total grants (${activeGrants} active)`);
    
    // Show sample grants
    if (grants.length > 0) {
      const sample = grants[0];
      console.log(`      Sample: ${sample.app_slug} (${sample.access_type}) - ${sample.purchases.product_name}`);
    }
  });

  // Check if there are users with purchases but no grants
  const { data: allPurchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('user_id, email')
    .not('user_id', 'is', null);

  if (purchasesError) {
    console.error('Error fetching purchases:', purchasesError.message);
    return;
  }

  const purchaseEmails = new Set(allPurchases.map(p => p.email.toLowerCase()));
  const grantEmails = new Set(Object.keys(grantsByUser));
  
  const usersWithPurchasesButNoGrants = [...purchaseEmails].filter(email => !grantEmails.has(email));
  
  console.log(`\nUsers with purchases but NO app access grants: ${usersWithPurchasesButNoGrants.length}`);
  if (usersWithPurchasesButNoGrants.length > 0) {
    console.log('First 5:', usersWithPurchasesButNoGrants.slice(0, 5));
  }

  // Check if there are users with grants but no purchases (shouldn't happen)
  const usersWithGrantsButNoPurchases = [...grantEmails].filter(email => !purchaseEmails.has(email));
  
  console.log(`\nUsers with grants but NO purchases: ${usersWithGrantsButNoPurchases.length}`);
  if (usersWithGrantsButNoPurchases.length > 0) {
    console.log('First 5:', usersWithGrantsButNoPurchases.slice(0, 5));
  }
}

main().catch(console.error);