#!/usr/bin/env bash
# ============================================================
# Clerk Production Keys Setup
# ============================================================
# This script helps you switch from Clerk development keys to
# production keys for deployment.
#
# Prerequisites:
#   1. Have a Clerk account at https://dashboard.clerk.com
#   2. Have a production instance created in Clerk dashboard
#   3. Have your production keys ready (pk_live_... and sk_live_...)
#
# Usage:
#   ./setup-clerk-production.sh
#
# Or manually:
#   1. Go to https://dashboard.clerk.com
#   2. Select your production instance
#   3. Go to "API Keys" in the sidebar
#   4. Copy the Publishable Key (pk_live_...) and Secret Key (sk_live_...)
#   5. Update your .env file with these keys
# ============================================================

set -e

echo "============================================================"
echo "Clerk Production Keys Setup"
echo "============================================================"
echo ""
echo "This script will help you switch from Clerk development keys"
echo "to production keys for deployment."
echo ""
echo "Prerequisites:"
echo "  1. Clerk account at https://dashboard.clerk.com"
echo "  2. Production instance created in Clerk dashboard"
echo "  3. Production keys ready (pk_live_... and sk_live_...)"
echo ""
echo "------------------------------------------------------------"
echo ""

# Check current keys
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found"
  echo "   Run: cp .env.example .env"
  exit 1
fi

CURRENT_PUB_KEY=$(grep "VITE_CLERK_PUBLISHABLE_KEY" "$ENV_FILE" | cut -d'=' -f2)
CURRENT_SECRET_KEY=$(grep "CLERK_SECRET_KEY" "$ENV_FILE" | cut -d'=' -f2)

if [[ "$CURRENT_PUB_KEY" == pk_live_* ]]; then
  echo "✅ Already using production keys!"
  echo "   VITE_CLERK_PUBLISHABLE_KEY=$CURRENT_PUB_KEY"
  exit 0
fi

if [[ "$CURRENT_PUB_KEY" == pk_test_* ]]; then
  echo "⚠️  Currently using DEVELOPMENT keys"
  echo "   VITE_CLERK_PUBLISHABLE_KEY=$CURRENT_PUB_KEY"
  echo ""
  echo "To switch to production:"
  echo ""
  echo "1. Go to https://dashboard.clerk.com"
  echo "2. Select your PRODUCTION instance (not Development)"
  echo "3. Click 'API Keys' in the sidebar"
  echo "4. Copy the Publishable Key (starts with pk_live_)"
  echo "5. Copy the Secret Key (starts with sk_live_)"
  echo "6. Update your .env file:"
  echo ""
  echo "   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here"
  echo "   CLERK_SECRET_KEY=sk_live_your_key_here"
  echo ""
  echo "7. Restart your dev server: npm run dev"
  echo ""
  echo "------------------------------------------------------------"
  echo ""
  read -p "Do you want to update the keys now? (y/N): " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your production Publishable Key (pk_live_...): " NEW_PUB_KEY
    read -p "Enter your production Secret Key (sk_live_...): " NEW_SECRET_KEY

    if [[ ! "$NEW_PUB_KEY" == pk_live_* ]]; then
      echo "❌ Invalid Publishable Key format. Must start with pk_live_"
      exit 1
    fi

    if [[ ! "$NEW_SECRET_KEY" == sk_live_* ]]; then
      echo "❌ Invalid Secret Key format. Must start with sk_live_"
      exit 1
    fi

    # Update .env file
    sed -i '' "s|VITE_CLERK_PUBLISHABLE_KEY=.*|VITE_CLERK_PUBLISHABLE_KEY=$NEW_PUB_KEY|" "$ENV_FILE"
    sed -i '' "s|CLERK_SECRET_KEY=.*|CLERK_SECRET_KEY=$NEW_SECRET_KEY|" "$ENV_FILE"

    echo ""
    echo "✅ Keys updated in .env"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your dev server: npm run dev"
    echo "  2. Verify the warning is gone: 'Clerk has been loaded with development keys'"
    echo "  3. Test sign-in/sign-up flows"
    echo "  4. Deploy to production"
  else
    echo ""
    echo "No changes made. Update your .env file manually when ready."
  fi
else
  echo "⚠️  Could not detect Clerk key format"
  echo "   Current VITE_CLERK_PUBLISHABLE_KEY=$CURRENT_PUB_KEY"
  echo ""
  echo "Please update your .env file manually with production keys."
fi
