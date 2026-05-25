import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Realistic AI Marketing Tools Thumbnail Generator
 * 
 * Uses OpenAI DALL-E 3 to generate high-quality, realistic thumbnails
 * showing humans using each product in real-world environments.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load prompts
const promptsPath = path.join(__dirname, '..', 'tmp', 'realistic_thumbnails_prompts.json');
const promptsData = fs.readFileSync(promptsPath, 'utf8');
const prompts = JSON.parse(promptsData);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Apps that need realistic thumbnails
const apps = [
  { id: 'ai-personalized-content', name: 'AI Personalized Content Hub' },
  { id: 'funnelcraft-ai', name: 'FunnelCraft AI' },
  { id: 'ai-skills-monetizer', name: 'AI Skills Monetizer' },
  { id: 'ai-skills-resume', name: 'AI Skills & Resume' },
  { id: 'sales-page-builder', name: 'Sales Page Builder' },
  { id: 'sales-assistant-pro', name: 'Sales Assistant Pro' },
  { id: 'ai-personalization-studio', name: 'AI Personalization Studio' },
  { id: 'ai-personalizer', name: 'AI Personalizer' },
  { id: 'ai-video-transformer', name: 'AI Video Transformer' },
  { id: 'ai-screen-recorder', name: 'AI Screen Recorder' },
  { id: 'ai-signature', name: 'AI Signature' },
  { id: 'ai-thumbnail-generator', name: 'AI Thumbnail Generator' },
  { id: 'profile-gen', name: 'Profile Gen' },
  { id: 'ai-video-editor', name: 'AI Video Editor' },
  { id: 'ai-referral-maximizer-pro', name: 'AI Referral Maximizer Pro' },
  { id: 'ai-sales-maximizer', name: 'AI Sales Maximizer' },
  { id: 'contentai', name: 'ContentAI' },
  { id: 'product-research-ai', name: 'Product Research AI' }
];

async function generateImageWithDalle(prompt, appName) {
  console.log(`🎨 Generating realistic thumbnail for ${appName}...`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '1792x1024', // High quality for thumbnails
        quality: 'hd',
        style: 'natural',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response from OpenAI API');
    }

    return data.data[0].url;
  } catch (error) {
    console.error(`❌ Failed to generate image for ${appName}:`, error.message);
    return null;
  }
}

async function uploadToSupabase(imageUrl, filename) {
  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to Supabase Storage
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer]), filename);
    
    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/app-thumbnails/${filename}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    return `${SUPABASE_URL}/storage/v1/object/public/app-thumbnails/${filename}`;
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function generateAllRealisticThumbnails() {
  console.log('🚀 Starting Realistic Thumbnail Generation...\n');
  console.log('📸 Using OpenAI DALL-E 3 for high-quality, realistic images');
  console.log('⚠️  This will generate 18 premium images and may take 10-15 minutes\n');

  const results = [];
  const errors = [];

  for (const app of apps) {
    const promptData = prompts[app.id];
    
    if (!promptData) {
      console.log(`⚠️  No prompt found for ${app.name}, skipping...`);
      continue;
    }

    // Create enhanced prompt with style requirements
    const enhancedPrompt = `${promptData.prompt}. ${promptData.style}. Photorealistic, highly detailed, professional photography, 8k quality, realistic lighting, modern office or studio environment, showing actual software interfaces and human interaction.`;

    // Generate image
    const imageUrl = await generateImageWithDalle(enhancedPrompt, app.name);
    
    if (!imageUrl) {
      errors.push({ app: app.name, error: 'Generation failed' });
      continue;
    }

    // Upload to Supabase
    const filename = `${app.id}-realistic-thumbnail.jpg`;
    const storedUrl = await uploadToSupabase(imageUrl, filename);

    if (storedUrl) {
      results.push({
        id: app.id,
        name: app.name,
        url: storedUrl,
        filename,
        prompt: enhancedPrompt
      });
      console.log(`✅ Generated and uploaded: ${app.name}`);
    } else {
      errors.push({ app: app.name, error: 'Upload failed' });
    }

    // Rate limiting - wait 3 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Save results
  const metadata = {
    generated: new Date().toISOString(),
    type: 'realistic-photographic-thumbnails',
    method: 'openai-dall-e-3',
    quality: 'hd',
    size: '1792x1024',
    style: 'natural-photorealistic',
    totalGenerated: results.length,
    totalErrors: errors.length,
    results,
    errors
  };

  const metadataPath = path.join(process.cwd(), 'public', 'app-thumbnails', 'realistic-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log('\n🎉 Realistic Thumbnail Generation Complete!');
  console.log(`✅ Successfully generated: ${results.length} thumbnails`);
  console.log(`❌ Failed: ${errors.length} thumbnails`);
  
  if (results.length > 0) {
    console.log('\n📸 Generated thumbnails:');
    results.forEach(r => console.log(`   ${r.name}: ${r.url}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   ${e.app}: ${e.error}`));
  }

  return { results, errors };
}

// Run if called directly
generateAllRealisticThumbnails().catch(console.error);
