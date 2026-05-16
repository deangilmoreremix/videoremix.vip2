/*
  # Public App Viewing with Purchase-Gated Access

  ## Summary
  Allows all visitors (anon + authenticated) to browse and view active apps.
  Actual app usage remains gated behind purchase/access grants.

  ## Changes
  1. Add policy for anon + authenticated to SELECT active apps
  2. Keep existing admin policy for full CRUD
*/

-- =============================================================================
-- 1. ALLOW ANON + AUTHENTICATED TO VIEW ACTIVE APPS
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view apps" ON apps;

-- Create new policy: anyone (anon or authenticated) can view active apps
CREATE POLICY "Anyone can view active apps"
ON apps
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- =============================================================================
-- 2. VERIFY: Admin policy "Super Admins manage apps" already exists (no change)
-- =============================================================================
