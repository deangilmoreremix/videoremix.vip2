const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get user by id
async function getUserById(userId) {
  const { data: { users }, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.error(`Error fetching user by id ${userId}:`, error.message);
    return null;
  }
  return users;
}

// Function to get product by id from products_catalog
async function getProductById(productId) {
  const { data: product, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching product by id ${productId}:`, error.message);
    return null;
  }

  return product;
}

// Function to grant app access to a user
async function grantAppAccess(userId, appSlug, purchaseId = null, accessType = 'lifetime') {
  // Get default tenant ID
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (tenantError) {
    console.error('Error fetching tenant ID:', tenantError.message);
    return { success: false, error: tenantError.message };
  }

  const tenantId = tenantData.id;

  // Check if access already exists
  const { data: existingAccess, error: checkError } = await supabase
    .from('user_app_access')
    .select('id')
    .eq('user_id', userId)
    .eq('app_slug', appSlug)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
    console.error(`Error checking existing access for user ${userId}, app ${appSlug}:`, checkError.message);
    return { success: false, error: checkError.message };
  }

  if (existingAccess) {
    console.log(`Access already exists for user ${userId} to app ${appSlug}`);
    return { success: true, exists: true };
  }

  // Create new access
  const { data, error } = await supabase
    .from('user_app_access')
    .insert({
      user_id: userId,
      app_slug: appSlug,
      purchase_id: purchaseId,
      access_type: accessType,
      is_active: true,
      tenant_id: tenantId
    })
    .select();

  if (error) {
    console.error(`Error granting access for user ${userId} to app ${appSlug}:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`Granted access to app ${appSlug} for user ${userId}`);
  return { success: true, access: data[0] };
}

// Main function
async function main() {
  console.log('Starting grant access from purchases...');

  // Get all completed purchases
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('id, user_id, email, product_id, product_name, status')
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching purchases:', error.message);
    return;
  }

  console.log(`Found ${purchases.length} completed purchase records`);

  // Group purchases by user_id
  const purchasesByUserId = {};
  purchases.forEach(purchase => {
    if (!purchasesByUserId[purchase.user_id]) {
      purchasesByUserId[purchase.user_id] = [];
    }
    purchasesByUserId[purchase.user_id].push(purchase);
  });

  console.log(`Found ${Object.keys(purchasesByUserId).length} unique users with purchases`);

  // Process each user
  const results = {
    usersProcessed: 0,
    purchasesProcessed: 0,
    accessGranted: 0,
    accessSkipped: 0,
    errors: []
  };

  for (const userId in purchasesByUserId) {
    const userPurchases = purchasesByUserId[userId];
    results.usersProcessed++;

    // Get user details (we can get from the first purchase's email or by id)
    const firstPurchase = userPurchases[0];
    let user = await getUserById(userId);
    if (!user) {
      // Try to get by email from purchase
      const { data: users, error } = await supabase.auth.admin.listUsers({
        filters: { email: firstPurchase.email }
      });
      if (error) {
        console.error(`Error fetching user by email ${firstPurchase.email}:`, error.message);
        results.errors.push(`Error fetching user by email ${firstPurchase.email}: ${error.message}`);
        continue;
      }
      user = users && users.length > 0 ? users[0] : null;
    }

    if (!user) {
      console.warn(`Could not find user for id ${userId} or email ${firstPurchase.email}`);
      results.errors.push(`Could not find user for id ${userId} or email ${firstPurchase.email}`);
      continue;
    }

    console.log(`\nProcessing user: ${user.email} (${user.id})`);

    // Process each purchase for this user
    for (const purchase of userPurchases) {
      results.purchasesProcessed++;

      // Get product details
      const product = await getProductById(purchase.product_id);
      if (!product) {
        console.warn(`Could not find product with id ${purchase.product_id} for purchase ${purchase.id}`);
        results.errors.push(`Could not find product with id ${purchase.product_id} for purchase ${purchase.id}`);
        continue;
      }

      console.log(`  Processing purchase: ${product.name} (id: ${product.id})`);

      // We found a product, now grant access to its apps
      if (!product.apps_granted || product.apps_granted.length === 0) {
        console.warn(`    Product ${product.name} has no apps_granted`);
        results.errors.push(`Product ${product.name} has no apps_granted`);
        continue;
      }

      // Grant access to each app in apps_granted
      for (const appSlug of product.apps_granted) {
        const grantResult = await grantAppAccess(user.id, appSlug, purchase.id);
        if (grantResult.success) {
          results.accessGranted++;
          if (!grantResult.exists) {
            // Newly granted access
          } else {
            results.accessSkipped++;
          }
        } else {
          results.errors.push(`Failed to grant access for ${user.email} to ${appSlug}: ${grantResult.error}`);
        }
      }
    }
  }

  // Print summary
  console.log('\n=== Processing Complete ===');
  console.log(`👤 Users processed: ${results.usersProcessed}`);
  console.log(`🛒 Purchases processed: ${results.purchasesProcessed}`);
  console.log(`🔐 Access grants: ${results.accessGranted}`);
  console.log(`⏭️  Access skipped (already existed): ${results.accessSkipped}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});