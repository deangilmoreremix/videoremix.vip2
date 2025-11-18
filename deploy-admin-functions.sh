#!/bin/bash

# Admin Functions Deployment Script
# This script deploys all admin edge functions to Supabase

set -e

echo "================================================"
echo "Admin Panel Functions Deployment"
echo "================================================"
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not installed. Please install Node.js and npm."
    exit 1
fi

# List of functions to deploy
FUNCTIONS=(
  "admin-dashboard-stats"
  "admin-apps"
  "admin-users"
  "admin-purchases"
  "admin-features"
  "admin-subscriptions"
  "admin-products"
  "admin-videos"
)

echo "Functions to deploy:"
for func in "${FUNCTIONS[@]}"; do
  echo "  - $func"
done
echo ""

# Prompt for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Starting deployment..."
echo ""

# Deploy each function
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_FUNCTIONS=()

for func in "${FUNCTIONS[@]}"; do
  echo "================================================"
  echo "Deploying: $func"
  echo "================================================"

  if npx supabase functions deploy "$func" --project-ref gadedbrnqzpfqtsdfzcg; then
    echo "✅ $func deployed successfully"
    ((SUCCESS_COUNT++))
  else
    echo "❌ Failed to deploy $func"
    ((FAILED_COUNT++))
    FAILED_FUNCTIONS+=("$func")
  fi

  echo ""
done

# Summary
echo "================================================"
echo "Deployment Summary"
echo "================================================"
echo "Total functions: ${#FUNCTIONS[@]}"
echo "Successful: $SUCCESS_COUNT"
echo "Failed: $FAILED_COUNT"

if [ $FAILED_COUNT -gt 0 ]; then
  echo ""
  echo "Failed functions:"
  for func in "${FAILED_FUNCTIONS[@]}"; do
    echo "  - $func"
  done
  echo ""
  echo "Please check the errors above and try deploying failed functions manually."
  exit 1
else
  echo ""
  echo "🎉 All admin functions deployed successfully!"
  echo ""
  echo "Admin Panel is now fully functional at:"
  echo "https://videoremix.vip/admin"
  echo ""
  echo "Login credentials:"
  echo "Email: dev@videoremix.vip"
  echo "Password: Admin123!@#"
fi

echo "================================================"
