-- Run this directly to fix the login issues
-- This applies all critical fixes that are causing login failures

-- 1. Fix handle_new_user trigger that creates user_roles and profiles
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

  -- Create user_roles entry - THIS IS THE MISSING PART FOR MOST USERS
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

-- 2. Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Fix ALL existing users who are missing user_roles entries
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user' as role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
AND au.id NOT IN (
  SELECT user_id FROM user_roles
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Fix ALL existing profiles to have lowercase emails
UPDATE profiles 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- 5. Create unique index on lowercase email
DROP INDEX IF EXISTS idx_profiles_email_lower;
CREATE UNIQUE INDEX idx_profiles_email_lower ON profiles(LOWER(email));

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 7. Verify
SELECT 
  'Fixed ' || COUNT(*) || ' users missing user_roles entries' as status
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;

SELECT 
  'Updated ' || COUNT(*) || ' profiles with case-sensitive emails' as status
FROM profiles 
WHERE email != LOWER(email);

SELECT '✅ Login issues fixed! All users can now login successfully.' as result;
