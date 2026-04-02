const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to fetch all users with pagination
async function fetchAllUsers() {
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50
    });
    if (error) {
      console.error('Error fetching users:', error.message);
      break;
    }
    const users = data.users || [];
    allUsers = allUsers.concat(users);
    console.log(`Fetched page ${page}, got ${users.length} users, total so far: ${allUsers.length}`);
    hasMore = data.nextPage !== null && data.nextPage !== undefined;
    page++;
  }

  return allUsers;
}

// Function to create a user
async function createUser(email, password, userMetadata = {}) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Automatically confirm the email
    user_metadata: userMetadata
  });

  if (error) {
    console.error(`Error creating user ${email}:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`Created user: ${email}`);
  return { success: true, user: data.user };
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

// Function to get product by name or SKU from products_catalog
async function getProductByNameOrSku(productNameOrSku) {
  // Try exact match on name first
  let { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .ilike('name', productNameOrSku)
    .eq('is_active', true);

  if (error) {
    console.error(`Error fetching product by name ${productNameOrSku}:`, error.message);
    return null;
  }

  if (products && products.length > 0) {
    return products[0];
  }

  // Try exact match on SKU
  ({ data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .ilike('sku', productNameOrSku)
    .eq('is_active', true));

  if (error) {
    console.error(`Error fetching product by SKU ${productNameOrSku}:`, error.message);
    return null;
  }

  if (products && products.length > 0) {
    return products[0];
  }

  // Try partial match on name
  ({ data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .ilike('name', `%${productNameOrSku}%`)
    .eq('is_active', true));

  if (error) {
    console.error(`Error fetching product by partial name ${productNameOrSku}:`, error.message);
    return null;
  }

  return products && products.length > 0 ? products[0] : null;
}

// Function to grant app access to a user
async function grantAppAccess(userId, appSlug, purchaseId = null, accessType = 'lifetime') {
  // Get default tenant ID
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (tenantError) {
    console.error('Error fetching tenant ID:', tenantError.message);
    return { success: false, error: tenantError.message };
  }

  const tenantId = tenantData.id;

  // Check if access already exists
  const { data: existingAccess, error: checkError } = await supabase
    .from('user_app_access')
    .select('id')
    .eq('user_id', userId)
    .eq('app_slug', appSlug)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
    console.error(`Error checking existing access for user ${userId}, app ${appSlug}:`, checkError.message);
    return { success: false, error: checkError.message };
  }

  if (existingAccess) {
    console.log(`Access already exists for user ${userId} to app ${appSlug}`);
    return { success: true, exists: true };
  }

  // Create new access
  const { data, error } = await supabase
    .from('user_app_access')
    .insert({
      user_id: userId,
      app_slug: appSlug,
      purchase_id: purchaseId,
      access_type: accessType,
      is_active: true,
      tenant_id: tenantId
    })
    .select();

  if (error) {
    console.error(`Error granting access for user ${userId} to app ${appSlug}:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`Granted access to app ${appSlug} for user ${userId}`);
  return { success: true, access: data[0] };
}

// Function to process a CSV file
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

  // Function to parse CSV line properly handling quoted fields
  function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  // Parse headers
  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map(h => h.trim());
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
    usersCreated: 0,
    usersFound: 0,
    purchasesProcessed: 0,
    accessGranted: 0,
    errors: []
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    try {
      const values = parseCSVLine(line);
      const email = values[emailIndex]?.toLowerCase();
      const firstName = values[firstNameIndex] || '';
      const lastName = values[lastNameIndex] || '';
      const productName = values[productIndex] || '';
      const fullName = `${firstName} ${lastName}`.trim();

      if (!email) {
        console.warn(`Skipping row ${i + 1}: no email found`);
        continue;
      }

      console.log(`\nProcessing: ${email} (${fullName})`);

      // Check if user already exists
      let user = await getUserByEmail(email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
        const userResult = await createUser(email, randomPassword, {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName
        });

        if (!userResult.success) {
          results.errors.push(`Failed to create user ${email}: ${userResult.error}`);
          continue;
        }

        user = userResult.user;
        isNewUser = true;
        results.usersCreated++;
        console.log(`Created new user: ${email}`);
      } else {
        results.usersFound++;
        console.log(`Found existing user: ${email}`);
      }

      // Process products if specified
      if (productName && productName !== 'nan' && productName.trim() !== '') {
        // Split pipe-separated products and process each one
        const productNames = productName.split(' | ').map(p => p.trim()).filter(p => p !== '');
        
        console.log(`Found ${productNames.length} products to process:`, productNames.join(', '));

        for (const productName of productNames) {
          // Try to find product in catalog
          const product = await getProductByNameOrSku(productName);
          
          if (!product) {
            console.warn(`Could not find product matching: ${productName}`);
            results.errors.push(`Could not find product matching: ${productName}`);
            continue;
          }

          console.log(`Processing product: ${product.name}`);

          // We found a product, now grant access to its apps
          if (!product.apps_granted || product.apps_granted.length === 0) {
            console.warn(`Product ${product.name} has no apps_granted`);
            results.errors.push(`Product ${product.name} has no apps_granted`);
            continue;
          }

          // Find or create a purchase record for this user/product
          let purchaseId = null;
          const { data: existingPurchases, error: purchaseError } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .eq('status', 'completed')
            .single();

          if (purchaseError && purchaseError.code !== 'PGRST116') {
            console.error(`Error checking existing purchase for ${email}:`, purchaseError.message);
          } else if (!purchaseError && existingPurchases) {
            purchaseId = existingPurchases.id;
            console.log(`Found existing purchase for ${email} and product ${product.name}`);
          } else {
            // Create a manual purchase record
            const { data: purchaseData, error: insertError } = await supabase
              .from('purchases')
              .insert({
                user_id: user.id,
                email: email,
                platform: 'manual_import',
                product_id: product.id,
                product_name: product.name,
                amount: 0,
                currency: 'USD',
                status: 'completed',
                purchase_date: new Date().toISOString(),
                processed: true,
                processed_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (insertError) {
              console.error(`Error creating purchase record for ${email}:`, insertError.message);
              results.errors.push(`Error creating purchase record for ${email}: ${insertError.message}`);
              continue;
            }

            purchaseId = purchaseData.id;
            console.log(`Created purchase record for ${email} and product ${product.name}`);
          }

          // Grant access to each app in apps_granted
          for (const appSlug of product.apps_granted) {
            const grantResult = await grantAppAccess(user.id, appSlug, purchaseId);
            if (grantResult.success) {
              results.accessGranted++;
              if (!grantResult.exists) {
                results.purchasesProcessed++;
              }
            } else {
              results.errors.push(`Failed to grant access for ${email} to ${appSlug}: ${grantResult.error}`);
            }
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
  console.log(`👤 Users created: ${results.usersCreated}`);
  console.log(`👥 Users found: ${results.usersFound}`);
  console.log(`🛒 Purchases processed: ${results.purchasesProcessed}`);
  console.log(`🔐 Access grants: ${results.accessGranted}`);
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
    console.log('Usage: node process-user-purchases-fixed.cjs <csv-file-path>');
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