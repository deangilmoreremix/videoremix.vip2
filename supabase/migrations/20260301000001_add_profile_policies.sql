-- =============================================================================
-- Add profile policies for user self-management
-- =============================================================================

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "users_can_upsert_own_profile" ON profiles;
CREATE POLICY "users_can_upsert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "users_can_update_own_profile_db" ON profiles;
CREATE POLICY "users_can_update_own_profile_db" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to do anything
DROP POLICY IF EXISTS "service_role_can_manage_all_profiles" ON profiles;
CREATE POLICY "service_role_can_manage_all_profiles" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
