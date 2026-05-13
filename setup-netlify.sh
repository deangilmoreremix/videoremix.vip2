#!/bin/bash

# Netlify Automated Deployment Setup Script
# This script configures Netlify CLI for automated deployments

echo "🔧 Setting up Netlify CLI for automated deployments..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check for NETLIFY_AUTH_TOKEN
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo "⚠️  NETLIFY_AUTH_TOKEN not found in environment"
    echo "📋 To set up authentication:"
    echo "1. Go to https://app.netlify.com/user/applications#personal-access-tokens"
    echo "2. Generate a new personal access token"
    echo "3. Add it to your .env file:"
    echo "   echo 'NETLIFY_AUTH_TOKEN=your_token_here' >> .env"
    echo "4. Or export it: export NETLIFY_AUTH_TOKEN=your_token_here"
    read -p "Do you have a token ready? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Setup cancelled. Please get your token and run this script again."
        exit 1
    fi
    read -p "Enter your Netlify personal access token: " -s NETLIFY_AUTH_TOKEN
    echo
    echo "NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN" >> .env
fi

# Login to Netlify CLI
echo "🔐 Logging in to Netlify CLI..."
export NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN
netlify login --token

# Check login status
if netlify status > /dev/null 2>&1; then
    echo "✅ Netlify CLI authentication successful"
else
    echo "❌ Netlify CLI login failed"
    exit 1
fi

# Check if site is linked
if [ ! -f ".netlify/state.json" ]; then
    echo "🔗 Site not linked. Linking site..."
    read -p "Enter your Netlify site ID or URL: " SITE_ID
    netlify link --id $SITE_ID
fi

# Verify site linking
if netlify status > /dev/null 2>&1; then
    echo "✅ Site linked successfully"
    netlify status
else
    echo "❌ Site linking failed"
    exit 1
fi

# Set up build hooks for automation
echo "🔗 Setting up build hooks..."
HOOK_URL=$(netlify build-hooks create --name "auto-deploy" --branch main | grep -o 'https://[^"]*')

if [ -n "$HOOK_URL" ]; then
    echo "✅ Build hook created: $HOOK_URL"
    echo "💡 Use this URL to trigger automated deployments"
else
    echo "⚠️  Could not create build hook automatically"
fi

echo "🎉 Netlify setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push your changes to trigger automatic deployments"
echo "2. Use 'npm run deploy' for manual deployments"
echo "3. Use build hook URL for external triggers"