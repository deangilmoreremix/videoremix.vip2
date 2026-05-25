#!/usr/bin/env node
/**
 * Generate stub Edge Functions for all React agent pages that don't have one yet.
 * This ensures frontend fetch calls won't 404 while real implementations are in progress.
 *
 * Usage: node scripts/generate-stub-functions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const agentsDir = path.join(rootDir, 'src', 'pages', 'agents');
const supabaseDir = path.join(rootDir, 'supabase', 'functions');

// Convert PascalCase/camelCase to kebab-case
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Get all React page files
const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.tsx') && !f.includes('index'));

console.log(`\n🔍 Found ${files.length} React agent pages\n`);

let created = 0;
let skipped = 0;

for (const file of files) {
  // Derive function name: Page.tsx → strip "Page", convert to kebab-case
  let baseName = file.replace('.tsx', ''); // e.g., AiBlogToPodcastAgentPage
  if (baseName.endsWith('Page')) {
    baseName = baseName.slice(0, -4); // remove "Page"
  }
  // If ends with "AgentPage" remove both: e.g., AiBlogToPodcastAgent → ai-blog-to-podcast-agent
  // Actually pattern: many end with "AgentPage" and some have "AIPage". Let's just kebab-case the whole thing.
  const functionName = toKebabCase(baseName);

  const targetDir = path.join(supabaseDir, functionName);
  const targetFile = path.join(targetDir, 'index.ts');

  // Skip if already exists (migrated)
  if (fs.existsSync(targetFile)) {
    skipped++;
    continue;
  }

  // Create stub Edge Function
  const stubCode = `/**
 * Edge Function: ${functionName}
 * Auto-generated stub. Replace with real implementation.
 *
 * Corresponding React page: ${file}
 * Category: TODO
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse } from '../_shared/utils.ts';

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();

    // TODO: Implement actual agent logic for ${functionName}
    // See netlify/functions/ for reference implementations (if any)
    // Or create new OpenAI/Anthropic calls as needed

    return jsonResponse({
      status: 'coming_soon',
      message: 'This agent is under active development. Check back soon!',
      function: '${functionName}',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, status: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
`;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, stubCode, 'utf-8');
  created++;
}

console.log(`\n📊 Stub generation: ${created} created, ${skipped} skipped (already exist)\n`);

// Report
fs.writeFileSync(
  path.join(rootDir, 'docs', 'stub-functions-report.json'),
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalReactPages: files.length,
      stubsCreated: created,
      alreadyPresent: skipped,
    },
    null,
    2
  )
);
