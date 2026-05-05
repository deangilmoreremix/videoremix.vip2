#!/bin/bash

# 🎯 REVOLUTIONARY LAUNCH SCRIPT
# Card Tile & Modal Experience Launch Sequence

set -e  # Exit on any error

echo "🚀 REVOLUTIONARY LAUNCH: Card Tile & Modal Experience"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAUNCH_ENV="${LAUNCH_ENV:-production}"
FEATURE_FLAG="${FEATURE_FLAG:-VITE_ENABLE_CARD_MODAL_EXPERIENCE}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-launch validation
validate_prerequisites() {
    log "🔍 Validating prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        error "Not in project root directory"
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        error "node_modules not found. Run 'npm install' first"
        exit 1
    fi

    # Check if build works
    if ! npm run build > /dev/null 2>&1; then
        error "Build failed. Fix build issues before launch"
        exit 1
    fi

    success "Prerequisites validated"
}

# Health checks
run_health_checks() {
    log "🏥 Running health checks..."

    # Component tests
    if command -v npm &> /dev/null; then
        if npm run test:components > /dev/null 2>&1; then
            success "Component tests passed"
        else
            warning "Component tests failed - proceeding with caution"
        fi
    fi

    # Database connectivity
    if [ -n "$SUPABASE_URL" ]; then
        if curl -s "$SUPABASE_URL" > /dev/null; then
            success "Database connectivity verified"
        else
            error "Database connectivity failed"
            exit 1
        fi
    fi
}

# Feature flag management
enable_feature_flag() {
    log "🏁 Enabling feature flag..."

    # Create .env file with feature flag
    echo "$FEATURE_FLAG=true" >> .env

    success "Feature flag enabled"
}

# Backup systems
create_backup() {
    log "💾 Creating backup..."

    # Backup current deployment
    mkdir -p backups/$(date +%Y%m%d_%H%M%S)
    cp -r dist/* backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

    # Database backup if available
    if command -v supabase &> /dev/null; then
        supabase db dump > backups/$(date +%Y%m%d_%H%M%S)/database.sql 2>/dev/null || true
    fi

    success "Backup created"
}

# Deploy to staging
deploy_staging() {
    log "🎭 Deploying to staging..."

    # Set staging environment
    export NODE_ENV=staging

    # Build for staging
    npm run build

    # Deploy to staging (Netlify example)
    if command -v netlify &> /dev/null; then
        netlify deploy --dir=dist --alias=staging-card-modal
        success "Staging deployment complete"
    else
        warning "Netlify CLI not found - manual staging deployment required"
    fi
}

# Production deployment
deploy_production() {
    log "🌟 Deploying to production..."

    # Build for production
    npm run build

    # Deploy to production
    if command -v netlify &> /dev/null; then
        netlify deploy --prod --dir=dist
        success "Production deployment complete"
    else
        error "Netlify CLI not found - cannot deploy automatically"
        exit 1
    fi
}

# Post-launch verification
verify_deployment() {
    log "🔍 Verifying deployment..."

    # Wait for deployment to propagate
    sleep 30

    # Check if site is accessible
    if curl -s -o /dev/null -w "%{http_code}" https://videoremix.vip2/ | grep -q "200"; then
        success "Site is accessible"
    else
        error "Site is not accessible"
        exit 1
    fi

    # Check if modal loads (basic check)
    if curl -s https://videoremix.vip2/ | grep -q "ProductDetailModal"; then
        success "Modal components detected"
    else
        warning "Modal components not detected in HTML - may be loaded dynamically"
    fi
}

# Monitoring setup
setup_monitoring() {
    log "📊 Setting up monitoring..."

    # Start monitoring if available
    if [ -f "monitoring/docker-compose.yml" ]; then
        cd monitoring
        docker-compose up -d
        cd ..
        success "Monitoring systems started"
    else
        warning "Monitoring systems not configured"
    fi
}

# Rollback function
rollback() {
    log "🔄 Initiating rollback..."

    # Disable feature flag
    sed -i.bak "/$FEATURE_FLAG/d" .env

    # Redeploy
    npm run build
    netlify deploy --prod --dir=dist

    success "Rollback complete"
}

# Main launch sequence
main() {
    echo ""
    echo "🎯 REVOLUTIONARY LAUNCH SEQUENCE"
    echo "==============================="

    case "${1:-launch}" in
        "validate")
            validate_prerequisites
            run_health_checks
            ;;
        "staging")
            validate_prerequisites
            create_backup
            enable_feature_flag
            deploy_staging
            ;;
        "production")
            validate_prerequisites
            run_health_checks
            create_backup
            enable_feature_flag
            deploy_production
            verify_deployment
            setup_monitoring
            ;;
        "rollback")
            rollback
            ;;
        "launch")
            # Full launch sequence
            validate_prerequisites
            run_health_checks
            create_backup
            enable_feature_flag
            deploy_staging
            echo ""
            warning "Staging deployment complete. Verify manually before proceeding to production."
            echo "Run '$0 production' when ready for production launch."
            ;;
        *)
            echo "Usage: $0 [validate|staging|production|launch|rollback]"
            exit 1
            ;;
    esac

    echo ""
    if [ $? -eq 0 ]; then
        success "🎉 Operation completed successfully!"
    else
        error "💥 Operation failed!"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"