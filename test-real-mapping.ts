import { updateAppThumbnails } from './src/utils/thumbnailMapper.ts';
import { rawAppsData } from './src/data/appsData.ts';

console.log('Testing updateAppThumbnails with actual rawAppsData...\n');

const result = updateAppThumbnails(rawAppsData);

console.log(`Total apps: ${rawAppsData.length}`);
console.log(`Result apps: ${result.length}`);

// Count flags
let countWithFlag = 0;
let changedImage = 0;
result.forEach(app => {
  if ((app as any).generatedThumbnail) countWithFlag++;
  // Compare image URLs: if image differs from original raw app's image
});
const rawMap = new Map(rawAppsData.map(a => [a.id, a]));
result.forEach(app => {
  const raw = rawMap.get(app.id);
  if (raw && app.image !== raw.image) changedImage++;
});
console.log(`Apps with generatedThumbnail flag: ${countWithFlag}`);
console.log(`Apps with changed image: ${changedImage}`);

// Show details for expected 10
const expectedApps = ['video-ai-editor', 'ai-video-image', 'ai-referral-maximizer', 'smart-crm-closer', 'funnelcraft-ai', 'personalizer-recorder', 'ai-skills-monetizer', 'ai-signature', 'ai-template-generator', 'personalizer-video-image-transformer'];
console.log('\nExpected app details:');
expectedApps.forEach(appId => {
  const app = result.find(a => a.id === appId);
  if (app) {
    const hasFlag = (app as any).generatedThumbnail ? 'YES' : 'NO';
    const raw = rawMap.get(appId);
    const imageChanged = raw && app.image !== raw.image ? 'CHANGED' : 'UNCHANGED';
    console.log(`${appId}: flag=${hasFlag}, image=${imageChanged}`);
    console.log(`  original image: ${raw?.image?.substring(0, 60)}...`);
    console.log(`   new image: ${app.image?.substring(0, 60)}...`);
  } else {
    console.log(`${appId}: NOT FOUND`);
  }
});

// Verify map keys from generatedThumbnails
const { generatedThumbnails } = await import('./src/data/generatedThumbnails.ts');
const thumbIds = new Set(generatedThumbnails.map(t => t.metadata.appId));
console.log(`\ngeneratedThumbnails count: ${generatedThumbnails.length}`);
console.log(`Checking ID match for expected apps:`);
expectedApps.forEach(appId => {
  const match = thumbIds.has(appId);
  console.log(`${appId}: ${match ? 'IN generatedThumbnails' : 'MISSING'}`);
});
