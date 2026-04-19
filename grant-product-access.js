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

async function grantProductAccess() {
  console.log('🔑 Granting product access to all users...\n');

  // Load products catalog
  const { data: products, error: productsError } = await supabase
    .from('products_catalog')
    .select('id, name, apps_granted')
    .eq('is_active', true);

  if (productsError) {
    console.error('Error loading products:', productsError.message);
    return;
  }

  console.log(`Loaded ${products.length} products from catalog`);

  // Create product lookup map
  const productMap = {};
  products.forEach(p => {
    productMap[p.name.toLowerCase()] = p;
  });

  // Parse CSV
  console.log('📄 Reading CSV file...');
  const content = readFileSync(path.join(__dirname, 'all_users_for_import.csv'), 'utf-8');
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

  console.log(`Parsed ${records.length} CSV records`);

  // Group by email and collect products
  const userProducts = {};
  for (const record of records) {
    const email = record['Customer Email']?.toLowerCase().trim();
    if (!email) continue;

    if (!userProducts[email]) {
      userProducts[email] = new Set();
    }

    const product = record['Product']?.trim();
    if (product) {
      userProducts[email].add(product);
    }
  }

  console.log(`Found ${Object.keys(userProducts).length} unique users with products\n`);

  // Get all auth users
  const allAuthUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });

    if (error) {
      console.error('Error loading auth users:', error.message);
      return;
    }

    if (!users || users.length === 0) break;
    allAuthUsers.push(...users);

    if (users.length < perPage) break;
    page++;
  }

  // Create email to user ID map
  const emailToUserId = {};
  allAuthUsers.forEach(user => {
    emailToUserId[user.email.toLowerCase().trim()] = user.id;
  });

  console.log(`Mapped ${Object.keys(emailToUserId).length} auth users by email\n`);

  // Grant access
  let totalAccessGranted = 0;
  let totalProductsProcessed = 0;
  let usersProcessed = 0;

  for (const [email, products] of Object.entries(userProducts)) {
    const userId = emailToUserId[email];
    if (!userId) {
      console.log(`⚠️  No auth user found for ${email}, skipping`);
      continue;
    }

    usersProcessed++;
    console.log(`Processing ${email} (${products.size} products)`);

    for (const productName of products) {
      totalProductsProcessed++;

      // Find matching product (fuzzy match)
      let matchedProduct = null;
      const productNameLower = productName.toLowerCase();

      // Exact match first
      if (productMap[productNameLower]) {
        matchedProduct = productMap[productNameLower];
      } else {
        // Fuzzy match
        for (const [key, product] of Object.entries(productMap)) {
          if (key.includes(productNameLower) || productNameLower.includes(key)) {
            matchedProduct = product;
            break;
          }
        }
      }

      if (!matchedProduct) {
        console.log(`  ⚠️  No match for: "${productName}"`);
        continue;
      }

      // Grant access to all apps in this product
      if (matchedProduct.apps_granted && Array.isArray(matchedProduct.apps_granted)) {
        for (const appSlug of matchedProduct.apps_granted) {
          // Check if access already exists
          const { data: existingAccess } = await supabase
            .from('user_app_access')
            .select('id')
            .eq('user_id', userId)
            .eq('app_slug', appSlug)
            .single();

          if (existingAccess) {
            console.log(`  ✓ Already has: ${appSlug}`);
            continue;
          }

          // Create purchase if needed
          const { data: existingPurchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', matchedProduct.id)
            .single();

          let purchaseId = existingPurchase?.id;

          if (!purchaseId) {
            const { data: newPurchase, error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                user_id: userId,
                email: email,
                platform: 'stripe',
                platform_transaction_id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                product_id: matchedProduct.id,
                product_name: matchedProduct.name,
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
              console.error(`  ❌ Purchase error for ${appSlug}:`, purchaseError.message);
              continue;
            }

            purchaseId = newPurchase.id;
          }

          // Grant access
          const { error: accessError } = await supabase
            .from('user_app_access')
            .insert({
              user_id: userId,
              app_slug: appSlug,
              purchase_id: purchaseId,
              access_type: 'lifetime',
              is_active: true,
              granted_at: new Date().toISOString(),
              tenant_id: '00000000-0000-0000-0000-000000000001'
            });

          if (accessError) {
            console.error(`  ❌ Access error for ${appSlug}:`, accessError.message);
          } else {
            console.log(`  ✅ Granted: ${appSlug}`);
            totalAccessGranted++;
          }
        }
      }
    }

    // Progress update
    if (usersProcessed % 50 === 0) {
      console.log(`\n📊 Progress: ${usersProcessed} users processed, ${totalAccessGranted} access grants\n`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 PRODUCT ACCESS GRANTING COMPLETE');
  console.log('='.repeat(80));
  console.log(`Users processed: ${usersProcessed}`);
  console.log(`Products processed: ${totalProductsProcessed}`);
  console.log(`Access grants created: ${totalAccessGranted}`);
  console.log('='.repeat(80));
}

grantProductAccess().catch(console.error);