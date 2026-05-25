#!/bin/bash

# Deploy VideoRemix Functions After Cleanup
# Run this after cleanup_supabase_functions.sh

echo "🚀 Deploying VideoRemix Edge Functions..."
echo "This will deploy the most commonly used functions called by the frontend"
echo ""

# Most critical VideoRemix functions (prioritize these)
HIGH_PRIORITY_FUNCTIONS=(
    "ai-reasoning-agent"
    "chat-with-pdf"
    "autonomous-rag"
    "ai-personalized-memory"
    "ai-router-app"
    "multi-ai-memory"
    "contentgenius-ai"
    "tutorial-starter-agent"
    "tutorial-parallel-agent"
    "tutorial-sequential-agent"
    "tutorial-loop-agent"
    "tutorial-memory-conversation-agent"
    "tutorial-running-agents"
    "tutorial-sessions"
    "tutorial-plugins"
    "tutorial-agent-lifecycle-callbacks"
    "tutorial-llm-interaction-callbacks"
    "tutorial-tool-execution-callbacks"
)

# Medium priority - popular agents
MEDIUM_PRIORITY_FUNCTIONS=(
    "rag-agent-cohere"
    "llama3-1-local-rag"
    "llama31-local-rag"
    "vision-rag"
    "voice-rag-openaisdk"
    "web-scraping-agent"
    "web-scraping-ai-agent"
    "ai-travel-agent"
    "ai-travel-agent-memory"
    "ai-movie-production-agent"
    "ai-startup-trend-analysis-agent"
    "ai-startup-insight-fire1-agent"
    "ai-medical-imaging-agent"
    "ai-system-architect-r1"
    "ai-3dpygame-r1"
    "ai-chess-agent"
    "ai-tic-tac-toe-agent"
    "ai-financial-coach-agent"
    "ai-audio-tour-agent"
    "ai-blog-to-podcast-agent"
    "ai-arxiv-agent-memory"
    "ai-blog-search"
    "ai-breakup-recovery-agent"
    "ai-competitor-intelligence-agent-team"
    "ai-customer-support-agent"
    "ai-data-analysis-agent"
    "ai-data-visualisation-agent"
    "ai-deep-research-agent"
    "ai-email-gtm-outreach-agent"
    "ai-fraud-investigation-agent"
    "ai-game-design-agent-team"
    "ai-health-fitness-agent"
    "ai-life-insurance-advisor-agent"
    "ai-mental-wellbeing-agent"
    "ai-meme-generator-agent-browseruse"
    "ai-real-estate-agent-team"
    "ai-recipe-meal-planning-agent"
    "ai-recruitment-agent-team"
    "ai-services-agency"
    "ai-teaching-agent-team"
)

echo "📋 Will deploy functions in priority order:"
echo "🔥 HIGH PRIORITY (${#HIGH_PRIORITY_FUNCTIONS[@]} functions):"
for func in "${HIGH_PRIORITY_FUNCTIONS[@]}"; do
    echo "  🚀 $func"
done

echo ""
echo "📊 MEDIUM PRIORITY (${#MEDIUM_PRIORITY_FUNCTIONS[@]} functions):"
for func in "${MEDIUM_PRIORITY_FUNCTIONS[@]}"; do
    echo "  📈 $func"
done

echo ""
echo "⚠️  This will deploy ${#HIGH_PRIORITY_FUNCTIONS[@]} + ${#MEDIUM_PRIORITY_FUNCTIONS[@]} functions. Continue? (y/N)"
read -r confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying HIGH PRIORITY functions..."
    
    for func in "${HIGH_PRIORITY_FUNCTIONS[@]}"; do
        echo "Deploying: $func"
        if supabase functions deploy "$func" --project-ref bzxohkrxcwodllketcpz 2>/dev/null; then
            echo "  ✅ $func deployed successfully"
        else
            echo "  ❌ $func failed to deploy"
        fi
        sleep 2  # Delay to avoid rate limiting
    done
    
    echo ""
    echo "📊 Deploying MEDIUM PRIORITY functions..."
    
    for func in "${MEDIUM_PRIORITY_FUNCTIONS[@]}"; do
        echo "Deploying: $func"
        if supabase functions deploy "$func" --project-ref bzxohkrxcwodllketcpz 2>/dev/null; then
            echo "  ✅ $func deployed successfully"
        else
            echo "  ❌ $func failed to deploy"
        fi
        sleep 2  # Delay to avoid rate limiting
    done
    
    echo ""
    echo "✅ Deployment complete!"
    echo "🔍 Check function status with: supabase functions list --project-ref bzxohkrxcwodllketcpz"
    
else
    echo "❌ Deployment cancelled"
fi
