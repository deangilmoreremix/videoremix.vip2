#!/usr/bin/env node
/**
 * LLM Batch Generator for Extended Sales Copy
 *
 * Generates tonality-specific sales copy for all 134 apps using OpenAI GPT-4.
 * Outputs to src/data/extendedSalesCopy.ts
 *
 * Usage:
 * 1. Set OPENAI_API_KEY in .env
 * 2. node scripts/generate-extended-sales-copy.js [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run    Validate prompts without making API calls
 *   --limit=N    Only generate for first N apps (for testing)
 *
 * Requirements:
 * - OPENAI_API_KEY environment variable
 * - src/data/appSalesCopy.ts (contains tonality mappings for existing apps)
 * - src/data/appsData.ts (contains app metadata)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load app data
const appSalesCopyPath = path.join(rootDir, 'src', 'data', 'appSalesCopy.ts');
const appsDataPath = path.join(rootDir, 'src', 'data', 'appsData.ts');

// Dynamic import of TypeScript files (simple approach: use eval or require after transpile)
// For simplicity, we'll read the files and parse with regex (production would use ts-node)

function extractSalesCopyMap(content: string): Record<string, any> {
  // Find the exported appSalesCopy object
  const match = content.match(/export\s+const\s+appSalesCopy\s*=\s*\{([\s\S]*?)\};/);
  if (!match) return {};
  const objBody = match[1];
  // Parse key-value pairs: "appId": { ... }
  const entries: Record<string, any> = {};
  const entryRegex = /"([^"]+)":\s*(\{[^}]+\})/g;
  let m;
  while ((m = entryRegex.exec(objBody)) !== null) {
    const key = m[1];
    const valueStr = m[2];
    try {
      // Use eval in a sandboxed way (this is a build script, ok)
      entries[key] = eval(`(${valueStr})`);
    } catch (e) {
      console.warn(`Failed to parse value for ${key}:`, e.message);
    }
  }
  return entries;
}

function extractAppsData(content: string): Record<string, any> {
  // Find exported appsData array
  const match = content.match(/export\s+const\s+appsData\s*=\s*\[([\s\S]*?)\];/);
  if (!match) return [];
  const arrayBody = match[1];
  // Split by },\s*{ (naive)
  const items = arrayBody.split(/},\s*{/);
  const apps: Record<string, any>[] = [];
  items.forEach((itemStr, idx) => {
    try {
      // Add back braces
      const jsonStr = idx === 0 ? itemStr + '}' : '{' + itemStr + (idx === items.length - 1 ? '' : '}');
      // Convert to valid JSON (single quotes to double, trailing commas removed)
      const jsonReady = jsonStr.replace(/'/g, '"').replace(/(\w+):/g, '"$1":').replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
      const obj = JSON.parse(jsonReady);
      apps.push(obj);
    } catch (e) {
      console.warn(`Failed to parse app at index ${idx}:`, e.message);
    }
  });
  return apps;
}

// ExtendedSalesCopy interface
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
  useCases: Array<{ industry: string; scenario: string; outcome: string }>;
  testimonials: Array<{
    quote: string;
    name: string;
    role: string;
    businessType: string;
    rating: number;
  }>;
}

// Tonality guidance
const TONALITY_GUIDANCE: Record<string, string[]> = {
  'Steve Jobs': ['Reality distortion field', 'Emphasize simplicity & elegance', 'Use "revolutionary", "game-changing"'],
  'Seth Godin': ['Remarkable, shareworthy', 'Story-driven', 'Purple Cow thinking'],
  'Chris Voss': ['Tactical empathy', 'Mirroring language', 'Psychological precision'],
  'Jeff Bezos': ['Customer-obsessed', 'Day 1 mentality', 'Long-term thinking'],
  'Challenger Sale': ['Insight-led', 'Teach & tailor', 'Confident disruption'],
  'Trusted Advisor': ['Relationship-first', 'Trust before sell', 'Steady guidance'],
  'Cormac McCarthy': ['Sparse & visionary', 'Atmospheric', 'Profound simplicity'],
  'Hemingway': ['Direct & clear', 'Strong verbs', 'No fluff'],
  'Value-Based': ['ROI-focused', 'Quantify everything', 'Numbers-driven'],
  'Pain Point Research': ['Diagnostic', 'Question-led discovery', 'Problem-first'],
  'David Ogilvy': ['Benefit-driven', 'Proven formulas', 'Headline thinking'],
  'Growth Hacker': ['Scalable loops', 'Experiment-fast', 'Metrics-obsessed'],
};

// Category → tonality distribution hint
const CATEGORY_TONALITY: Record<string, string[]> = {
  video: ['Steve Jobs', 'Hemingway', 'Growth Hacker'],
  'ai-image': ['Seth Godin', 'Cormac McCarthy', 'Visionary'],
  creative: ['Seth Godin', 'David Ogilvy', 'Innovative'],
  'lead-gen': ['Challenger Sale', 'Value-Based', 'Trusted Advisor'],
  personalizer: ['Chris Voss', 'Pain Point Research', 'Socratic'],
  branding: ['Jeff Bezos', 'Trusted Advisor', 'Strategic'],
};

async function generateExtendedCopy(
  app: any,
  tonality: string,
  openai: OpenAI
): Promise<ExtendedSalesCopy> {
  const prompt = `You are writing persuasive sales copy for a SaaS app called "${app.name}" sold to local businesses & individuals.

App description: ${app.description}
Category: ${app.category}
GTM Skills Tonality: ${tonality}

Write concise, scannable copy (50-100 words per core section). Output valid JSON:

{
  "tonality": "${tonality}",
  "tagline": "5-12 word hook (compelling, benefit-driven)",
  "summary": "1-2 sentence elevator pitch",
  "whatItDoes": "50-80 words explaining core functionality",
  "howItWorks": "Brief narrative: first [step], then [step], finally [step]. 3-5 steps, 60-100 words total.",
  "howToProfit": {
    "forLocalBusinesses": "What service model? Who pays? What price range? Potential monthly revenue. 3-4 sentences.",
    "forIndividuals": "What side-hustle service to offer? Which platforms (Fiverr/Upwork/local)? How much time? Income potential. 3-4 sentences."
  },
  "whyYouNeedIt": "Start with pain point (1 sentence). Then value proposition in ${tonality} voice (2 sentences). End with urgency/trend (1 sentence). Total 3-4 sentences.",
  "useCases": [{"industry":"...", "scenario":"...", "outcome":"..."}],
  "testimonials": [{"quote":"1-2 sentence realistic quote","name":"...","role":"...","businessType":"...","rating":5}]
}

Tonality traits: ${TONALITY_GUIDANCE[tonality]?.join(', ') || 'N/A'}

Now output ONLY the JSON object.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are a world-class copywriter specializing in concise, persuasive SaaS sales copy.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e.message}\nRaw: ${content}`);
  }
}

function generateTypeScriptExports(data: Record<string, ExtendedSalesCopy>): string {
  const lines: string[] = [];
  lines.push('// Auto-generated by scripts/generate-extended-sales-copy.js');
  lines.push('// DO NOT EDIT MANUALLY — re-run the script to update');
  lines.push('');
  lines.push('export const extendedSalesCopy: Record<string, ExtendedSalesCopy> = {');
  for (const [appId, copy] of Object.entries(data)) {
    lines.push(`  "${appId}": {`);
    lines.push(`    tonality: ${JSON.stringify(copy.tonality)},`);
    lines.push(`    tagline: ${JSON.stringify(copy.tagline)},`);
    lines.push(`    summary: ${JSON.stringify(copy.summary)},`);
    lines.push(`    whatItDoes: ${JSON.stringify(copy.whatItDoes)},`);
    lines.push(`    howItWorks: ${JSON.stringify(copy.howItWorks)},`);
    lines.push(`    howToProfit: {`);
    lines.push(`      forLocalBusinesses: ${JSON.stringify(copy.howToProfit.forLocalBusinesses)},`);
    lines.push(`      forIndividuals: ${JSON.stringify(copy.howToProfit.forIndividuals)},`);
    lines.push(`    },`);
    lines.push(`    whyYouNeedIt: ${JSON.stringify(copy.whyYouNeedIt)},`);
    lines.push(`    useCases: ${JSON.stringify(copy.useCases)},`);
    lines.push(`    testimonials: ${JSON.stringify(copy.testimonials)}`);
    lines.push(`  },`);
  }
  lines.push('};');
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitMatch = args.find((a) => a.startsWith('--limit='));
  const limit = limitMatch ? parseInt(limitMatch.split('=')[1]) : Infinity;

  // Check API key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('❌ OPENAI_API_KEY is required');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: openaiKey });

  // Load source files
  console.log('📖 Loading app data...\n');
  const appSalesCopySrc = fs.readFileSync(appSalesCopyPath, 'utf-8');
  const appsDataSrc = fs.readFileSync(appsDataPath, 'utf-8');

  const salesCopyMap = extractSalesCopyMap(appSalesCopySrc);
  const appsData = extractAppsData(appsDataSrc);

  console.log(`📊 Found ${appsData.length} apps in appsData`);
  console.log(`📊 Found ${Object.keys(salesCopyMap).length} apps in appSalesCopy (tonality source)\n`);

  // Build apps with tonality
  const appsWithTonality = appsData.filter((app: any) => {
    const tonality = salesCopyMap[app.id]?.tonality;
    return tonality && TONALITY_GUIDANCE[tonality];
  });

  console.log(`🎯 ${appsWithTonality.length} apps have tonality mapped\n`);

  if (appsWithTonality.length === 0) {
    console.error('❌ No apps with tonality found. Check appSalesCopy.ts and TONALITY_GUIDANCE.');
    process.exit(1);
  }

  const toProcess = appsWithTonality.slice(0, limit);
  console.log(`🚀 Generating extended copy for ${toProcess.length} apps...\n`);

  const results: Record<string, ExtendedSalesCopy> = {};

  for (let i = 0; i < toProcess.length; i++) {
    const app = toProcess[i];
    const tonality = salesCopyMap[app.id].tonality;
    console.log(`[${i + 1}/${toProcess.length}] Generating: ${app.name} (${tonality})`);

    if (dryRun) {
      console.log('   (dry run — skipping API call)');
      continue;
    }

    try {
      const copy = await generateExtendedCopy(app, tonality, openai);
      results[app.id] = copy;
      console.log(`   ✅ Done — tagline: "${copy.tagline.substring(0, 50)}..."`);
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      // Continue with next app
    }
  }

  if (dryRun) {
    console.log('\n✅ Dry run complete. No files written.');
    return;
  }

  // Write output file
  const outputPath = path.join(rootDir, 'src', 'data', 'extendedSalesCopy.ts');
  const outputContent = generateTypeScriptExports(results);
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`\n📝 Wrote ${outputPath} (${results.length} apps)`);

  // Summary report
  console.log('\n📊 Generation Summary:');
  console.log(`   Total attempted: ${toProcess.length}`);
  console.log(`   Successful: ${Object.keys(results).length}`);
  console.log(`   Failed: ${toProcess.length - Object.keys(results).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
