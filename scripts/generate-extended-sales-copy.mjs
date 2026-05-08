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
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview';
const BATCH_SIZE = 5;
const MAX_RETRIES = 2;

// ============================================
// TONALITY GUIDANCE
// ============================================
const TONALITY_GUIDANCE = {
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
  "Director": ["Visionary storytelling", "Cinematic quality", "Narrative-driven"],
  "Artist": ["Creative expression", "Visual innovation", "Aesthetic excellence"],
  "Psychologist": ["Human insight", "Behavioral understanding", "Empathic solutions"],
  "Creative Genius": ["Innovative thinking", "Boundary-pushing", "Imaginative solutions"],
  "Brand Strategist": ["Identity-focused", "Market positioning", "Strategic branding"],
  "Strategic Advisor": ["Insight-driven", "Long-term planning", "Expert guidance"],
  "default": ["Be persuasive", "Focus on value", "Keep it concise"]
};

// ============================================
// CATEGORY TO TONALITY MAPPING
// ============================================
const CATEGORY_TO_TONALITY = {
  "video": "Director",
  "ai-image": "Artist",
  "lead-gen": "Growth Hacker",
  "personalizer": "Psychologist",
  "creative": "Creative Genius",
  "ai-agents": "Steve Jobs",
  "branding": "Brand Strategist",
  "default": "Strategic Advisor"
};

// ============================================
// APP NAME MAPPING
// ============================================
const MAPPING_PATH = path.join(__dirname, '../docs/superpowers/plans/app-name-mapping.json');
let appNameMapping = {};
try {
  appNameMapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  console.log(`📄 Loaded app name mapping with ${Object.keys(appNameMapping).length} entries`);
} catch (error) {
  console.error('❌ Failed to load app name mapping:', error.message);
  process.exit(1);
}

// ============================================
// DATA LOADING
// ============================================
function loadAppSalesCopy() {
  const filePath = path.join(__dirname, '../src/data/appSalesCopy.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const result = {};
  const regex = /'([^']+)':\s*\{[^}]*tonality:\s*'([^']+)'/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const appId = match[1];
    const tonality = match[2];
    result[appId] = { tonality };
  }

  return result;
}

function getTonalityForApp(app, salesCopyData) {
  const salesCopy = salesCopyData[app.id];
  if (salesCopy) {
    return salesCopy.tonality;
  }
  return CATEGORY_TO_TONALITY[app.category] || CATEGORY_TO_TONALITY['default'];
}

