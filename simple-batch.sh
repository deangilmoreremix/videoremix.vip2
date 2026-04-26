#!/bin/bash

# Simple batch processor for Netlify sites
# Process sites in smaller chunks to avoid timeouts

BATCH_SIZE=20
START_BATCH=${1:-1}
END_BATCH=${2:-10}

echo "🚀 SIMPLE BATCH PROCESSOR"
echo "========================="
echo "Processing batches $START_BATCH to $END_BATCH"
echo "Batch size: $BATCH_SIZE sites"
echo ""

# Environment variables
SUPABASE_URL="https://bzxohkrxcwodllketcpz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A"
STRIPE_PUB_KEY="pk_live_51OyF7gDdmNBqrzmWn503WQHDLemPtD8MLID66D4cB89eA08s1O2BdgyPNVAH5txYt3SY9YnNczbMBnkkTkPCDkWz000doOUclm"
OPENAI_KEY="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"

# Get site IDs from the JSON file
SITE_IDS=$(node -e "
const fs = require('fs');
const sites = JSON.parse(fs.readFileSync('sites.json'));
const start = ($START_BATCH - 1) * $BATCH_SIZE;
const end = Math.min($END_BATCH * $BATCH_SIZE, sites.length);
const batchSites = sites.slice(start, end);
console.log(batchSites.map(s => s.site_id).join(' '));
")

echo "Processing $(echo $SITE_IDS | wc -w) sites from batch $START_BATCH to $END_BATCH"
echo ""

COUNT=1
TOTAL=$(echo $SITE_IDS | wc -w)
SUCCESS_COUNT=0
FAIL_COUNT=0

for SITE_ID in $SITE_IDS; do
  SITE_NAME=$(node -e "
    const fs = require('fs');
    const sites = JSON.parse(fs.readFileSync('sites.json'));
    const site = sites.find(s => s.site_id === '$SITE_ID');
    console.log(site ? site.name : 'unknown');
  ")

  echo "[$(( ($START_BATCH-1)*$BATCH_SIZE + $COUNT ))/237] 🔄 $SITE_NAME ($SITE_ID)"

  SITE_SUCCESS=true

  # Set VITE_SUPABASE_URL
  if netlify env:set VITE_SUPABASE_URL "$SUPABASE_URL" --site "$SITE_ID" 2>/dev/null; then
    echo "  ✅ VITE_SUPABASE_URL set"
  else
    echo "  ❌ VITE_SUPABASE_URL failed"
    SITE_SUCCESS=false
  fi

  # Set VITE_SUPABASE_ANON_KEY
  if netlify env:set VITE_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" --site "$SITE_ID" 2>/dev/null; then
    echo "  ✅ VITE_SUPABASE_ANON_KEY set"
  else
    echo "  ❌ VITE_SUPABASE_ANON_KEY failed"
    SITE_SUCCESS=false
  fi

  # Set VITE_STRIPE_PUBLISHABLE_KEY
  if netlify env:set VITE_STRIPE_PUBLISHABLE_KEY "$STRIPE_PUB_KEY" --site "$SITE_ID" 2>/dev/null; then
    echo "  ✅ VITE_STRIPE_PUBLISHABLE_KEY set"
  else
    echo "  ❌ VITE_STRIPE_PUBLISHABLE_KEY failed"
    SITE_SUCCESS=false
  fi

  # Set OPENAI_API_KEY
  if netlify env:set OPENAI_API_KEY "$OPENAI_KEY" --site "$SITE_ID" 2>/dev/null; then
    echo "  ✅ OPENAI_API_KEY set"
  else
    echo "  ❌ OPENAI_API_KEY failed"
    SITE_SUCCESS=false
  fi

  if $SITE_SUCCESS; then
    echo "  🎯 $SITE_NAME: SUCCESS"
    ((SUCCESS_COUNT++))
  else
    echo "  🎯 $SITE_NAME: PARTIAL/FAILED"
    ((FAIL_COUNT++))
  fi

  echo ""

  # Rate limiting
  if [ $COUNT -lt $TOTAL ]; then
    echo "⏱️  Rate limiting... (3 seconds)"
    sleep 3
  fi

  ((COUNT++))
done

echo "📊 BATCH $START_BATCH-$END_BATCH COMPLETE:"
echo "  ✅ Successful sites: $SUCCESS_COUNT"
echo "  ❌ Failed sites: $FAIL_COUNT"
echo "  📈 Success rate: $(echo "scale=1; $SUCCESS_COUNT * 100 / ($SUCCESS_COUNT + $FAIL_COUNT)" | bc)%"
echo ""
echo "💾 Run next batch with: ./simple-batch.sh $((END_BATCH + 1)) $((END_BATCH + 1))"