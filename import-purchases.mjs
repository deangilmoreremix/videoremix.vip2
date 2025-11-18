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

// Parse CSV function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Map product name to product ID
const productMappings = {
  'Personalizer AI Agency (Monthly)': 'personalizer-monthly',
  'Personalizer AI Agency (Subscription)': 'personalizer-monthly',
  'Personalizer AI Agency (Lifetime)': 'personalizer-lifetime',
  'FE Bundle': 'fe-bundle',
  'Master Reseller Package': 'master-reseller',
  'OTO2 - Creator\'s Advantage': 'oto2-creators',
  'OTO3 - Reseller Advantage': 'oto3-reseller',
  'Realtime Graphics Toolkit': 'realtime-graphics',
  'Social Video Toolkit': 'social-video'
};

async function main() {
  console.log('🚀 Starting purchase import from CSV...\n');

  // Check if tables exist
  const { error: checkError } = await supabase.from('purchases').select('id').limit(1);
  if (checkError) {
    console.error('❌ Error: purchases table does not exist!');
    console.error('   Please apply migrations first using Supabase Dashboard.');
    console.error('   See MANUAL_MIGRATION_GUIDE.md for instructions.\n');
    process.exit(1);
  }

  // Read CSV file
  console.log('📖 Reading CSV file...');
  const csvPath = join(__dirname, 'src/data/personalizer .csv');
  const csvText = readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`   Found ${rows.length} transactions\n`);

  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products_catalog')
    .select('id, name, slug');

  if (productsError || !products || products.length === 0) {
    console.error('❌ Error: No products found in products_catalog!');
    console.error('   Please apply migration 2 to populate products.');
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products in catalog\n`);

  // Create product map
  const productMap = {};
  products.forEach(p => {
    productMap[p.slug] = p.id;
    productMap[p.name] = p.id;
  });

  // Get all users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${users.users.length} users in database\n`);

  // Create user email map
  const userMap = {};
  users.users.forEach(u => {
    userMap[u.email.toLowerCase()] = u.id;
  });

  // Process each transaction
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  console.log('📦 Processing transactions...\n');

  for (const row of rows) {
    const email = row['CUSTOMER EMAIL']?.toLowerCase();
    const productName = row['PRODUCT NAME'];
    const transactionId = row['PAYPAL TXN ID'];
    const amount = parseFloat(row['AMOUNT']?.replace(/[^0-9.]/g, '') || '0');
    const dateStr = row['DATE'];
    const status = row['PAYMENT STATUS']?.toLowerCase();

    if (!email || !productName || !transactionId) {
      skipped++;
      continue;
    }

    // Find user
    const userId = userMap[email];
    if (!userId) {
      console.log(`   ⚠️  No user found for: ${email}`);
      skipped++;
      continue;
    }

    // Find product
    const productSlug = productMappings[productName];
    const productId = productSlug ? productMap[productSlug] : null;

    if (!productId) {
      console.log(`   ⚠️  No product mapping for: ${productName}`);
    }

    // Parse date
    let purchaseDate = new Date();
    try {
      const parts = dateStr.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)\s+(\d+):(\d+)\s+(AM|PM)/);
      if (parts) {
        const [, month, day, year, hour, minute, ampm] = parts;
        const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        let h = parseInt(hour);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        purchaseDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), h, parseInt(minute)));
      }
    } catch (e) {
      console.log(`   ⚠️  Could not parse date: ${dateStr}`);
    }

    // Determine if subscription
    const isSubscription = productName.includes('Monthly') || productName.includes('Subscription');

    // Get subscription ID (PayPal Preapproval Key)
    const subscriptionId = row['PAYPAL PREAPPROVAL KEY'] || null;

    // Insert purchase
    const purchase = {
      user_id: userId,
      email: email,
      platform: 'paypal',
      platform_transaction_id: transactionId,
      product_id: productId,
      product_name: productName,
      amount: amount,
      currency: 'USD',
      status: status === 'completed' ? 'completed' : status === 'refunded' ? 'refunded' : 'pending',
      is_subscription: isSubscription,
      subscription_id: subscriptionId,
      purchase_date: purchaseDate.toISOString(),
      webhook_data: row,
      processed: false
    };

    const { error } = await supabase.from('purchases').insert(purchase);

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        skipped++;
      } else {
        console.log(`   ❌ Error importing: ${transactionId} - ${error.message}`);
        errors++;
      }
    } else {
      imported++;
      if (imported % 10 === 0) {
        console.log(`   ✅ Imported ${imported} purchases...`);
      }
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  // Show breakdown
  const { data: breakdown } = await supabase.from('purchases').select('is_subscription, status').eq('platform', 'paypal');

  if (breakdown) {
    const subscriptions = breakdown.filter(p => p.is_subscription).length;
    const oneTime = breakdown.filter(p => !p.is_subscription).length;
    const completed = breakdown.filter(p => p.status === 'completed').length;
    const pending = breakdown.filter(p => p.status === 'pending').length;

    console.log('\n📈 Purchase Breakdown:');
    console.log(`   Subscriptions: ${subscriptions}`);
    console.log(`   One-time: ${oneTime}`);
    console.log(`   Completed: ${completed}`);
    console.log(`   Pending: ${pending}`);
  }

  console.log('\n✨ Import complete!\n');
  console.log('Next steps:');
  console.log('   1. Run: node grant-app-access.mjs');
  console.log('   2. Run: node setup-subscriptions.mjs\n');
}

main().catch(console.error);
