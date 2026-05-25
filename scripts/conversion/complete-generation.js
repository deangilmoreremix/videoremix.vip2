#!/usr/bin/env node
/**
 * Completion Script - Generate functions and components for all remaining analysis files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ANALYSIS_DIR = './scripts/conversion/output/analysis';
const FUNCTIONS_DIR = './scripts/conversion/output/functions';
const COMPONENTS_DIR = './scripts/conversion/output/components';

// Get all analysis JSON files
const files = fs.readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));

console.log(`\n🔧 Completing generation for ${files.length} analysis files...\n`);

let success = 0, fail = 0;

for (const file of files) {
  const analysisPath = path.join(ANALYSIS_DIR, file);
  const baseName = path.basename(file, '.json');
  
  try {
    // Check if function already exists
    const funcPath = path.join(FUNCTIONS_DIR, baseName + '.ts');
    if (!fs.existsSync(funcPath)) {
      execSync(`npx ts-node scripts/conversion/generate-netlify-function.ts ${analysisPath} ${FUNCTIONS_DIR}`, { stdio: 'pipe' });
    }
    
    // Check if component already exists
    const safeName = baseName.replace(/^[a-z0-9]+-/, '').replace(/_/g, '-');
    const componentName = safeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
    const compPath = path.join(COMPONENTS_DIR, componentName + '.tsx');
    if (!fs.existsSync(compPath)) {
      execSync(`npx ts-node scripts/conversion/generate-react-component.ts ${analysisPath} ${COMPONENTS_DIR}`, { stdio: 'pipe' });
    }
    
    console.log(`  ✅ ${baseName}`);
    success++;
  } catch (err) {
    console.error(`  ❌ ${baseName}: ${err.message}`);
    fail++;
  }
}

console.log(`\n📊 Completion: ${success} processed, ${fail} failed\n`);

// Build final manifest
const manifest = { categories: {}, summary: { total: files.length, success, fail } };

for (const file of files) {
  const analysisPath = path.join(ANALYSIS_DIR, file);
  const data = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  const baseName = path.basename(file, '.json');
  
  // Derive component name
  const safeName = baseName.replace(/^[a-z0-9]+-/, '').replace(/_/g, '-');
  const componentName = safeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
  
  const entry = {
    appName: data.appName || safeName,
    category: data.category || 'unknown',
    componentName,
    analysisFile: analysisPath,
    functionFile: path.join(FUNCTIONS_DIR, baseName + '.ts'),
    componentFile: path.join(COMPONENTS_DIR, componentName + '.tsx'),
    uiType: data.uiType,
    complexity: data.complexity
  };
  
  if (!manifest.categories[entry.category]) {
    manifest.categories[entry.category] = { apps: [] };
  }
  manifest.categories[entry.category].apps.push(entry);
}

fs.writeFileSync('./scripts/conversion/output/final_manifest.json', JSON.stringify(manifest, null, 2));

console.log('📄 Final manifest created: scripts/conversion/output/final_manifest.json');
console.log('🔧 Next: node scripts/conversion/register-apps.js scripts/conversion/output/final_manifest.json');
