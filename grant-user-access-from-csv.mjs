#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Product to app mapping based on products_catalog
const productMapping = {
  'Personalizer AI Agency (Monthly)': ['voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile', 'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature'],
  'Personalizer AI Agency (Yearly)': ['voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile', 'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature', 'personalizer-text-ai-editor', 'personalizer-advanced-text-video-editor', 'personalizer-writing-toolkit'],
  'Personalizer AI Agency (Lifetime)': ['voice-coach', 'resume-amplifier', 'personalizer-recorder', 'personalizer-profile', 'thumbnail-generator', 'ai-skills-monetizer', 'ai-signature', 'personalizer-text-ai-editor', 'personalizer-advanced-text-video-editor', 'personalizer-writing-toolkit', 'personalizer-video-image-transformer', 'personalizer-url-video-generation'],
  'Personalizer AI Writing Toolkit (Lifetime)': ['personalizer-writing-toolkit', 'personalizer-text-ai-editor'],
  'Personalizer Advanced Text-Video AI Editor (Lifetime)': ['personalizer-advanced-text-video-editor', 'personalizer-text-ai-editor'],
  'Personalizer URL Video Generation Templates & Editor (Lifetime)': ['personalizer-url-video-generation'],
  'Personalizer Interactive Shopping (Lifetime)': ['interactive-shopping'],
  'Personalizer AI Video and Image Transformer (Lifetime)': ['personalizer-video-image-transformer', 'ai-video-image'],
};

async function main() {
  console.log('🚀 Starting user access grant from CSV...\n');

  // Read CSV file
  const csvPath = join(__dirname, 'src/data/personalizer .csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`📋 Found ${records.length} purchase records\n`);

  // Group purchases by email
  const userPurchases = {};

  for (const record of records) {
    const email = record['CUSTOMER EMAIL']?.toLowerCase().trim();
    const productName = record['PRODUCT NAME']?.trim();
    const paymentStatus = record['PAYMENT STATUS']?.trim();

    if (!email || !productName) continue;

    // Only process completed payments
    if (paymentStatus !== 'Completed') continue;

    if (!userPurchases[email]) {
      userPurchases[email] = new Set();
    }

    // Add apps for this product
    const apps = productMapping[productName];
    if (apps) {
      apps.forEach(app => userPurchases[email].add(app));
    }
  }

  console.log(`👥 Found ${Object.keys(userPurchases).length} unique users with purchases\n`);

  // Process each user
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  for (const [email, appSlugs] of Object.entries(userPurchases)) {
    console.log(`\n📧 Processing: ${email}`);
    console.log(`   Apps: ${Array.from(appSlugs).join(', ')}`);

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error(`   ❌ Error fetching users: ${userError.message}`);
      errorCount++;
      continue;
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email);

    if (!user) {
      console.log(`   ⚠️  User not found in auth.users`);
      notFoundCount++;
      continue;
    }

    // Grant access to each app
    const accessRecords = Array.from(appSlugs).map(appSlug => ({
      user_id: user.id,
      app_slug: appSlug,
      access_type: 'lifetime',
      is_active: true,
      granted_at: new Date().toISOString(),
    }));

    // Check if access already exists
    for (const record of accessRecords) {
      const { data: existing } = await supabase
        .from('user_app_access')
        .select('id')
        .eq('user_id', record.user_id)
        .eq('app_slug', record.app_slug)
        .maybeSingle();

      if (existing) {
        console.log(`   ✓ Access already exists for ${record.app_slug}`);
        continue;
      }

      // Insert new access
      const { error: insertError } = await supabase
        .from('user_app_access')
        .insert(record);

      if (insertError) {
        console.error(`   ❌ Error granting access to ${record.app_slug}: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✓ Granted access to ${record.app_slug}`);
        successCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully granted: ${successCount} app accesses`);
  console.log(`⚠️  Users not found: ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
