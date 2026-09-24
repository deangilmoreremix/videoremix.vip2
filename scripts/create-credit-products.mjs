/**
 * Stripe Credit Products Creator
 *
 * Creates the 4 credit products in Stripe with one-time prices.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/create-credit-products.mjs
 *
 * Outputs Stripe Price IDs that should be added to .env:
 *   STRIPE_PRICE_ID_STARTER=price_...
 *   STRIPE_PRICE_ID_PRO=price_...
 *   STRIPE_PRICE_ID_BUSINESS=price_...
 *   STRIPE_PRICE_ID_ENTERPRISE=price_...
 */

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  console.log('Usage: STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/create-credit-products.mjs');
  Deno.exit(1);
}

const PRODUCTS = [
  { name: 'Starter AI Credits', credits: 500_000, priceCents: 500, slug: 'starter' },
  { name: 'Pro AI Credits', credits: 2_500_000, priceCents: 2000, slug: 'pro' },
  { name: 'Business AI Credits', credits: 8_000_000, priceCents: 5000, slug: 'business' },
  { name: 'Enterprise AI Credits', credits: 35_000_000, priceCents: 20000, slug: 'enterprise' },
];

console.log('Creating Stripe credit products...\n');

const results = [];

for (const product of PRODUCTS) {
  try {
    const stripeProduct = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        name: product.name,
        description: `${product.credits.toLocaleString()} AI credits for VideoRemixVIP`,
        'metadata[credits_amount]': String(product.credits),
        'metadata[product_slug]': product.slug,
      }),
    });

    const stripeProductData = await stripeProduct.json();

    if (stripeProductData.error) {
      console.error(`Failed to create product "${product.name}":`, stripeProductData.error.message);
      continue;
    }

    const stripePrice = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product: stripeProductData.id,
        unit_amount: String(product.priceCents),
        currency: 'usd',
        type: 'one_time',
        'metadata[credits_amount]': String(product.credits),
        'metadata[product_slug]': product.slug,
      }),
    });

    const stripePriceData = await stripePrice.json();

    if (stripePriceData.error) {
      console.error(`Failed to create price for "${product.name}":`, stripePriceData.error.message);
      continue;
    }

    results.push({
      slug: product.slug,
      name: product.name,
      credits: product.credits,
      priceCents: product.priceCents,
      productId: stripeProductData.id,
      priceId: stripePriceData.id,
    });

    console.log(`✓ Created: ${product.name}`);
    console.log(`  Product ID: ${stripeProductData.id}`);
    console.log(`  Price ID:   ${stripePriceData.id}`);
    console.log(`  Price:      $${(product.priceCents / 100).toFixed(2)} for ${product.credits.toLocaleString()} credits`);
    console.log();
  } catch (error) {
    console.error(`Failed to create "${product.name}":`, error);
  }
}

if (results.length > 0) {
  console.log('Add these to your .env file:');
  console.log('');
  for (const result of results) {
    const envVar = `STRIPE_PRICE_ID_${result.slug.toUpperCase()}`;
    console.log(`${envVar}=${result.priceId}`);
  }
  console.log('');
  console.log('Summary:');
  for (const result of results) {
    console.log(`  ${result.slug}: ${result.priceId}`);
  }
} else {
  console.log('\nNo products were created.');
}
