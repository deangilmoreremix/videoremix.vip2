#!/usr/bin/env node

/**
 * Grant Personalizer Access Script
 *
 * This script processes CSV import data and grants app access to all users who purchased
 * Personalizer products. It handles:
 * - Reading CSV files with purchase data
 * - Matching users by email to existing accounts
 * - Mapping products to apps based on product catalog
 * - Granting appropriate access levels
 * - Creating subscription records where applicable
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Normalize product names for consistent matching
function normalizeProductName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

// Extract product base name (remove subscription type info)
function extractProductBaseName(name) {
  return name
    .replace(/\(monthly\)/gi, '')
    .replace(/\(yearly\)/gi, '')
    .replace(/\(lifetime\)/gi, '')
    .trim();
}

// Determine access type from product name
function determineAccessType(productName) {
  const name = productName.toLowerCase();
  if (name.includes('monthly')) return 'subscription';
  if (name.includes('yearly')) return 'subscription';
  if (name.includes('lifetime')) return 'lifetime';
  return 'lifetime'; // Default to lifetime for one-time purchases
}

// Calculate expiration date for subscriptions
function calculateExpirationDate(purchaseDate, productName) {
  const name = productName.toLowerCase();
  const date = new Date(purchaseDate);

  if (name.includes('monthly')) {
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  }

  if (name.includes('yearly')) {
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  return null; // Lifetime access doesn't expire
}

// Parse CSV file and extract purchase records
function parseCSV(filePath) {
  console.log(`\n📄 Reading CSV file: ${filePath}`);
  const fileContent = readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`✅ Parsed ${records.length} records from CSV`);
  return records;
}

// Filter only Personalizer products
function filterPersonalizerRecords(records) {
  const personalizerRecords = records.filter(record => {
    const productName = record['PRODUCT NAME'] || record['product_name'] || '';
    return productName.toLowerCase().includes('personalizer');
  });

  console.log(`\n🎯 Found ${personalizerRecords.length} Personalizer purchases`);
  return personalizerRecords;
}

// Get unique products from records
function extractUniqueProducts(records) {
  const products = new Map();

  records.forEach(record => {
    const productName = record['PRODUCT NAME'] || record['product_name'] || '';
    const normalizedName = normalizeProductName(productName);

    if (!products.has(normalizedName)) {
      products.set(normalizedName, {
        originalName: productName,
        normalizedName,
        count: 0,
        emails: new Set(),
      });
    }

    const product = products.get(normalizedName);
    product.count++;

    const email = record['CUSTOMER EMAIL'] || record['customer_email'] || '';
    if (email) {
      product.emails.add(email.toLowerCase());
    }
  });

  return Array.from(products.values()).map(p => ({
    ...p,
    emails: Array.from(p.emails),
    uniqueUsers: p.emails.length,
  }));
}

// Get product catalog from database
async function getProductCatalog() {
  console.log('\n📦 Fetching product catalog...');

  const { data, error } = await supabase
    .from('products_catalog')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching product catalog:', error);
    return [];
  }

  console.log(`✅ Found ${data.length} active products in catalog`);
  return data;
}

// Match CSV product to catalog product
function matchProductToCatalog(csvProductName, catalog) {
  const normalized = normalizeProductName(csvProductName);
  const baseName = extractProductBaseName(csvProductName);

  // Try exact slug match first
  let match = catalog.find(p => normalized.includes(p.slug));
  if (match) return match;

  // Try name matching
  match = catalog.find(p => {
    const catalogNormalized = normalizeProductName(p.name);
    return normalized === catalogNormalized ||
           normalized.includes(catalogNormalized) ||
           catalogNormalized.includes(normalized);
  });

  if (match) return match;

  // Try base name matching
  const baseNormalized = normalizeProductName(baseName);
  match = catalog.find(p => {
    const catalogBase = normalizeProductName(extractProductBaseName(p.name));
    return baseNormalized === catalogBase;
  });

  return match;
}

// Find or create user by email
async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find user in auth.users via profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (profileData) {
    return profileData.user_id;
  }

  // Try to find directly in auth metadata (admin query)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (!usersError && users) {
    const user = users.find(u => u.email?.toLowerCase() === normalizedEmail);
    if (user) return user.id;
  }

  return null;
}

// Grant app access to user
async function grantAppAccess(userId, appSlugs, productName, purchaseId = null) {
  const accessType = determineAccessType(productName);
  const grantedAt = new Date().toISOString();
  const expiresAt = accessType === 'subscription' ? calculateExpirationDate(grantedAt, productName) : null;

  const accessRecords = appSlugs.map(appSlug => ({
    user_id: userId,
    app_slug: appSlug,
    purchase_id: purchaseId,
    access_type: accessType,
    granted_at: grantedAt,
    expires_at: expiresAt,
    is_active: true,
  }));

  // Use upsert to avoid duplicates
  const { data, error } = await supabase
    .from('user_app_access')
    .upsert(accessRecords, {
      onConflict: 'user_id,app_slug',
      ignoreDuplicates: false,
    })
    .select();

  return { data, error };
}

// Process a single purchase record
async function processPurchaseRecord(record, catalog, stats) {
  const email = (record['CUSTOMER EMAIL'] || record['customer_email'] || '').toLowerCase().trim();
  const productName = record['PRODUCT NAME'] || record['product_name'] || '';
  const customerName = record['CUSTOMER NAME'] || record['customer_name'] || '';
  const status = (record['PAYMENT STATUS'] || record['status'] || '').toLowerCase();

  if (!email || !productName) {
    stats.skipped++;
    return { success: false, reason: 'Missing email or product name' };
  }

  // Skip non-completed purchases
  if (status !== 'completed' && status !== '') {
    stats.skipped++;
    return { success: false, reason: `Skipped status: ${status}` };
  }

  // Find matching product in catalog
  const catalogProduct = matchProductToCatalog(productName, catalog);

  if (!catalogProduct) {
    stats.unmappedProducts++;
    return { success: false, reason: `No catalog match for: ${productName}` };
  }

  // Find user by email
  const userId = await findUserByEmail(email);

  if (!userId) {
    stats.userNotFound++;
    return { success: false, reason: `User not found: ${email}`, email, productName };
  }

  // Get apps granted by this product
  const appsGranted = catalogProduct.apps_granted || [];

  if (appsGranted.length === 0) {
    stats.skipped++;
    return { success: false, reason: `No apps granted by: ${productName}` };
  }

  // Grant access to all apps
  const { data, error } = await grantAppAccess(userId, appsGranted, productName);

  if (error) {
    stats.failed++;
    console.error(`❌ Error granting access for ${email}:`, error.message);
    return { success: false, reason: error.message, email, productName };
  }

  stats.success++;
  stats.appsGranted += appsGranted.length;

  return {
    success: true,
    email,
    productName,
    appsGranted: appsGranted.length,
    userId
  };
}

// Main processing function
async function processCSVAndGrantAccess(csvFilePath) {
  console.log('\n🚀 Starting Personalizer Access Grant Process\n');
  console.log('='.repeat(70));

  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    unmappedProducts: 0,
    userNotFound: 0,
    appsGranted: 0,
  };

  try {
    // Parse CSV
    const allRecords = parseCSV(csvFilePath);
    const personalizerRecords = filterPersonalizerRecords(allRecords);

    stats.total = personalizerRecords.length;

    // Extract unique products
    const uniqueProducts = extractUniqueProducts(personalizerRecords);
    console.log('\n📊 Unique Personalizer Products Found:');
    uniqueProducts.forEach(p => {
      console.log(`  • ${p.originalName}`);
      console.log(`    └─ Purchases: ${p.count}, Unique Users: ${p.uniqueUsers}`);
    });

    // Get product catalog
    const catalog = await getProductCatalog();

    if (catalog.length === 0) {
      console.error('❌ No products found in catalog. Cannot proceed.');
      return;
    }

    // Show product mappings
    console.log('\n🔗 Product Mappings:');
    uniqueProducts.forEach(p => {
      const match = matchProductToCatalog(p.originalName, catalog);
      if (match) {
        console.log(`  ✅ ${p.originalName}`);
        console.log(`     └─ Maps to: ${match.name}`);
        console.log(`     └─ Grants: ${match.apps_granted.length} apps`);
      } else {
        console.log(`  ❌ ${p.originalName}`);
        console.log(`     └─ No mapping found!`);
      }
    });

    // Process each record
    console.log('\n⚙️  Processing purchase records...\n');

    const notFoundUsers = [];

    for (let i = 0; i < personalizerRecords.length; i++) {
      const record = personalizerRecords[i];
      const result = await processPurchaseRecord(record, catalog, stats);

      if (!result.success && result.email) {
        notFoundUsers.push(result);
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`   Processed ${i + 1}/${stats.total} records...`);
      }
    }

    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 PROCESSING SUMMARY\n');
    console.log(`Total Records:          ${stats.total}`);
    console.log(`✅ Successfully Granted: ${stats.success}`);
    console.log(`❌ Failed:               ${stats.failed}`);
    console.log(`⏭️  Skipped:              ${stats.skipped}`);
    console.log(`🔍 Unmapped Products:    ${stats.unmappedProducts}`);
    console.log(`👤 Users Not Found:      ${stats.userNotFound}`);
    console.log(`🎯 Total Apps Granted:   ${stats.appsGranted}`);

    if (notFoundUsers.length > 0) {
      console.log('\n⚠️  Users Not Found (need to create accounts):');
      const uniqueNotFound = new Map();
      notFoundUsers.forEach(u => {
        if (!uniqueNotFound.has(u.email)) {
          uniqueNotFound.set(u.email, []);
        }
        uniqueNotFound.get(u.email).push(u.productName);
      });

      uniqueNotFound.forEach((products, email) => {
        console.log(`   • ${email}`);
        console.log(`     └─ Purchased: ${products.join(', ')}`);
      });

      console.log('\n💡 These users need to create accounts to receive access.');
      console.log('   Access will be automatically granted when they sign up with these emails.');
    }

    console.log('\n✨ Process completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during processing:', error);
    throw error;
  }
}

// CLI usage
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node grant-personalizer-access.mjs <path-to-csv-file>');
  console.log('\nExample:');
  console.log('  node grant-personalizer-access.mjs ./src/data/personalizer.csv');
  process.exit(1);
}

const csvFilePath = args[0];

processCSVAndGrantAccess(csvFilePath)
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
