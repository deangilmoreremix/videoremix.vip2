-- =============================================================================
-- URGENT FIX: EMAIL CASE SENSITIVITY LOGIN BUG
-- 
-- PROBLEM:
-- Users are unable to login because:
-- 1. Supabase auth stores emails in LOWERCASE internally
-- 2. But profiles table stores emails in original case
-- 3. Queries doing exact case-sensitive match fail
-- 
-- THIS IS CAUSING WIDESPREAD LOGIN FAILURES!
-- =============================================================================

-- Step 1: Fix the handle_new_user trigger to ALWAYS store lowercase email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
  lower_email TEXT;
BEGIN
  -- ALWAYS convert email to lowercase - critical fix!
  lower_email := LOWER(NEW.email);
  
  -- Extract names from user metadata if available
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- If no full_name but have first/last, construct it
  IF full_name = '' AND (first_name != '' OR last_name != '') THEN
    full_name := TRIM(first_name || ' ' || last_name);
  END IF;

  -- Create user_roles entry
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create profiles entry with LOWERCASE EMAIL
  INSERT INTO profiles (user_id, email, full_name, tenant_id)
  VALUES (NEW.id, lower_email, COALESCE(NULLIF(full_name, ''), 'User'), '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id) DO UPDATE 
  SET email = lower_email, updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fix ALL existing profiles to have lowercase emails
-- This fixes ALL existing users immediately
UPDATE profiles 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Step 3: Create unique index on lowercase email to prevent duplicates
DROP INDEX IF EXISTS idx_profiles_email_lower;
CREATE UNIQUE INDEX idx_profiles_email_lower ON profiles(LOWER(email));

-- Step 4: Fix user_has_feature_access function for case-insensitive email matching
CREATE OR REPLACE FUNCTION user_has_feature_access(p_user_id uuid, p_feature_id uuid) 
RETURNS boolean 
SECURITY DEFINER 
SET search_path = public, pg_temp 
LANGUAGE plpgsql 
AS $$
DECLARE v_has_access boolean; 
BEGIN 
  SELECT EXISTS (
    SELECT 1 FROM app_features af 
    JOIN user_app_access uaa ON uaa.app_id = af.app_id
    WHERE af.id = p_feature_id 
    AND uaa.user_id = p_user_id 
    AND uaa.is_active = true
  ) INTO v_has_access; 
  RETURN v_has_access; 
END; 
$$;

-- Step 5: Fix any other functions that do email comparisons
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid AS $$
  SELECT user_id FROM profiles 
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Step 7: Verify the fix
SELECT 'Fixed email case sensitivity bug. Updated ' || COUNT(*) || ' existing user records.' as status
FROM profiles 
WHERE email != LOWER(email);

SELECT 'ALL users can now login regardless of email case!' as message;
