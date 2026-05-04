import { appsData, rawAppsData } from './src/data/appsData.ts';

console.log('Checking the actual exported appsData...\n');

const expectedApps = ['video-ai-editor', 'ai-video-image', 'ai-referral-maximizer', 'smart-crm-closer', 'funnelcraft-ai', 'personalizer-recorder', 'ai-skills-monetizer', 'ai-signature', 'ai-template-generator', 'personalizer-video-image-transformer'];

let countFlag = 0;
expectedApps.forEach(appId => {
  const app = appsData.find(a => a.id === appId);
  if (app) {
    const hasFlag = (app as any).generatedThumbnail ? 'YES' : 'NO';
    if ((app as any).generatedThumbnail) countFlag++;
    console.log(`${appId}: generatedThumbnail=${hasFlag}, image=${app.image?.substring(0, 60)}...`);
  } else {
    console.log(`${appId}: NOT FOUND`);
  }
});
console.log(`\nTotal with flag among expected: ${countFlag} out of ${expectedApps.length}`);

// Also check a couple raw vs processed
console.log('\nComparison raw vs appsData for video-ai-editor:');
const rawApp = rawAppsData.find(a => a.id === 'video-ai-editor');
const procApp = appsData.find(a => a.id === 'video-ai-editor');
if (rawApp && procApp) {
  console.log('raw image:', rawApp.image);
  console.log('processed image:', procApp.image);
  console.log('raw has generatedThumbnail:', (rawApp as any).generatedThumbnail);
  console.log('processed has generatedThumbnail:', (procApp as any).generatedThumbnail);
}
