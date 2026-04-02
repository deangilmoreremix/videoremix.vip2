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

// Function to get product by ID from products_catalog
async function getProductById(productId) {
  const { data: products, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching product by ID ${productId}:`, error.message);
    return null;
  }

  return products;
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

  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const firstNameIndex = headers.findIndex(h => h.toLowerCase() === 'first_name');
  const lastNameIndex = headers.findIndex(h => h.toLowerCase() === 'last_name');

  if (emailIndex === -1) {
    console.error('Could not find email column in CSV. Headers:', headers);
    return;
  }

  console.log(`Found columns: email=${headers[emailIndex]}, first_name=${headers[firstNameIndex] || 'not found'}, last_name=${headers[lastNameIndex] || 'not found'}`);

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

      // Get purchases for this user from the purchases table
      const { data: userPurchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, product_id, product_name, status')
        .eq('email', email)
        .eq('status', 'completed');
      
      if (purchaseError) {
        console.error(`Error fetching purchases for ${email}:`, purchaseError.message);
        results.errors.push(`Error fetching purchases for ${email}: ${purchaseError.message}`);
        continue;
      }

      if (userPurchases.length === 0) {
        console.log(`No completed purchases found for ${email}`);
        continue;
      }

      console.log(`Found ${userPurchases.length} completed purchases for ${email}`);

      // Process each purchase
      for (const purchase of userPurchases) {
        // Get product details
        const product = await getProductById(purchase.product_id);
        
        if (!product) {
          console.warn(`Could not find product with ID ${purchase.product_id} for purchase ${purchase.id}`);
          results.errors.push(`Could not find product with ID ${purchase.product_id} for purchase ${purchase.id}`);
          continue;
        }

        console.log(`Processing purchase: ${product.name} (ID: ${purchase.product_id})`);

        // We found a product, now grant access to its apps
        if (!product.apps_granted || product.apps_granted.length === 0) {
          console.warn(`Product ${product.name} has no apps_granted`);
          results.errors.push(`Product ${product.name} has no apps_granted`);
          continue;
        }

        // Grant access to each app in apps_granted
        for (const appSlug of product.apps_granted) {
          const grantResult = await grantAppAccess(user.id, appSlug, purchase.id);
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
    console.log('Usage: node process-user-purchases-via-purchases.cjs <csv-file-path>');
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