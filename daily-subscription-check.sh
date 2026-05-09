#!/bin/bash

# Cron job script for VideoRemix subscription monitoring
# Run this daily to check for expired subscriptions

echo "🔄 Running daily subscription check..."

# Navigate to the project directory
cd /workspaces/videoremix.vip2

# Run the subscription setup script
node setup-subscriptions.mjs

echo "✅ Daily subscription check complete"