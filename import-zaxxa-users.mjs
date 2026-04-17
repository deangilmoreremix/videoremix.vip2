import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importZaxxaUsers() {
  console.log('📊 Starting Zaxxa CSV Import Process...\n');

  // Read and parse CSV file
  const csvContent = readFileSync('./src/data/personalizer  copy copy copy.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📁 Found ${records.length} records in CSV\n`);

  const stats = {
    total: records.length,
    usersCreated: 0,
    usersExisting: 0,
    purchasesRecorded: 0,
    appsGranted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Process each record
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 1;

    try {
      const email = row['CUSTOMER EMAIL']?.toLowerCase().trim();
      const paymentStatus = row['PAYMENT STATUS']?.trim();
      const productName = row['PRODUCT NAME']?.trim();

      // Skip rows without email or with refunded/pending payments
      if (!email || email === '-') {
        console.log(`⏭️  Row ${rowNum}: Skipped - No email`);
        stats.skipped++;
        continue;
      }

      if (paymentStatus?.toLowerCase() === 'refunded') {
        console.log(`⏭️  Row ${rowNum}: Skipped - Refunded transaction (${email})`);
        stats.skipped++;
        continue;
      }

      console.log(`\n🔄 Processing Row ${rowNum}: ${email}`);

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      let userId;

      if (existingUser) {
        userId = existingUser.id;
        stats.usersExisting++;
        console.log(`   ✅ User already exists: ${email}`);
      } else {
        // Create new user
        const tempPassword = generateSecurePassword();
        const customerName = row['CUSTOMER NAME'] || '';
        const [firstName, ...lastNameParts] = customerName.split(' ');

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName || '',
            last_name: lastNameParts.join(' ') || '',
            created_via: 'zaxxa_csv_import',
            customer_name: customerName,
          },
        });

        if (createError || !newUser.user) {
          console.error(`   ❌ Failed to create user: ${createError?.message}`);
          stats.failed++;
          stats.errors.push(`Row ${rowNum}: ${createError?.message}`);
          continue;
        }

        userId = newUser.user.id;
        stats.usersCreated++;
        console.log(`   ✨ Created new user: ${email}`);

        // Create user role
        await supabase.from('user_roles').upsert({
          user_id: userId,
          role: 'user',
        });
      }

      // Find matching product
      const productMatch = await matchProduct(productName);

      if (!productMatch) {
        console.log(`   ⚠️  No product match found for: ${productName}`);
      }

      // Create purchase record
      const transactionId = row['PAYPAL TXN ID'] || row['ZAXAA TXN ID'];
      if (transactionId) {
        // Check if purchase already exists
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('platform_transaction_id', transactionId)
          .maybeSingle();

        if (!existingPurchase) {
          const isSubscription = row['PAYMENT TYPE']?.toLowerCase() === 'subscription';
          const amount = parseFloat(row['AMOUNT']?.replace(/[^0-9.]/g, '') || '0');
          const purchaseDate = parseDate(row['DATE']);

          const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              email: email,
              platform: 'zaxxa',
              platform_transaction_id: transactionId,
              platform_customer_id: row['PAYPAL PREAPPROVAL KEY'] || null,
              product_id: productMatch?.productId,
              product_name: productName,
              amount: amount,
              currency: row['CURRENCY'] || 'USD',
              status: mapPaymentStatus(paymentStatus),
              subscription_id: isSubscription ? row['PAYPAL PREAPPROVAL KEY'] : null,
              is_subscription: isSubscription,
              purchase_date: purchaseDate.toISOString(),
              webhook_data: { csv_import: true, row_number: rowNum },
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (purchaseError) {
            console.error(`   ❌ Failed to create purchase: ${purchaseError.message}`);
          } else {
            stats.purchasesRecorded++;
            console.log(`   💰 Purchase recorded: ${productName} ($${amount})`);

            // Grant app access if payment completed and product matched
            if (
              productMatch &&
              productMatch.appSlugs.length > 0 &&
              paymentStatus?.toLowerCase().includes('completed')
            ) {
              const granted = await grantAppAccess(
                userId,
                productMatch.appSlugs,
                purchase.id,
                isSubscription,
                purchaseDate,
                row['RECURRING PERIOD']
              );

              stats.appsGranted += granted;
              console.log(`   🎁 Granted access to ${granted} apps: ${productMatch.appSlugs.join(', ')}`);

              // Create subscription status if applicable
              if (isSubscription && row['PAYPAL PREAPPROVAL KEY']) {
                await createSubscriptionStatus(
                  userId,
                  purchase.id,
                  row['PAYPAL PREAPPROVAL KEY'],
                  purchaseDate,
                  row['RECURRING PERIOD'],
                  paymentStatus
                );
              }
            }
          }
        } else {
          console.log(`   ℹ️  Purchase already exists`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error processing row ${rowNum}:`, error.message);
      stats.failed++;
      stats.errors.push(`Row ${rowNum}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Records:        ${stats.total}`);
  console.log(`New Users Created:    ${stats.usersCreated}`);
  console.log(`Existing Users Found: ${stats.usersExisting}`);
  console.log(`Purchases Recorded:   ${stats.purchasesRecorded}`);
  console.log(`Apps Granted:         ${stats.appsGranted}`);
  console.log(`Skipped:              ${stats.skipped}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✅ Import process completed!\n');
}

async function matchProduct(productName) {
  const normalized = productName.toLowerCase();

  let productSlug = null;

  // Existing Personalizer products
  if (normalized.includes('personalizer ai agency') && normalized.includes('monthly')) {
    productSlug = 'personalizer-monthly';
  } else if (normalized.includes('personalizer ai agency') && normalized.includes('yearly')) {
    productSlug = 'personalizer-yearly';
  } else if (normalized.includes('personalizer ai agency') && normalized.includes('lifetime')) {
    productSlug = 'personalizer-lifetime';
  } else if (normalized.includes('writing toolkit')) {
    productSlug = 'personalizer-writing-toolkit';
  } else if (normalized.includes('advanced text-video')) {
    productSlug = 'personalizer-text-video-editor';
  } else if (normalized.includes('url video generation')) {
    productSlug = 'personalizer-url-video';
  } else if (normalized.includes('interactive shopping')) {
    productSlug = 'personalizer-interactive-shopping';
  } else if (normalized.includes('video and image transformer')) {
    productSlug = 'personalizer-video-transformer';
  }
  // New products
  else if (normalized.includes('ai personalized content hub')) {
    productSlug = 'ai-personalized-content-hub-product';
  } else if (normalized.includes('funnelcraft ai')) {
    productSlug = 'funnelcraft-ai-product';
  } else if (normalized.includes('ai skills monetizer') && !normalized.includes('pro') && !normalized.includes('walkthrough')) {
    productSlug = 'ai-skills-monetizer-product';
  } else if (normalized.includes('ai skills & resume')) {
    productSlug = 'ai-skills-resume-product';
  } else if (normalized.includes('ai skills monetizer pro')) {
    productSlug = 'ai-skills-monetizer-pro-product';
  } else if (normalized.includes('sales page builder') && !normalized.includes('pro')) {
    productSlug = 'sales-page-builder-product';
  } else if (normalized.includes('sales page builder pro')) {
    productSlug = 'sales-page-builder-pro-product';
  } else if (normalized.includes('sales assistant pro')) {
    productSlug = 'sales-assistant-pro-product';
  } else if (normalized.includes('sales assistant platform')) {
    productSlug = 'sales-assistant-platform-product';
  } else if (normalized.includes('ai personalization studio')) {
    productSlug = 'ai-personalization-studio-product';
  } else if (normalized.includes('ai screen recorder') && !normalized.includes('pro') && !normalized.includes('gold')) {
    productSlug = 'ai-screen-recorder-product';
  } else if (normalized.includes('ai screen recorder pro')) {
    productSlug = 'ai-screen-recorder-pro-product';
  } else if (normalized.includes('ai signature') && !normalized.includes('pro') && !normalized.includes('app')) {
    productSlug = 'ai-signature-product';
  } else if (normalized.includes('ai signature pro')) {
    productSlug = 'ai-signature-pro-product';
  } else if (normalized.includes('profile gen')) {
    productSlug = 'profile-gen-product';
  } else if (normalized.includes('profile generator pro')) {
    productSlug = 'profile-generator-pro-product';
  } else if (normalized.includes('smart crm closer pro')) {
    productSlug = 'smart-crm-closer-pro-product';
  } else if (normalized.includes('ai referral maximizer pro')) {
    productSlug = 'ai-referral-maximizer-pro-product';
  } else if (normalized.includes('ai sales maximizer')) {
    productSlug = 'ai-sales-maximizer-product';
  } else if (normalized.includes('ai video editor')) {
    productSlug = 'ai-video-editor-product';
  } else if (normalized.includes('video ai editor pro')) {
    productSlug = 'video-ai-editor-pro-product';
  } else if (normalized.includes('videoemail app')) {
    productSlug = 'videoemail-app-product';
  } else if (normalized.includes('contentai')) {
    productSlug = 'contentai-product';
  } else if (normalized.includes('smartanimator')) {
    productSlug = 'smartanimator-product';
  } else if (normalized.includes('luminaai ai studio gemini')) {
    productSlug = 'luminaai-ai-studio-gemini-product';
  } else if (normalized.includes('product research ai')) {
    productSlug = 'product-research-ai-product';
  } else if (normalized.includes('contactshub')) {
    productSlug = 'contactshub-product';
  } else if (normalized.includes('ai studio')) {
    productSlug = 'ai-studio-product';
  } else if (normalized.includes('ai insight module')) {
    productSlug = 'ai-insight-module-product';
  } else if (normalized.includes('ai screen recorder gold')) {
    productSlug = 'ai-screen-recorder-gold-product';
  } else if (normalized.includes('white label management app')) {
    productSlug = 'white-label-management-app-product';
  } else if (normalized.includes('ai brand creator 2')) {
    productSlug = 'ai-brand-creator-2-product';
  } else if (normalized.includes('ai brand creator analysis')) {
    productSlug = 'ai-brand-creator-analysis-product';
  } else if (normalized.includes('ai skills monetizer with walkthrough')) {
    productSlug = 'ai-skills-monetizer-with-walkthrough-product';
  } else if (normalized.includes('ai rebranding calculator')) {
    productSlug = 'ai-rebranding-calculator-product';
  } else if (normalized.includes('videoremix special offer landing page')) {
    productSlug = 'videoremix-special-offer-landing-page-product';
  } else if (normalized.includes('elevate rebranding accelerator')) {
    productSlug = 'elevate-rebranding-accelerator-product';
  } else if (normalized.includes('ai video recorder remotion')) {
    productSlug = 'ai-video-recorder-remotion-product';
  } else if (normalized.includes('business brander ai recraft')) {
    productSlug = 'business-brander-ai-recraft-product';
  } else if (normalized.includes('power hour webinar landing page')) {
    productSlug = 'power-hour-webinar-landing-page-product';
  } else if (normalized.includes('resume ai')) {
    productSlug = 'resume-ai-product';
  } else if (normalized.includes('videoremix power hour 2 page')) {
    productSlug = 'videoremix-power-hour-2-page-product';
  } else if (normalized.includes('ai signature app 1')) {
    productSlug = 'ai-signature-app-1-product';
  } else if (normalized.includes('url video 2')) {
    productSlug = 'url-video-2-product';
  } else if (normalized.includes('video generation templates')) {
    productSlug = 'video-generation-templates-product';
  } else if (normalized.includes('personalizer website')) {
    productSlug = 'personalizer-website-product';
  } else if (normalized.includes('video ai pro')) {
    productSlug = 'video-ai-pro-product';
  }

  if (!productSlug) {
    return null;
  }

  const { data: product } = await supabase
    .from('products_catalog')
    .select('id, apps_granted')
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (product) {
    return {
      productId: product.id,
      appSlugs: product.apps_granted || [],
    };
  }

  return null;
}

async function grantAppAccess(userId, appSlugs, purchaseId, isSubscription, purchaseDate, recurringPeriod) {
  const expiresAt = isSubscription ? calculateExpiryDate(purchaseDate, recurringPeriod) : null;

  let granted = 0;

  for (const slug of appSlugs) {
    const { error } = await supabase
      .from('user_app_access')
      .upsert(
        {
          user_id: userId,
          app_slug: slug,
          purchase_id: purchaseId,
          access_type: isSubscription ? 'subscription' : 'lifetime',
          granted_at: purchaseDate.toISOString(),
          expires_at: expiresAt,
          is_active: true,
        },
        { onConflict: 'user_id,app_slug' }
      );

    if (!error) {
      granted++;
    }
  }

  return granted;
}

async function createSubscriptionStatus(userId, purchaseId, subscriptionId, startDate, recurringPeriod, paymentStatus) {
  const periodEnd = calculateExpiryDate(startDate, recurringPeriod);
  const status = mapPaymentStatus(paymentStatus) === 'completed' ? 'active' : 'payment_failed';

  const { data: existing } = await supabase
    .from('subscription_status')
    .select('id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('subscription_status').insert({
      user_id: userId,
      purchase_id: purchaseId,
      platform: 'zaxxa',
      platform_subscription_id: subscriptionId,
      status: status,
      current_period_start: startDate.toISOString(),
      current_period_end: periodEnd,
      cancel_at_period_end: false,
    });
  }
}

function calculateExpiryDate(startDate, recurringPeriod) {
  const expiry = new Date(startDate);
  const period = recurringPeriod?.toLowerCase() || 'monthly';

  if (period === 'monthly') {
    expiry.setMonth(expiry.getMonth() + 1);
  } else if (period === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  return expiry.toISOString();
}

function parseDate(dateString) {
  const cleaned = dateString?.replace(' ET', '').trim();
  const date = new Date(cleaned);

  if (isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function mapPaymentStatus(status) {
  const normalized = status?.toLowerCase().trim();

  if (normalized === 'completed') return 'completed';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'refunded') return 'refunded';

  return 'pending';
}

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

// Run the import
importZaxxaUsers().catch(console.error);