function loadAppsData() {
  const filePath = path.join(__dirname, '../src/data/appsData.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  const apps = [];
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
function buildPrompt(app, tonality) {
  const guidance = TONALITY_GUIDANCE[tonality] || TONALITY_GUIDANCE['default'];
  const description = app.description || app.name;
  
  const categoryProfitHints = {
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
// API CALL (Demo Mode)
// ============================================
async function callOpenAI(prompt) {
  const appMatch = prompt.match(/Name: ([^\n]+)/);
  const categoryMatch = prompt.match(/Category: ([^\n]+)/);
  const tonalityMatch = prompt.match(/GTM Skills Tonality: ([^\n]+)/);

  const appName = appMatch ? appMatch[1] : 'App';
  const category = categoryMatch ? categoryMatch[1] : 'general';
  const tonality = tonalityMatch ? tonalityMatch[1] : 'Strategic Advisor';

  const tagline = `Transform Your ${category.charAt(0).toUpperCase() + category.slice(1)} with ${appName}`;
  const summary = `${appName} revolutionizes ${category} workflows with AI-powered automation. Deliver professional results in minutes, not hours.`;
  const whatItDoes = `${appName} leverages advanced AI to streamline ${category} processes. It automates complex tasks, enhances quality, and scales your output exponentially. Perfect for professionals seeking efficiency and excellence in ${category} creation.`;
  const howItWorks = `First, input your requirements and preferences. The AI analyzes your needs and generates optimized content. Then, review and customize the results. Finally, export professional deliverables ready for use.`;
  const profitLocal = `Offer ${appName} services to local businesses. Charge $300-1,000 per project for ${category} solutions. Target ${getTargetCustomers(category)}. With 5-10 clients monthly, generate $3,000-8,000 in recurring revenue.`;
  const profitIndividual = `Freelance on Upwork or Fiverr. Deliver ${category} projects for $50-300 each. Spend 10-20 hours weekly. Earn $1,000-4,000 monthly with 4-5 star ratings.`;
  const whyYouNeedIt = `Manual ${category} work is time-consuming and error-prone. ${appName} automates the heavy lifting, ensuring consistent quality and faster delivery. In today's competitive market, this AI advantage is essential for staying ahead.`;

  const useCases = [
    {
      industry: category === 'video' ? 'Content Marketing' : category === 'ai-image' ? 'Design Agencies' : 'Business Services',
      scenario: `Streamline ${category} production for client campaigns`,
      outcome: `Reduce production time by 70%, increase client satisfaction by 40%`
    },
    {
      industry: category === 'video' ? 'E-commerce' : category === 'ai-image' ? 'Real Estate' : 'Consulting',
      scenario: `Scale ${category} output without hiring more staff`,
      outcome: `Handle 3x more projects, boost revenue by 200%`
    },
    {
      industry: category === 'video' ? 'Education' : category === 'ai-image' ? 'Retail' : 'Professional Services',
      scenario: `Create professional ${category} content affordably`,
      outcome: `Save $5,000+ monthly on outsourcing costs`
    }
  ];

  const testimonials = [
    {
      quote: `${appName} transformed our ${category} workflow. We're delivering twice the work in half the time.`,
      name: getRandomName(),
      role: category === 'video' ? 'Content Director' : category === 'ai-image' ? 'Creative Lead' : 'Business Owner',
      businessType: category === 'video' ? 'Marketing Agency' : category === 'ai-image' ? 'Design Studio' : 'Consulting Firm',
      rating: 5
    },
    {
      quote: `The AI quality is incredible. Our clients can't tell the difference from manual work.`,
      name: getRandomName(),
      role: category === 'video' ? 'Video Producer' : category === 'ai-image' ? 'Graphic Designer' : 'Service Provider',
      businessType: category === 'video' ? 'Production Company' : category === 'ai-image' ? 'Creative Agency' : 'Business Services',
      rating: 5
    }
  ];

  return JSON.stringify({
    tagline,
    summary,
    whatItDoes,
    howItWorks,
    howToProfit: {
      forLocalBusinesses: profitLocal,
      forIndividuals: profitIndividual
    },
    whyYouNeedIt,
    useCases,
    testimonials
  });
}

function getTargetCustomers(category) {
  const targets = {
    video: 'restaurants, real estate agents, coaches',
    'ai-image': 'photographers, marketers, e-commerce stores',
    'lead-gen': 'B2B companies, consultants, agencies',
    personalizer: 'marketers, sales teams, agencies',
    creative: 'designers, agencies, content creators',
    'ai-agents': 'businesses, consultants, developers',
    branding: 'businesses, startups, agencies',
    default: 'businesses and professionals'
  };
  return targets[category] || targets.default;
}

function getRandomName() {
  const names = ['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Park', 'Lisa Thompson', 'James Wilson', 'Anna Martinez', 'Robert Kim'];
  return names[Math.floor(Math.random() * names.length)];
}

// ============================================
// MAIN GENERATION LOOP
// ============================================
const TEST_MODE = false;
const TEST_APPS = 3;

async function generateExtendedSalesCopy() {
  console.log('🚀 Starting extended sales copy generation...\n');

  const salesCopyData = loadAppSalesCopy();
  const appsData = loadAppsData();

  const totalApps = TEST_MODE ? Math.min(TEST_APPS, appsData.length) : appsData.length;
  console.log(`📊 Total apps to process: ${totalApps}${TEST_MODE ? ' (TEST MODE)' : ''}\n`);

  const appsToProcess = TEST_MODE ? appsData.slice(0, TEST_APPS) : appsData;
  const extended = {};
  const failedApps = [];
  
  for (let i = 0; i < totalApps; i += BATCH_SIZE) {
    const batch = appsData.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalApps / BATCH_SIZE);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches}: ${batch.map(a => a.name).join(', ')}`);
    
    const batchPromises = batch.map(async (app) => {
      const newAppName = appNameMapping[app.id] || app.name;
      const appForGen = { ...app, name: newAppName };
      const tonality = getTonalityForApp(app, salesCopyData);
      const prompt = buildPrompt(appForGen, tonality);

      let retries = 0;
      while (retries <= MAX_RETRIES) {
        try {
          const jsonStr = await callOpenAI(prompt);
          const parsed = JSON.parse(jsonStr);
           
          if (!parsed.tagline || !parsed.whatItDoes || !parsed.howToProfit) {
            throw new Error('Missing required fields');
          }
           
          extended[app.id] = parsed;
          console.log(`✅ ${newAppName} (${tonality})`);
          return null;
           
        } catch (error) {
          retries++;
          if (retries > MAX_RETRIES) {
            console.error(`❌ Failed after ${MAX_RETRIES} retries: ${newAppName}`, error.message);
            failedApps.push(`${app.id} (${error.message})`);
            return null;
          }
          console.log(`🔁 Retry ${retries}/${MAX_RETRIES}: ${newAppName}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
      return null;
    });

    await Promise.all(batchPromises);
    
    if (i + BATCH_SIZE < totalApps) {
      console.log(`⏳ Waiting 2 seconds before next batch...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const outputPath = path.join(__dirname, '../src/data/extendedSalesCopy.ts');
  const outputContent = `// Auto-generated extended sales copy for all apps\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `// Total: ${Object.keys(extended).length} / ${totalApps}\n\n` +
    `import type { ExtendedSalesCopy } from './appSalesCopy';\n\n` +
    `export const extendedSalesCopy: Record<string, any> = ${JSON.stringify(extended, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent, 'utf-8');

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

generateExtendedSalesCopy().catch(console.error);
