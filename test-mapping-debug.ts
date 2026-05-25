import { updateAppThumbnails } from './src/utils/thumbnailMapper.ts';
import { rawAppsData } from './src/data/appsData.ts';

console.log('Testing updateAppThumbnails...\n');

const result = updateAppThumbnails(rawAppsData);

const withGenThumb = result.filter(app => (app as any).generatedThumbnail);
console.log(`Apps with generatedThumbnail flag: ${withGenThumb.length}`);

if (withGenThumb.length > 0) {
  console.log('\nThese apps have AI thumbnails:');
  withGenThumb.forEach(app => {
    console.log(`- ${app.id}: ${app.image.substring(0, 70)}...`);
  });
} else {
  console.log('\n❌ No apps have generatedThumbnail flag set!');
}

// Check specific expected apps
const expectedApps = ['video-ai-editor', 'ai-referral-maximizer', 'smart-crm-closer', 'funnelcraft-ai', 'personalizer-recorder', 'ai-skills-monetizer', 'ai-signature', 'ai-template-generator', 'personalizer-video-image-transformer', 'ai-video-image'];
console.log('\nExpected app check:');
expectedApps.forEach(appId => {
  const app = result.find(a => a.id === appId);
  if (app) {
    const hasAIThumb = (app as any).generatedThumbnail ? 'YES' : 'NO (still using old)';
    const imagePreview = app.image.substring(0, 60);
    console.log(`${appId}: generatedThumbnail=${hasAIThumb}, image=${imagePreview}...`);
  } else {
    console.log(`${appId}: APP NOT FOUND`);
  }
});

// Debug: check if map actually contains entries
const { generatedThumbnails } = await import('./src/data/generatedThumbnails.ts');
console.log(`\ngeneratedThumbnails array length: ${generatedThumbnails.length}`);
const sampleThumb = generatedThumbnails[0];
console.log(`First thumbnail appId: ${sampleThumb.metadata.appId}`);

const thumbnailMap = new Map(generatedThumbnails.map(img => [img.metadata.appId, img]));
console.log(`Map size: ${thumbnailMap.size}`);

// Test lookup for each expected app
console.log('\nMap lookup test:');
expectedApps.forEach(appId => {
  const thumb = thumbnailMap.get(appId);
  if (thumb) {
    console.log(`✅ ${appId} -> ${thumb.url.substring(0, 60)}...`);
  } else {
    console.log(`❌ ${appId} NOT FOUND in map`);
  }
});
