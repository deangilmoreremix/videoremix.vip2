#!/bin/bash
# =============================================================================
# Deploy Edge Functions for VideoRemixVIP
# Project: bzxohkrxcwodllketcpz
# 
# Run this script from the project root directory
# Make sure you have the Supabase CLI installed and are logged in
# =============================================================================

set -e

PROJECT_REF="bzxohkrxcwodllketcpz"

echo "=========================================="
echo "VideoRemixVIP Edge Functions Deployment"
echo "=========================================="
echo "Project: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it:"
    echo "   npm install -g supabase"
    echo "   or follow: https://github.com/supabase/cli"
    exit 1
fi

# Check if logged in
echo "Checking Supabase login..."
supabase projects list | grep -q "$PROJECT_REF" || {
    echo "❌ Not linked to project $PROJECT_REF"
    echo "Run: supabase link --project-ref $PROJECT_REF"
    exit 1
}

echo "✅ Connected to project $PROJECT_REF"
echo ""

# Deploy all functions
echo "Deploying Edge Functions..."
echo "=========================================="

FUNCTIONS=(
    "admin-apps"
    "admin-dashboard-stats"
    "admin-features"
    "admin-products"
    "admin-purchases"
    "admin-subscriptions"
    "admin-user-features"
    "admin-users"
    "admin-videos"
    "create-checkout-session"
    "create-super-admin"
    "import-personalizer-purchases"
    "process-csv-import"
    "reset-admin-password"
    "resolve-user-access"
    "send-email-hook"
    "stripe-sync"
    "webhook-paykickstart"
    "webhook-paypal"
    "webhook-stripe"
    "webhook-zaxxa"
)

for func in "${FUNCTIONS[@]}"; do
    echo "Deploying $func..."
    if supabase functions deploy "$func" --project-ref "$PROJECT_REF" 2>/dev/null; then
        echo "  ✅ $func deployed"
    else
        echo "  ⚠️ $func failed or skipped"
    fi
done

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo "=========================================="
