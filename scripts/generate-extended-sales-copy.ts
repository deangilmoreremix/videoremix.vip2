#!/usr/bin/env tsx

/**
 * LLM Batch Generator for Extended Sales Copy
 * Uses OpenAI GPT-4 to generate concise, tonality-rich copy for all apps
 * 
 * IMPORTANT: Set OPENAI_API_KEY environment variable before running
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview'; // or 'gpt-3.5-turbo' for cost savings
const BATCH_SIZE = 5; // Process N apps concurrently (respect rate limits)
const MAX_RETRIES = 2;

// ============================================
// TONALITY GUIDANCE (short, distinctive)
// ============================================
const TONALITY_GUIDANCE: Record<string, string[]> = {
  "Steve Jobs": ["Reality distortion field", "Emphasize simplicity & elegance", "Use: revolutionary, game-changing, elegant"],
  "Seth Godin": ["Remarkable & shareworthy", "Story-driven", "Purple Cow thinking"],
  "Chris Voss": ["Tactical empathy", "Mirroring language", "Psychological precision"],
  "Jeff Bezos": ["Customer-obsessed", "Day 1 mentality", "Long-term strategic"],
  "Challenger Sale": ["Insight-led disruption", "Teach & tailor", "Confident"],
  "Trusted Advisor": ["Relationship-first", "Trust before transaction", "Steady guidance"],
  "Cormac McCarthy": ["Sparse & visionary", "Atmospheric", "Profound simplicity"],
  "Hemingway": ["Direct & clear", "Strong verbs", "No fluff"],
  "Value-Based": ["ROI-focused", "Quantify everything", "Numbers-driven"],
  "Pain Point Research": ["Diagnostic discovery", "Question-led", "Problem-first"],
  "David Ogilvy": ["Benefit-driven", "Proven formulas", "Headline-first"],
  "Growth Hacker": ["Scalable loops", "Experiment fast", "Metrics-obsessed"],
  // Fallbacks for any missing
  "default": ["Be persuasive", "Focus on value", "Keep it concise"]
};

// ============================================
// TYPE DEFINITIONS
// ============================================
interface AppData {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface ExtendedSalesCopy {
  tonality: string;
  tagline: string;
  summary: string;
  whatItDoes: string;
  howItWorks: string;
  howToProfit: {
    forLocalBusinesses: string;
    forIndividuals: string;
  };
  whyYouNeedIt: string;
  useCases: Array<{industry: string; scenario: string; outcome: string}>;
  testimonials: Array<{
    quote: string;
    name: string;
    role: string;
    businessType: string;
    rating: number;
  }>;
}

interface ExtendedAppSalesData {
  [appId: string]: ExtendedSalesCopy;
}

// ============================================
// DATA LOADING
// ============================================
function loadAppSalesCopy(): Record<string, { tonality: string }> {
  const filePath = path.join(__dirname, '../src/data/appSalesCopy.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const result: Record<string, { tonality: string }> = {};
  const regex = /'([^']+)':\s*\{[^}]*tonality:\s*'([^']+)'/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const appId = match[1];
    const tonality = match[2];
    result[appId] = { tonality };
  }

  return result;
}

function loadAppsData(): AppData[] {
  const filePath = path.join(__dirname, '../src/data/appsData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const apps: AppData[] = [];
  
  // Use regex to extract app objects more robustly
  // Looking for: { id: "...", name: "...", description: "...", category: "..." }
  const appRegex = /\{\s*id:\s*["']([^"']+)["']\s*,\s*name:\s*["']([^"']+)["']\s*,\s*description:\s*["']([^"']+)["']\s*,\s*category:\s*["']([^"']+)["'][^}]*\}/g;
  
  let match;
  while ((match = appRegex.exec(content)) !== null) {
    const [, id, name, description, category] = match;
    apps.push({ id, name, description, category });
  }

  console.log(`📦 Extracted ${apps.length} apps from appsData.ts`);
  return apps;
}

// ============================================
// PROMPT BUILDING
// ============================================
function buildPrompt(app: AppData, tonality: string): string {
  const guidance = TONALITY_GUIDANCE[tonality] || TONALITY_GUIDANCE['default'];
  
  // Use provided description if available; otherwise construct from name
  const description = app.description || app.name;
  
  // Category-specific hints for profit sections
  const categoryProfitHints: Record<string, string> = {
    'video': 'video services, content creation, social media management',
    'ai-image': 'design services, image editing, creative freelancing',
    'creative': 'design services, content creation, agency work',
    'lead-gen': 'lead generation services, marketing consulting, agency offers',
    'personalizer': 'personalization services, consulting, custom solutions',
    'branding': 'branding services, identity design, strategy consulting',
    'video': 'video editing, production, content repurposing'
  };
  
  const profitHint = categoryProfitHints[app.category] || 'digital services, consulting, or productized offers';

  return `You are writing concise, persuasive sales copy for a SaaS app. Be specific and actionable.

APP DETAILS:
- Name: ${app.name}
- Description: ${description}
- Category: ${app.category}
- GTM Skills Tonality: ${tonality}
- Tonality markers: ${guidance.join('; ')}

Write scannable copy. Be concise. Every word must earn its place.

OUTPUT STRUCTURE (JSON only):
{
  "tagline": "5-12 word benefit-driven hook",
  "summary": "1-2 sentence elevator pitch",
  "whatItDoes": "50-80 words: what the app does and core benefits",
  "howItWorks": "3-5 steps in narrative form, 60-100 words total. Use: First, Then, Finally.",
  "howToProfit": {
    "forLocalBusinesses": "Service model? Target customers? Price range ($X-XX)? Monthly revenue potential? 3-4 sentences.",
    "forIndividuals": "Side hustle service? Platforms (Fiverr/Upwork/local)? Hours/week? Income potential ($X-XX/month)? 3-4 sentences."
  },
  "whyYouNeedIt": "Start with pain (1 sent). Value prop in ${tonality} voice (2 sent). Urgency/trend (1 sent). Total 3-4 sentences.",
  "useCases": [{"industry":"...","scenario":"...","outcome":"..."}],
  "testimonials": [{"quote":"1-2 sent","name":"...","role":"...","businessType":"...","rating":5}]
}

Monetization focus: This app serves ${profitHint}. Tailor profit examples accordingly.

Rules:
- NEVER use "makes money" – be specific: "Charge $X-XX per project", "Earn $X,XXX/month"
- Include actual numbers, price ranges, time investments
- Target customers: be concrete ("local restaurants", "real estate agents", "e-commerce stores")
- Platforms: name them (Fiverr, Upwork, local networking, direct outreach)
- Tonality: match ${tonality} voice consistently

Output ONLY valid JSON. No extra text.`;
}

// ============================================
// API CALL
// ============================================
async function callOpenAI(prompt: string): Promise<any> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a persuasive copywriter specializing in SaaS sales with GTM Skills tonalities. Output only structured JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// MAIN GENERATION LOOP
// ============================================
// Test with just 3 apps first
const TEST_MODE = true; // Set to false to run all 134 apps
const TEST_APPS = 3;

// ...

async function generateExtendedSalesCopy() {
  console.log('🚀 Starting extended sales copy generation...\n');

  const salesCopyData = loadAppSalesCopy();
  const appsData = loadAppsData();

  const totalApps = TEST_MODE ? Math.min(TEST_APPS, appsData.length) : appsData.length;
  console.log(`📊 Total apps to process: ${totalApps}${TEST_MODE ? ' (TEST MODE)' : ''}\n`);

  // Take only first N apps if test mode
  const appsToProcess = TEST_MODE ? appsData.slice(0, TEST_APPS) : appsData;

  const extended: ExtendedAppSalesData = {};
  const failedApps: string[] = [];
  
  // Process in batches
  for (let i = 0; i < totalApps; i += BATCH_SIZE) {
    const batch = appsData.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalApps / BATCH_SIZE);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches}: ${batch.map(a => a.name).join(', ')}`);
    
    const batchPromises = batch.map(async (app) => {
      const salesCopy = salesCopyData[app.id];
      if (!salesCopy) {
        console.warn(`⚠️  No tonality data for app: ${app.id} (${app.name}) - skipping`);
        failedApps.push(`${app.id} (no tonality)`);
        return null;
      }

      const tonality = salesCopy.tonality;
      const prompt = buildPrompt(app, tonality);

      let retries = 0;
      while (retries <= MAX_RETRIES) {
        try {
          const jsonStr = await callOpenAI(prompt);
          const parsed = JSON.parse(jsonStr);
          
          // Validate required fields
          if (!parsed.tagline || !parsed.whatItDoes || !parsed.howToProfit) {
            throw new Error('Missing required fields');
          }
          
          extended[app.id] = parsed;
          console.log(`✅ ${app.name} (${tonality})`);
          return null;
          
        } catch (error: any) {
          retries++;
          if (retries > MAX_RETRIES) {
            console.error(`❌ Failed after ${MAX_RETRIES} retries: ${app.name}`, error.message);
            failedApps.push(`${app.id} (${error.message})`);
            return null;
          }
          console.log(`🔁 Retry ${retries}/${MAX_RETRIES}: ${app.name}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // backoff
        }
      }
      return null;
    });

    await Promise.all(batchPromises);
    
    // Rate limit pause between batches (OpenAI rate limits)
    if (i + BATCH_SIZE < totalApps) {
      console.log(`⏳ Waiting 2 seconds before next batch...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Write output file
  const outputPath = path.join(__dirname, '../src/data/extendedSalesCopy.ts');
  const outputContent = `// Auto-generated extended sales copy for all apps\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `// Total: ${Object.keys(extended).length} / ${totalApps}\n\n` +
    `import type { ExtendedSalesCopy } from './appSalesCopy';\n\n` +
    `export const extendedSalesCopy: Record<string, ExtendedSalesCopy> = ${JSON.stringify(extended, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent, 'utf-8');

  // Report
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successfully generated: ${Object.keys(extended).length}/${totalApps}`);
  console.log(`❌ Failed: ${failedApps.length}`);
  
  if (failedApps.length > 0) {
    console.log('\nFailed apps:');
    failedApps.forEach(app => console.log(`  - ${app}`));
  }
  
  console.log(`\n📁 Output written to: ${outputPath}`);
  console.log('='.repeat(60) + '\n');
}

// Run
generateExtendedSalesCopy().catch(console.error);

Now output ONLY the JSON object:
`;
}

// ============================================
// LOAD DATA
// ============================================
function loadAppSalesCopy(): Record<string, { tonality: string }> {
  const filePath = path.join(__dirname, '../src/data/appSalesCopy.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract appId: { tonality: '...' } pairs using regex
  const regex = /'([^']+)':\s*\{[^}]*tonality:\s*'([^']+)'/g;
  const result: Record<string, { tonality: string }> = {};
  let match;

  while ((match = regex.exec(content)) !== null) {
    const appId = match[1];
    const tonality = match[2];
    result[appId] = { tonality };
  }

  return result;
}

function loadAppsData(): any[] {
  const filePath = path.join(__dirname, '../src/data/appsData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract rawAppsData array – need to evaluate the array
  // This is tricky; we'll use a simple approach: look for id: "xxx", name: "xxx", etc.
  // Better: use a TypeScript compiler, but for simplicity we'll parse manually
  const apps: any[] = [];
  const lines = content.split('\n');
  let currentApp: any = null;
  let inArray = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('const rawAppsData:')) {
      inArray = true;
      continue;
    }

    if (inArray) {
      if (line.startsWith('id:')) {
        if (currentApp) apps.push(currentApp);
        currentApp = { id: line.split(/id:\s*["']([^"']+)["']/)[1] };
      } else if (line.startsWith('name:')) {
        currentApp.name = line.split(/name:\s*["']([^"']+)["']/)[1];
      } else if (line.startsWith('description:')) {
        currentApp.description = line.split(/description:\s*["']([^"']+)["']/)[1];
      } else if (line.startsWith('category:')) {
        currentApp.category = line.split(/category:\s*["']([^"']+)["']/)[1];
      } else if (line.includes(']')) {
        break;
      }
    }
  }

  if (currentApp) apps.push(currentApp);
  return apps;
}

// ============================================
// MAIN GENERATION LOGIC
// ============================================
async function generateExtendedSalesCopy() {
  console.log('🚀 Starting extended sales copy generation...\n');

  const salesCopyData = loadAppSalesCopy();
  const appsData = loadAppsData();

  console.log(`📊 Loaded ${Object.keys(salesCopyData).length} apps with tonality data`);
  console.log(`📊 Loaded ${appsData.length} apps total\n`);

  // Build extended data
  const extended: Record<string, any> = {};

  // For each app in appsData, find its tonality
  for (const app of appsData) {
    const salesCopy = salesCopyData[app.id];
    if (!salesCopy) {
      console.log(`⚠️  No tonality data for app: ${app.id}`);
      continue;
    }

    const tonality = salesCopy.tonality;

    // Build prompt
    const prompt = buildPrompt(app, tonality);

    // Here we would call OpenAI API
    // For now, we'll create a placeholder structure
    console.log(`Generating for: ${app.name} (${app.id}) - ${tonality}`);

    // Simulate LLM response with structured placeholder
    extended[app.id] = {
      tonality,
      tagline: `Transform your ${app.category} with ${app.name}`,
      summary: `${app.name} helps you create amazing content with AI. Simple, fast, professional.`,
      whatItDoes: `${app.description} It streamlines workflows and boosts productivity.`,
      howItWorks: `First, upload your content. Then, let AI analyze and process. Finally, get polished results instantly.`,
      howToProfit: {
        forLocalBusinesses: `Offer ${app.name} as a service to your clients. Charge $200-800 per project. Target local businesses needing ${app.category} solutions. Potential revenue: $2,000-8,000 per month.`,
        forIndividuals: `Provide ${app.name} services on Fiverr or Upwork. Skill level: beginner friendly. Invest 5-10 hours weekly. Income potential: $500-2,000/month.`
      },
      whyYouNeedIt: `Struggling with ${app.description}? This tool automates the heavy lifting, delivering professional results in minutes not hours. Start today before your competitors do.`,
      useCases: [
        {
          industry: app.category,
          scenario: `Use ${app.name} for routine tasks`,
          outcome: `Save time and improve quality`
        }
      ],
      testimonials: [
        {
          quote: `This tool changed how we work. Highly recommended!`,
          name: "Local Business Owner",
          role: "Manager",
          businessType: "Small Business",
          rating: 5
        }
      ]
    };
  }

  // Write output file
  const outputPath = path.join(__dirname, '../src/data/extendedSalesCopy.ts');
  const outputContent = `// Auto-generated extended sales copy for all apps\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `export const extendedSalesCopy: Record<string, any> = ${JSON.stringify(extended, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`\n✅ Generated ${Object.keys(extended).length} extended sales copies`);
  console.log(`📁 Output: ${outputPath}`);
}

// Run
generateExtendedSalesCopy().catch(console.error);
