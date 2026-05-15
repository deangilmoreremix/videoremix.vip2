/**
 * Sync Stripe Pricing Plans
 * 
 * This script creates/updates the 3-tier subscription pricing in Stripe:
 * - Free: $0
 * - Pro: $29/month / $290/year / $699 lifetime
 * - Business: $79/month / $790/year / $1999 lifetime
 * 
 * Usage: npx tsx scripts/sync-stripe-pricing.ts [--dry-run]
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dryRun = process.argv.includes('--dry-run');

const pricingPlans = [
  {
    name: 'Free',
    description: 'Perfect for trying out the platform',
    prices: [
      { interval: 'month', amount: 0, lookup_key: 'free-monthly' },
      { interval: 'year', amount: 0, lookup_key: 'free-yearly' },
    ],
  },
  {
    name: 'Pro',
    description: 'Ideal for content creators and small teams',
    prices: [
      { interval: 'month', amount: 2900, lookup_key: 'pro-monthly' },
      { interval: 'year', amount: 29000, lookup_key: 'pro-yearly' },
      { interval: 'lifetime', amount: 69900, lookup_key: 'pro-lifetime' },
    ],
  },
  {
    name: 'Business',
    description: 'For teams and professionals with advanced needs',
    prices: [
      { interval: 'month', amount: 7900, lookup_key: 'business-monthly' },
      { interval: 'year', amount: 79000, lookup_key: 'business-yearly' },
      { interval: 'lifetime', amount: 199900, lookup_key: 'business-lifetime' },
    ],
  },
];

async function syncPricingPlans() {
  console.log('Syncing pricing plans to Stripe...\n');

  for (const plan of pricingPlans) {
    console.log(`Processing: ${plan.name} plan`);

    // Create or retrieve the product
    const existingProducts = await stripe.products.search({
      query: `metadata['plan_name']:"${plan.name}"`,
    });

    let productId: string;

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
      console.log(`  Found existing product: ${productId}`);
    } else {
      if (dryRun) {
        console.log(`  [DRY RUN] Would create product: ${plan.name}`);
        continue;
      }
      const product = await stripe.products.create({
        name: `${plan.name} Plan`,
        description: plan.description,
        metadata: {
          plan_name: plan.name,
          plan_type: 'subscription',
        },
      });
      productId = product.id;
      console.log(`  Created product: ${productId}`);
    }

    // Create prices for each billing interval
    for (const priceConfig of plan.prices) {
      const { interval, amount, lookup_key } = priceConfig;
      const intervalStr = interval === 'lifetime' ? 'month' : interval;

      console.log(`  ${interval}: $${amount / 100}`);

      if (dryRun) {
        console.log(`    [DRY RUN] Would create price`);
        continue;
      }

      try {
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: amount,
          currency: 'usd',
          recurring: interval === 'lifetime' ? null : { interval: intervalStr },
          metadata: { lookup_key },
        });
        console.log(`    Price ID: ${price.id}`);
      } catch (error: any) {
        if (error.type === 'idempotency_error') {
          console.log(`    Price already exists`);
        } else {
          console.log(`    Error: ${error.message}`);
        }
      }
    }
  }

  console.log('\nPricing sync complete!');
}

syncPricingPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });