/*
  # Fix User Roles RLS Infinite Recursion

  ## Problem
  The existing RLS policies on `user_roles` table create infinite recursion because:
  - Policy checks if user is super_admin by querying user_roles table
  - This triggers the same policy again, causing infinite loop

  ## Solution
  Replace the recursive policies with simpler ones:
  1. Users can always read their own role (no recursion)
  2. Super admins can manage all roles (check via function, not subquery)
  
  ## Changes
  - Drop existing problematic policies
  - Create new non-recursive policies
  - Users can read their own role without any checks
  - Create helper function to check super_admin status safely
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can read roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;

-- Create a security definer function to check if current user is super admin
-- This breaks the recursion by using a function instead of a subquery
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

-- Policy: Super admins can insert new roles
CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Policy: Super admins can update roles
CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Policy: Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
