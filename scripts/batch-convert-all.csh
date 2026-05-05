#!/bin/bash

# Batch convert all Streamlit apps
# Usage: ./scripts/batch-convert-all.sh

set -e

echo "Starting batch conversion of all Streamlit apps..."

# Find all Streamlit apps
STREAMLIT_APPS=$(find awesome-llm-apps -name "app.py" -type f -exec dirname {} \; | sort | uniq)

TOTAL_APPS=$(echo "$STREAMLIT_APPS" | wc -l)
echo "Found $TOTAL_APPS Streamlit apps to convert"

SUCCESS_COUNT=0
FAILURE_COUNT=0
NEW_APPS=()

for app_dir in $STREAMLIT_APPS; do
  echo "Converting $app_dir..."

  # Step 1: Analyze
  METADATA=$(node scripts/analyze-streamlit-app.cjs "$app_dir" 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "Failed to analyze $app_dir"
    ((FAILURE_COUNT++))
    continue
  fi

  # Step 2: Generate Netlify function
  FUNCTION_NAME=$(echo "$METADATA" | node scripts/generate-netlify-function.cjs /dev/stdin 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "Failed to generate function for $app_dir"
    ((FAILURE_COUNT++))
    continue
  fi

  # Step 3: Generate React component
  echo "$METADATA" | node scripts/generate-react-component.cjs /dev/stdin "$FUNCTION_NAME" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "Failed to generate component for $app_dir"
    ((FAILURE_COUNT++))
    continue
  fi

  # Prepare app metadata for registration
  APP_SLUG=$(basename "$app_dir" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g')
  APP_NAME=$(echo "$METADATA" | jq -r '.appName' 2>/dev/null || echo "Unknown App")
  COMPONENT_NAME="${APP_NAME//[^a-zA-Z0-9]/}App"

  NEW_APPS+=("{\"slug\":\"$APP_SLUG\",\"name\":\"$APP_NAME\",\"component\":\"$COMPONENT_NAME\"}")

  ((SUCCESS_COUNT++))
  echo "Successfully converted $app_dir"
done

echo "Conversion complete: $SUCCESS_COUNT successful, $FAILURE_COUNT failed"

# Register all new apps
if [ ${#NEW_APPS[@]} -gt 0 ]; then
  NEW_APPS_JSON=$(printf '%s\n' "${NEW_APPS[@]}" | jq -s '.' 2>/dev/null || echo "[]")
  echo "$NEW_APPS_JSON" | node scripts/register-apps.cjs /dev/stdin 2>/dev/null
  echo "Registered ${#NEW_APPS[@]} new apps"
fi

echo "Batch conversion finished!"
