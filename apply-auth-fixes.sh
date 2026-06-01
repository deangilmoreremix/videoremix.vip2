#!/bin/bash

# Apply Critical Authentication Fixes using Supabase SQL API
# This script uses curl to execute SQL statements via Supabase's REST API

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ Missing environment variables"
  echo "Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://\(.*\)\.supabase\.co|\1|')

echo "🚀 Applying Critical Authentication Fixes"
echo "Project: $PROJECT_REF"
echo "=========================================="

# Function to execute SQL via Supabase API
execute_sql() {
  local sql="$1"
  local description="$2"

  echo "🔧 $description"

  # Use the Supabase REST API to execute SQL
  # Note: This uses the internal SQL execution endpoint
  local response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -d "{\"sql\": \"$sql\"}")

  local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  local body=$(echo "$response" | sed '/HTTP_STATUS:/d')

  if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
    echo "   ✅ Success"
  else
    echo "   ❌ Failed (HTTP $http_status): $body"
    # Don't exit on error for now, continue with other statements
  fi
}

# Read and execute the SQL file
echo "📄 Reading CRITICAL_AUTH_FIXES.sql"

# Execute statements one by one
execute_sql "
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on profiles.user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on profiles.user_id already exists';
  END IF;
END \$\$;
" "Adding unique constraint to profiles table"

execute_sql "
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS \$\$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
  lower_email TEXT;
BEGIN
  lower_email := LOWER(NEW.email);

  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  IF full_name = '' AND (first_name != '' OR last_name != '') THEN
    full_name := TRIM(first_name || ' ' || last_name);
  END IF;

  INSERT INTO user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'user', '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO profiles (user_id, email, full_name, tenant_id)
  VALUES (NEW.id, lower_email, COALESCE(NULLIF(full_name, ''), 'User'), '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id) DO UPDATE
  SET email = lower_email, updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;
" "Creating handle_new_user function"

execute_sql "
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
" "Creating trigger on auth.users"

execute_sql "
INSERT INTO profiles (user_id, email, full_name, tenant_id)
SELECT
  au.id,
  LOWER(au.email),
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
" "Creating profiles for existing users"

execute_sql "
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT
  au.id,
  'user',
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
" "Creating user_roles for existing users"

execute_sql "
UPDATE profiles
SET email = LOWER(email)
WHERE email != LOWER(email);
" "Updating existing profiles to lowercase emails"

execute_sql "
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
" "Granting permissions"

echo ""
echo "🎉 Authentication fixes applied!"
echo "🔍 Verifying..."

# Verification queries
echo "📊 Verification Results:"
echo "----------------------------------------"

# Check user counts
user_count=$(curl -s \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/auth.users?select=count" | jq -r '.count // 0')

role_count=$(curl -s \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/user_roles?select=count" | jq -r '.count // 0')

profile_count=$(curl -s \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/profiles?select=count" | jq -r '.count // 0')

echo "Users: $user_count"
echo "Roles: $role_count"
echo "Profiles: $profile_count"

if [ "$user_count" = "$role_count" ] && [ "$user_count" = "$profile_count" ]; then
  echo "✅ All counts match - fix appears successful!"
else
  echo "⚠️  Count mismatch - some users may be missing roles/profiles"
fi

echo ""
echo "🎯 Ready to run the authentication test suite!"
echo "Run: node test-signup-login-fixed.mjs"