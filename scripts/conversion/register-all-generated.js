#!/usr/bin/env node
/**
 * Final Registration - Flattens manifest and registers all generated apps
 */

import fs from 'fs';
import { execSync } from 'child_process';

const MANIFEST_PATH = './scripts/conversion/output/final_manifest.json';
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

// Flatten all apps from all categories
const allApps = [];
for (const [catName, catData] of Object.entries(manifest.categories)) {
  if (Array.isArray(catData.apps)) {
    catData.apps.forEach(app => {
      // Add required fields for registration
      allApps.push({
        ...app,
        appSlug: app.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
        template: app.uiType || 'form'
      });
    });
  }
}

console.log(`\n📋 Flattened ${allApps.length} apps from manifest\n`);

// Write flat manifest
const flatPath = './scripts/conversion/output/flat-manifest.json';
fs.writeFileSync(flatPath, JSON.stringify(allApps, null, 2));
console.log(`📄 Flat manifest written to ${flatPath}\n`);

// Now run the register script
console.log('🚀 Starting registration...\n');
execSync(`npx ts-node scripts/conversion/register-apps.ts ${flatPath}`, { stdio: 'inherit' });

console.log('\n✅ Registration complete!');
console.log('🔧 Next steps:');
console.log('   1. Review changes: git diff src/App.tsx src/data/appsData.ts');
console.log('   2. Build: npm run build');
console.log('   3. Deploy functions: bash DEPLOY_FUNCTIONS_LOCAL.sh');
console.log('   4. Deploy frontend: npm run deploy:netlify');
