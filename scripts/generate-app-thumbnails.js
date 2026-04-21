#!/usr/bin/env node

import { AIImageGenerator } from '../src/utils/aiImageGenerator.js';
import { appThumbnailSpecs } from '../src/data/appThumbnailSpecs.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
const env = readFileSync(envPath, 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Set environment variables
process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;
process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function generateAllThumbnails() {
  console.log('🚀 Starting AI thumbnail generation for all apps...\n');

  const generator = new AIImageGenerator();

  // Test connection first
  console.log('🔗 Testing AI Image API connection...');
  const isConnected = await generator.testConnection();
  if (!isConnected) {
    console.error('❌ Failed to connect to OpenAI API. Please check your API key.');
    process.exit(1);
  }
  console.log('✅ AI Image API connection successful\n');

  const results = [];
  const errors = [];

  try {
    console.log(`📋 Processing ${appThumbnailSpecs.length} apps...`);
    console.log('⚠️  This will generate ~30 high-quality images and may take 15-20 minutes\n');

    const generatedImages = await generator.generateBatch(appThumbnailSpecs);

    // Categorize results
    generatedImages.forEach(img => results.push(img));

    console.log('\n🎉 Thumbnail generation complete!');
    console.log(`✅ Successfully generated: ${results.length} thumbnails`);
    console.log(`❌ Failed: ${errors.length} thumbnails`);

    if (results.length > 0) {
      console.log('\n📸 Sample generated thumbnails:');
      results.slice(0, 3).forEach((img, index) => {
        console.log(`${index + 1}. ${img.metadata.appId}: ${img.url.substring(0, 80)}...`);
      });
      if (results.length > 3) {
        console.log(`... and ${results.length - 3} more`);
      }

      // Save results to a JSON file for reference
      const outputPath = join(__dirname, '../../generated-thumbnails.json');
      const fs = await import('fs');
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Saved thumbnail data to: ${outputPath}`);
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => console.log(`  ${err.appId}: ${err.error}`));
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Review generated thumbnails at the URLs above');
    console.log('2. Update appsData.ts with new thumbnail URLs');
    console.log('3. Test dashboard with new AI-generated thumbnails');

  } catch (error) {
    console.error('💥 Batch generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllThumbnails().catch(console.error);
}