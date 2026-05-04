#!/usr/bin/env bash
# ============================================================================
# FINAL BATCH CONVERSION - All 111+ Apps
# ============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

ANALYSIS_DIR="./scripts/conversion/output/analysis"
FUNCTIONS_DIR="./scripts/conversion/output/functions"
COMPONENTS_DIR="./scripts/conversion/output/components"

mkdir -p "$ANALYSIS_DIR" "$FUNCTIONS_DIR" "$COMPONENTS_DIR"

CATALOG="./streamlit_apps_catalog.json"

echo "🚀 Starting full batch conversion..."

TOTAL=0
SUCCESS=0
FAIL=0

# Iterate over categories
for category in $(jq -r 'keys[]' "$CATALOG"); do
  echo "📁 Category: $category"
  
  # Get app names
  APPS=$(jq -r --arg cat "$category" '.[$cat] | keys[]' "$CATALOG")
  
  for app in $APPS; do
    TOTAL=$((TOTAL + 1))
    
    # Get main file
    MAIN_FILE=$(jq -r --arg cat "$category" --arg app "$app" '.[$cat][$app].main_file // .[$cat][$app].mainFile' "$CATALOG")
    
    if [[ -z "$MAIN_FILE" || ! -f "$MAIN_FILE" ]]; then
      echo "  ❌ $app: main_file missing or not found"
      FAIL=$((FAIL + 1))
      continue
    fi
    
    SAFE_NAME=$(echo "$app" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/-\+/-/g')
    ANALYSIS_PATH="$ANALYSIS_DIR/${category}-${SAFE_NAME}.json"
    
    echo "  Processing: $app"
    
    # Step 1: Analyze
    if ! node scripts/conversion/analyze-streamlit-app.js "$MAIN_FILE" "$ANALYSIS_PATH" 2>/dev/null; then
      echo "    ❌ Analysis failed"
      FAIL=$((FAIL + 1))
      continue
    fi
    
    if [[ ! -f "$ANALYSIS_PATH" ]]; then
      echo "    ❌ Analysis file not created"
      FAIL=$((FAIL + 1))
      continue
    fi
    
    # Step 2: Generate function
    if ! npx ts-node scripts/conversion/generate-netlify-function.ts "$ANALYSIS_PATH" "$FUNCTIONS_DIR" 2>/dev/null; then
      echo "    ❌ Function generation failed"
      FAIL=$((FAIL + 1))
      continue
    fi
    
    # Step 3: Generate component
    if ! npx ts-node scripts/conversion/generate-react-component.ts "$ANALYSIS_PATH" "$COMPONENTS_DIR" 2>/dev/null; then
      echo "    ❌ Component generation failed"
      FAIL=$((FAIL + 1))
      continue
    fi
    
    echo "    ✅ $app"
    SUCCESS=$((SUCCESS + 1))
  done
  
  echo "   📊 $category: processed"
done

echo ""
echo "=========================================="
echo "✅ BATCH CONVERSION COMPLETE"
echo "   Total:   $TOTAL"
echo "   Success: $SUCCESS"
echo "   Failed:  $FAIL"
echo "=========================================="

# Generate manifest
node -e "
const fs = require('fs');
const path = require('path');
const manifest = { categories: {}, summary: { total: $TOTAL, success: $SUCCESS, fail: $FAIL } };
const analysisDir = '$ANALYSIS_DIR';
const functionsDir = '$FUNCTIONS_DIR';
const componentsDir = '$COMPONENTS_DIR';
const categories = $(jq -r 'keys' streamlit_apps_catalog.json | tr -d '[]');

categories.forEach(cat => {
  const pattern = new RegExp(cat + '-');
  const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('.json') && f.startsWith(cat + '-'));
  
  manifest.categories[cat] = { apps: files.map(f => {
    const safeName = f.replace(cat + '-', '').replace('.json', '');
    const componentName = safeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Page';
    return {
      appName: safeName,
      safeName,
      analysisFile: path.join(analysisDir, f),
      functionFile: path.join(functionsDir, f.replace('.json', '.ts')),
      componentFile: path.join(componentsDir, componentName + '.tsx'),
      componentName
    };
  })};
});

fs.writeFileSync('./scripts/conversion/output/final_manifest.json', JSON.stringify(manifest, null, 2));
console.log('📄 Manifest created: scripts/conversion/output/final_manifest.json');
console.log('🔧 Next: Register all generated apps with node scripts/conversion/register-apps.js scripts/conversion/output/final_manifest.json');
"
