#!/usr/bin/env node
/**
 * Netlify → Supabase Edge Function Migration Script
 * Converts Netlify Functions (Node.js, handler(event)) to Supabase Edge Functions (Deno.serve)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const netlifyDir = path.join(rootDir, 'netlify', 'functions');
const supabaseDir = path.join(rootDir, 'supabase', 'functions');

// Package name mappings for Deno compatibility
const packageMap = {
  '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.39.7',
  openai: 'npm:openai@4.78.1',
  '@anthropic-ai/sdk': 'npm:anthropic@0.39.0',
  exa: 'npm:exa-js@4.0.0',
};

function mapImport(importPath) {
  if (importPath.startsWith('npm:')) return importPath;
  if (packageMap[importPath]) return packageMap[importPath];
  return importPath;
}

function transformCode(source, functionName) {
  let code = source;

  // 1. Convert import statements to Deno npm: specifiers
  code = code.replace(
    /^import\s+(\w+)\s+from\s+'([^']+)'/gm,
    (match, binding, modulePath) => {
      const mapped = mapImport(modulePath);
      return `import ${binding} from '${mapped}';`;
    }
  );

  // 2. Replace process.env.VAR
  code = code.replace(/process\.env\.([A-Z_][A-Z0-9_]*)/g, "Deno.env.get('$1')");

  // 3. Convert handler export to Deno.serve
  code = code.replace(
    /export\s+async\s+function\s+handler\s*\(\s*event\s*:\s*\w+\s*\)\s*{/,
    `Deno.serve(async (req: Request) => {`
  );

  // 4. Replace event.* patterns
  code = code.replace(/event\.httpMethod/g, 'req.method');
  code = code.replace(/await event\.body\.text\(\)/g, 'await req.text()');
  // For JSON body: event.body → await req.json()
  // Already handled in most functions via JSON.parse(event.body)
  code = code.replace(/JSON\.parse\(event\.body\)/g, 'await req.json()');

  // 5. Replace returns: { statusCode, body: JSON.stringify(...) }
  code = code.replace(
    /return\s*{\s*statusCode:\s*(\d+)\s*,\s*body:\s*(JSON\.stringify\([^)]+\)|'[^']*'|"[^"]*")\s*}/g,
    (match, status, body) => {
      return `return new Response(${body}, { status: ${status}, headers: { 'Content-Type': 'application/json', ...corsHeaders } });`;
    }
  );

  // 6. Add CORS preflight handler inside Deno.serve
  const corsHandler = `
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
`;
  code = code.replace(
    /Deno\.serve\(async\s*\(req:\s*Request\)\s*=>\s*{/,
    `Deno.serve(async (req: Request) => {${corsHandler}`
  );

  // 7. Add import for corsHeaders and jsonResponse/errorResponse if used
  if (!code.includes("from '../_shared/utils.ts'")) {
    const importBlock = `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

`;
    code = importBlock + code;
  }

  // 8. Fix common mismatches: jsonResponse() calls need to return Response
  // In Netlify they returned object with statusCode/body — we converted above.
  // If code already uses jsonResponse/errorResponse, they already return Response objects. Keep as-is.

  // 9. Ensure Deno.serve closing brace
  // We have the closing brace later

  return code;
}

function migrateFunction(functionName) {
  const sourceFile = path.join(netlifyDir, `${functionName}.ts`);
  const targetDir = path.join(supabaseDir, functionName);
  const targetFile = path.join(targetDir, 'index.ts');

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source not found: ${sourceFile}`);
    return false;
  }

  const sourceCode = fs.readFileSync(sourceFile, 'utf-8');

  if (!sourceCode.includes('export async function handler')) {
    console.warn(`⚠️  Skipping ${functionName}: not a Netlify function`);
    return false;
  }

  const transformed = transformCode(sourceCode, functionName);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, transformed, 'utf-8');

  console.log(`✅ Migrated: ${functionName}`);
  return true;
}

// Main
const netlifyFiles = fs.readdirSync(netlifyDir).filter((f) => f.endsWith('.ts'));

console.log(`\n🔍 Found ${netlifyFiles.length} Netlify functions to migrate\n`);

let success = 0;
let failed = 0;

for (const file of netlifyFiles) {
  const functionName = path.basename(file, '.ts');
  try {
    if (migrateFunction(functionName)) {
      success++;
    } else {
      failed++;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${functionName}:`, error.message);
    failed++;
  }
}

console.log(`\n📊 Migration complete: ${success} succeeded, ${failed} failed\n`);

// Save report
const report = {
  timestamp: new Date().toISOString(),
  total: netlifyFiles.length,
  succeeded: success,
  failed,
  functions: netlifyFiles.map((f) => ({
    name: path.basename(f, '.ts'),
    migrated: fs.existsSync(path.join(supabaseDir, path.basename(f, '.ts'), 'index.ts')),
  })),
};

const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'migration-report.json'), JSON.stringify(report, null, 2));
console.log(`📄 Report saved to docs/migration-report.json`);
