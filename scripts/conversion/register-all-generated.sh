#!/usr/bin/env bash
# Final registration of all generated apps

MANIFEST="./scripts/conversion/output/final_manifest.json"

echo "🔧 Flattening manifest..."
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf-8'));
const all = [];
Object.values(manifest.categories).forEach(cat => { if (Array.isArray(cat.apps)) all.push(...cat.apps); });
fs.writeFileSync('./scripts/conversion/output/flat-manifest.json', JSON.stringify(all, null, 2));
console.log('📄 Flat manifest created with ' + all.length + ' apps');
"

echo "🚀 Running registration..."
node scripts/conversion/register-apps.js scripts/conversion/output/flat-manifest.json

echo "✅ Done!"
