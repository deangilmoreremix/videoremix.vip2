import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

// Map of product names to app slugs
const PRODUCT_APP_MAP = {
  'personalizer ai agency (monthly)': [
    'voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile',
    'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature'
  ],
  'personalizer ai agency (yearly)': [
    'voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile',
    'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature', 'personalizer-text-ai-editor',
    'personalizer-advanced-text-video-editor', 'personalizer-writing-toolkit'
  ],
  'personalizer ai agency (lifetime)': [
    'voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile',
    'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature', 'personalizer-text-ai-editor',
    'personalizer-advanced-text-video-editor', 'personalizer-writing-toolkit',
    'personalizer-video-image-transformer', 'personalizer-url-video-generation'
  ],
};

async function grantAccess() {
  console.log('🚀 Starting Access Grant via Direct SQL...\n');

  const csvContent = readFileSync('./src/data/personalizer  copy copy copy.csv', 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`📁 Found ${records.length} records\n`);

  // Get all users
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const userMap = new Map();
  allUsers?.users?.forEach(user => {
    if (user.email) userMap.set(user.email.toLowerCase(), user.id);
  });

  console.log(`✅ Found ${userMap.size} users\n`);

  // Build access map
  const accessMap = new Map();

  for (const row of records) {
    const email = row['CUSTOMER EMAIL']?.toLowerCase().trim();
    const paymentStatus = row['PAYMENT STATUS']?.trim();
    const productName = row['PRODUCT NAME']?.trim().toLowerCase();

    if (!email || email === '-' || paymentStatus?.toLowerCase() !== 'completed') continue;

    const userId = userMap.get(email);
    if (!userId) continue;

    const appSlugs = PRODUCT_APP_MAP[productName];
    if (!appSlugs) continue;

    if (!accessMap.has(userId)) {
      accessMap.set(userId, { email, apps: new Set() });
    }

    appSlugs.forEach(slug => accessMap.get(userId).apps.add(slug));
  }

  console.log(`📊 Processing ${accessMap.size} users...\n`);

  let totalGranted = 0;

  for (const [userId, userData] of accessMap) {
    try {
      console.log(`🔄 ${userData.email}`);

      for (const appSlug of userData.apps) {
        const sql = `
          INSERT INTO user_app_access (user_id, app_slug, access_type, granted_at, is_active)
          VALUES ('${userId}', '${appSlug}', 'lifetime', NOW(), true)
          ON CONFLICT (user_id, app_slug)
          DO UPDATE SET is_active = true, updated_at = NOW();
        `;

        const { error } = await supabase.rpc('exec', { query: sql });

        if (error) {
          console.log(`   ❌ ${appSlug}: ${error.message}`);
        } else {
          totalGranted++;
        }
      }

      console.log(`   ✅ Granted ${userData.apps.size} apps\n`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed! Granted ${totalGranted} app access permissions`);
  console.log('='.repeat(60) + '\n');
}

grantAccess().catch(console.error);
