#!/bin/bash

# VideoRemix Supabase Function Cleanup Script
# Removes unused functions from other workspaces to free up slots

echo "🧹 Cleaning up Supabase Edge Functions..."
echo "This will remove functions from other workspaces to free up 91 slots"
echo ""

# Functions to keep (critical for VideoRemix)
KEEP_FUNCTIONS=(
    "create-checkout-session"
    "resolve-user-access" 
    "stripe-sync"
    "webhook-paykickstart"
    "webhook-zaxxa"
    "webhook-stripe"
    "webhook-paypal"
    "process-csv-import"
    "send-email-hook"
)

# Functions to remove (from other workspaces)
REMOVE_FUNCTIONS=(
    "adaptive-playbook" "admin-apps" "admin-dashboard-stats" "admin-features"
    "admin-products" "admin-purchases" "admin-subscriptions" "admin-user-features"
    "admin-user-management" "admin-users" "admin-videos" "ag2-adaptive-research-team"
    "agentic-rag-embedding-gemma" "agentic-rag-gpt5" "agentic-rag-with-reasoning"
    "ai-agents" "ai-enrichment" "ai-insights" "ai-personalized-memory"
    "ai-router-app" "ai-video-prompt-generator" "analytics-events" "analytics-manager"
    "analytics-summary" "apply-auth-fixes" "automation-ai" "calendar" "change-user-password"
    "communication-optimization" "contact-card-ai" "contact-detail-ai" "contacts"
    "contentgenius-ai" "conversation-analysis" "create-share" "create-super-admin"
    "cross-sell-analysis" "deal-analysis" "deal-health-analysis" "deals" "director-agent"
    "discovery-questions" "document-summarizer" "duplicate-detection" "email-analyzer"
    "email-composer" "email-manager" "email-service" "email-templates" "enhance-text"
    "execute-deal-ai" "feature-analysis" "frame-agent" "gemini-image-generator"
    "generate-video-proxy" "import-personalizer-purchases" "insights-manager"
    "instant-response" "journey-manager" "lead-nurturing" "lead-processor" "media-service"
    "meeting-optimizer" "muapi-proxy" "muapi-webhook" "multi-ai-memory" "personalized-messages"
    "predictive-analytics" "process-upload" "project-service" "proposal-generation"
    "relationship-insights" "rendiv-render" "reset-admin-password" "roadmap-prioritization"
    "sales-forecasting" "semantic-search" "send-email" "smart-categorize" "smart-enrichment"
    "smart-qualify" "smart-score" "streaming-chat" "template-service" "timeline-generator"
    "track-event" "user-service" "value-propositions" "video-upload" "videoagent" "yucut-processor"
)

echo "📋 Functions to KEEP (${#KEEP_FUNCTIONS[@]}):"
for func in "${KEEP_FUNCTIONS[@]}"; do
    echo "  ✅ $func"
done

echo ""
echo "🗑️  Functions to REMOVE (${#REMOVE_FUNCTIONS[@]}):"
for func in "${REMOVE_FUNCTIONS[@]}"; do
    echo "  ❌ $func"
done

echo ""
echo "⚠️  This will remove ${#REMOVE_FUNCTIONS[@]} functions. Continue? (y/N)"
read -r confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  Removing unused functions..."
    
    for func in "${REMOVE_FUNCTIONS[@]}"; do
        echo "Removing: $func"
        supabase functions delete "$func" --project-ref bzxohkrxcwodllketcpz
        sleep 1  # Small delay to avoid rate limiting
    done
    
    echo ""
    echo "✅ Cleanup complete!"
    echo "📊 Remaining functions: ${#KEEP_FUNCTIONS[@]}"
    echo "🎯 Free slots available: ${#REMOVE_FUNCTIONS[@]}"
    
    echo ""
    echo "Next step: Deploy VideoRemix functions that are called by frontend but missing"
else
    echo "❌ Cleanup cancelled"
fi
