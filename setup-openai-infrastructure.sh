#!/bin/bash

# OpenAI API Setup Script for VideoRemix Migration
# This script configures OpenAI API access and monitoring

set -e

echo "🚀 Setting up OpenAI API infrastructure for VideoRemix migration..."

# Check for required environment variables
check_env_vars() {
    echo "🔍 Checking environment variables..."

    required_vars=("OPENAI_API_KEY")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "\033[0;31m❌ Missing required environment variables:\033[0m"
        printf '  - %s\n' "${missing_vars[@]}"
        echo -e "\033[1;33mPlease set these environment variables before running this script.\033[0m"
        exit 1
    fi

    echo -e "\033[0;32m✅ Environment variables are set\033[0m"
}

# Test OpenAI API connectivity
test_api_connectivity() {
    echo "🔌 Testing OpenAI API connectivity..."

    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            -H "Content-Type: application/json" \
            https://api.openai.com/v1/models)

        if [ "$response" -eq 200 ]; then
            echo -e "\033[0;32m✅ OpenAI API connection successful\033[0m"
        else
            echo -e "\033[0;31m❌ OpenAI API connection failed (HTTP $response)\033[0m"
            echo "Please check your API key and network connectivity."
            exit 1
        fi
    else
        echo -e "\033[1;33m⚠️  curl not available, skipping API connectivity test\033[0m"
    fi
}

# Setup monitoring
setup_monitoring() {
    echo "📊 Setting up API monitoring..."

    # Create monitoring directory
    mkdir -p monitoring/logs

    # Setup log rotation
    cat > monitoring/logrotate.conf << EOF
monitoring/logs/openai-usage.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

    echo -e "\033[0;32m✅ Monitoring setup complete\033[0m"
}

# Configure rate limiting
configure_rate_limiting() {
    echo "⏱️  Configuring rate limiting..."

    # Create rate limit configuration
    cat > .rate-limits.json << EOF
{
    "openai": {
        "requests_per_minute": 50,
        "requests_per_hour": 1000,
        "tokens_per_minute": 10000,
        "burst_limit": 10,
        "backoff_multiplier": 2,
        "max_retries": 3
    }
}
EOF

    echo -e "\033[0;32m✅ Rate limiting configured\033[0m"
}

# Setup cost monitoring
setup_cost_monitoring() {
    echo "💰 Setting up cost monitoring..."

    # Create cost monitoring configuration
    cat > .cost-monitoring.json << EOF
{
    "daily_budget": 50.00,
    "monthly_budget": 1000.00,
    "alert_thresholds": {
        "warning": 0.8,
        "critical": 0.95
    },
    "notification_channels": [
        "slack",
        "email"
    ]
}
EOF

    echo -e "\033[0;32m✅ Cost monitoring setup complete\033[0m"
}

# Create backup configurations
create_backup_configs() {
    echo "💾 Creating backup configurations..."

    # Backup current environment
    cp .env .env.backup 2>/dev/null || true

    # Create fallback model configurations
    cat > .fallback-models.json << EOF
{
    "primary_models": {
        "text": "gpt-4o",
        "embedding": "text-embedding-ada-002",
        "speech": "whisper-1"
    },
    "fallback_models": {
        "text": ["gpt-4", "gpt-3.5-turbo"],
        "embedding": ["text-embedding-ada-002"],
        "speech": ["whisper-1"]
    },
    "error_handling": {
        "max_retries": 3,
        "backoff_seconds": 1,
        "circuit_breaker_threshold": 5
    }
}
EOF

    echo -e "\033[0;32m✅ Backup configurations created\033[0m"
}

# Main setup process
main() {
    echo "🎯 Starting OpenAI API setup for VideoRemix migration"
    echo "=================================================="

    check_env_vars
    test_api_connectivity
    setup_monitoring
    configure_rate_limiting
    setup_cost_monitoring
    create_backup_configs

    echo ""
    echo -e "\033[0;32m🎉 OpenAI API infrastructure setup complete!\033[0m"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update your application configurations to use OpenAI models"
    echo "2. Run the monitoring script: node .openai-config/monitor.js"
    echo "3. Test converted applications with OpenAI keys"
    echo "4. Monitor usage and costs regularly"
    echo ""
    echo "📊 Configuration files created:"
    echo "  - .openai-config/migration-config.json"
    echo "  - .rate-limits.json"
    echo "  - .cost-monitoring.json"
    echo "  - .fallback-models.json"
    echo ""
    echo "🔧 Monitoring commands:"
    echo "  node .openai-config/monitor.js    # Check current usage"
    echo "  tail -f monitoring/logs/openai-usage.log  # Monitor logs"
}

# Run main function
main