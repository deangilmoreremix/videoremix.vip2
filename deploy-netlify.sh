#!/bin/bash

# Automated Netlify Deployment Script
# Uses Kilo agents for intelligent deployment orchestration

ENVIRONMENT="${1:-production}"
DRY_RUN="${2:-false}"

echo "🚀 Starting automated Netlify deployment..."
echo "📦 Environment: $ENVIRONMENT"
echo "🧪 Dry run: $DRY_RUN"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if [ "$ENVIRONMENT" = "production" ] && [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Uncommitted changes detected in production deployment"
    echo "💡 Commit or stash changes before deploying"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Validate environment
if ! npm run validate-env > /dev/null 2>&1; then
    echo "❌ Environment validation failed"
    exit 1
fi

# Run tests and linting
echo "🧪 Running tests and linting..."
if ! npm run lint > /dev/null 2>&1; then
    echo "❌ Linting failed"
    exit 1
fi

if ! npm run test:run > /dev/null 2>&1; then
    echo "❌ Tests failed"
    exit 1
fi

echo "✅ Pre-deployment checks passed"

# Build the application
echo "🔨 Building application..."
if ! npm run build > /dev/null 2>&1; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed"

# Check Netlify authentication
echo "🔐 Checking Netlify authentication..."
if ! netlify status > /dev/null 2>&1; then
    echo "❌ Netlify not authenticated. Run setup-netlify.sh first"
    exit 1
fi

# Dry run mode
if [ "$DRY_RUN" = "true" ]; then
    echo "🧪 Dry run mode - would deploy to $ENVIRONMENT"
    echo "📊 Build artifacts ready in ./dist"
    echo "🔗 Would deploy using: netlify deploy --prod --dir=./dist"
    exit 0
fi

# Execute deployment
echo "📤 Deploying to Netlify ($ENVIRONMENT)..."

if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_CMD="netlify deploy --prod --dir=./dist"
elif [ "$ENVIRONMENT" = "preview" ]; then
    DEPLOY_CMD="netlify deploy --dir=./dist"
else
    DEPLOY_CMD="netlify deploy --dir=./dist --alias=$ENVIRONMENT"
fi

# Execute deployment
if $DEPLOY_CMD; then
    echo "✅ Deployment successful!"
    netlify status
else
    echo "❌ Deployment failed"
    exit 1
fi

# Post-deployment verification
echo "🔍 Verifying deployment..."
sleep 5

# Check if site is accessible
SITE_URL=$(netlify status | grep -o 'https://[^[:space:]]*' | head -1)
if [ -n "$SITE_URL" ]; then
    echo "🌐 Site URL: $SITE_URL"
    # Simple health check
    if curl -s --head --fail "$SITE_URL" > /dev/null; then
        echo "✅ Site is accessible"
    else
        echo "⚠️  Site may not be fully deployed yet"
    fi
fi

echo "🎉 Automated deployment complete!"
echo "📊 Deployment summary:"
echo "  - Environment: $ENVIRONMENT"
echo "  - Build status: ✅ Success"
echo "  - Tests: ✅ Passed"
echo "  - Linting: ✅ Passed"
echo "  - Deployment: ✅ Success"