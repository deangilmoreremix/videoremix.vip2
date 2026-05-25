#!/usr/bin/env node
/**
 * Update React agent pages to call Supabase Edge Functions instead of Netlify Functions
 *
 * Transformation:
 *   fetch('/.netlify/functions/function-name', { ... })
 *   →
 *   fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/function-name`, { ... })
 *
 * This keeps the same fetch API (no need to change .json() logic).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const agentsDir = path.join(rootDir, 'src', 'pages', 'agents');

// Process all .tsx files in agents directory
const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.tsx'));

let updated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(agentsDir, file);
  const original = fs.readFileSync(filePath, 'utf-8');

  // Check if this file contains a Netlify function fetch
  if (!original.includes('/.netlify/functions/')) {
    skipped++;
    continue;
  }

  // Replace fetch URL pattern: '/.netlify/functions/xxx' → `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xxx`
  const updatedCode = original.replace(
    /fetch\(['"]\/\.netlify\/functions\/([^'"]+)['"]/g,
    (match, functionName) => {
      return `fetch(\`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}\``;
    }
  );

  if (updatedCode !== original) {
    fs.writeFileSync(filePath, updatedCode, 'utf-8');
    console.log(`✅ Updated: ${file}`);
    updated++;
  } else {
    // Might have already been updated
    skipped++;
  }
}

console.log(`\n📊 Update complete: ${updated} files updated, ${skipped} skipped\n`);
console.log(`⚠️  Ensure VITE_SUPABASE_URL is defined in your .env file (already present).`);
