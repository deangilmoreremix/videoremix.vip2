import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
const platform = 'stripe';

// Product name mapping for common products
const productMappings = {
  // Smart products
  'smart analytics': 'Smart Analytics',
  'smart crm': 'Smart CRM',
  'smart video': 'SmartVideo',
  'smart ai designer': 'Smart AI Designer',
  'smart marketer': 'Smart Marketer',
  'smart apps': 'Smart Apps',
  'smart conversion kit': 'Smart Conversion Kit',
  'smart business': 'Smart Business',
  'smart images': 'Smart Images',
  'smart sms': 'Smart SMS',
  'smart notebook': 'Smart Notebook',
  'smart presentation': 'Smart Presentation',

  // AI products
  'personalizer ai': 'Personalizer AI',
  'rebrander ai': 'Rebrander AI',
  'ai text to video': 'AI Text To Video',
  'ai video editor': 'Video AI Editor',
  'ai sales maximizer': 'AI Sales Maximizer',
  'ai referral maximizer': 'AI Referral Maximizer',
  'ai screen recorder': 'AI Screen Recorder',
  'ai signature': 'AI Signature',

  // Video products
  'video remix': 'VideoRemix',
  'video remix elite': 'VideoRemix Elite',
  'video remix connect': 'VideoRemix Connect',

  // Agency products
  'agency growth accelerator': 'Agency Growth Accelerator',
  'real estate accelerator': 'Real Estate Accelerator',
  'attorney lead generator': 'Attorney Lead Generator',
  'financial accelerator': 'Financial Accelerator'
};

function normalizeProductName(productName) {
  // Clean and normalize product name for matching
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function findProductMatch(productName) {
  const normalized = normalizeProductName(productName);

  // First try exact match with normalized name
  for (const [key, mappedName] of Object.entries(productMappings)) {
    if (normalized.includes(key)) {
      // Try to find this mapped product in the database
      const { data: product } = await supabase
        .from('products_catalog')
        .select('id, name, apps_granted')
        .ilike('name', `%${mappedName}%`)
        .eq('is_active', true)
        .single();

      if (product) {
        return product;
      }
    }
  }

  // Fallback: try partial match with database products
  const { data: products } = await supabase
    .from('products_catalog')
    .select('id, name, apps_granted')
    .eq('is_active', true);

  for (const product of products) {
    const productNormalized = normalizeProductName(product.name);
    if (productNormalized.includes(normalized) || normalized.includes(productNormalized)) {
      return product;
    }
  }

  return null;
}

async function importUsersWithProducts() {
  try {
    console.log('Starting enhanced CSV import with product matching...\n');

    // Read CSV (assuming it's been cleaned)
    const csvContent = readFileSync('users_to_import.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Parse header
    const header = lines[0].split(',');
    const emailIndex = header.findIndex(h => h.includes('email'));
    const firstNameIndex = header.findIndex(h => h.includes('first_name'));
    const lastNameIndex = header.findIndex(h => h.includes('last_name'));
    const productsIndex = header.findIndex(h => h.includes('products_purchased'));

    if (emailIndex === -1 || productsIndex === -1) {
      console.error('CSV missing required columns: email and products_purchased');
      process.exit(1);
    }

    console.log(`Processing ${lines.length - 1} user records...\n`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;
    let productsMatched = 0;
    let accessGranted = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        processed++;
        if (processed % 10 === 0) {
          console.log(`Processed ${processed} users...`);
        }

        // Simple CSV parsing (avoiding complex parsing issues)
        const fields = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        fields.push(current);

        const email = fields[emailIndex]?.replace(/"/g, '').trim().toLowerCase() || '';
        const firstName = fields[firstNameIndex]?.replace(/"/g, '').trim() || '';
        const lastName = fields[lastNameIndex]?.replace(/"/g, '').trim() || '';
        const productsStr = fields[productsIndex]?.replace(/"/g, '').trim() || '';

        if (!email || email === 'nan' || email.includes('|')) {
          console.log(`Skipping invalid email at row ${i + 1}`);
          continue;
        }

        // Check if user exists
        let userId = null;
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = users.users.find(u => u.email === email);

        if (existingUser) {
          userId = existingUser.id;
          updated++;
        } else {
          // Create user
          const fullName = `${firstName} ${lastName}`.trim();
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'TempPass123!',
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
          created++;
          console.log(`✓ Created user: ${email}`);
        }

        // Ensure profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!profile) {
          const fullName = `${firstName} ${lastName}`.trim();
          await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              email: email,
              full_name: fullName,
              tenant_id: tenantId
            });
          console.log(`✓ Created profile for ${email}`);
        }

        // Process products if they exist
        if (productsStr && productsStr !== 'nan' && productsStr !== '') {
          const products = productsStr.split('|').map(p => p.trim()).filter(p => p);

          for (const productName of products) {
            try {
              const product = await findProductMatch(productName);

              if (product) {
                productsMatched++;

                // Check if purchase exists
                const { data: existingPurchase } = await supabase
                  .from('purchases')
                  .select('id')
                  .eq('user_id', userId)
                  .eq('product_id', product.id)
                  .single();

                let purchaseId = existingPurchase?.id;

                if (!purchaseId) {
                  // Create purchase
                  const { data: newPurchase, error: purchaseError } = await supabase
                    .from('purchases')
                    .insert({
                      user_id: userId,
                      email: email,
                      platform: platform,
                      platform_transaction_id: `import_${Date.now()}_${Math.random()}`,
                      product_id: product.id,
                      product_name: product.name,
                      amount: 0,
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
                    console.error(`Error creating purchase for ${email}:`, purchaseError.message);
                    continue;
                  }

                  purchaseId = newPurchase.id;
                  console.log(`✓ Created purchase: ${email} - ${product.name}`);
                }

                // Grant app access
                if (product.apps_granted && Array.isArray(product.apps_granted)) {
                  for (const appSlug of product.apps_granted) {
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

                      if (!accessError) {
                        accessGranted++;
                        console.log(`✓ Granted access to ${appSlug} for ${email}`);
                      }
                    }
                  }
                }
              } else {
                console.log(`No product match found for: "${productName}" (user: ${email})`);
              }
            } catch (err) {
              console.error(`Error processing product ${productName} for ${email}:`, err.message);
            }
          }
        }

      } catch (err) {
        console.error(`Error processing row ${i + 1}:`, err.message);
        errors++;
      }
    }

    console.log('\n=== Import Complete ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Users created: ${created}`);
    console.log(`Users updated: ${updated}`);
    console.log(`Products matched: ${productsMatched}`);
    console.log(`Access grants: ${accessGranted}`);
    console.log(`Errors: ${errors}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

importUsersWithProducts();