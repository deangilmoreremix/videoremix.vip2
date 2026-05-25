#!/usr/bin/env node

/**
 * Professional Photo-Realistic AI App Thumbnail Generator
 *
 * Creates high-quality, photo-realistic thumbnails for all AI apps using
 * the Pragmatic Essence design philosophy. Each thumbnail shows professional
 * users in realistic work environments using the AI tools.
 *
 * Based on design philosophy: Pragmatic Essence - functionality through
 * photo-realistic depictions of professional life where AI tools are
 * seamlessly integrated into work environments.
 */

import { AIImageGenerator, ImageGenerationRequest } from '../src/utils/aiImageGenerator';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

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
  // Writing & Content
  'ai_reasoning_agent': 'clean text editor with AI suggestions, progress indicators, content analysis sidebar',
  'ai_breakup_recovery_agent': 'supportive interface with conversation bubbles, emotional guidance elements',
  'ai_blog_to_podcast_agent': 'content transformation interface, audio waveform visualization, publishing controls',

  // Voice & Audio
  'ai_audio_tour_agent': 'audio interface with location pins, voice synthesis controls, tour navigation',
  'customer_support_voice_agent': 'call center interface, conversation transcript, sentiment analysis',

  // Data & Analysis
  'ai_data_analysis_agent': 'data visualization dashboard, interactive charts, insight annotations',
  'ai_data_visualisation_agent': 'graphical data representations, trend analysis, predictive modeling',

  // Research & RAG
  'rag_database_routing': 'knowledge base interface, search results, document connections',
  'ai_blog_search': 'research interface with article previews, relevance scoring, citation tools',
  'agentic_rag_with_reasoning': 'multi-step analysis interface, reasoning traces, evidence linking',

  // Business & Marketing
  'ai_email_gtm_outreach_agent': 'email composition interface, personalization indicators, campaign analytics',
  'ai_sales_maximizer': 'sales dashboard with lead scoring, conversion tracking, performance metrics',
  'ai_competitor_intelligence_agent_team': 'market analysis interface, competitor profiles, strategic insights',

  // Creative & Design
  'ai_meme_generator_agent_browseruse': 'creative interface with image generation, text overlay tools, style selectors',
  'multimodal_design_agent_team': 'design collaboration interface, asset library, creative workflow tools',

  // Specialized
  'ai_medical_imaging_agent': 'medical imaging interface with diagnostic overlays, confidence scores',
  'ai_legal_agent_team': 'legal research interface with document analysis, case law references',
  'ai_financial_coach_agent': 'financial planning dashboard, portfolio visualization, goal tracking'
};

function getAppCategory(appName: string): string {
  // Extract category from app naming patterns
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
  return 'advanced_ai_agents'; // default
}

function getUserArchetype(appType: string): string {
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

function buildPhotoRealisticPrompt(appName: string, appDescription: string): string {
  const category = getAppCategory(appName);
  const environment = PROFESSIONAL_ENVIRONMENTS[category] || PROFESSIONAL_ENVIRONMENTS.advanced_ai_agents;
  const userType = getUserArchetype(appName.toLowerCase());
  const functionality = FUNCTIONALITY_CUES[appName.toLowerCase()] || 'professional AI interface with data visualization and interactive controls';

  // Clean app name for display
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

async function generatePhotoRealisticThumbnails() {
  console.log('🎨 Starting Photo-Realistic AI App Thumbnail Generation...');
  console.log('📋 Based on "Pragmatic Essence" design philosophy');
  console.log('🏗️  Creating professional, photo-realistic scenes for all AI apps\n');

  const generator = new AIImageGenerator();

  // Get all apps from appsData
  const appsDataPath = path.join(__dirname, '../src/data/appsData.ts');
  const appsDataContent = fs.readFileSync(appsDataPath, 'utf-8');

  // Extract apps array (this is a bit hacky but works)
  const appsMatch = appsDataContent.match(/export const appsData: App\[\] = updateAppThumbnails\(\[([\s\S]*?)\]\);/);
  if (!appsMatch) {
    console.error('❌ Could not parse appsData.ts');
    return;
  }

  // Simple regex to extract app objects (this is approximate)
  const appObjects = appsMatch[1].split('},\n  {').map(obj => {
    const idMatch = obj.match(/id:\s*["']([^"']+)["']/);
    const nameMatch = obj.match(/name:\s*["']([^"']+)["']/);
    const descriptionMatch = obj.match(/description:\s*["']([^"']+)["']/);
    const categoryMatch = obj.match(/category:\s*["']([^"']+)["']/);

    if (idMatch && nameMatch && descriptionMatch) {
      return {
        id: idMatch[1],
        name: nameMatch[1],
        description: descriptionMatch[1],
        category: categoryMatch ? categoryMatch[1] : 'ai-agents'
      };
    }
    return null;
  }).filter(Boolean);

  console.log(`📊 Found ${appObjects.length} apps to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const app of appObjects.slice(0, 10)) { // Process first 10 for testing
    try {
      console.log(`🎯 Processing: ${app.name} (${app.id})`);

      const prompt = buildPhotoRealisticPrompt(app.id, app.description);

      const request: ImageGenerationRequest = {
        appId: app.id,
        appName: app.name,
        description: app.description,
        category: app.category,
        keyFeatures: [], // Could be extracted from description if needed
        targetSize: { width: 800, height: 600 }
      };

      const result = await generator.generateAppThumbnail(request);

      console.log(`✅ Generated: ${result.url}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed: ${app.name} - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Generation Complete:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📁 Images uploaded to Supabase storage: app-assets/thumbnails/`);
  console.log('\n🔄 Run again to process remaining apps or adjust the slice limit.');
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePhotoRealisticThumbnails().catch(console.error);
}