-- Fix Profiles RLS for Trigger Function
-- Ensure the trigger can create profiles by allowing service role operations

-- Check current RLS policies and ensure service role can insert
DROP POLICY IF EXISTS "service_role_can_manage_profiles" ON profiles;
CREATE POLICY "service_role_can_manage_profiles" ON profiles
  FOR ALL USING (
    auth.jwt()->>'role' = 'service_role' OR
    auth.uid() = user_id
  );

-- Also allow the trigger function to work by checking for service role context
-- The trigger function runs in a service context, so this should work

-- Alternative approach: Temporarily disable RLS, create profiles, re-enable
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create profiles for all existing users
INSERT INTO profiles (user_id, email, full_name, tenant_id)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    TRIM(
      COALESCE(au.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    ),
    'User'
  ),
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
;

-- Skip user_roles creation during migration to avoid trigger issues
-- User roles will be created by the application or other migrations as needed
-- Focus on fixing profiles RLS and creating missing profiles

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the trigger function is properly set up
SELECT
  'Trigger exists: ' || EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  )::text as trigger_status,
  'Function exists: ' || EXISTS(
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  )::text as function_status;
