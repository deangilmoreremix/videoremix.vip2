import { updateAppThumbnails } from './src/utils/thumbnailMapper.ts';
import { generatedThumbnails } from './src/data/generatedThumbnails.ts';

// Create a minimal rawAppsData sample with the 10 expected matching app IDs
const sampleRawApps = [
  { id: 'video-ai-editor', name: 'Video AI Editor', description: '', category: 'video', icon: null, image: 'old.png' },
  { id: 'ai-video-image', name: 'AI Video & Image', description: '', category: 'ai-image', icon: null, image: 'old.png' },
  { id: 'ai-referral-maximizer', name: 'AI Referral Maximizer', description: '', category: 'lead-gen', icon: null, image: 'old.png' },
  { id: 'smart-crm-closer', name: 'Smart CRM Closer', description: '', category: 'lead-gen', icon: null, image: 'old.png' },
  { id: 'funnelcraft-ai', name: 'FunnelCraft AI', description: '', category: 'lead-gen', icon: null, image: 'old.png' },
  { id: 'personalizer-recorder', name: 'AI Screen Recorder', description: '', category: 'personalizer', icon: null, image: 'old.png' },
  { id: 'ai-skills-monetizer', name: 'AI Skills Monetizer', description: '', category: 'personalizer', icon: null, image: 'old.png' },
  { id: 'ai-signature', name: 'AI Signature', description: '', category: 'personalizer', icon: null, image: 'old.png' },
  { id: 'ai-template-generator', name: 'AI Template Generator', description: '', category: 'creative', icon: null, image: 'old.png' },
  { id: 'personalizer-video-image-transformer', name: 'Personalizer AI Video & Image Transformer', description: '', category: 'ai-image', icon: null, image: 'old.png' },
];

console.log('Testing updateAppThumbnails with minimal sample data...\n');

const result = updateAppThumbnails(sampleRawApps);

console.log(`Input apps: ${sampleRawApps.length}`);
console.log(`Result apps: ${result.length}`);

let countWithFlag = 0;
result.forEach(app => {
  if ((app as any).generatedThumbnail) countWithFlag++;
});
console.log(`Apps with generatedThumbnail flag: ${countWithFlag}`);

result.forEach(app => {
  const hasFlag = (app as any).generatedThumbnail ? 'YES' : 'NO';
  const imagePreview = (app.image || '').substring(0, 60);
  console.log(`${app.id}: generatedThumbnail=${hasFlag}, image=${imagePreview}`);
});

// Also test map directly
console.log('\nDirect map lookup check:');
const thumbnailMap = new Map(generatedThumbnails.map(img => [img.metadata.appId, img]));
sampleRawApps.forEach(app => {
  const thumb = thumbnailMap.get(app.id);
  if (thumb) {
    console.log(`✅ Map has ${app.id}`);
  } else {
    console.log(`❌ Map missing ${app.id}`);
  }
});
