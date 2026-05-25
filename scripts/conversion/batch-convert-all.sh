#!/usr/bin/env bash

# ============================================================================
# Batch Streamlit App Conversion Pipeline
#
# Converts all 111+ Streamlit apps from awesome-llm-apps/ to
# Supabase Edge Functions + React components in one shot.
#
# Usage: bash scripts/conversion/batch-convert-all.sh [OPTIONS]
#
# Options:
#   --analyze-only    Only analyze apps, don't generate code
#   --functions-only  Only generate functions from existing analysis
#   --components-only Only generate React components
#   --register-only   Only update App.tsx + appsData.ts
#   --limit N         Process only first N apps (for testing)
#   --category CAT    Only process apps from specific category
#   --dry-run         Show what would be done without doing it
# ============================================================================

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Defaults
ANALYZE_ONLY=false
FUNCTIONS_ONLY=false
COMPONENTS_ONLY=false
REGISTER_ONLY=false
LIMIT=0
CATEGORY_FILTER=""
DRY_RUN=false
VERBOSE=false

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --analyze-only) ANALYZE_ONLY=true; shift ;;
    --functions-only) FUNCTIONS_ONLY=true; shift ;;
    --components-only) COMPONENTS_ONLY=true; shift ;;
    --register-only) REGISTER_ONLY=true; shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --category) CATEGORY_FILTER="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Directories
ANALYSIS_DIR="$PROJECT_ROOT/scripts/conversion/output/analysis"
FUNCTIONS_DIR="$PROJECT_ROOT/netlify/functions/generated"
COMPONENTS_DIR="$PROJECT_ROOT/src/pages/agents/generated"
METADATA_FILE="$PROJECT_ROOT/scripts/conversion/output/generated-apps.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# ============ Step 1: Analyze Streamlit Apps ============
run_analysis() {
  log_info "=== STEP 1: Analyzing Streamlit apps ==="
  
  # Ensure analysis directory exists
  mkdir -p "$ANALYSIS_DIR"
  
  # Run analyzer on all apps in catalog
  if [[ -n "$CATEGORY_FILTER" ]]; then
    log_info "Filtering by category: $CATEGORY_FILTER"
    # TODO: implement category filter in analyzer or filter results post-hoc
  fi
  
  if [[ $LIMIT -gt 0 ]]; then
    log_info "Processing limit: $LIMIT apps (testing mode)"
  fi
  
  # The analyzer supports --all mode
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would analyze all apps from streamlit_apps_catalog.json"
    return
  }
  
  # Check if catalog exists
  if [[ ! -f "$PROJECT_ROOT/streamlit_apps_catalog.json" ]]; then
    log_error "Catalog not found: streamlit_apps_catalog.json"
    exit 1
  fi
  
  # Run analyzer
  log_info "Running analyzer..."
  node scripts/conversion/analyze-streamlit-app.js --all "$ANALYSIS_DIR" 2>&1 | tee /tmp/analysis.log
  
  # Count generated analyses
  local count=$(find "$ANALYSIS_DIR" -name "*.json" | wc -l)
  log_success "Analyzed $count apps (metadata in $ANALYSIS_DIR)"
}

