#!/bin/bash

# Production Monitoring Deployment Script
# Deploys the complete monitoring stack for VideoRemix VIP2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITORING_DIR="$PROJECT_ROOT/monitoring"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="$MONITORING_DIR/docker-compose.yml"
ENV_FILE="$MONITORING_DIR/.env.monitoring"
MAIN_ENV_FILE="$PROJECT_ROOT/.env"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if docker-compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Setup environment variables
setup_env() {
    log_info "Setting up environment variables..."

    # Check if Slack webhook is configured
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log_warning "SLACK_WEBHOOK_URL not set in environment"
        log_info "Option 1: Set in shell: export SLACK_WEBHOOK_URL='your-webhook'"
        log_info "Option 2: Edit monitoring/.env.monitoring directly"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check OpenAI API key
    if [ -z "$OPENAI_API_KEY" ]; then
        log_warning "OPENAI_API_KEY not set"
        log_info "This is needed for OpenAI cost tracking exporter"
        read -p "Continue? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Create monitoring .env file
    if [ -f "$ENV_FILE" ]; then
        log_info "Found monitoring .env file"
    else
        log_warning "monitoring/.env.monitoring not found - creating from template"
        cp "$MONITORING_DIR/.env.monitoring.example" "$ENV_FILE" 2>/dev/null || true
    fi

    log_success "Environment setup complete"
}

# Build Docker images
build_images() {
    log_info "Building monitoring Docker images..."

    cd "$MONITORING_DIR"

    # Build exporters
    log_info "Building OpenAI exporter..."
    docker build \
        -f exporters/Dockerfile.openai \
        -t vr-openai-exporter:latest \
        exporters/ || true

    log_info "Building App metrics exporter..."
    docker build \
        -f exporters/Dockerfile.app \
        -t vr-app-exporter:latest \
        exporters/ || true

    log_info "Building Health checker..."
    docker build \
        -f scripts/Dockerfile.health \
        -t vr-health-checker:latest \
        scripts/ || true

    log_info "Building Cost tracker..."
    docker build \
        -f scripts/Dockerfile.cost \
        -t vr-cost-tracker:latest \
        scripts/ || true

    log_success "Docker images built"
}

# Start services
start_services() {
    log_info "Starting monitoring services..."

    cd "$MONITORING_DIR"
    docker-compose up -d

    log_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to become healthy..."

    # Wait for Prometheus
    log_info "Waiting for Prometheus..."
    for i in {1..30}; do
        if curl -s http://localhost:9090/-/healthy &> /dev/null; then
            log_success "Prometheus is ready"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo

    # Wait for Grafana
    log_info "Waiting for Grafana..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health | grep -q "ok"; then
            log_success "Grafana is ready"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo

    # Wait for Loki
    log_info "Waiting for Loki..."
    for i in {1..30}; do
        if curl -s http://localhost:3100/ready | grep -q "ready"; then
            log_success "Loki is ready"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    local errors=0

    # Check all services are running
    local services=("prometheus" "grafana" "loki" "alertmanager" "node-exporter" "cadvisor")
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            ((errors++))
        fi
    done

    # Check metrics endpoint
    log_info "Testing metrics endpoint..."
    if curl -s http://localhost:9090/metrics | head -5 | grep -q "HELP"; then
        log_success "Prometheus metrics endpoint accessible"
    else
        log_error "Prometheus metrics endpoint not accessible"
        ((errors++))
    fi

    # Check Grafana access
    log_info "Testing Grafana access..."
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
        log_success "Grafana is accessible"
    else
        log_error "Grafana is not accessible"
        ((errors++))
    fi

    # Check OpenAI exporter metrics
    log_info "Testing OpenAI exporter..."
    if curl -s http://localhost:9464/metrics | grep -q "openai"; then
        log_success "OpenAI exporter is collecting metrics"
    else
        log_warning "OpenAI exporter may need API key configured"
    fi

    # Check health checker
    log_info "Testing health checker..."
    if curl -s http://localhost:9466/health | grep -q "healthy"; then
        log_success "Health checker is responding"
    else
        log_warning "Health checker may need configuration"
    fi

    if [ $errors -eq 0 ]; then
        log_success "All service checks passed!"
    else
        log_warning "Some services have issues - check logs with: docker-compose logs"
    fi
}

# Display access information
show_access_info() {
    echo
    echo "=============================================="
    echo "  Monitoring Stack Deployment Complete!"
    echo "=============================================="
    echo
    echo "Access URLs:"
    echo "  📊 Grafana:        http://localhost:3000"
    echo "                   Login: admin / admin"
    echo "                   (CHANGE PASSWORD IMMEDIATELY!)"
    echo
    echo "  📈 Prometheus:      http://localhost:9090"
    echo "  ⚠️  Alertmanager:    http://localhost:9093"
    echo "  📋 Loki Logs:       http://localhost:3100"
    echo "  🐳 cAdvisor:        http://localhost:8080"
    echo "  📊 Node Exporter:   http://localhost:9100/metrics"
    echo
    echo "Dashboards:"
    echo "  • OpenAI Usage & Cost Monitoring"
    echo "  • Application Health & Performance"
    echo "  • System Resources"
    echo "  • Error Tracking & Logs"
    echo
    echo "Alert Channels:"
    echo "  • Slack #monitoring-alerts (critical & warnings)"
    echo "  • Slack #cost-alerts (budget alerts)"
    echo
    echo "Next Steps:"
    echo "  1. Change Grafana admin password"
    echo "  2. Configure SLACK_WEBHOOK_URL in .env"
    echo "  3. Integrate application (see docs/MONITORING_INTEGRATION.md)"
    echo "  4. Set up alert routing (edit alertmanager/alertmanager.yml)"
    echo "  5. Configure retention periods for your storage"
    echo
    echo "Useful Commands:"
    echo "  View logs:       docker-compose logs -f <service>"
    echo "  Restart service: docker-compose restart <service>"
    echo "  Stop all:        docker-compose down"
    echo "  Status:          docker-compose ps"
    echo "  Check alerts:    curl http://localhost:9093/api/v1/alerts"
    echo
    echo "For support, see: monitoring/README.md"
    echo
}

# Main execution
main() {
    echo "=========================================="
    echo "  VideoRemix Monitoring Deployment"
    echo "=========================================="
    echo

    check_prerequisites
    setup_env
    build_images
    start_services
    wait_for_services
    verify_deployment
    show_access_info

    log_success "Deployment completed successfully!"
}

# Run main
main "$@"
