#!/usr/bin/env node

/**
 * Update Supabase app_api_requirements for converted OpenAI apps
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Apps that now use OpenAI (converted from other providers)
const OPENAI_APPS = [
  // Manually converted
  'agentic-rag-math-agent', // Already OpenAI
  'devpulse-ai', // Converted from Gemini
  'gpt-oss-critique-loop', // Converted from Groq
  'ai-aqi-analysis', // OpenAI + Firecrawl

  // Auto-converted framework apps (16 apps)
  'ai-tic-tac-toe-agent',
  'ai-real-estate-agent-team',
  'ai-travel-planner-agent-team',
  'multimodal-coding-agent-team',
  'multimodal-design-agent-team',
  'ai-health-fitness-agent',
  'ai-movie-production-agent',
  'ai-system-architect-r1',
  'windows-use-autonomous-agent',
  'agentic-rag-with-reasoning',
  'ai-blog-search',
  'rag-chain',
  'ai-breakup-recovery-agent',
  'ai-medical-imaging-agent',
  'multimodal-ai-agent',

  // Already OpenAI compatible (from analysis)
  'ai-reasoning-agent',
  'openai-research-agent',
  'web-scraping-ai-agent',
  'ai-audio-tour-agent',
  'customer-support-voice-agent',
  'openai-sdk-crash-course'
];

// Apps that still need other providers
const OTHER_PROVIDER_APPS = [
  { id: 'ai-aqi-analysis', providers: ['openai', 'firecrawl'] },
  // Add other apps that need additional providers here
];

async function updateAppRequirements() {
  console.log('🔄 Updating app_api_requirements for OpenAI apps...\n');

  let updated = 0;
  let errors = 0;

  // Update OpenAI-only apps
  for (const appId of OPENAI_APPS) {
    try {
      const { error } = await supabase
        .from('app_api_requirements')
        .upsert({
          app_id: appId,
          required_providers: ['openai'],
          description: `AI app using OpenAI API - ${appId.replace(/-/g, ' ')}`
        });

      if (error) {
        console.error(`❌ Failed to update ${appId}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Updated ${appId}`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error updating ${appId}:`, err.message);
      errors++;
    }
  }

  // Update apps with multiple providers
  for (const app of OTHER_PROVIDER_APPS) {
    try {
      const { error } = await supabase
        .from('app_api_requirements')
        .upsert({
          app_id: app.id,
          required_providers: app.providers,
          description: `AI app requiring multiple APIs - ${app.id.replace(/-/g, ' ')}`
        });

      if (error) {
        console.error(`❌ Failed to update ${app.id}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Updated ${app.id} (multi-provider)`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error updating ${app.id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n📊 UPDATE COMPLETE`);
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 Total OpenAI-compatible apps now in database: ${OPENAI_APPS.length}`);
}

async function verifyApps() {
  console.log('\n🔍 Verifying app requirements...\n');

  const { data, error } = await supabase
    .from('app_api_requirements')
    .select('app_id, required_providers')
    .in('app_id', OPENAI_APPS.slice(0, 5)); // Check first 5

  if (error) {
    console.error('❌ Verification failed:', error.message);
  } else {
    console.log('✅ Sample verification:');
    data.forEach(app => {
      console.log(`   ${app.app_id}: ${JSON.stringify(app.required_providers)}`);
    });
  }
}

async function main() {
  await updateAppRequirements();
  await verifyApps();

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Test converted apps with OpenAI keys');
  console.log('2. Add iframe integration to VideoRemix dashboard');
  console.log('3. Update app catalog and descriptions');
  console.log('4. Deploy updated apps');
}

main().catch(console.error);