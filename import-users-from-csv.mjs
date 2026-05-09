import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const tenantId = '00000000-0000-0000-0000-000000000001';
const platform = 'stripe'; // Default platform for imports

async function importUsersFromCSV() {
  try {
    console.log('Starting CSV import process...\n');

    // Read and parse CSV
    const csvContent = readFileSync('users_to_import.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow variable column counts
      skip_records_with_error: true // Skip malformed records
    });

    console.log(`Found ${records.length} records in CSV\n`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const record of records) {
      try {
        processed++;

        // Progress indicator
        if (processed % 50 === 0) {
          console.log(`Processed ${processed} users...`);
        }

        const firstName = record.first_name?.trim() || '';
        const lastName = record.last_name?.trim() || '';
        const email = record.email?.trim().toLowerCase() || '';
        const productsPurchased = record.products_purchased?.trim() || '';

        // Skip invalid emails
        if (!email || email === '') {
          console.log(`Skipping invalid email at row ${processed}`);
          continue;
        }

        // Skip if products is 'nan'
        const hasProducts = productsPurchased && productsPurchased !== 'nan' && productsPurchased !== '';

        // Check if user exists
        let userId = null;
        let existingUser = null;

        try {
          const { data: users } = await supabase.auth.admin.listUsers({
            perPage: 1000
          });

          existingUser = users.users.find(u => u.email === email);
          if (existingUser) {
            userId = existingUser.id;
            console.log(`Found existing user: ${email}`);
          }
        } catch (err) {
          console.error(`Error checking existing user ${email}:`, err.message);
          errors++;
          continue;
        }

        // Create user if doesn't exist
        if (!userId) {
          try {
            const fullName = `${firstName} ${lastName}`.trim();

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: email,
              password: 'TempPass123!', // Temporary password
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                full_name: fullName
              }
            });

            if (createError) {
              console.error(`Error creating user ${email}:`, createError.message);
              errors++;
              continue;
            }

            userId = newUser.user.id;
            console.log(`✓ Created new user: ${email}`);
            created++;
          } catch (err) {
            console.error(`Unexpected error creating user ${email}:`, err.message);
            errors++;
            continue;
          }
        } else {
          updated++;
        }

        // Ensure profile exists
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (!profile) {
            const fullName = `${firstName} ${lastName}`.trim();

            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                email: email,
                full_name: fullName,
                tenant_id: tenantId
              });

            if (profileError) {
              console.error(`Error creating profile for ${email}:`, profileError.message);
            } else {
              console.log(`✓ Created profile for ${email}`);
            }
          }
        } catch (err) {
          console.error(`Error checking/creating profile for ${email}:`, err.message);
        }

        // Process products if they exist
        if (hasProducts) {
          const products = productsPurchased.split('|').map(p => p.trim()).filter(p => p && p !== 'nan');

          for (const productName of products) {
            try {
              // Find product in catalog
              const { data: product } = await supabase
                .from('products_catalog')
                .select('id, name, apps_granted')
                .ilike('name', productName)
                .eq('is_active', true)
                .single();

              if (!product) {
                console.log(`Product not found: ${productName} for user ${email}`);
                continue;
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
                    platform: platform,
                    platform_transaction_id: `import_${Date.now()}_${Math.random()}`,
                    platform_customer_id: `import_customer_${Date.now()}_${Math.random()}`,
                    product_id: product.id,
                    product_name: product.name,
                    amount: 0, // Amount not available in CSV
                    currency: 'USD',
                    status: 'completed',
                    is_subscription: false,
                    purchase_date: new Date().toISOString(),
                    processed: true,
                    processed_at: new Date().toISOString(),
                    tenant_id: tenantId
                  })
                  .select('id')
                  .single();

                if (purchaseError) {
                  console.error(`Error creating purchase for ${email} - ${productName}:`, purchaseError.message);
                  continue;
                }

                purchaseId = newPurchase.id;
                console.log(`✓ Created purchase for ${email} - ${productName}`);
              }

              // Grant app access
              if (product.apps_granted && Array.isArray(product.apps_granted)) {
                for (const appSlug of product.apps_granted) {
                  try {
                    // Check if access already exists
                    const { data: existingAccess } = await supabase
                      .from('user_app_access')
                      .select('id')
                      .eq('user_id', userId)
                      .eq('app_slug', appSlug)
                      .eq('is_active', true)
                      .single();

                    if (!existingAccess) {
                      const { error: accessError } = await supabase
                        .from('user_app_access')
                        .insert({
                          user_id: userId,
                          app_slug: appSlug,
                          purchase_id: purchaseId,
                          access_type: 'lifetime',
                          is_active: true,
                          granted_at: new Date().toISOString(),
                          tenant_id: tenantId
                        });

                      if (accessError) {
                        console.error(`Error granting access to ${appSlug} for ${email}:`, accessError.message);
                      } else {
                        console.log(`✓ Granted access to ${appSlug} for ${email}`);
                      }
                    }
                  } catch (err) {
                    console.error(`Error processing app access for ${email} - ${appSlug}:`, err.message);
                  }
                }
              }
            } catch (err) {
              console.error(`Error processing product ${productName} for ${email}:`, err.message);
            }
          }
        }

      } catch (err) {
        console.error(`Unexpected error processing row ${processed}:`, err.message);
        errors++;
      }
    }

    console.log('\n=== Import Complete ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

importUsersFromCSV();