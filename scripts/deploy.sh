# Deploy Script

#!/bin/bash

# VideoRemix.vip Deployment Script
# This script handles deployment to both Netlify and Vercel

set -e

echo "🚀 Starting VideoRemix.vip deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo "🔍 Checking environment variables..."

    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '  - %s\n' "${missing_vars[@]}"
        echo -e "${YELLOW}Please set these in your deployment platform's environment variables.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Environment variables are set${NC}"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    npm run build

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Deploy to Netlify
deploy_netlify() {
    if command -v netlify &> /dev/null; then
        echo "🌐 Deploying to Netlify..."
        netlify deploy --prod --dir=dist

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Netlify deployment completed${NC}"
            echo ""
            echo "🚀 Deployment successful! To see changes immediately:"
            echo "1. Hard refresh your browser: Ctrl+F5 (or Cmd+Shift+R on Mac)"
            echo "2. Or open in incognito/private mode"
            echo "3. Clear browser cache if issues persist"
            echo ""
            echo "📋 Cache Clearing Instructions:"
            echo "Chrome/Edge: Ctrl+Shift+Delete → Cached images and files → Clear"
            echo "Firefox: Ctrl+Shift+Delete → Cache → Clear"
            echo ""
        else
            echo -e "${RED}❌ Netlify deployment failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Netlify CLI not found, skipping Netlify deployment${NC}"
        echo -e "${YELLOW}Install with: npm install -g netlify-cli${NC}"
    fi
}



# Main deployment process
main() {
    check_env_vars
    build_app
    deploy_netlify

    echo -e "${GREEN}🎉 Netlify deployment completed!${NC}"
    echo "Check your Netlify dashboard for the live status."
}

# Run main function
main