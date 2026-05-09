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

// Map of product names to app slugs
const PRODUCT_APP_MAP = {
  'personalizer ai agency (monthly)': [
    'voice-coach',
    'resume-amplifier',
    'personalizer-recorder',
    'personalizer-profile',
    'thumbnail-generator',
    'ai-skills-monetizer',
    'ai-signature'
  ],
  'personalizer ai agency (yearly)': [
    'voice-coach',
    'resume-amplifier',
    'personalizer-recorder',
    'personalizer-profile',
    'thumbnail-generator',
    'ai-skills-monetizer',
    'ai-signature',
    'personalizer-text-ai-editor',
    'personalizer-advanced-text-video-editor',
    'personalizer-writing-toolkit'
  ],
  'personalizer ai agency (lifetime)': [
    'voice-coach',
    'resume-amplifier',
    'personalizer-recorder',
    'personalizer-profile',
    'thumbnail-generator',
    'ai-skills-monetizer',
    'ai-signature',
    'personalizer-text-ai-editor',
    'personalizer-advanced-text-video-editor',
    'personalizer-writing-toolkit',
    'personalizer-video-image-transformer',
    'personalizer-url-video-generation'
  ],
  'personalizer ai writing toolkit': [
    'personalizer-writing-toolkit',
    'personalizer-text-ai-editor'
  ],
  'personalizer advanced text-video ai editor': [
    'personalizer-advanced-text-video-editor',
    'personalizer-text-ai-editor'
  ],
  'personalizer url video generation templates & editor': [
    'personalizer-url-video-generation'
  ],
  'personalizer interactive shopping': [
    'interactive-shopping'
  ],
  'personalizer ai video and image transformer': [
    'personalizer-video-image-transformer',
    'ai-video-image'
  ]
};

async function grantAccess() {
  console.log('🚀 Starting Personalizer Access Grant Process...\n');

  // Read CSV
  const csvContent = readFileSync('./src/data/personalizer  copy copy copy.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📁 Found ${records.length} records in CSV\n`);

  const stats = {
    total: records.length,
    usersProcessed: 0,
    appsGranted: 0,
    skipped: 0,
    errors: [],
  };

  // Get all existing users
  console.log('📥 Fetching all users from database...');
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const userMap = new Map();

  allUsers?.users?.forEach(user => {
    if (user.email) {
      userMap.set(user.email.toLowerCase(), user.id);
    }
  });

  console.log(`✅ Found ${userMap.size} existing users\n`);

  // Process unique email+product combinations
  const userProductMap = new Map();

  for (const row of records) {
    const email = row['CUSTOMER EMAIL']?.toLowerCase().trim();
    const paymentStatus = row['PAYMENT STATUS']?.trim();
    const productName = row['PRODUCT NAME']?.trim().toLowerCase();

    // Skip invalid rows
    if (!email || email === '-' || paymentStatus?.toLowerCase() === 'refunded') {
      stats.skipped++;
      continue;
    }

    // Only process completed payments
    if (paymentStatus?.toLowerCase() !== 'completed') {
      stats.skipped++;
      continue;
    }

    const userId = userMap.get(email);
    if (!userId) {
      console.log(`⚠️  User not found: ${email}`);
      continue;
    }

    const appSlugs = PRODUCT_APP_MAP[productName];
    if (!appSlugs) {
      console.log(`⚠️  Unknown product: ${productName}`);
      continue;
    }

    // Track unique user+app combinations
    if (!userProductMap.has(userId)) {
      userProductMap.set(userId, { email, apps: new Set() });
    }

    appSlugs.forEach(slug => userProductMap.get(userId).apps.add(slug));
  }

  console.log(`\n📊 Processing ${userProductMap.size} unique users with purchases...\n`);

  // Grant access for each user
  for (const [userId, userData] of userProductMap) {
    try {
      console.log(`🔄 Granting access to ${userData.email}...`);

      let grantedCount = 0;
      const isSubscription = false; // Treat all as lifetime for simplicity
      const grantedAt = new Date().toISOString();

      for (const appSlug of userData.apps) {
        const { error } = await supabase
          .from('user_app_access')
          .upsert(
            {
              user_id: userId,
              app_slug: appSlug,
              access_type: 'lifetime',
              granted_at: grantedAt,
              expires_at: null,
              is_active: true,
            },
            { onConflict: 'user_id,app_slug' }
          );

        if (!error) {
          grantedCount++;
        } else {
          console.error(`   ❌ Error granting ${appSlug}:`, error.message);
        }
      }

      console.log(`   ✅ Granted ${grantedCount} apps: ${Array.from(userData.apps).join(', ')}\n`);
      stats.usersProcessed++;
      stats.appsGranted += grantedCount;

    } catch (error) {
      console.error(`   ❌ Error processing ${userData.email}:`, error.message);
      stats.errors.push(`${userData.email}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ACCESS GRANT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Records:       ${stats.total}`);
  console.log(`Users Processed:     ${stats.usersProcessed}`);
  console.log(`Total Apps Granted:  ${stats.appsGranted}`);
  console.log(`Skipped:             ${stats.skipped}`);
  console.log(`Errors:              ${stats.errors.length}`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✅ Access grant process completed!\n');
}

grantAccess().catch(console.error);
