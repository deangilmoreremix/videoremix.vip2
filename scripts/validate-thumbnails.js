import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatedThumbnails } from '../src/data/generatedThumbnails.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateThumbnails() {
  console.log('🔍 Validating generated thumbnails...\n');

  const thumbnailsDir = path.join(__dirname, '../public/thumbnails/');
  let validCount = 0;
  let invalidCount = 0;
  const issues = [];

  generatedThumbnails.forEach((thumbnail, index) => {
    const expectedPath = path.join(thumbnailsDir, `${thumbnail.metadata.appId}-thumbnail.png`);

    // Check if file exists
    if (!fs.existsSync(expectedPath)) {
      issues.push(`${thumbnail.metadata.appId}: File not found`);
      invalidCount++;
      return;
    }

    // Check file size (should be reasonable)
    const stats = fs.statSync(expectedPath);
    if (stats.size < 10000) { // Less than 10KB is suspicious
      issues.push(`${thumbnail.metadata.appId}: File too small (${stats.size} bytes)`);
      invalidCount++;
      return;
    }

    console.log(`✅ ${thumbnail.metadata.appId}: Valid (${(stats.size / 1024).toFixed(1)}KB)`);
    validCount++;
  });

  console.log(`\n📊 Validation Results:`);
  console.log(`✅ Valid thumbnails: ${validCount}`);
  console.log(`❌ Issues found: ${invalidCount}`);

  if (issues.length > 0) {
    console.log('\n⚠️ Issues to address:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  return invalidCount === 0;
}

if (validateThumbnails()) {
  console.log('\n🎉 All thumbnails validated successfully!');
} else {
  console.log('\n❌ Thumbnail validation failed. Please regenerate missing/invalid thumbnails.');
  process.exit(1);
}