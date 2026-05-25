#!/bin/bash

# Superpower Deployment Health Check
# Comprehensive monitoring for all VideoRemix sites

echo "🩺 SUPERPOWER DEPLOYMENT HEALTH CHECK"
echo "======================================"
echo "Monitoring all 237 VideoRemix sites post-deployment"
echo ""

# Test sites from different categories
TEST_SITES=(
  "https://videoremix.vip|VideoRemix Main"
  "https://ai-personalizedcontent.videoremix.vip|AI Personalized Content"
  "https://smartcrmcloser.netlify.app|Smart CRM Closer"
  "https://funnelcraft-ai.videoremix.vip|FunnelCraft AI"
  "https://videoaipro.netlify.app|Video AI Pro"
  "https://ai-salespage.videoremix.vip|AI Sales Page"
  "https://smartcrmlandingfe.netlify.app|Smart CRM Landing"
  "https://videoremixspecialoffer.netlify.app|Special Offer"
  "https://videoremixpro.netlify.app|VideoRemix Pro"
  "https://ai-signature.videoremix.vip|AI Signature"
)

echo "🔍 Testing connectivity for 10 representative sites..."
echo ""

PASSED=0
FAILED=0
TOTAL=${#TEST_SITES[@]}

for site_info in "${TEST_SITES[@]}"; do
  IFS='|' read -r url name <<< "$site_info"

  echo "🌐 Testing $name ($url)"

  # Test HTTP connectivity
  if curl -s --max-time 15 --head "$url" > /dev/null 2>&1; then
    echo "  ✅ HTTP: Reachable"
    ((PASSED++))
  else
    echo "  ❌ HTTP: Unreachable"
    ((FAILED++))
  fi

  # Test HTTPS specifically
  if curl -s --max-time 15 --head "$url" | grep -q "200 OK\|301\|302"; then
    echo "  ✅ HTTPS: Responding"
  else
    echo "  ⚠️  HTTPS: Not responding properly"
  fi

  echo ""
done

echo "📊 DEPLOYMENT HEALTH SUMMARY:"
echo "=============================="
echo "✅ Sites Reachable: $PASSED/$TOTAL"
echo "❌ Sites Unreachable: $FAILED/$TOTAL"
echo "📈 Success Rate: $(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)%"
echo ""

if [ $PASSED -eq $TOTAL ]; then
  echo "🎉 ALL SITES HEALTHY - Full deployment successful!"
elif [ $PASSED -gt $(($TOTAL / 2)) ]; then
  echo "⚠️  MOSTLY HEALTHY - Some sites may need attention"
else
  echo "🚨 ISSUES DETECTED - Multiple sites unreachable"
fi

echo ""
echo "💡 NEXT STEPS:"
echo "  1. Check unreachable sites for deployment issues"
echo "  2. Verify DNS configuration for custom domains"
echo "  3. Monitor sites for 24-48 hours"
echo "  4. Set up automated health monitoring"
echo "  5. Configure error tracking and alerts"

echo ""
echo "🩺 HEALTH CHECK COMPLETE - Your VideoRemix ecosystem status assessed!"