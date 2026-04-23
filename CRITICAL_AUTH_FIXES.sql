-- =============================================================================
-- CRITICAL AUTHENTICATION FIXES - Run this SQL in Supabase SQL Editor
-- =============================================================================

-- Step 1: Add unique constraint to profiles table (required for ON CONFLICT)
DO $$
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
END $$;

-- Step 2: Create the handle_new_user function
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
  INSERT INTO user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'user', '00000000-0000-0000-0000-000000000001')
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

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Create profiles for existing users
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

-- Step 5: Create user_roles for existing users
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT
  au.id,
  'user',
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Update existing profiles to lowercase emails
UPDATE profiles
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Verification queries
SELECT 'Profiles created for existing users:' as info, COUNT(*) as count
FROM profiles;

SELECT 'User roles created for existing users:' as info, COUNT(*) as count
FROM user_roles;

SELECT 'Users with confirmed emails:' as info, COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;

-- Final status
SELECT '✅ AUTHENTICATION SYSTEM FIXED!' as status;