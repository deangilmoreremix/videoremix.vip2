import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Configuration
const CSV_FILE = path.join(__dirname, 'all_users_for_import.csv');
const BATCH_SIZE = 10;

// Product to App mapping (simplified)
const PRODUCT_APP_MAP = {
  'personalizer': 'personalizer',
  'smartvideo': 'smartvideo',
  'social_video': 'social_video',
  'ai-personalized-content': 'ai-personalized-content',
  'video-ai-editor-pro': 'video-ai-editor-pro'
};

async function loadProductsCatalog() {
  const { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, apps_granted')
    .eq('is_active', true);

  if (error) {
    console.error('Error loading products:', error.message);
    return {};
  }

  const productMap = {};
  products.forEach(p => {
    productMap[p.name.toLowerCase()] = p;
  });
  return productMap;
}

function parseCSV() {
  console.log('📄 Reading CSV file...');
  const content = readFileSync(CSV_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }

  return records;
}

function groupUsersByEmail(records) {
  const userMap = new Map();

  for (const record of records) {
    const email = record['Customer Email']?.toLowerCase().trim();
    if (!email || !email.includes('@')) continue;

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

async function loadExistingAuthUsers() {
  console.log('🔍 Loading existing auth users...');
  const allUsers = [];
  let page = 1;
  const perPage = 1000;

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

  const userMap = new Map(allUsers.map(u => [u.email.toLowerCase().trim(), u]));
  console.log(`✅ Loaded ${userMap.size} existing auth users\n`);
  return userMap;
}

async function createMissingAuthUsers(userMap, existingAuthUsers) {
  console.log('👤 Creating missing auth users...');

  const usersToCreate = [];
  for (const [email, userData] of userMap) {
    if (!existingAuthUsers.has(email)) {
      usersToCreate.push(userData);
    }
  }

  console.log(`📊 ${usersToCreate.length} users need to be created`);

  let created = 0;
  let failed = 0;

  for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
    const batch = usersToCreate.slice(i, i + BATCH_SIZE);
    console.log(`  Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} users`);

    for (const userData of batch) {
      try {
        const password = 'VideoRemix2026'; // Fixed password for all imported users

        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.name,
            imported_via_csv: true,
            import_date: new Date().toISOString()
          }
        });

        if (error) {
          console.error(`❌ Failed to create ${userData.email}:`, error.message);
          failed++;
        } else {
          console.log(`✅ Created: ${userData.email}`);
          created++;
          existingAuthUsers.set(userData.email, newUser.user); // Add to map for later use
        }
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
        failed++;
      }
    }

    // Rate limiting
    if (i + BATCH_SIZE < usersToCreate.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Auth user creation complete: ${created} created, ${failed} failed\n`);
}

async function createMissingProfiles(userMap, existingAuthUsers) {
  console.log('📝 Creating missing profiles...');

  let created = 0;
  let skipped = 0;

  for (const [email, userData] of userMap) {
    const authUser = existingAuthUsers.get(email);
    if (!authUser) {
      console.log(`⚠️  No auth user found for ${email}, skipping profile creation`);
      continue;
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    if (existingProfile) {
      skipped++;
      continue;
    }

    // Create profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        user_id: authUser.id,
        email: email,
        full_name: userData.name,
        tenant_id: '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Failed to create profile for ${email}:`, error.message);
    } else {
      console.log(`✅ Created profile: ${email}`);
      created++;
    }
  }

  console.log(`\n✅ Profile creation complete: ${created} created, ${skipped} already existed\n`);
}

async function grantProductAccess(userMap, existingAuthUsers, productsCatalog) {
  console.log('🔑 Granting product access...');

  let totalAccessGranted = 0;
  let totalProductsProcessed = 0;

  for (const [email, userData] of userMap) {
    const authUser = existingAuthUsers.get(email);
    if (!authUser) continue;

    console.log(`  Processing ${email} (${userData.products.size} products)`);

    for (const productName of userData.products) {
      totalProductsProcessed++;

      // Find matching product in catalog (fuzzy match)
      const catalogKey = Object.keys(productsCatalog).find(key =>
        key.includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(key)
      );

      if (!catalogKey) {
        console.log(`    ⚠️  No catalog match for: "${productName}"`);
        continue;
      }

      const product = productsCatalog[catalogKey];

      // Check if access already exists
      if (product.apps_granted && Array.isArray(product.apps_granted)) {
        for (const appSlug of product.apps_granted) {
          const { data: existingAccess } = await supabase
            .from('user_app_access')
            .select('id')
            .eq('user_id', authUser.id)
            .eq('app_slug', appSlug)
            .single();

          if (existingAccess) {
            console.log(`    ✓ Already has access to: ${appSlug}`);
            continue;
          }

          // Create purchase record first
          const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: authUser.id,
              email: email,
              platform: 'stripe',
              platform_transaction_id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              product_id: product.id,
              product_name: product.name,
              amount: 0,
              currency: 'USD',
              status: 'completed',
              is_subscription: false,
              purchase_date: new Date().toISOString(),
              processed: true,
              processed_at: new Date().toISOString(),
              tenant_id: '00000000-0000-0000-0000-000000000001'
            })
            .select('id')
            .single();

          if (purchaseError) {
            console.error(`    ❌ Purchase error for ${appSlug}:`, purchaseError.message);
            continue;
          }

          // Grant app access
          const { error: accessError } = await supabase
            .from('user_app_access')
            .insert({
              user_id: authUser.id,
              app_slug: appSlug,
              purchase_id: purchase.id,
              access_type: 'lifetime',
              is_active: true,
              granted_at: new Date().toISOString(),
              tenant_id: '00000000-0000-0000-0000-000000000001'
            });

          if (accessError) {
            console.error(`    ❌ Access error for ${appSlug}:`, accessError.message);
          } else {
            console.log(`    ✅ Granted access to: ${appSlug}`);
            totalAccessGranted++;
          }
        }
      }
    }
  }

  console.log(`\n✅ Product access complete: ${totalAccessGranted} grants for ${totalProductsProcessed} products\n`);
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive user import process...\n');

    // Step 1: Load products catalog
    const productsCatalog = await loadProductsCatalog();

    // Step 2: Parse CSV and group users
    const records = parseCSV();
    const userMap = groupUsersByEmail(records);
    console.log(`📊 Found ${userMap.size} unique users in CSV\n`);

    // Step 3: Load existing auth users
    const existingAuthUsers = await loadExistingAuthUsers();

    // Step 4: Create missing auth users
    await createMissingAuthUsers(userMap, existingAuthUsers);

    // Step 5: Create missing profiles
    await createMissingProfiles(userMap, existingAuthUsers);

    // Step 6: Grant product access
    await grantProductAccess(userMap, existingAuthUsers, productsCatalog);

    // Final summary
    console.log('=' .repeat(80));
    console.log('🎉 COMPREHENSIVE IMPORT COMPLETE');
    console.log('=' .repeat(80));
    console.log(`CSV users processed: ${userMap.size}`);
    console.log(`Auth users: ${existingAuthUsers.size}`);
    console.log(`Profiles: ${existingAuthUsers.size}`);
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();