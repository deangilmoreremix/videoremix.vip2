#!/usr/bin/env node
/**
 * Final Batch Completion - MCP and Framework Crash Course Agents
 * This script processes the remaining 16 apps: mcp_ai_agents (4) + ai_agent_framework_crash_course (12)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read catalog
const catalog = JSON.parse(fs.readFileSync('./streamlit_apps_catalog.json', 'utf-8'));

// Target categories
const remainingCategories = ['mcp_ai_agents', 'ai_agent_framework_crash_course'];
const analysisDir = './scripts/conversion/output/analysis';
const functionsDir = './scripts/conversion/output/functions';
const componentsDir = './scripts/conversion/output/components';

fs.mkdirSync(analysisDir, { recursive: true });
fs.mkdirSync(functionsDir, { recursive: true });
fs.mkdirSync(componentsDir, { recursive: true });

const manifest = { category: 'remaining', apps: [] };

let total = 0, success = 0, fail = 0;

for (const category of remainingCategories) {
  const apps = catalog[category];
  if (!apps) {
    console.log(`Category ${category} not found in catalog`);
    continue;
  }
  
  for (const [appName, appInfo] of Object.entries(apps)) {
    total++;
    const mainFile = appInfo.main_file || appInfo.mainFile;
    if (!mainFile) {
      console.warn(`  [${category}] ${appName}: No main file, skipping`);
      fail++;
      continue;
    }
    
    const analysisPath = path.resolve(analysisDir, `${category}-${appName}.json`);
    
    // Step 1: Analyze
    try {
      const { execSync } = require('child_process');
      execSync(`node scripts/conversion/analyze-streamlit-app.js ${mainFile} ${analysisPath}`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`  [${category}] ${appName}: Analysis failed`);
      fail++;
      continue;
    }
    
    if (!fs.existsSync(analysisPath)) {
      console.error(`  [${category}] ${appName}: Analysis file not created`);
      fail++;
      continue;
    }
    
    // Step 2: Generate function
    try {
      const { execSync } = require('child_process');
      execSync(`npx ts-node scripts/conversion/generate-netlify-function.ts ${analysisPath} ${functionsDir}`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`  [${category}] ${appName}: Function generation failed`);
      fail++;
      continue;
    }
    
    // Step 3: Generate component
    try {
      const { execSync } = require('child_process');
      execSync(`npx ts-node scripts/conversion/generate-react-component.ts ${analysisPath} ${componentsDir}`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`  [${category}] ${appName}: Component generation failed`);
      fail++;
      continue;
    }
    
    success++;
    manifest.apps.push({
      appName,
      category,
      analysisFile: analysisPath,
      functionFile: path.join(functionsDir, path.basename(analysisPath, '.json') + '.ts'),
      componentFile: path.join(componentsDir, path.basename(analysisPath, '.json').replace(/_/g, '').replace(/-/g, '') + 'Page.tsx')
    });
    console.log(`  ✅ [${category}] ${appName}`);
  }
}

// Write manifest
fs.writeFileSync('./scripts/conversion/output/remaining_manifest.json', JSON.stringify(manifest, null, 2));

console.log(`\n✅ Remaining agents conversion complete: ${success}/${total} succeeded, ${fail} failed`);
console.log(`📄 Manifest: scripts/conversion/output/remaining_manifest.json`);
