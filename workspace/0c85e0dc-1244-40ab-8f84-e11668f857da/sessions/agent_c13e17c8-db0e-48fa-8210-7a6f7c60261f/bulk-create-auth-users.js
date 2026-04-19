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

// Load environment variables from project root .env
const projectRoot = path.resolve(__dirname, '../../../../'); // Go up 4 levels to project root
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('   Make sure .env file exists in project root with SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuration
const CSV_FILE = path.join(projectRoot, 'all_users_for_import.csv');
const BATCH_SIZE = 10;
const DRY_RUN = process.argv.includes('--dry-run');
const PLATFORM = 'stripe';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// In-memory map of existing auth users: email -> { id, ... }
let authUsersMap = new Map();

// Will hold all active products from catalog for fuzzy matching
let productsCatalog = [];

/**
 * Load all active products from catalog into memory for fuzzy matching
 */
async function loadProductsCatalog() {
  const { data, error } = await supabase
    .from('products_catalog')
    .select('id, name, apps_granted, slug')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error loading products catalog:', error.message);
    return [];
  }
  
  console.log(`Loaded ${data.length} products from catalog`);
  return data;
}

/**
 * Load all existing auth users into memory for quick lookup
 */
async function loadAuthUsers() {
  console.log('Loading existing auth users...');
  const allUsers = [];
  let page = 1;
  const perPage = 1000; // Max per page
  
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    
    if (error) {
      console.error('Error loading auth users:', error.message);
      return new Map();
    }
    
    if (!users || users.length === 0) break;
    
    allUsers.push(...users);
    console.log(`  Loaded ${allUsers.length} users so far...`);
    
    if (users.length < perPage) break;
    page++;
  }
  
  const userMap = new Map(allUsers.map(u => [u.email.toLowerCase().trim(), u.id]));
  console.log(`✓ Loaded ${userMap.size} existing auth users\n`);
  return userMap;
}

/**
 * Find best matching product for a given product name from CSV
 * Uses substring matching (case-insensitive)
 */
function findMatchingProduct(csvProductName, catalog) {
  if (!csvProductName) return null;
  
  const normalizedCSV = csvProductName.toLowerCase().trim();
  
  // First try exact match
  let match = catalog.find(p => p.name.toLowerCase().trim() === normalizedCSV);
  if (match) return match;
  
  // Then try: CSV name contains catalog name
  for (const product of catalog) {
    if (normalizedCSV.includes(product.name.toLowerCase().trim())) {
      return product;
    }
  }
  
  // Then try: catalog name contains CSV name (less accurate)
  for (const product of catalog) {
    if (product.name.toLowerCase().trim().includes(normalizedCSV)) {
      return product;
    }
  }
  
  // Finally try partial overlap (any word match)
  const csvWords = normalizedCSV.split(/\s+/).filter(w => w.length > 3);
  for (const product of catalog) {
    const productNameLower = product.name.toLowerCase();
    for (const word of csvWords) {
      if (productNameLower.includes(word)) {
        return product;
      }
    }
  }
  
  return null;
}

function parseCSV() {
  console.log(`Reading CSV file: ${CSV_FILE}`);
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    columns: true,
  });
  console.log(`Parsed ${records.length} rows from CSV`);
  return records;
}

function groupUsersByEmail(records) {
  const userMap = new Map();
  
  for (const record of records) {
    const email = record['Customer Email']?.toLowerCase().trim();
    if (!email) continue;
    
    if (!userMap.has(email)) {
      userMap.set(email, {
        name: record['Customer Name']?.trim() || 'Unknown',
        email: email,
        campaign: record['Campaign']?.trim() || '',
        products: new Set()
      });
    }
    
    const product = record['Product']?.trim();
    if (product) {
      userMap.get(email).products.add(product);
    }
  }
  
  return userMap;
}

async function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function createAuthUser(email, fullName) {
  try {
    const password = await generateSecurePassword();
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        created_via_import: true,
        import_date: new Date().toISOString()
      }
    });

    if (createError) {
      // Check for duplicate user error (message may contain "already")
      if (createError.message.toLowerCase().includes('already')) {
        console.log(`  ℹ User already exists: ${email}`);
        // Query auth.users directly using service role key (bypasses RLS)
        const { data: existingUser, error: fetchError } = await supabase
          .from('users', { schema: 'auth' })
          .select('id')
          .eq('email', email)
          .single();
          
        if (fetchError) {
          console.error(`  ⚠ Could not fetch existing user: ${fetchError.message}`);
          throw createError;
        }
        if (existingUser?.id) {
          return { userId: existingUser.id, password: null, existing: true };
        } else {
          console.log(`  ⚠ Existing user not found by email: ${email}`);
          throw createError;
        }
      }
      throw createError;
    }

    console.log(`  ✓ Created auth user: ${email}`);
    return { userId: newUser.user.id, password, existing: false };

  } catch (error) {
    console.error(`  ✗ Error creating user ${email}:`, error.message);
    throw error;
  }
}

async function createProfile(userId, email, fullName) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email: email,
        full_name: fullName,
        tenant_id: '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`  ✗ Error creating profile for ${email}:`, error.message);
      return false;
    }
    console.log(`  ✓ Created profile: ${email}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Profile error for ${email}:`, error.message);
    return false;
  }
}

