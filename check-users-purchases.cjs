const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersPurchases() {
  // Get all users from auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`Total auth users: ${authUsers.users.length}`);
  
  // Get all purchases
  const { data: purchases, error: purchaseError } = await supabase
    .from('purchases')
    .select('id, user_id, email, product_id, product_name, platform, status, purchase_date')
    .order('purchase_date', { ascending: false });
    
  if (purchaseError) {
    console.error('Error fetching purchases:', purchaseError);
    return;
  }
  
  console.log(`Total purchases: ${purchases.length}`);
  
  // Group purchases by user email
  const purchasesByEmail = {};
  purchases.forEach(p => {
    if (!purchasesByEmail[p.email]) {
      purchasesByEmail[p.email] = [];
    }
    purchasesByEmail[p.email].push(p);
  });
  
  console.log(`Users with purchases: ${Object.keys(purchasesByEmail).length}`);
  
  // For each auth user, check if they have purchases
  let usersWithPurchases = 0;
  let usersWithoutPurchases = 0;
  
  authUsers.users.forEach(user => {
    const userPurchases = purchasesByEmail[user.email] || [];
    if (userPurchases.length > 0) {
      usersWithPurchases++;
      console.log(`User ${user.email} has ${userPurchases.length} purchases`);
      // Show first purchase as example
      if (userPurchases.length > 0) {
        const p = userPurchases[0];
        console.log(`  Example: ${p.product_name} (${p.status}) on ${p.purchase_date}`);
      }
    } else {
      usersWithoutPurchases++;
      // Only show first 10 users without purchases to avoid too much output
      if (usersWithoutPurchases <= 10) {
        console.log(`User ${user.email} has NO purchases`);
      }
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`Users with purchases: ${usersWithPurchases}`);
  console.log(`Users without purchases: ${usersWithoutPurchases}`);
}

checkUsersPurchases();