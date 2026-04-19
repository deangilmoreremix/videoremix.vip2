/**
 * Bulk Create Auth Users and Grant Product Access
 * 
 * This script:
 * 1. Reads all_users_for_import.csv (transformed user data)
 * 2. Creates Supabase Auth users for each email
 * 3. Creates corresponding profiles
 * 4. Grants product access based on purchases
 * 5. Tracks all imports in csv_imports and import_user_records
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

// Supabase configuration - use environment variables or fallback
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuration
const CSV_FILE = path.join(__dirname, 'all_users_for_import.csv');
const BATCH_SIZE = 10; // Users to process before checking errors
const DRY_RUN = process.argv.includes('--dry-run'); // Add --dry-run to preview without creating

// Product to App mapping (adjust based on your products_catalog)
const PRODUCT_APP_MAP = {
  'personalizer ai agency (monthly)': 'personalizer',
  'personalizer ai agency': 'personalizer',
  'smartvideo interactive design club - monthly': 'smartvideo',
  'smartvideo interactive design club': 'smartvideo',
  'social media personalized video prospecting bundle': 'social_video',
  // Add more product mappings as needed
};

/**
 * Find the app slug for a given product name
 */
function findAppForProduct(productName) {
  if (!productName) return null;
  const normalizedProduct = productName.toLowerCase().trim();
  
  for (const [productPattern, appSlug] of Object.entries(PRODUCT_APP_MAP)) {
    if (normalizedProduct.includes(productPattern) || productPattern.includes(normalizedProduct)) {
      return appSlug;
    }
  }
  return null;
}

/**
 * Parse the CSV file
 */
function parseCSV() {
  console.log(`Reading CSV file: ${CSV_FILE}`);
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  console.log(`Parsed ${records.length} rows from CSV`);
  return records;
}

/**
 * Group users by email, aggregating their products
 */
function groupUsersByEmail(records) {
  const headers = records[0];
  const userMap = new Map();
  
  // Find column indices
  const nameIdx = headers.findIndex(h => h?.toLowerCase().includes('customer name'));
  const emailIdx = headers.findIndex(h => h?.toLowerCase().includes('customer email'));
  const campaignIdx = headers.findIndex(h => h?.toLowerCase().includes('campaign'));
  const productIdx = headers.findIndex(h => h?.toLowerCase().includes('product'));
  
  console.log(`Column indices - Name: ${nameIdx}, Email: ${emailIdx}, Campaign: ${campaignIdx}, Product: ${productIdx}`);
  
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    const customerName = nameIdx >= 0 ? row[nameIdx]?.trim() : '';
    const customerEmail = row[emailIdx]?.toLowerCase().trim();
    const campaign = campaignIdx >= 0 ? row[campaignIdx]?.trim() : '';
    const product = productIdx >= 0 ? row[productIdx]?.trim() : '';
    
    if (!customerEmail) continue;
    
    if (!userMap.has(customerEmail)) {
      userMap.set(customerEmail, {
        name: customerName || 'Unknown',
        email: customerEmail,
        campaigns: new Set(),
        products: new Set(),
      });
    }
    
    if (campaign) userMap.get(customerEmail).campaigns.add(campaign);
    if (product) userMap.get(customerEmail).products.add(product);
  }
  
  return userMap;
}

/**
 * Check if a user already exists in auth.users
 */
async function userExistsInAuth(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  
  if (error) {
    console.error(`Error checking user ${email}:`, error);
    return null;
  }
  
  return data;
}

/**
 * Create a new auth user
 */
async function createAuthUser(email, name) {
  // Generate a random password
  const password = generateRandomPassword();
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: name,
      full_name: name,
    }
  });
  
  if (error) {
    console.error(`Error creating user ${email}:`, error.message);
    return { success: false, error: error.message, user: null };
  }
  
  return { success: true, error: null, user: data.user };
}

/**
 * Generate a random password (16 characters)
 */
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Grant product access to a user
 */
