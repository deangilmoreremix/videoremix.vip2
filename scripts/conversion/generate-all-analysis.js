#!/usr/bin/env node
/**
 * Complete Analysis Generator - Processes entire catalog
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CATALOG = './streamlit_apps_catalog.json';
const ANALYSIS_DIR = './scripts/conversion/output/analysis';

// Load catalog
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf-8'));

let total = 0, success = 0, fail = 0;

console.log('\n🔍 Generating analysis for all apps...\n');

for (const [category, apps] of Object.entries(catalog)) {
  if (category === 'awesome_agent_skills') continue; // empty
  
  for (const [appName, appInfo] of Object.entries(apps)) {
    total++;
    const mainFile = appInfo.main_file || appInfo.mainFile;
    if (!mainFile) {
      console.warn(`  ⚠️  ${category}/${appName}: no main_file`);
      fail++;
      continue;
    }
    
    // Prepend root directory (catalog paths are relative)
    const fullPath = path.join('awesome-llm-apps', mainFile);
    if (!fs.existsSync(fullPath)) {
      console.warn(`  ⚠️  ${category}/${appName}: file not found: ${fullPath}`);
      fail++;
      continue;
    }
    
    // Safe name
    const safeName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const outPath = path.join(ANALYSIS_DIR, `${category}-${safeName}.json`);
    
    try {
      execSync(`node scripts/conversion/analyze-streamlit-app.js "${fullPath}" "${outPath}"`, { stdio: 'pipe' });
      if (fs.existsSync(outPath)) {
        console.log(`  ✅ ${category}/${appName}`);
        success++;
      } else {
        throw new Error('output not created');
      }
    } catch (e) {
      console.error(`  ❌ ${category}/${appName}: ${e.message}`);
      fail++;
    }
  }
}

console.log(`\n📊 Analysis generation: ${success}/${total} succeeded, ${fail} failed`);
console.log(`📁 Analysis files: ${ANALYSIS_DIR}/`);

const count = fs.readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('.json')).length;
console.log(`📈 Total analysis files: ${count}\n`);
