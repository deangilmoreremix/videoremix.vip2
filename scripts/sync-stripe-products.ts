/**
 * Sync Apps to Stripe Products
 * 
 * This script syncs all VideoRemix apps from the database to Stripe as Products.
 * Each app gets a corresponding Stripe Product with lifetime pricing.
 * 
 * Usage: npx tsx scripts/sync-stripe-products.ts [--dry-run]
 * 
 * Environment:
 *   - STRIPE_SECRET_KEY: Required
 *   - SUPABASE_URL: Required (or will use linked project)
 *   - SUPABASE_SERVICE_ROLE_KEY: Required (or will use linked project)
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is required');
  console.error('Set it with: export STRIPE_SECRET_KEY="sk_test_..."');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-10-15',
});

// Use Supabase URL from environment or linked project
const supabaseUrl = process.env.SUPABASE_URL || 'https://bzxohkrxcwodllketcpz.supabase.co';

// Service role key is required for admin access
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('Get it from: https://supabase.com/dashboard/project/bzxohkrxcwodllketcpz/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dryRun = process.argv.includes('--dry-run');

async function syncAppsToStripe() {
  console.log('Fetching apps from database...\n');
  
  const { data: dbApps, error: dbError } = await supabase
    .from('apps')
    .select('slug, name, description, category, price, is_active, stripe_product_id, stripe_price_id')
    .eq('is_active', true);

  if (dbError) {
    throw new Error(`Failed to fetch apps: ${dbError.message}`);
  }

  console.log(`Found ${dbApps.length} active apps in database\n`);

  const results: { slug: string; product_id?: string; price_id?: string; error?: string }[] = [];

  for (const app of dbApps) {
    try {
      const price = app.price || 97;
      console.log(`Processing: ${app.name} (${app.slug}) - $${price}`);
      
      if (dryRun) {
        console.log(`  [DRY RUN] Would create product for ${app.name}`);
        results.push({ slug: app.slug, product_id: 'dry-run', price_id: 'dry-run' });
        continue;
      }

      const existingProducts = await stripe.products.search({
        query: `metadata['app_slug']:"${app.slug}"`,
      });

      let productId: string;
      let priceId: string | undefined;

      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;
        console.log(`  Updating existing product: ${productId}`);
        
        await stripe.products.update(productId, {
          name: app.name,
          description: app.description,
          metadata: {
            app_slug: app.slug,
            category: app.category || '',
            price: price.toString(),
          },
        });
        
        const existingPrices = await stripe.prices.search({
          query: `product:"${productId}"`,
        });
        
        if (existingPrices.data.length > 0) {
          priceId = existingPrices.data[0].id;
        } else {
          const priceObj = await stripe.prices.create({
            product: productId,
            currency: 'usd',
            unit_amount: Math.round(price * 100),
          });
          priceId = priceObj.id;
          console.log(`  Created price: ${priceId}`);
        }
      } else {
        const product = await stripe.products.create({
        name: app.name,
        description: app.description,
        metadata: {
          app_slug: app.slug,
          category: app.category || '',
          price: price.toString(),
        },
      });
      productId = product.id;
      
      const priceObj = await stripe.prices.create({
        product: productId,
        currency: 'usd',
        unit_amount: Math.round(price * 100),
      });
      priceId = priceObj.id;
      console.log(`  Created new product: ${productId}`);
      console.log(`  Created price: ${priceId}`);
      }

if (!priceId) {
        throw new Error('Failed to get or create price for ' + app.name);
      }

      await supabase
        .from('apps')
        .update({ 
          stripe_product_id: productId,
          stripe_price_id: priceId 
        })
        .eq('slug', app.slug);

      console.log(`  Product ID: ${productId}`);
      console.log(`  Price ID: ${priceId}`);
      
      results.push({ slug: app.slug, product_id: productId, price_id: priceId });

    } catch (error: any) {
      console.error(`  Error processing ${app.slug}: ${error.message}`);
      results.push({ slug: app.slug, error: error.message });
    }
  }

  console.log('\n\n=== Summary ===');
  console.log(`Total apps processed: ${dbApps.length}`);
  console.log(`Successful: ${results.filter(r => !r.error).length}`);
  console.log(`Failed: ${results.filter(r => r.error).length}`);

  if (results.some(r => r.error)) {
    console.log('\nFailed apps:');
    results.filter(r => r.error).forEach(r => {
      console.log(`  - ${r.slug}: ${r.error}`);
    });
  }

  return results;
}

syncAppsToStripe()
  .then(() => {
    console.log('\nSync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });