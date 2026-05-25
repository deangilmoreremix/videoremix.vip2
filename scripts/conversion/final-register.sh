#!/usr/bin/env bash
# Final: flatten manifest, augment with required fields, register

MANIFEST="./scripts/conversion/output/final_manifest.json"

echo "🔧 Flattening and augmenting manifest..."
node -e '
const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync(process.env.MANIFEST, "utf-8"));
const all = [];
Object.values(manifest.categories).forEach(cat => { if (Array.isArray(cat.apps)) all.push(...cat.apps); });

// Add required fields
all.forEach(app => {
  if (!app.appSlug) app.appSlug = app.appName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  if (!app.template) app.template = app.uiType || "simple";
});

fs.writeFileSync("./scripts/conversion/output/flat-manifest.json", JSON.stringify(all, null, 2));
console.log("📄 Flat manifest with " + all.length + " apps");
' MANIFEST="$MANIFEST"

echo "🚀 Registering apps..."
npx ts-node scripts/conversion/register-apps.ts ./scripts/conversion/output/flat-manifest.json

echo "✅ Complete!"
