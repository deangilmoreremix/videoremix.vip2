#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🚀 Starting app access grant process...\n');

  // Check if tables exist
  const { error: checkError } = await supabase.from('user_app_access').select('id').limit(1);
  if (checkError) {
    console.error('❌ Error: user_app_access table does not exist!');
    console.error('   Please apply migrations first.');
    process.exit(1);
  }

  // Get all completed purchases
  console.log('📖 Fetching purchases...');
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('*')
    .eq('status', 'completed')
    .not('user_id', 'is', null)
    .not('product_id', 'is', null);

  if (purchasesError) {
    console.error('❌ Error fetching purchases:', purchasesError.message);
    process.exit(1);
  }

  console.log(`   Found ${purchases.length} completed purchases\n`);

  // Get all products with their granted apps
  console.log('📖 Fetching products...');
  const { data: products, error: productsError } = await supabase
    .from('products_catalog')
    .select('id, name, product_type, apps_granted');

  if (productsError) {
    console.error('❌ Error fetching products:', productsError.message);
    process.exit(1);
  }

  console.log(`   Found ${products.length} products\n`);

  // Create product map
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });

  // Group purchases by user and product
  const userPurchases = {};

  purchases.forEach(p => {
    const key = `${p.user_id}:${p.product_id}`;
    if (!userPurchases[key]) {
      userPurchases[key] = {
        user_id: p.user_id,
        product_id: p.product_id,
        is_subscription: p.is_subscription,
        purchases: []
      };
    }
    userPurchases[key].purchases.push(p);
  });

  console.log('🔐 Granting app access...\n');

  let granted = 0;
  let updated = 0;
  let errors = 0;

  for (const key in userPurchases) {
    const { user_id, product_id, is_subscription, purchases: userPurchaseList } = userPurchases[key];
    const product = productMap[product_id];

    if (!product) {
      console.log(`   ⚠️  Product not found: ${product_id}`);
      continue;
    }

    // Get apps granted by this product
    const appsGranted = product.apps_granted || [];

    if (!Array.isArray(appsGranted) || appsGranted.length === 0) {
      console.log(`   ⚠️  Product has no apps: ${product.name}`);
      continue;
    }

    // Find most recent purchase
    const sortedPurchases = userPurchaseList.sort((a, b) =>
      new Date(b.purchase_date) - new Date(a.purchase_date)
    );
    const lastPurchase = sortedPurchases[0];

    // Calculate expiration for subscriptions
    let expiresAt = null;
    let isActive = true;

    if (is_subscription) {
      const lastDate = new Date(lastPurchase.purchase_date);
      expiresAt = new Date(lastDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      // Check if expired
      isActive = expiresAt > new Date();
    }

    // Grant access for each app
    for (const appSlug of appsGranted) {
      const accessRecord = {
        user_id,
        app_slug: appSlug,
        purchase_id: lastPurchase.id,
        access_type: is_subscription ? 'subscription' : 'lifetime',
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        is_active: isActive
      };

      // Try insert
      const { error } = await supabase
        .from('user_app_access')
        .insert(accessRecord);

      if (error) {
        if (error.code === '23505') {
          // Duplicate - update instead
          const { error: updateError } = await supabase
            .from('user_app_access')
            .update({
              purchase_id: lastPurchase.id,
              access_type: accessRecord.access_type,
              expires_at: accessRecord.expires_at,
              is_active: accessRecord.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id)
            .eq('app_slug', appSlug);

          if (updateError) {
            console.log(`   ❌ Error updating access: ${updateError.message}`);
            errors++;
          } else {
            updated++;
          }
        } else {
          console.log(`   ❌ Error granting access: ${error.message}`);
          errors++;
        }
      } else {
        granted++;
      }
    }

    if ((granted + updated) % 20 === 0) {
      console.log(`   ✅ Processed ${granted + updated} access grants...`);
    }
  }

  console.log('\n📊 Access Grant Summary:');
  console.log(`   ✅ Granted: ${granted}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Show breakdown by access type
  const { data: breakdown } = await supabase
    .from('user_app_access')
    .select('access_type, is_active');

  if (breakdown) {
    const lifetime = breakdown.filter(a => a.access_type === 'lifetime').length;
    const subscription = breakdown.filter(a => a.access_type === 'subscription').length;
    const active = breakdown.filter(a => a.is_active).length;
    const expired = breakdown.filter(a => !a.is_active).length;

    console.log('\n📈 Access Breakdown:');
    console.log(`   Lifetime: ${lifetime}`);
    console.log(`   Subscription: ${subscription}`);
    console.log(`   Active: ${active}`);
    console.log(`   Expired: ${expired}`);
  }

  // Show users with access
  const { data: userAccess } = await supabase
    .from('user_app_access')
    .select('user_id')
    .eq('is_active', true);

  if (userAccess) {
    const uniqueUsers = new Set(userAccess.map(a => a.user_id)).size;
    console.log(`   Users with active access: ${uniqueUsers}`);
  }

  console.log('\n✨ Access grant complete!\n');
  console.log('Next step:');
  console.log('   Run: node setup-subscriptions.mjs\n');
}

main().catch(console.error);
