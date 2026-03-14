#!/usr/bin/env node

/**
 * Update image paths in appsData.ts and featuresData.ts
 * to point to the new generated thumbnails
 */

import fs from 'fs/promises';
import path from 'path';

const replacements = [
  // Apps
  { id: 'video-creator', old: 'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/video-creator.svg' },
  { id: 'promo-generator', old: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/promo-generator.svg' },
  { id: 'landing-page', old: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/landing-page.svg' },
  { id: 'ai-image-tools', old: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-image-tools.svg' },
  { id: 'rebrander-ai', old: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/rebrander-ai.svg' },
  { id: 'business-brander', old: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/business-brander.svg' },
  { id: 'branding-analyzer', old: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/branding-analyzer.svg' },
  { id: 'ai-branding', old: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-branding.svg' },
  { id: 'ai-sales', old: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-sales.svg' },
  { id: 'voice-coach', old: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/voice-coach.svg' },
  { id: 'resume-amplifier', old: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/resume-amplifier.svg' },
  { id: 'storyboard', old: 'https://images.pexels.com/photos/1174952/pexels-photo-1174952.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/storyboard.svg' },
  { id: 'sales-monetizer', old: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/sales-monetizer.svg' },
  { id: 'smart-presentations', old: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/smart-presentations.svg' },
  { id: 'personalizer-recorder', old: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-recorder.svg' },
  { id: 'personalizer-profile', old: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-profile.svg' },
  { id: 'thumbnail-generator', old: 'https://images.pexels.com/photos/6476808/pexels-photo-6476808.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/thumbnail-generator.svg' },
  { id: 'interactive-outros', old: 'https://images.pexels.com/photos/3945317/pexels-photo-3945317.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/interactive-outros.svg' },
  { id: 'social-pack', old: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/social-pack.svg' },
  { id: 'ai-art', old: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-art.svg' },
  { id: 'bg-remover', old: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/bg-remover.svg' },
  { id: 'text-to-speech', old: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/text-to-speech.svg' },
  { id: 'niche-script', old: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/niche-script.svg' },
  { id: 'ai-referral-maximizer', old: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-referral-maximizer.svg' },
  { id: 'smart-crm-closer', old: 'https://images.pexels.com/photos/7688460/pexels-photo-7688460.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/smart-crm-closer.svg' },
  { id: 'video-ai-editor', old: 'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/video-ai-editor.svg' },
  { id: 'ai-video-image', old: 'https://images.pexels.com/photos/8386422/pexels-photo-8386422.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-video-image.svg' },
  { id: 'ai-skills-monetizer', old: 'https://images.pexels.com/photos/3943723/pexels-photo-3943723.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-skills-monetizer.svg' },
  { id: 'ai-signature', old: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-signature.svg' },
  { id: 'ai-template-generator', old: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/ai-template-generator.svg' },
  { id: 'funnelcraft-ai', old: 'https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/funnelcraft-ai.svg' },
  { id: 'interactive-shopping', old: 'https://images.pexels.com/photos/5632386/pexels-photo-5632386.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/interactive-shopping.svg' },
  { id: 'personalizer-video-image-transformer', old: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-video-image-transformer.svg' },
  { id: 'personalizer-url-video-generation', old: 'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-url-video-generation.svg' },
  { id: 'sales-assistant-app', old: 'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/sales-assistant-app.svg' },
  { id: 'personalizer-text-ai-editor', old: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-text-ai-editor.svg' },
  { id: 'personalizer-advanced-text-video-editor', old: 'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-advanced-text-video-editor.svg' },
  { id: 'personalizer-writing-toolkit', old: 'https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=800', new: '/thumbnails/apps/personalizer-writing-toolkit.svg' },

  // Features
  { id: 'ai-video-creator-feature', old: 'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/ai-video-creator.svg' },
  { id: 'ai-editing-feature', old: 'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/ai-editing.svg' },
  { id: 'smart-templates-feature', old: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/smart-templates.svg' },
  { id: 'content-repurposing-feature', old: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/content-repurposing.svg' },
  { id: 'auto-captions-feature', old: 'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/auto-captions.svg' },
  { id: 'collaboration-feature', old: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1400', new: '/thumbnails/features/collaboration.svg' }
];

async function updateFile(filePath, replacements) {
  console.log(`\nUpdating ${path.basename(filePath)}...`);

  let content = await fs.readFile(filePath, 'utf-8');
  let count = 0;

  for (const replacement of replacements) {
    const regex = new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement.new);
      count += matches.length;
      console.log(`  ✓ ${replacement.id}: ${matches.length} replacement(s)`);
    }
  }

  await fs.writeFile(filePath, content);
  console.log(`✓ Updated ${count} image path(s)`);

  return count;
}

async function main() {
  console.log('Updating image paths to use generated thumbnails...');

  const appsDataPath = path.join(process.cwd(), 'src', 'data', 'appsData.ts');
  const featuresDataPath = path.join(process.cwd(), 'src', 'data', 'featuresData.ts');

  const appsCount = await updateFile(appsDataPath, replacements);
  const featuresCount = await updateFile(featuresDataPath, replacements);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Total: ${appsCount + featuresCount} image paths updated`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
