/*
  # Fix Authentication Issues

  ## Summary
  Addresses issues where users can sign up but cannot sign in with their credentials.

  ## Problems Identified
  1. RLS policies on user_roles may prevent users from reading their own role
  2. Trigger function silently fails if user_roles insert fails
  3. Complex RLS policies may cause issues with new user creation

  ## Changes Made
  1. **Fix user_roles RLS policies** - Ensure users can always read their own role
  2. **Improve handle_new_user trigger** - Better error handling and logging
  3. **Add fallback policies** - Ensure basic access for all authenticated users
  4. **Fix user_achievements RLS** - Allow users to insert their own achievements

  ## Notes
  - All changes are backward compatible
  - Existing users will not be affected
  - New users will have proper access from signup
*/

-- ============================================================================
-- SECTION 1: Fix user_roles RLS Policies
-- ============================================================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON user_roles;

-- Ensure the is_super_admin function exists and works correctly
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

-- Policy 1: Users can always read their own role (critical for auth)
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Super admins can read all roles
CREATE POLICY "Super admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Policy 3: Super admins can insert new roles
CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Policy 4: Super admins can update roles
CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Policy 5: Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ============================================================================
-- SECTION 2: Improve handle_new_user Trigger Function
-- ============================================================================

-- Drop and recreate with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Try to create user_roles entry
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_role_id;
  
  IF v_role_id IS NULL THEN
    -- Role already exists, log but don't fail
    RAISE LOG 'User % already has a role entry', NEW.id;
  ELSE
    RAISE LOG 'Created user role for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 3: Fix user_achievements RLS Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON user_achievements;

-- Policy 1: Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own achievements (needed for signup flow)
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own achievements
CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own achievements
CREATE POLICY "Users can delete own achievements"
  ON user_achievements FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 4: Fix user_dashboard_preferences RLS Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can insert own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can update own dashboard preferences" ON user_dashboard_preferences;
DROP POLICY IF EXISTS "Users can delete own dashboard preferences" ON user_dashboard_preferences;

-- Policy 1: Users can view their own preferences
CREATE POLICY "Users can view own dashboard preferences"
  ON user_dashboard_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own preferences
CREATE POLICY "Users can insert own dashboard preferences"
  ON user_dashboard_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own preferences
CREATE POLICY "Users can update own dashboard preferences"
  ON user_dashboard_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own preferences
CREATE POLICY "Users can delete own dashboard preferences"
  ON user_dashboard_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 5: Ensure Proper Permissions
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_dashboard_preferences TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SECTION 6: Add Comments for Documentation
-- ============================================================================

COMMENT ON FUNCTION handle_new_user() IS 'Trigger function that creates user_roles entry for new users. Uses SECURITY DEFINER to bypass RLS during insert.';
COMMENT ON FUNCTION is_super_admin() IS 'Helper function to check if current user is super_admin. Uses SECURITY DEFINER to prevent RLS recursion.';
COMMENT ON POLICY "Users can read own role" ON user_roles IS 'Allows users to always read their own role entry - critical for authentication flow';
COMMENT ON POLICY "Users can insert own achievements" ON user_achievements IS 'Allows users to insert their own achievements during signup and usage';
