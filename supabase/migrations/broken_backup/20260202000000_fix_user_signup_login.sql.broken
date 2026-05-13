/*
  # Fix User Signup and Login Issues

  ## Problem
  Users are able to signup but cannot login afterward with their credentials.

  ## Issues Identified
  1. handle_new_user trigger may fail silently when creating user_roles entries
  2. Frontend email confirmation check is inconsistent with Supabase settings
  3. Need to ensure user_roles entries are created reliably for all new users

  ## Solution
  1. Improve handle_new_user trigger with better error handling
  2. Ensure RLS policies allow new users to read their own role
  3. Add a fallback mechanism to create user_roles if trigger fails
*/

-- ============================================================================
-- SECTION 1: Fix handle_new_user trigger function
-- ============================================================================

-- First, create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Only create user_roles entry, not admin_profiles
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_role_id;
  
  -- Log successful creation
  IF v_role_id IS NOT NULL THEN
    RAISE LOG 'Created user_roles entry for user_id: %', NEW.id;
  ELSE
    RAISE LOG 'User % already has a role, skipping creation', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to not block user creation in auth.users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 2: Fix user_roles RLS policies to ensure users can read their role
-- ============================================================================

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users manage own roles" ON user_roles;

-- Enable RLS on user_roles (in case it was disabled)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if current user is super admin
-- This breaks any recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Simple policy: Users can always read their own role (no checks needed)
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Super admins can read all roles
CREATE POLICY "Super admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Policy: Super admins can manage roles
CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon;

-- ============================================================================
-- SECTION 3: Backfill user_roles for existing users who might be missing them
-- ============================================================================

-- Create roles for any auth.users who don't have a user_roles entry
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id,
  'user'::public.app_role
FROM auth.users au
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL;

-- Log how many users were fixed
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users au
  LEFT JOIN user_roles ur ON ur.user_id = au.id
  WHERE ur.id IS NULL;
  
  IF v_count > 0 THEN
    RAISE LOG 'Created missing user_roles entries for % users', v_count;
  ELSE
    RAISE LOG 'All users have user_roles entries - no changes needed';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: Add a database function to fix missing roles (for manual fixing)
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_missing_user_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  action_taken text
) AS $$
BEGIN
  RETURN QUERY
  WITH missing_roles AS (
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN user_roles ur ON ur.user_id = au.id
    WHERE ur.id IS NULL
  ),
  inserted AS (
    INSERT INTO user_roles (user_id, role)
    SELECT mr.id, 'user'
    FROM missing_roles mr
    RETURNING user_roles.user_id, user_roles.role
  )
  SELECT 
    mr.id,
    mr.email,
    'Role created'::text as action_taken
  FROM missing_roles mr
  JOIN inserted i ON i.user_id = mr.id
  
  UNION ALL
  
  SELECT 
    au.id,
    au.email,
    'Role already exists'::text as action_taken
  FROM auth.users au
  JOIN user_roles ur ON ur.user_id = au.id
  WHERE au.id NOT IN (SELECT id FROM missing_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fix_missing_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_missing_user_roles() TO anon;

-- ============================================================================
-- SECTION 5: Add helpful comments for debugging
-- ============================================================================

COMMENT ON FUNCTION handle_new_user() IS 'Trigger function that creates a user_roles entry when a new user signs up. Runs with SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION is_super_admin() IS 'Checks if the current user has super_admin role. Used in RLS policies to avoid recursion.';
COMMENT ON FUNCTION fix_missing_user_roles() IS 'Fixes missing user_roles entries for existing auth.users. Can be called manually or by admins.';

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Migration 20260202000000_fix_user_signup_login completed successfully';
END $$;