# ============ Step 2: Generate Functions ============
run_functions() {
  log_info "=== STEP 2: Generating Netlify Functions (Supabase Edge) ==="
  
  mkdir -p "$FUNCTIONS_DIR"
  
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would generate functions from $ANALYSIS_DIR to $FUNCTIONS_DIR"
    return
  }
  
  # Check if we need to compile TypeScript first
  if [[ ! -f "./node_modules/.bin/ts-node" ]]; then
    log_error "ts-node not found. Run: npm install"
    exit 1
  fi
  
  # Generate all functions
  local analysis_files=($(find "$ANALYSIS_DIR" -name "*.json" | grep -v '_summary.json' | grep -v '_generation'))
  local total=${#analysis_files[@]}
  
  if [[ $LIMIT -gt 0 && $LIMIT -lt $total ]]; then
    analysis_files=("${analysis_files[@]:0:$LIMIT}")
    total=$LIMIT
  fi
  
  log_info "Processing $total functions..."
  
  local success=0
  local failed=0
  
  for analysis in "${analysis_files[@]}"; do
    local app_name=$(basename "$analysis" .json)
    if [[ "$VERBOSE" == true ]]; then
      log_info "Generating function for $app_name..."
    fi
    
    if npx ts-node scripts/conversion/generate-netlify-function.ts "$analysis" "$FUNCTIONS_DIR" 2>/dev/null; then
      ((success++))
    else
      log_warn "Failed: $app_name"
      ((failed++))
    fi
  done
  
  log_success "Generated $success functions, $failed failed"
  
  # Create barrel export file
  cat > "$PROJECT_ROOT/netlify/functions/generated-index.ts" << 'EOF'
// Auto-generated exports - DO NOT EDIT MANUALLY
// Regenerate with: bash scripts/conversion/batch-convert-all.sh

EOF
  for func in "$FUNCTIONS_DIR"/*.ts; do
    if [[ -f "$func" && "$(basename "$func")" != "index.ts" ]]; then
      local name=$(basename "$func" .ts)
      echo "export * as $name from './generated/$name';" >> "$PROJECT_ROOT/netlify/functions/generated-index.ts"
    fi
  done
  
  log_success "Functions exported to netlify/functions/generated-index.ts"
}

# ============ Step 3: Generate React Components ============
run_components() {
  log_info "=== STEP 3: Generating React Components ==="
  
  mkdir -p "$COMPONENTS_DIR"
  
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would generate React components from $ANALYSIS_DIR"
    return
  fi
  
  local analysis_files=($(find "$ANALYSIS_DIR" -name "*.json" | grep -v '_summary.json'))
  local total=${#analysis_files[@]}
  
  if [[ $LIMIT -gt 0 && $LIMIT -lt $total ]]; then
    analysis_files=("${analysis_files[@]:0:$LIMIT}")
    total=$LIMIT
  fi
  
  log_info "Processing $total components..."
  
  local success=0
  local failed=0
  
  for analysis in "${analysis_files[@]}"; do
    local app_name=$(basename "$analysis" .json)
    
    if npx ts-node scripts/conversion/generate-react-component.ts "$analysis" "$COMPONENTS_DIR" 2>/dev/null; then
      ((success++))
    else
      ((failed++))
    fi
  done
  
  log_success "Generated $success components, $failed failed"
}

# ============ Step 4: Register Routes ============
run_registration() {
  log_info "=== STEP 4: Registering Apps (App.tsx + appsData.ts) ==="
  
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would update App.tsx and src/data/appsData.ts"
    return
  }
  
  # Build metadata file from generated components
  local metadata="["
  local first=true
  
  for component in "$COMPONENTS_DIR"/*.tsx; do
    [[ -f "$component" ]] || continue
    
    local filename=$(basename "$component" .tsx)
    # Derive app name from filename (PascalCase → kebab-case)
    local appSlug=$(echo "$filename" | sed 's/Page$//' | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
    local componentName="$filename"
    
    # Read generated file to extract some metadata (optional)
    # For now, generate plausible defaults
    
    if [[ "$first" == false ]]; then metadata+=","; fi
    first=false
    
    metadata+=$(cat <<EOF
  {
    "appName": "$appSlug",
    "appSlug": "$appSlug",
    "componentName": "$componentName",
    "category": "generated",
    "uiType": "form",
    "complexity": "simple",
    "template": "simple-form",
    "outputPath": "$component"
  }
EOF
    )
  done
  
  metadata+="]"
  
  # Write temporary metadata file for registration script
  echo "$metadata" > "$METADATA_FILE"
  
  # Run registration
  if node scripts/conversion/register-apps.ts "$METADATA_FILE"; then
    log_success "Registration complete"
  else
    log_error "Registration failed"
    return 1
  fi
}

# ============ Step 5: Thumbnails & Build ============
run_thumbnails() {
  log_info "=== STEP 5: Generating App Thumbnails ==="
  
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would generate thumbnails"
    return
  fi
  
  if [[ -f "scripts/generate-app-thumbnails.js" ]]; then
    node scripts/generate-app-thumbnails.js 2>&1 | tail -5
    log_success "Thumbnails generated"
  else
    log_warn "Thumbnail generator not found, skipping"
  fi
}

run_build_test() {
  log_info "=== STEP 6: Build Verification ==="
  
  if [[ "$DRY_RUN" == true ]]; then
    log_warn "[DRY RUN] Would run npm run build"
    return
  fi
  
  log_info "Running TypeScript build (this may take a minute)..."
  if npm run build 2>&1 | tee /tmp/build.log; then
    log_success "Build succeeded!"
  else
    log_error "Build failed! Check /tmp/build.log"
    return 1
  fi
}

# ============ Main Pipeline ============

log_info "🚀 VideoRemix.vip Streamlit Batch Converter"
log_info "=========================================="
echo ""

# Ensure we're in project root
if [[ ! -d "awesome-llm-apps" ]]; then
  log_error "Must run from project root (awesome-llm-apps/ not found)"
  exit 1
fi

# Check dependencies
if ! command -v node &> /dev/null; then
  log_error "Node.js not found"
  exit 1
fi

# Steps (respect flags)
if [[ "$ANALYZE_ONLY" == false && "$FUNCTIONS_ONLY" == false && "$COMPONENTS_ONLY" == false && "$REGISTER_ONLY" == false ]]; then
  # Full pipeline
  run_analysis
  run_functions
  run_components
  run_registration
  run_thumbnails
  run_build_test
elif [[ "$ANALYZE_ONLY" == true ]]; then
  run_analysis
elif [[ "$FUNCTIONS_ONLY" == true ]]; then
  run_functions
elif [[ "$COMPONENTS_ONLY" == true ]]; then
  run_components
elif [[ "$REGISTER_ONLY" == true ]]; then
  run_registration
fi

echo ""
log_success "🎉 Conversion pipeline complete!"
echo ""
log_info "Summary:"
echo "  Analysis:   $ANALYSIS_DIR"
echo "  Functions:  $FUNCTIONS_DIR"
echo "  Components: $COMPONENTS_DIR"
echo ""
log_info "Next steps:"
echo "  1. Review generated code in netlify/functions/generated/ and src/pages/agents/generated/"
echo "  2. Run: npm run dev to test locally"
echo "  3. Fix any compilation errors"
echo "  4. Deploy: npm run deploy:netlify"
echo ""