async function grantProductAccess(userId, products) {
  const results = [];
  
  for (const product of products) {
    const appSlug = findAppForProduct(product);
    
    if (!appSlug) {
      console.log(`  No app mapping found for product: ${product}`);
      results.push({ product, app: null, granted: false, reason: 'no_app_mapping' });
      continue;
    }
    
    // Check if access already exists
    const { data: existing } = await supabase
      .from('user_app_access')
      .select('id')
      .eq('user_id', userId)
      .eq('app_slug', appSlug)
      .maybeSingle();
    
    if (existing) {
      results.push({ product, app: appSlug, granted: false, reason: 'already_exists' });
      continue;
    }
    
    // Grant access
    const { error } = await supabase
      .from('user_app_access')
      .insert({
        user_id: userId,
        app_slug: appSlug,
        granted_via_product: product,
        access_source: 'bulk_import',
        is_active: true,
        granted_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error(`  Error granting access for ${product}:`, error.message);
      results.push({ product, app: appSlug, granted: false, reason: error.message });
    } else {
      results.push({ product, app: appSlug, granted: true, reason: 'success' });
    }
  }
  
  return results;
}

/**
 * Create an import record
 */
async function createImportRecord(totalUsers) {
  const { data, error } = await supabase
    .from('csv_imports')
    .insert({
      import_name: `bulk_auth_import_${new Date().toISOString().split('T')[0]}`,
      filename: 'all_users_for_import.csv',
      file_size: fs.statSync(CSV_FILE).size,
      import_source: 'bulk_create_auth_users_script',
      status: 'processing',
      csv_headers: ['Customer Name', 'Customer Email', 'Campaign', 'Product'],
      total_rows: totalUsers,
      imported_by: null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating import record:', error);
    return null;
  }
  
  return data;
}

/**
 * Update import record status
 */
async function updateImportRecord(importId, stats) {
  await supabase
    .from('csv_imports')
    .update({
      status: stats.status || 'completed',
      completed_at: new Date().toISOString(),
      processed_rows: stats.processed || 0,
      successful_rows: stats.successful || 0,
      failed_rows: stats.failed || 0,
      new_users_created: stats.newUsers || 0,
      existing_users_updated: stats.existingUsers || 0,
      new_products_added: stats.newProducts || 0,
    })
    .eq('id', importId);
}

/**
 * Insert user record into import_user_records
 */
async function insertUserRecord(importId, userData, rowNumber) {
  return supabase
    .from('import_user_records')
    .insert({
      csv_import_id: importId,
      customer_name: userData.name,
      customer_email: userData.email,
      campaign: Array.from(userData.campaigns).join(', '),
      product_name: Array.from(userData.products).join(', '),
      user_id: userData.userId,
      processing_status: userData.userId ? 'processed' : 'failed',
      row_number: rowNumber,
      raw_data: [userData.name, userData.email, Array.from(userData.campaigns).join(', '), Array.from(userData.products).join(', ')],
      processed_at: new Date().toISOString(),
    });
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('BULK CREATE AUTH USERS AND GRANT PRODUCT ACCESS');
  console.log('='.repeat(60));
  console.log(`\nMode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`CSV File: ${CSV_FILE}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');
  
  // Check if CSV exists
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found: ${CSV_FILE}`);
    console.log('Please run "node transform-all-csvs.js" first to create the combined CSV.');
    process.exit(1);
  }
  
  // Parse CSV
  const records = parseCSV();
  
  // Group users by email
  const usersByEmail = groupUsersByEmail(records);
  console.log(`\nFound ${usersByEmail.size} unique users`);
  
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Preview of users to be created ---');
    let count = 0;
    for (const [email, userData] of usersByEmail) {
      console.log(`  ${userData.name} <${email}> - Products: ${userData.products.size}`);
      count++;
      if (count >= 20) {
        console.log(`  ... and ${usersByEmail.size - count} more users`);
        break;
      }
    }
    console.log('\nRun without --dry-run to actually create users.');
    return;
  }
  
  // Create import record
  const importRecord = await createImportRecord(usersByEmail.size);
  if (!importRecord) {
    console.error('❌ Failed to create import record');
    process.exit(1);
  }
  console.log(`Created import record: ${importRecord.id}`);
  
  // Statistics
  const stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    newUsers: 0,
    existingUsers: 0,
    skipped: 0,
  };
  
  // Process users
  console.log('\n--- Processing Users ---');
  let processedCount = 0;
  
  for (const [email, userData] of usersByEmail) {
    processedCount++;
    
    process.stdout.write(`[${processedCount}/${usersByEmail.size}] ${email}... `);
    
    // Check if user already exists
    const existingUser = await userExistsInAuth(email);
    
    if (existingUser) {
      console.log('EXISTS (skipping)');
      stats.existingUsers++;
      stats.skipped++;
      
      // Grant any NEW product access
      if (userData.products.size > 0) {
        const accessResults = await grantProductAccess(existingUser.id, userData.products);
        const newAccess = accessResults.filter(r => r.granted);
        if (newAccess.length > 0) {
          console.log(`    Granted ${newAccess.length} new product access(s)`);
        }
      }
      
      // Record in import_user_records
      await insertUserRecord(importRecord.id, { ...userData, userId: existingUser.id }, processedCount);
    } else {
      // Create new user
      const result = await createAuthUser(email, userData.name);
      
      if (result.success && result.user) {
        console.log('CREATED');
        stats.newUsers++;
        stats.successful++;
        
        // Grant product access
        if (userData.products.size > 0) {
          const accessResults = await grantProductAccess(result.user.id, userData.products);
          const granted = accessResults.filter(r => r.granted).length;
          console.log(`    Granted ${granted}/${userData.products.size} product access(s)`);
        }
        
        // Record in import_user_records
        await insertUserRecord(importRecord.id, { ...userData, userId: result.user.id }, processedCount);
      } else {
        console.log(`FAILED: ${result.error}`);
        stats.failed++;
        
        // Record failed attempt
        await insertUserRecord(importRecord.id, { ...userData, userId: null }, processedCount);
      }
    }
    
    stats.processed++;
    
    // Batch update every 50 users
    if (processedCount % 50 === 0) {
      await updateImportRecord(importRecord.id, stats);
      console.log(`\n  Progress: ${processedCount}/${usersByEmail.size} (${stats.newUsers} new, ${stats.existingUsers} existing, ${stats.failed} failed)`);
    }
  }
  
  // Final update
  await updateImportRecord(importRecord.id, { ...stats, status: 'completed' });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total processed: ${stats.processed}`);
  console.log(`New users created: ${stats.newUsers}`);
  console.log(`Existing users found: ${stats.existingUsers}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Import record ID: ${importRecord.id}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the import record in your Supabase dashboard');
  console.log('2. Users will receive confirmation emails (if enabled)');
  console.log('3. Run grant-personalizer-access.sql to ensure all product access is granted');
}

// Run the import
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
