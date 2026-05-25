#!/usr/bin/env bash
# Clean final registration - only add apps whose components don't already exist

MANIFEST="./scripts/conversion/output/registration-manifest.json"

echo "🔍 Filtering out already-existing components..."

# Get list of existing component files
EXISTING=$(ls src/pages/agents/*.tsx 2>/dev/null | xargs -n1 basename | sed 's/\.tsx$//')

# Filter manifest to only include apps whose component file does NOT exist
node -e "
const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf-8'));
const existing = new Set($EXISTING);
const newApps = manifest.filter(app => !existing.has(app.componentName));
const removed = manifest.length - newApps.length;
console.log('📊 Total apps in manifest:', manifest.length);
console.log('   Already existing:', removed);
console.log('   New to register:', newApps.length);
fs.writeFileSync('./scripts/conversion/output/new-apps-to-register.json', JSON.stringify(newApps, null, 2));
"

echo "🚀 Registering new apps only..."
npx ts-node scripts/conversion/register-apps.ts ./scripts/conversion/output/new-apps-to-register.json

echo "✅ Registration complete!"
echo "🔧 Next: npm run build"
