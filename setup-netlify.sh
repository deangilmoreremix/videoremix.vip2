#!/bin/bash

# Netlify Automated Deployment Setup Script
# This script configures Netlify CLI for automated deployments
# Uses project-local netlify-cli via npx instead of global installation

echo "🔧 Setting up Netlify CLI for automated deployments..."

# Use npx to run netlify-cli from project dependencies
NETLIFY_CMD="npx netlify"

# Check if netlify-cli is available in project dependencies
if ! npm list netlify-cli > /dev/null 2>&1; then
    echo "📦 Installing netlify-cli as a project dependency..."
    npm install --save-dev netlify-cli
fi

# Check for NETLIFY_AUTH_TOKEN
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo "⚠️  NETLIFY_AUTH_TOKEN not found in environment"
    echo "📋 To set up authentication:"
    echo "1. Go to https://app.netlify.com/user/applications#personal-access-tokens"
    echo "2. Generate a new personal access token"
    echo "3. Set it as an environment variable:"
    echo "   export NETLIFY_AUTH_TOKEN=your_token_here"
    echo "   Or add it to your .env file (for local development only)"
    exit 1
fi

# Verify authentication using NETLIFY_AUTH_TOKEN
echo "🔐 Verifying Netlify authentication..."
export NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN

if $NETLIFY_CMD status > /dev/null 2>&1; then
    echo "✅ Netlify CLI authentication successful"
else
    echo "❌ Netlify CLI authentication failed"
    echo "   Please check that your NETLIFY_AUTH_TOKEN is valid"
    exit 1
fi

# Check if site is linked
if [ ! -f ".netlify/state.json" ]; then
    echo "🔗 Site not linked. Linking site..."
    read -p "Enter your Netlify site ID or URL: " SITE_ID
    $NETLIFY_CMD link --id $SITE_ID
fi

# Verify site linking
if $NETLIFY_CMD status > /dev/null 2>&1; then
    echo "✅ Site linked successfully"
    $NETLIFY_CMD status
else
    echo "❌ Site linking failed"
    exit 1
fi

# Set up build hooks for automation (optional)
echo "🔗 Setting up build hooks..."
echo "💡 You can create build hooks manually in the Netlify dashboard:"
echo "   Site settings > Build & deploy > Continuous deployment > Build hooks"

echo "🎉 Netlify setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push your changes to trigger automatic deployments"
echo "2. Use 'npm run deploy' for manual deployments (uses npx netlify)"
echo "3. Use 'npm run deploy:auto' for automated deployments"