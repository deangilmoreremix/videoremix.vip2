#!/bin/bash

# UI/UX Validation Script for VideoRemix Apps
# Checks all app URLs for proper Streamlit UI elements and functionality

echo "🔍 VideoRemix App UI/UX Validation"
echo "=================================="
echo ""

URLS_FILE="app_urls.txt"
RESULTS_FILE="ui_validation_results.txt"

# Clear previous results
> "$RESULTS_FILE"

check_ui_elements() {
    local url="$1"
    echo "Checking: $url"
    
    # Fetch the page with timeout
    response=$(curl -s --max-time 30 --connect-timeout 10 "$url" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ FAILED: Cannot connect to $url" | tee -a "$RESULTS_FILE"
        return 1
    fi
    
    # Check for Streamlit-specific elements
    local has_streamlit=0
    local has_sidebar=0
    local has_main_content=0
    local has_api_input=0
    local has_app_selector=0
    local has_error_boundary=0
    
    # Check for Streamlit markers
    if echo "$response" | grep -qi "streamlit"; then
        has_streamlit=1
    fi
    
    # Check for sidebar (common in Streamlit apps)
    if echo "$response" | grep -qi "sidebar"; then
        has_sidebar=1
    fi
    
    # Check for main content area
    if echo "$response" | grep -qi "main.*content\|content.*main"; then
        has_main_content=1
    fi
    
    # Check for API key input (most apps need this)
    if echo "$response" | grep -qi "api.*key\|key.*input\|text.*input.*password"; then
        has_api_input=1
    fi
    
    # Check for app selector (for multi-app hubs)
    if echo "$response" | grep -qi "select.*app\|app.*select\|choose.*app"; then
        has_app_selector=1
    fi
    
    # Check for error handling
    if echo "$response" | grep -qi "error\|exception\|try.*catch"; then
        has_error_boundary=1
    fi
    
    # Check for basic HTML structure
    local has_html_structure=0
    if echo "$response" | grep -qi "<!DOCTYPE html>" && echo "$response" | grep -qi "</html>"; then
        has_html_structure=1
    fi
    
    # Report findings
    echo "Results for $url:" >> "$RESULTS_FILE"
    echo "  Streamlit detected: $( [ $has_streamlit -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  Sidebar present: $( [ $has_sidebar -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  Main content area: $( [ $has_main_content -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  API key input: $( [ $has_api_input -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  App selector: $( [ $has_app_selector -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  Error boundary: $( [ $has_error_boundary -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    echo "  HTML structure: $( [ $has_html_structure -eq 1 ] && echo '✅' || echo '❌' )" >> "$RESULTS_FILE"
    
    # Overall assessment
    local score=$((has_streamlit + has_sidebar + has_main_content + has_api_input + has_app_selector + has_error_boundary + has_html_structure))
    
    if [ $score -ge 5 ]; then
        echo "✅ PASS: Good UI/UX detected ($score/7 criteria)" >> "$RESULTS_FILE"
    elif [ $score -ge 3 ]; then
        echo "⚠️  WARNING: Partial UI/UX ($score/7 criteria)" >> "$RESULTS_FILE"
    else
        echo "❌ FAIL: Poor UI/UX detected ($score/7 criteria)" >> "$RESULTS_FILE"
    fi
    
    echo "" >> "$RESULTS_FILE"
    
    return 0
}

# Process each URL
total_urls=$(wc -l < "$URLS_FILE")
current=0

while IFS= read -r url; do
    if [ -n "$url" ] && [ "$url" != "https://" ]; then
        current=$((current + 1))
        echo "[$current/$total_urls] Checking $url..."
        check_ui_elements "$url"
        # Small delay to be respectful to servers
        sleep 1
    fi
done < "$URLS_FILE"

echo ""
echo "🎯 UI/UX Validation Complete!"
echo "Results saved to: $RESULTS_FILE"
echo ""

# Summary
passed=$(grep -c "PASS:" "$RESULTS_FILE")
warnings=$(grep -c "WARNING:" "$RESULTS_FILE")
failed=$(grep -c "FAIL:" "$RESULTS_FILE")
connection_failed=$(grep -c "FAILED:" "$RESULTS_FILE")

echo "📊 Summary:"
echo "  ✅ Passed: $passed"
echo "  ⚠️  Warnings: $warnings"
echo "  ❌ Failed: $failed"
echo "  🔌 Connection failed: $connection_failed"
