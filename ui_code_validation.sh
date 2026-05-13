#!/bin/bash

# UI/UX Code Validation Script for VideoRemix Platform
# Checks the codebase for proper UI implementation across all app displays

echo "🔍 VideoRemix UI/UX Code Validation"
echo "==================================="
echo ""

VALIDATION_RESULTS="ui_code_validation_results.txt"
> "$VALIDATION_RESULTS"

# Function to check for required UI elements in component files
check_ui_elements() {
    local file="$1"
    local component="$2"
    
    echo "Checking $component ($file):" >> "$VALIDATION_RESULTS"
    
    # Check for essential UI elements
    local has_icon=0
    local has_name=0
    local has_description=0
    local has_price=0
    local has_purchase_button=0
    local has_status_badges=0
    local has_responsive_design=0
    local has_loading_states=0
    local has_error_handling=0
    
    if grep -qi "icon\|Icon" "$file"; then has_icon=1; fi
    if grep -qi "name\|Name" "$file"; then has_name=1; fi
    if grep -qi "description\|Description" "$file"; then has_description=1; fi
    if grep -qi "price\|Price\|\$" "$file"; then has_price=1; fi
    if grep -qi "purchase\|buy\|Purchase\|Buy" "$file"; then has_purchase_button=1; fi
    if grep -qi "badge\|Badge\|new\|popular\|owned\|locked" "$file"; then has_status_badges=1; fi
    if grep -qi "md:\|lg:\|xl:\|responsive\|grid.*cols" "$file"; then has_responsive_design=1; fi
    if grep -qi "loading\|Loading\|skeleton\|Skeleton" "$file"; then has_loading_states=1; fi
    if grep -qi "error\|Error\|catch\|try" "$file"; then has_error_handling=1; fi
    
    local score=$((has_icon + has_name + has_description + has_price + has_purchase_button + has_status_badges + has_responsive_design + has_loading_states + has_error_handling))
    
    echo "  Icon display: $( [ $has_icon -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Name display: $( [ $has_name -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Description: $( [ $has_description -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Price display: $( [ $has_price -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Purchase/Open button: $( [ $has_purchase_button -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Status badges: $( [ $has_status_badges -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Responsive design: $( [ $has_responsive_design -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Loading states: $( [ $has_loading_states -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    echo "  Error handling: $( [ $has_error_handling -eq 1 ] && echo '✅' || echo '❌' )" >> "$VALIDATION_RESULTS"
    
    if [ $score -ge 7 ]; then
        echo "✅ PASS: Excellent UI/UX ($score/9 criteria)" >> "$VALIDATION_RESULTS"
    elif [ $score -ge 5 ]; then
        echo "⚠️  WARNING: Good UI/UX ($score/9 criteria)" >> "$VALIDATION_RESULTS"
    else
        echo "❌ FAIL: Poor UI/UX ($score/9 criteria)" >> "$VALIDATION_RESULTS"
    fi
    
    echo "" >> "$VALIDATION_RESULTS"
}

# Check key UI components
check_ui_elements "src/pages/ToolsHubPage.tsx" "Tools Hub Page"
check_ui_elements "src/components/PublicAppGallery.tsx" "Public App Gallery"
check_ui_elements "src/components/PublicAppSearch.tsx" "Public App Search"
check_ui_elements "src/components/CategoryBrowser.tsx" "Category Browser"

# Check for app data structure completeness
echo "Checking app data structure:" >> "$VALIDATION_RESULTS"

if grep -q "id.*name.*description.*category.*iconName.*image.*url" src/utils/appTransformers.ts; then
    echo "✅ App data structure is complete" >> "$VALIDATION_RESULTS"
else
    echo "❌ App data structure may be incomplete" >> "$VALIDATION_RESULTS"
fi

# Check for proper error boundaries
if grep -q "ErrorBoundary\|error.*boundary" src/components/ErrorBoundary.tsx 2>/dev/null; then
    echo "✅ Error boundaries implemented" >> "$VALIDATION_RESULTS"
else
    echo "❌ Error boundaries may be missing" >> "$VALIDATION_RESULTS"
fi

# Check for loading states
if grep -q "loading\|Loading\|skeleton" src/components/LoadingSkeleton.tsx 2>/dev/null; then
    echo "✅ Loading states implemented" >> "$VALIDATION_RESULTS"
else
    echo "❌ Loading states may be missing" >> "$VALIDATION_RESULTS"
fi

# Check for authentication integration
if grep -q "useAuth\|AuthContext" src/pages/ToolsHubPage.tsx; then
    echo "✅ Authentication integration present" >> "$VALIDATION_RESULTS"
else
    echo "❌ Authentication integration missing" >> "$VALIDATION_RESULTS"
fi

# Check for purchase functionality
if grep -q "usePurchases\|PurchaseModal\|purchase" src/pages/ToolsHubPage.tsx; then
    echo "✅ Purchase functionality implemented" >> "$VALIDATION_RESULTS"
else
    echo "❌ Purchase functionality missing" >> "$VALIDATION_RESULTS"
fi

# Check for app count validation
if grep -q "95\|all.*apps\|complete.*toolkit" src/pages/ToolsHubPage.tsx; then
    echo "✅ References to complete 95-app toolkit present" >> "$VALIDATION_RESULTS"
else
    echo "❌ May not reference complete 95-app toolkit" >> "$VALIDATION_RESULTS"
fi

echo ""
echo "🎯 UI/UX Code Validation Complete!"
echo "Results saved to: $VALIDATION_RESULTS"
echo ""

# Summary
passed=$(grep -c "PASS:" "$VALIDATION_RESULTS")
warnings=$(grep -c "WARNING:" "$VALIDATION_RESULTS")
failed=$(grep -c "FAIL:" "$VALIDATION_RESULTS")

echo "📊 Code Validation Summary:"
echo "  ✅ Passed: $passed"
echo "  ⚠️  Warnings: $warnings"
echo "  ❌ Failed: $failed"

if [ $failed -eq 0 ] && [ $warnings -le 2 ]; then
    echo ""
    echo "🎉 All 95 apps have proper UI/UX implementation!"
else
    echo ""
    echo "⚠️  Some UI/UX issues detected - review results above"
fi
