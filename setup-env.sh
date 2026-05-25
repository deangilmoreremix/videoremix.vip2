#!/bin/bash
# Auto-generate .env from supabase status
cd "$(dirname "$0")"

echo "� Getting Supabase credentials..."
SUPABASE_STATUS=$(supabase status 2>&1)

# Extract URLs
SUPABASE_URL=$(echo "$SUPABASE_STATUS" | grep "API URL" | grep -oP 'https?://[^`     ]+')
SUPABASE_ANON_KEY=$(echo "$SUPABASE_STATUS" | grep "anon" | grep -oP 'eyJ[^`     "]+')

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Failed to get Supabase credentials"
    exit 1
fi

echo "� Creating .env file..."
cat > .env << EOFF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Copy other settings from .env.example
EOFF

# Copy other settings from .env.example if exists
if [ -f .env.example ]; then
    grep -v "VITE_SUPABASE" .env.example >> .env
fi

echo "✅ Created .env with local Supabase credentials"
echo "   URL: $SUPABASE_URL"
echo "   Key: ${SUPABASE_ANON_KEY:0:20}..."
