import { AIImageGenerator } from './src/utils/aiImageGenerator.js';
import { appThumbnailSpecs } from './src/data/appThumbnailSpecs.js';
import { readFileSync } from 'fs';

// Load environment variables
const env = readFileSync('./.env', 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey && trimmedValue) {
      envVars[trimmedKey] = trimmedValue;
    }
  }
});

// Set environment variables
process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;
process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function continueThumbnailGeneration() {
  console.log('🔄 Continuing AI thumbnail generation...\n');

  const generator = new AIImageGenerator();

  // Get existing thumbnails to avoid regenerating
  const supabase = await import('@supabase/supabase-js');
  const { createClient } = supabase;
  const client = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const { data: existingFiles } = await client.storage
    .from('app-assets')
    .list('thumbnails');

  const existingAppIds = existingFiles.map(file =>
    file.name.replace('-ai-thumbnail-', '').replace(/-\d+\.png$/, '').replace('ai-thumbnail-', '')
  );

  console.log(`Found ${existingFiles.length} existing thumbnails`);
  console.log('Existing apps:', existingAppIds.slice(0, 5).join(', '), '...');

  // Filter out apps that already have thumbnails
  const remainingSpecs = appThumbnailSpecs.filter(spec =>
    !existingAppIds.some(existingId =>
      existingId.includes(spec.appId) || spec.appId.includes(existingId)
    )
  );

  console.log(`\n📋 Remaining apps to process: ${remainingSpecs.length}`);

  if (remainingSpecs.length === 0) {
    console.log('✅ All thumbnails already generated!');
    return;
  }

  // Generate remaining thumbnails
  const results = [];
  const errors = [];

  try {
    const generatedImages = await generator.generateBatch(remainingSpecs);

    generatedImages.forEach(img => results.push(img));

    console.log('\n🎉 Continuation complete!');
    console.log(`✅ Successfully generated: ${results.length} additional thumbnails`);
    console.log(`❌ Failed: ${errors.length} thumbnails`);

    if (results.length > 0) {
      console.log('\n📸 New thumbnails:');
      results.forEach((img, index) => {
        console.log(`${index + 1}. ${img.metadata.appId}: ${img.url.substring(0, 80)}...`);
      });
    }

  } catch (error) {
    console.error('💥 Continuation failed:', error);
  }
}

continueThumbnailGeneration();