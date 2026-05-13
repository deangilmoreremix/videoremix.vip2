#!/bin/bash
# =============================================================================
# Stripe CLI Setup for VideoRemixVIP Local Development
# =============================================================================

set -e

echo "=========================================="
echo "Stripe CLI Setup"
echo "=========================================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found"
    echo ""
    echo "Install options:"
    echo ""
    echo "1. macOS (Homebrew):"
    echo "   brew install stripe/stripe/stripe"
    echo ""
    echo "2. Debian/Ubuntu:"
    echo "   curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg >/dev/null"
    echo "   echo 'deb https://packages.stripe.dev/stripe-cli-debian-local stable main' | sudo tee /etc/apt/sources.list.d/stripe.list"
    echo "   sudo apt-get update && sudo apt-get install -y stripe"
    echo ""
    echo "3. Manual download:"
    echo "   curl -L -o stripe.tar.gz https://github.com/stripe/stripe-cli/releases/latest/download/stripe_1.40.9_mac-os_x86_64.tar.gz"
    echo "   tar -xzf stripe.tar.gz && ./stripe"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI found: $(stripe --version)"
echo ""

# Check for Stripe credentials
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set in environment"
    echo "   Set it before running stripe login:"
    echo "   export STRIPE_SECRET_KEY=sk_test_..."
    echo ""
fi

echo "To authenticate with your Stripe account:"
echo "  stripe login"
echo ""
echo "To start listening for webhooks locally:"
echo "  stripe listen --forward-to localhost:5173/webhook-stripe"
echo ""
echo "To run with test mode:"
echo "  stripe login --test-mode"
echo ""