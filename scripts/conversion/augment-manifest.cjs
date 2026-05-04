#!/usr/bin/env node
/**
 * Augment flat manifest with required fields for registration
 */

const fs = require('fs');

const inputPath = './scripts/conversion/output/flat-manifest.json';
const outputPath = './scripts/conversion/output/flat-manifest-augmented.json';

const apps = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

let addedSlug = 0, addedTemplate = 0;

apps.forEach(app => {
  if (!app.appSlug) {
    app.appSlug = app.appName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    addedSlug++;
  }
  if (!app.template) {
    app.template = app.uiType || 'simple';
    addedTemplate++;
  }
});

fs.writeFileSync(outputPath, JSON.stringify(apps, null, 2));

console.log(`✅ Augmented manifest:`);
console.log(`   - Added appSlug for ${addedSlug} apps`);
console.log(`   - Added template for ${addedTemplate} apps`);
console.log(`   - Total: ${apps.length} apps`);
console.log(`📄 Output: ${outputPath}`);
console.log(`🔧 Next: npx ts-node scripts/conversion/register-apps.ts ${outputPath}`);
