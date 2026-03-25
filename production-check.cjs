const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Starting production readiness check...\n');

  // 1. Check that the three target users exist
  const targetEmails = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com',
    'ejo1ed@gmail.com'
  ];

  // Fetch all users with pagination
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50
    });
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }
    const users = data.users || [];
    allUsers = allUsers.concat(users);
    hasMore = data.nextPage !== null && data.nextPage !== undefined;
    page++;
  }

  const userMap = {};
  allUsers.forEach(u => {
    userMap[u.email.toLowerCase()] = u.id;
  });

  console.log(`✅ Found ${allUsers.length} total users in the system.`);

  for (const email of targetEmails) {
    const userId = userMap[email.toLowerCase()];
    if (userId) {
      console.log(`✅ User ${email} exists (ID: ${userId})`);
    } else {
      console.log(`❌ User ${email} NOT FOUND`);
    }
  }
  console.log('');

  // 2. Check purchases for each target user
  console.log('📦 Checking purchases...');
  for (const email of targetEmails) {
    const { data: purchases, error: purError } = await supabase
      .from('purchases')
      .select('id, product_name, status, is_subscription, amount, purchase_date')
      .eq('email', email)
      .order('purchase_date', { ascending: false });

    if (purError) {
      console.error(`❌ Error fetching purchases for ${email}:`, purError.message);
    } else {
      console.log(`✅ User ${email} has ${purchases.length} purchases:`);
      purchases.forEach(p => {
        console.log(`   - ${p.product_name} ($${p.amount}) - ${p.status} ${p.is_subscription ? '(subscription)' : ''} on ${p.purchase_date}`);
      });
    }
  }
  console.log('');

  // 3. Check app access for each target user
  console.log('🔐 Checking app access...');
  for (const email of targetEmails) {
    const userId = userMap[email.toLowerCase()];
    if (!userId) {
      console.log(`❌ Skipping app access check for ${email} (user not found)`);
      continue;
    }
    const { data: appAccess, error: appError } = await supabase
      .from('user_app_access')
      .select('*')
      .eq('user_id', userId);

    if (appError) {
      console.error(`❌ Error fetching app access for ${email}:`, appError.message);
    } else {
      console.log(`✅ User ${email} has ${appAccess.length} app access records:`);
      appAccess.forEach(a => {
        console.log(`   - App ID: ${a.app_id}, Access Granted: ${a.access_granted}, Expires at: ${a.expires_at}`);
      });
    }
  }
  console.log('');

  // 4. Check subscription access for each target user
  console.log('💳 Checking subscription access...');
  for (const email of targetEmails) {
    const userId = userMap[email.toLowerCase()];
    if (!userId) {
      console.log(`❌ Skipping subscription access check for ${email} (user not found)`);
      continue;
    }
    const { data: subAccess, error: subError } = await supabase
      .from('user_subscription_access')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error(`❌ Error fetching subscription access for ${email}:`, subError.message);
    } else {
      console.log(`✅ User ${email} has ${subAccess.length} subscription access records:`);
      subAccess.forEach(s => {
        console.log(`   - Product ID: ${s.product_id}, Status: ${s.status}, Expires at: ${s.expires_at}`);
      });
    }
  }
  console.log('');

  // 5. Check that essential tables exist
  console.log('🗃️  Checking essential tables...');
  const tablesToCheck = [
    'purchases',
    'user_app_access',
    'user_subscription_access',
    'products_catalog',
    'admin_apps', // from the functions list we saw
    'admin_subscriptions'
  ];

  for (const tableName of tablesToCheck) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      // If the error is that the relation does not exist, we can note that.
      if (error.message && error.message.includes('could not find relation')) {
        console.log(`❌ Table ${tableName} does not exist or is not accessible.`);
      } else {
        console.log(`⚠️  Error checking table ${tableName}: ${error.message}`);
      }
    } else {
      console.log(`✅ Table ${tableName} exists and is accessible (sample row count: ${data.length >= 1 ? '>=1' : 0})`);
    }
  }
  console.log('');

  // 6. Check that the migration for multitenant architecture is applied (by checking for tenant_id in purchases)
  console.log('🏗️  Checking multitenant architecture...');
  const { data: purchaseSample, error: purSampleError } = await supabase
    .from('purchases')
    .select('tenant_id')
    .limit(1);

  if (purSampleError) {
    console.error(`❌ Error checking tenant_id in purchases:`, purSampleError.message);
  } else if (purchaseSample.length === 0) {
    console.log(`⚠️  No purchases found to check for tenant_id.`);
  } else {
    const sample = purchaseSample[0];
    if (sample && sample.tenant_id) {
      console.log(`✅ Purchases table has tenant_id column (sample value: ${sample.tenant_id})`);
    } else {
      console.log(`❌ Purchases table missing tenant_id value in sample row.`);
    }
  }
  console.log('');

  console.log('✅ Production readiness check complete.');
}

main().catch(console.error);