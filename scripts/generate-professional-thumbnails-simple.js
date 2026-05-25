#!/usr/bin/env node

/**
 * Professional Photo-Realistic AI App Thumbnail Generator
 *
 * Uses OpenAI DALL-E to create high-quality, photo-realistic thumbnails
 * for all AI apps based on the Pragmatic Essence design philosophy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Professional environments for different app categories
const PROFESSIONAL_ENVIRONMENTS = {
  'starter_ai_agents': 'modern home office with large windows, wooden desk, laptop, coffee mug, natural lighting',
  'voice_ai_agents': 'professional recording studio with microphones, sound panels, audio equipment, warm lighting',
  'rag_tutorials': 'tech research lab with multiple monitors, bookshelves, scientific equipment, focused lighting',
  'advanced_ai_agents': 'corporate innovation center with glass walls, collaborative spaces, presentation screens',
  'mcp_ai_agents': 'high-tech development workspace with servers, coding stations, ergonomic furniture',
  'ai_agent_framework_crash_course': 'educational workshop space with whiteboards, laptops, collaborative seating'
};

// Professional user archetypes
const USER_ARCHETYPES = {
  writer: 'focused female writer in her mid-30s, casual professional attire, engaged expression',
  designer: 'young male graphic designer, creative clothing, energetic posture',
  developer: 'senior software engineer with glasses, tech casual clothing, thoughtful expression',
  analyst: 'business professional in corporate attire, analytical posture',
  researcher: 'academic researcher, thoughtful expression, professional appearance',
  entrepreneur: 'young entrepreneur, confident posture, business casual',
  consultant: 'experienced consultant, professional attire, engaged demeanor'
};

// App functionality visual cues
const FUNCTIONALITY_CUES = {
  'ai_reasoning_agent': 'clean text editor with AI suggestions, progress indicators, content analysis sidebar',
  'ai_breakup_recovery_agent': 'supportive interface with conversation bubbles, emotional guidance elements',
  'ai_blog_to_podcast_agent': 'content transformation interface, audio waveform visualization, publishing controls',
  'ai_data_analysis_agent': 'data visualization dashboard, interactive charts, insight annotations',
  'ai_data_visualisation_agent': 'graphical data representations, trend analysis, predictive modeling',
  'ai_blog_search': 'research interface with article previews, relevance scoring, citation tools'
};

function getAppCategory(appName) {
  if (appName.includes('starter_ai_agents') || appName.match(/^(ai_[a-z]+_agent|ai_[a-z]+_recovery|ai_[a-z]+_to_podcast)/)) {
    return 'starter_ai_agents';
  }
  if (appName.includes('voice') || appName.includes('audio') || appName.includes('tour')) {
    return 'voice_ai_agents';
  }
  if (appName.includes('rag') || appName.includes('search') || appName.includes('research')) {
    return 'rag_tutorials';
  }
  if (appName.includes('advanced') || appName.includes('team') || appName.includes('intelligence')) {
    return 'advanced_ai_agents';
  }
  if (appName.includes('mcp') || appName.includes('browser') || appName.includes('github')) {
    return 'mcp_ai_agents';
  }
  if (appName.match(/^\d/) || appName.includes('callbacks') || appName.includes('plugins')) {
    return 'ai_agent_framework_crash_course';
  }
  return 'advanced_ai_agents';
}

function getUserArchetype(appType) {
  if (appType.includes('writing') || appType.includes('content') || appType.includes('blog')) {
    return USER_ARCHETYPES.writer;
  }
  if (appType.includes('design') || appType.includes('image') || appType.includes('visual')) {
    return USER_ARCHETYPES.designer;
  }
  if (appType.includes('code') || appType.includes('development') || appType.includes('agent')) {
    return USER_ARCHETYPES.developer;
  }
  if (appType.includes('data') || appType.includes('analysis') || appType.includes('research')) {
    return USER_ARCHETYPES.analyst;
  }
  if (appType.includes('rag') || appType.includes('search') || appType.includes('knowledge')) {
    return USER_ARCHETYPES.researcher;
  }
  if (appType.includes('business') || appType.includes('sales') || appType.includes('marketing')) {
    return USER_ARCHETYPES.entrepreneur;
  }
  return USER_ARCHETYPES.consultant;
}

function buildPhotoRealisticPrompt(appName, appDescription) {
  const category = getAppCategory(appName);
  const environment = PROFESSIONAL_ENVIRONMENTS[category] || PROFESSIONAL_ENVIRONMENTS.advanced_ai_agents;
  const userType = getUserArchetype(appName.toLowerCase());
  const functionality = FUNCTIONALITY_CUES[appName.toLowerCase()] || 'professional AI interface with data visualization and interactive controls';

  const displayName = appName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Ai/g, 'AI');

  const prompt = `Create a highly detailed, photo-realistic image of a professional workspace showing the "${displayName}" AI application in use.

SCENE SETTING: ${environment}, with authentic office lighting and realistic textures.

PROFESSIONAL USER: ${userType}, actively engaged with the work, natural posture and expression showing focus and productivity.

AI APPLICATION INTERFACE: Large, clear computer screen or laptop displaying the ${displayName} interface - ${functionality}. The interface should look modern, professional, and functional with realistic UI elements, buttons, data visualizations, and interactive controls.

VISUAL STORYTELLING: Show the AI app solving real problems - ${appDescription}. Include visual cues like progress bars, data flowing, results being generated, or user interacting with AI suggestions.

TECHNICAL QUALITY: Ultra-high resolution, professional photography style, perfect lighting, realistic shadows and reflections, authentic materials (wood, glass, metal), no cartoonish elements.

COMPOSITION: Balanced layout with user and interface both clearly visible, natural depth of field, professional aesthetic suitable for a corporate presentation or magazine feature.

COLOR & MOOD: Natural, professional color palette with screen glow providing focal contrast, conveying trust, innovation, and productivity.`;

  return prompt;
}

async function generateThumbnailWithOpenAI(appId, appName, description) {
  const prompt = buildPhotoRealisticPrompt(appId, description);

  console.log(`🎨 Generating thumbnail for: ${appName}`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      n: 1,
      size: '1792x1024', // High quality
      model: 'dall-e-3',
      quality: 'hd',
      style: 'natural'
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;

  console.log(`✅ Generated image: ${imageUrl}`);

  // Download and upload to Supabase
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  const filename = `${appId}-professional-thumbnail-${Date.now()}.png`;
  const filePath = `app-assets/thumbnails/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('public')
    .getPublicUrl(filePath);

  console.log(`📁 Uploaded to: ${publicUrl}`);

  return {
    url: publicUrl,
    filename,
    prompt,
    appId,
    appName
  };
}

async function generateAllProfessionalThumbnails() {
  console.log('🎨 Starting Professional Photo-Realistic AI App Thumbnail Generation...');
  console.log('📋 Based on "Pragmatic Essence" design philosophy\n');

  // Get apps from appsData.ts
  const appsDataPath = path.join(__dirname, '../src/data/appsData.ts');
  const appsDataContent = fs.readFileSync(appsDataPath, 'utf-8');

  // Extract app entries (simplified parsing)
  const appMatches = appsDataContent.match(/{\s*id:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["']/g);

  if (!appMatches) {
    console.error('❌ Could not parse apps from appsData.ts');
    return;
  }

  const apps = appMatches.slice(0, 5).map(match => { // Process first 5 for testing
    const idMatch = match.match(/id:\s*["']([^"']+)["']/);
    const nameMatch = match.match(/name:\s*["']([^"']+)["']/);
    const descMatch = match.match(/description:\s*["']([^"']+)["']/);

    return {
      id: idMatch?.[1] || '',
      name: nameMatch?.[1] || '',
      description: descMatch?.[1] || ''
    };
  }).filter(app => app.id && app.name);

  console.log(`📊 Found ${apps.length} apps to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const app of apps) {
    try {
      const result = await generateThumbnailWithOpenAI(app.id, app.name, app.description);

      // Update generatedThumbnails.ts
      updateGeneratedThumbnails(result);

      successCount++;
      console.log(`✅ Completed: ${app.name}\n`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Failed: ${app.name} - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Generation Complete:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`\n🎉 Professional thumbnails generated using Pragmatic Essence design philosophy!`);
}

function updateGeneratedThumbnails(result) {
  const thumbnailsPath = path.join(__dirname, '../src/data/generatedThumbnails.ts');

  try {
    let content = fs.readFileSync(thumbnailsPath, 'utf-8');

    // Add new entry before the closing bracket
    const newEntry = `  {
    appId: '${result.appId}',
    url: '${result.url}',
    filename: '${result.filename}',
    alt: '${result.appName} - Professional AI application interface',
    prompt: '${result.prompt.replace(/'/g, "\\'")}',
    generatedAt: '${new Date().toISOString()}',
    quality: 'professional'
  },`;

    // Insert before the last closing bracket
    content = content.replace(/(\]\s*;\s*\/\/.*$)/, `  ${newEntry}\n$1`);

    fs.writeFileSync(thumbnailsPath, content);
    console.log(`📝 Updated generatedThumbnails.ts`);

  } catch (error) {
    console.warn(`⚠️  Could not update generatedThumbnails.ts: ${error.message}`);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllProfessionalThumbnails().catch(console.error);
}