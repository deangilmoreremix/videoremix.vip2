const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fuzzy match function (Jaccard index for word sets)
function similarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// Function to get product by name or SKU from products_catalog with fuzzy matching
async function findBestProductMatch(productName) {
  // First try exact match on name
  let { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .ilike('name', productName)
    .eq('is_active', true);

  if (error) {
    console.error(`Error fetching product by name ${productName}:`, error.message);
    return null;
  }

  if (products && products.length > 0) {
    return products[0];
  }

  // Try exact match on SKU
  ({ data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .ilike('sku', productName)
    .eq('is_active', true));

  if (error) {
    console.error(`Error fetching product by SKU ${productName}:`, error.message);
    return null;
  }

  if (products && products.length > 0) {
    return products[0];
  }

  // Get all products for fuzzy matching
  const { data: allProducts, error: allError } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (allError) {
    console.error(`Error fetching all products for fuzzy matching:`, allError.message);
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;
  
  for (const product of allProducts) {
    const score = similarity(productName, product.name);
    if (score > bestScore && score > 0.3) { // Require at least 30% similarity
      bestScore = score;
      bestMatch = product;
    }
  }
  
  if (bestMatch) {
    return { product: bestMatch, type: 'fuzzy', score: bestScore.toFixed(2) };
  }
  
  return null;
}

// Function to get user by email
async function getUserByEmail(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({
    filters: { email: email }
  });

  if (error) {
    console.error(`Error fetching user ${email}:`, error.message);
    return null;
  }

  return users && users.length > 0 ? users[0] : null;
}

// Function to check if a purchase already exists for a user and product
async function purchaseExists(userId, productId) {
  const { data: existingPurchases, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('status', 'completed')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    console.error(`Error checking existing purchase:`, error.message);
    return false; // Assume doesn't exist on error to avoid duplicate inserts
  }

  return !!(existingPurchases && existingPurchases.id);
}

// Function to get default tenant ID
async function getDefaultTenantId() {
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (tenantError) {
    console.error('Error fetching tenant ID:', tenantError.message);
    return null;
  }

  return tenantData.id;
}

// Function to create a purchase record
async function createPurchaseRecord(userId, email, productId, productName) {
  const platformTransactionId = `manual_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tenantId = await getDefaultTenantId();

  if (!tenantId) {
    console.error('Could not get tenant ID');
    return null;
  }

  const { data: purchaseData, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      email: email,
      tenant_id: tenantId,
      platform: 'manual_import',
      platform_transaction_id: platformTransactionId,
      platform_customer_id: null,
      product_id: productId,
      product_name: productName,
      product_sku: null,
      amount: 0,
      currency: 'USD',
      status: 'completed',
      purchase_date: new Date().toISOString(),
      processed: true,
      processed_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating purchase record:`, error.message);
    return null;
  }

  return purchaseData;
}

// Function to process a CSV file and insert purchase records
async function processCsvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    console.log('CSV file is empty');
    return;
  }

  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const firstNameIndex = headers.findIndex(h => h.toLowerCase() === 'first_name');
  const lastNameIndex = headers.findIndex(h => h.toLowerCase() === 'last_name');
  const productIndex = headers.findIndex(h => h.toLowerCase() === 'products_purchased');

  if (emailIndex === -1) {
    console.error('Could not find email column in CSV. Headers:', headers);
    return;
  }

  console.log(`Found columns: email=${headers[emailIndex]}, first_name=${headers[firstNameIndex] || 'not found'}, last_name=${headers[lastNameIndex] || 'not found'}, products_purchased=${headers[productIndex] || 'not found'}`);

  // Process each data row
  const results = {
    usersProcessed: 0,
    purchasesInserted: 0,
    purchasesSkipped: 0,
    errors: []
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    try {
      // Parse CSV line respecting quotes
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      // Add the last field
      values.push(current.trim());

      // We expect at least 8 fields (if total_spend has no comma)
      // If total_spend has commas, we will have more fields.
      if (values.length < 8) {
        console.warn(`Skipping row ${i + 1}: insufficient columns (${values.length} < 8)`);
        continue;
      }

      // Extract fields using known structure:
      // 0: first_name
      // 1: last_name
      // 2: email
      // 3..(n-5): total_spend (possibly split into multiple fields due to commas)
      // (n-4): total_orders
      // (n-3): last_purchase
      // (n-2): segment
      // (n-1): products_purchased
      const firstName = values[0];
      const lastName = values[1];
      const email = values[2].toLowerCase();

      const productIndexInValues = values.length - 1;
      const productName = values[productIndexInValues];

      const fullName = `${firstName} ${lastName}`.trim();

      if (!email) {
        console.warn(`Skipping row ${i + 1}: no email found`);
        continue;
      }

      console.log(`\nProcessing: ${email} (${fullName})`);

      // Check if user exists
      const user = await getUserByEmail(email);
      if (!user) {
        console.warn(`User not found: ${email}`);
        results.errors.push(`User not found: ${email}`);
        continue;
      }

      results.usersProcessed++;

      // Process products if specified
      if (productName && productName !== 'nan' && productName.trim() !== '') {
        // Remove surrounding quotes if present
        let cleanProductName = productName.trim();
        if (cleanProductName.startsWith('"') && cleanProductName.endsWith('"')) {
          cleanProductName = cleanProductName.slice(1, -1);
        }

        // Split pipe-separated products and process each one
        const productNames = cleanProductName.split(' | ').map(p => p.trim()).filter(p => p !== '');

        console.log(`Found ${productNames.length} products to process:`, productNames.join(', '));

        for (const productName of productNames) {
          // Try to find product in catalog using fuzzy matching
          const matchResult = await findBestProductMatch(productName);
          
          if (!matchResult) {
            console.warn(`Could not find product matching: ${productName}`);
            results.errors.push(`Could not find product matching: ${productName}`);
            continue;
          }

          const product = matchResult.product;
          let matchInfo = '';
          if (matchResult.type === 'exact') {
            matchInfo = '(exact match)';
          } else {
            matchInfo = `(fuzzy match: ${matchResult.score} similarity)`;
          }

          console.log(`Processing product: ${product.name} ${matchInfo}`);

          // Check if purchase already exists
          const exists = await purchaseExists(user.id, product.id);
          if (exists) {
            console.log(`Purchase already exists for user ${email} and product ${product.name}`);
            results.purchasesSkipped++;
            continue;
          }

          // Create purchase record
          const purchaseRecord = await createPurchaseRecord(
            user.id,
            email,
            product.id,
            product.name
          );

          if (purchaseRecord) {
            console.log(`Created purchase record for ${email} and product ${product.name}`);
            results.purchasesInserted++;
          } else {
            results.errors.push(`Failed to create purchase record for ${email} and product ${product.name}`);
          }
        }
      } else {
        console.log(`No products purchased for this user`);
      }

    } catch (err) {
      console.error(`Error processing row ${i + 1}:`, err);
      results.errors.push(`Error processing row ${i + 1}: ${err.message}`);
    }
  }

  // Print summary
  console.log('\n=== Processing Complete ===');
  console.log(`👤 Users processed: ${results.usersProcessed}`);
  console.log(`✅ Purchases inserted: ${results.purchasesInserted}`);
  console.log(`⏭️  Purchases skipped (already existed): ${results.purchasesSkipped}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node insert-purchases-from-csv-fixed.cjs <csv-file-path>');
    console.log('CSV should have columns for email, name, and product');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  await processCsvFile(filePath);
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});