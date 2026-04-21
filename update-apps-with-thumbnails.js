import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function updateAppsWithThumbnails() {
  console.log('🔄 Updating appsData.ts with AI-generated thumbnails...\n');

  // Get all generated thumbnails
  const { data: files, error } = await supabase.storage
    .from('app-assets')
    .list('thumbnails');

  if (error) {
    console.error('Error fetching thumbnails:', error.message);
    return;
  }

  // Create mapping of app IDs to thumbnail URLs
  const thumbnailMap = {};
  files.forEach(file => {
    // Extract app ID from filename (remove timestamp and extension)
    const appId = file.name.replace(/-ai-thumbnail-\d+\.png$/, '');
    if (appId && !appId.includes('test-')) { // Skip test files
      const publicUrl = supabase.storage
        .from('app-assets')
        .getPublicUrl(`thumbnails/${file.name}`).data.publicUrl;

      thumbnailMap[appId] = publicUrl;
    }
  });

  console.log(`Found ${Object.keys(thumbnailMap).length} AI-generated thumbnails`);
  console.log('Mapped thumbnails:', Object.keys(thumbnailMap));

  // Read current appsData.ts
  const appsDataPath = path.join(__dirname, './src/data/appsData.ts');
  let appsDataContent = readFileSync(appsDataPath, 'utf-8');

  // Update image URLs for apps that have AI-generated thumbnails
  let updatedCount = 0;
  Object.entries(thumbnailMap).forEach(([appId, thumbnailUrl]) => {
    // Find the app in the data and replace its image URL
    const appPattern = new RegExp(`(id: "${appId}"[\\s\\S]*?image:\\s*)"([^"]*)"`, 'g');
    const replacement = `$1"${thumbnailUrl}"`;

    if (appsDataContent.match(appPattern)) {
      appsDataContent = appsDataContent.replace(appPattern, replacement);
      updatedCount++;
      console.log(`✅ Updated ${appId} with AI thumbnail`);
    } else {
      console.log(`⚠️  Could not find app ${appId} in appsData.ts`);
    }
  });

  // Write updated content back to file
  writeFileSync(appsDataPath, appsDataContent);

  console.log(`\n🎉 Successfully updated ${updatedCount} apps with AI-generated thumbnails!`);
  console.log('\n📋 Summary:');
  console.log('- AI thumbnails available:', Object.keys(thumbnailMap).length);
  console.log('- Apps updated:', updatedCount);
  console.log('- Apps still using original images:', 32 - updatedCount);
}

updateAppsWithThumbnails();