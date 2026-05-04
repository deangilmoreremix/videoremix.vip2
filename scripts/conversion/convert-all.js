#!/usr/bin/env node
/**
 * FINAL BATCH CONVERSION - All 111+ Apps
 * 
 * Processes all categories from streamlit_apps_catalog.json:
 * - starter_ai_agents (16)
 * - voice_ai_agents (3)
 * - rag_tutorials (20)
 * - advanced_ai_agents (37)
 * - mcp_ai_agents (4)
 * - ai_agent_framework_crash_course (12)
 * 
 * Output:
 * - scripts/conversion/output/analysis/*.json
 * - scripts/conversion/output/functions/*.ts
 * - scripts/conversion/output/components/*.tsx
 * - scripts/conversion/output/*_manifest.json (one per category)
 * - scripts/conversion/output/final_manifest.json (combined)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { execSync } = require('child_process');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_PATH = './streamlit_apps_catalog.json';
const ANALYSIS_DIR = './scripts/conversion/output/analysis';
const FUNCTIONS_DIR = './scripts/conversion/output/functions';
const COMPONENTS_DIR = './scripts/conversion/output/components';

// Ensure output dirs exist
[ANALYSIS_DIR, FUNCTIONS_DIR, COMPONENTS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Load catalog
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
const categories = Object.keys(catalog);

console.log(`\n🚀 Starting batch conversion of ${categories.length} categories...\n`);

const finalManifest = { categories: {}, summary: { total: 0, success: 0, fail: 0 } };

for (const category of categories) {
  console.log(`📁 Processing category: ${category}`);
  const apps = catalog[category];
  const manifest = { category, apps: [] };
  
  let catTotal = 0, catSuccess = 0, catFail = 0;
  
  for (const [appName, appInfo] of Object.entries(apps)) {
    catTotal++;
    finalManifest.summary.total++;
    
    // Get main file path
    const mainFile = appInfo.main_file || appInfo.mainFile;
    if (!mainFile) {
      console.warn(`  ⚠️  ${appName}: No main_file, skipping`);
      catFail++;
      finalManifest.summary.fail++;
      continue;
    }
    
    // Normalize app name for file naming
    const safeName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const analysisPath = path.resolve(ANALYSIS_DIR, `${category}-${safeName}.json`);
    
    try {
      // Step 1: Analyze
      execSync(`node scripts/conversion/analyze-streamlit-app.js ${mainFile} ${analysisPath}`, { stdio: 'pipe' });
      
      if (!fs.existsSync(analysisPath)) {
        throw new Error('Analysis file not created');
      }
      
      // Step 2: Generate Function
      execSync(`npx ts-node scripts/conversion/generate-netlify-function.ts ${analysisPath} ${FUNCTIONS_DIR}`, { stdio: 'pipe' });
      
      // Step 3: Generate Component
      execSync(`npx ts-node scripts/conversion/generate-react-component.ts ${analysisPath} ${COMPONENTS_DIR}`, { stdio: 'pipe' });
      
      // Find generated files
      const analysisBase = path.basename(analysisPath, '.json');
      const functionFile = path.join(FUNCTIONS_DIR, analysisBase + '.ts');
      const componentName = safeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
      const componentFile = path.join(COMPONENTS_DIR, componentName + '.tsx');
      
      if (!fs.existsSync(functionFile) || !fs.existsSync(componentFile)) {
        throw new Error('Generated files not found');
      }
      
      manifest.apps.push({
        appName,
        safeName,
        mainFile,
        analysisFile: analysisPath,
        functionFile,
        componentFile,
        componentName
      });
      
      console.log(`  ✅ ${appName}`);
      catSuccess++;
      finalManifest.summary.success++;
      
    } catch (err) {
      console.error(`  ❌ ${appName}: ${err.message}`);
      catFail++;
      finalManifest.summary.fail++;
    }
  }
  
  // Write category manifest
  fs.writeFileSync(path.join(ANALYSIS_DIR, `../${category}_manifest.json`), JSON.stringify(manifest, null, 2));
  finalManifest.categories[category] = manifest;
  
  console.log(`   📊 ${category}: ${catSuccess}/${catTotal} succeeded\n`);
}

// Write final manifest
fs.writeFileSync('./scripts/conversion/output/final_manifest.json', JSON.stringify(finalManifest, null, 2));

console.log('='.repeat(60));
console.log(`✅ BATCH CONVERSION COMPLETE`);
console.log(`   Total: ${finalManifest.summary.total}`);
console.log(`   Success: ${finalManifest.summary.success}`);
console.log(`   Failed: ${finalManifest.summary.fail}`);
console.log(`   Manifest: scripts/conversion/output/final_manifest.json`);
console.log('='.repeat(60));
console.log('\n🔧 Next steps:');
console.log('   1. Review generated functions and components');
console.log('   2. Run: node scripts/conversion/register-all-generated.js');
console.log('   3. Build: npm run build');
console.log('   4. Deploy: bash DEPLOY_FUNCTIONS_LOCAL.sh && npm run deploy:netlify');