async function grantProductAccess(userId, email, productName, importRecordId) {
  try {
    // Find product in catalog (fuzzy match)
    const product = findMatchingProduct(productName, productsCatalog);

    if (!product) {
      console.log(`  ⚠ Product not found in catalog: ${productName}`);
      
      // Log missing product
      await supabase.from('import_user_records').update({
        processing_status: 'failed',
        error_message: `Product not found: ${productName}`
      }).eq('customer_email', email);
      
      return false;
    }

    // Check if purchase already exists
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .single();

    let purchaseId = existingPurchase?.id;

    if (!purchaseId) {
      // Create purchase record
      const { data: newPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          email: email,
          platform: PLATFORM,
          platform_transaction_id: `import_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          platform_customer_id: `import_customer_${Date.now()}`,
          product_id: product.id,
          product_name: product.name,
          amount: 0,
          currency: 'USD',
          status: 'completed',
          is_subscription: false,
          purchase_date: new Date().toISOString(),
          processed: true,
          processed_at: new Date().toISOString(),
          tenant_id: TENANT_ID
        })
        .select('id')
        .single();

      if (purchaseError) {
        console.error(`  ✗ Error creating purchase for ${productName}:`, purchaseError.message);
        return false;
      }

      purchaseId = newPurchase.id;
      console.log(`  ✓ Created purchase: ${email} → ${productName}`);
    }

    // Grant app access
    let accessGranted = 0;
    if (product.apps_granted && Array.isArray(product.apps_granted)) {
      for (const appSlug of product.apps_granted) {
        try {
          const { error: accessError } = await supabase
            .from('user_app_access')
            .upsert({
              user_id: userId,
              app_slug: appSlug,
              purchase_id: purchaseId,
              access_type: 'lifetime',
              is_active: true,
              granted_at: new Date().toISOString(),
              tenant_id: '00000000-0000-0000-0000-000000000001'
            }, {
              onConflict: 'user_id,app_slug'
            });

          if (!accessError) {
            accessGranted++;
            console.log(`  ✓ Granted access: ${email} → ${appSlug}`);
          }
        } catch (err) {
          console.error(`  ✗ Error granting ${appSlug} to ${email}:`, err.message);
        }
      }
    }

    return accessGranted > 0;
  } catch (error) {
    console.error(`  ✗ Access error for ${email} - ${productName}:`, error.message);
    return false;
  }
}

async function processUsers(userMap) {
  console.log(`\n🚀 Starting user creation${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);
  
  const users = Array.from(userMap.values());
  const totalUsers = users.length;
  
  let created = 0;
  let existingCount = 0; // renamed to avoid conflict with 'existing' variable
  let errors = 0;
  let totalAccess = 0;

  for (let i = 0; i < totalUsers; i++) {
    const user = users[i];
    
    console.log(`[${i + 1}/${totalUsers}] Processing: ${user.email}`);
    
    try {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create user and grant access to ${user.products.size} products`);
        continue;
      }

      // Step 1: Check if user already exists in our map
      let userId;
      let isExisting = false;
      
      if (authUsersMap.has(user.email)) {
        userId = authUsersMap.get(user.email);
        isExisting = true;
        console.log(`  ℹ User already exists: ${user.email}`);
      } else {
        // Create new auth user
        const result = await createAuthUser(user.email, user.name);
        userId = result.userId;
        // result.existing should be false but ignore
      }

      if (isExisting) {
        existingCount++;
      } else {
        created++;
      }

      // Step 2: Create/Update Profile (upsert)
      await createProfile(userId, user.email, user.name);

      // Step 3: Grant product access
      for (const product of user.products) {
        const success = await grantProductAccess(userId, user.email, product, null);
        if (success) totalAccess++;
      }

    } catch (error) {
      console.error(`  ✗ Failed to process ${user.email}:`, error.message);
      errors++;
    }

    // Progress indicator
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${totalUsers} users processed`);
      console.log(`   Created: ${created}, Existing: ${existingCount}, Errors: ${errors}\n`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total users: ${totalUsers}`);
  console.log(`New users created: ${created}`);
  console.log(`Existing users: ${existingCount}`);
  console.log(`Total access grants: ${totalAccess}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  try {
    // Verify Supabase connection and load data
    console.log('🔌 Verifying Supabase connection...');
    const { error: testError } = await supabase.from('products_catalog').select('id', { limit: 1 });
    if (testError) {
      console.error('❌ Cannot connect to Supabase:', testError.message);
      console.error('   Check your VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    console.log('✓ Connected to Supabase\n');

    // Load products catalog for fuzzy matching
    productsCatalog = await loadProductsCatalog();
    if (productsCatalog.length === 0) {
      console.error('❌ No products found in catalog. Please add products first.');
      process.exit(1);
    }

    // Load existing auth users map
    authUsersMap = await loadAuthUsers();

    // Parse and group users
    const records = parseCSV();
    const userMap = groupUsersByEmail(records);
    console.log(`Grouped into ${userMap.size} unique users\n`);

    // Process users
    await processUsers(userMap);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();