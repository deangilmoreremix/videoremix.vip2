#!/bin/bash
# Test all app links from VideoRemix landing page

urls=(
  "https://capable-mermaid-3c73fa.netlify.app/"
  "https://ai-personalized-content.videoremix.vip"
  "https://stupendous-twilight-64389a.netlify.app/"
  "https://heroic-seahorse-296f32.netlify.app/"
  "https://thriving-mochi-ecd815.netlify.app/"
  "https://roaring-mochi-39a60a.netlify.app"
  "https://roaring-mochi-39a60a.netlify.app/"
  "https://endearing-churros-2ce8c6.netlify.app/"
  "https://cute-khapse-4e62cb.netlify.app/"
  "https://gentle-frangipane-ceed17.netlify.app"
  "https://gentle-frangipane-ceed17.netlify.app/"
  "https://proposal-ai.videoremix.vip"
  "https://sales-page-builder.videoremix.vip"
  "https://sales-assistant-ai.videoremix.vip"
  "https://videoremix.netlify.app/gemini-features"
  "https://videoremix.netlify.app/features/client-research"
)

echo "Testing VideoRemix app links..."
echo "URL | Status Code | Response Time (ms) | Notes"
echo "---|---|---|---"

for url in "${urls[@]}"; do
  start_time=$(date +%s%N)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" --max-time 10)
  end_time=$(date +%s%N)
  time_ms=$(( (end_time - start_time) / 1000000 ))
  
  if [ "$http_code" = "200" ]; then
    status="OK"
  elif [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
    status="Redirect"
  else
    status="Failed ($http_code)"
  fi
  
  effective_url=$(curl -s --head -w "%{url_effective}" -L "$url" --max-time 5 2>/dev/null || echo "N/A")
  notes=$(curl -s --head -w "%{content_type}" -L "$url" --max-time 5 2>/dev/null | head -n1 || echo "No response")
  
  echo "$url | $status | $time_ms | $notes"
done