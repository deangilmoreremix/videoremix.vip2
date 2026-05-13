#!/bin/bash
# Inventory-driven smoke test for VideoRemix app launch targets

# This script dynamically queries active app records and validates each launch target
# It replaces the static URL list with a database-driven approach

# Configuration
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

# Function to query active apps from database
get_active_apps() {
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required"
    echo "   Set these in your .env file or export them before running this script"
    exit 1
  fi

  # Query active apps from the database
  curl -s -X GET "${SUPABASE_URL}/rest/v1/apps?is_active=eq.true&select=slug,name,custom_domain,netlify_url" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json"
}

# Function to get app URL based on priority order
get_app_url() {
  local app_data="$1"

  # Extract URL fields
  local custom_domain=$(echo "$app_data" | jq -r '.custom_domain // empty')
  local netlify_url=$(echo "$app_data" | jq -r '.netlify_url // empty')
  local slug=$(echo "$app_data" | jq -r '.slug')

  # Priority order: custom_domain > netlify_url > centralized config > fallback
  if [ -n "$custom_domain" ]; then
    echo "$custom_domain"
  elif [ -n "$netlify_url" ]; then
    echo "$netlify_url"
  else
    # Check if slug exists in centralized config (simplified check)
    case "$slug" in
      "personalizer-text-ai-editor"|"personalizer-advanced-text-video-editor"|"personalizer-writing-toolkit"|"video-creator"|"promo-generator"|"text-to-speech"|"niche-script")
        echo "https://ai-personalizedcontent.videoremix.vip" ;;
      "funnelcraft-ai")
        echo "https://ai-funnelcraft.videoremix.vip" ;;
      "ai-skills-monetizer"|"resume-amplifier"|"voice-coach")
        echo "https://ai-skills.videoremix.vip" ;;
      "landing-page")
        echo "https://ai-salespage.videoremix.vip" ;;
      "sales-assistant-app"|"ai-sales"|"sales-monetizer")
        echo "https://ai-salesassistant.videoremix.vip" ;;
      "personalizer-profile")
        echo "https://ai-personalizer.videoremix.vip" ;;
      "personalizer-video-image-transformer")
        echo "https://ai-video-transformer.videoremix.vip" ;;
      "personalizer-recorder")
        echo "https://ai-screenrecorder.videoremix.vip" ;;
      "ai-signature")
        echo "https://ai-signature.videoremix.vip" ;;
      "thumbnail-generator")
        echo "https://ai-thumbnail-generator.videoremix.vip" ;;
      # Add more mappings as needed...
      *)
        echo "/app/$slug" ;; # Fallback to internal route
    esac
  fi
}

# Main execution
echo "🔍 VideoRemix App Launch Target Validation"
echo "=========================================="
echo ""

# Get active apps from database
echo "📊 Querying active apps from database..."
apps_json=$(get_active_apps)

if [ $? -ne 0 ] || [ -z "$apps_json" ]; then
  echo "❌ Failed to query active apps from database"
  exit 1
fi

# Parse apps and build URL list
urls=()
app_names=()

while IFS= read -r app; do
  if [ -n "$app" ] && [ "$app" != "null" ]; then
    url=$(get_app_url "$app")
    name=$(echo "$app" | jq -r '.name')
    urls+=("$url")
    app_names+=("$name")
  fi
done < <(echo "$apps_json" | jq -c '.[]')

if [ ${#urls[@]} -eq 0 ]; then
  echo "❌ No active apps found in database"
  exit 1
fi

echo "✅ Found ${#urls[@]} active apps to test"
echo ""

# Now test the URLs (rest of the original script)
echo "Testing VideoRemix app links..."
echo "App Name | URL | Status Code | Response Time (ms) | Notes"
echo "---|---|---|---|---"

echo "Testing VideoRemix app links..."
echo "URL | Status Code | Response Time (ms) | Notes"
echo "---|---|---|---"

for i in "${!urls[@]}"; do
  url="${urls[$i]}"
  app_name="${app_names[$i]}"

  start_time=$(date +%s%N)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" --max-time 10)
  end_time=$(date +%s%N)
  time_ms=$(( (end_time - start_time) / 1000000 ))

  if [ "$http_code" = "200" ]; then
    status="✅ OK"
  elif [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
    status="🔄 Redirect"
  else
    status="❌ Failed ($http_code)"
  fi

  effective_url=$(curl -s --head -w "%{url_effective}" -L "$url" --max-time 5 2>/dev/null || echo "N/A")
  notes=$(curl -s --head -w "%{content_type}" -L "$url" --max-time 5 2>/dev/null | head -n1 || echo "No response")

  echo "$app_name | $url | $status | $time_ms | $notes"
done

echo ""
echo "🎯 CI Check: All active apps must have verified launch targets"
failed_apps=0
for i in "${!urls[@]}"; do
  url="${urls[$i]}"
  app_name="${app_names[$i]}"

  if [[ "$url" == /app/* ]]; then
    echo "❌ FAIL: $app_name has no verified launch target (using fallback: $url)"
    ((failed_apps++))
  fi
done

if [ $failed_apps -gt 0 ]; then
  echo ""
  echo "❌ CI FAILURE: $failed_apps active apps lack verified launch targets"
  echo "   Add these apps to APP_URLS in src/config/appUrls.ts or provide"
  echo "   custom_domain/netlify_url in the database."
  exit 1
else
  echo "✅ CI SUCCESS: All active apps have verified launch targets"
fi