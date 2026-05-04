#!/usr/bin/env node

/**
 * Add Streamlit apps to app_api_requirements table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function addStreamlitApps() {
  const apps = [
    {
      app_id: 'agentic-rag-math-agent',
      required_providers: ['openai'],
      description: 'Math tutoring agent using OpenAI'
    },
    {
      app_id: 'devpulse-ai',
      required_providers: ['openai'],
      description: 'Developer signal intelligence using OpenAI'
    },
    {
      app_id: 'gpt-oss-critique-loop',
      required_providers: ['openai'],
      description: 'Iterative text improvement using OpenAI'
    },
    {
      app_id: 'ai-aqi-analysis',
      required_providers: ['openai', 'firecrawl'],
      description: 'Air quality analysis using OpenAI + Firecrawl'
    }
  ];

  for (const app of apps) {
    try {
      const { error } = await supabase
        .from('app_api_requirements')
        .upsert(app);

      if (error) {
        console.error(`Failed to add ${app.app_id}:`, error);
      } else {
        console.log(`✅ Added/updated ${app.app_id}`);
      }
    } catch (err) {
      console.error(`Error processing ${app.app_id}:`, err);
    }
  }
}

addStreamlitApps().catch(console.error);