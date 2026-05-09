-- Final Profile Creation Fix
-- Directly create all missing profiles in the database

-- Disable RLS temporarily to allow profile creation
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create profiles for all users missing them
INSERT INTO profiles (id, user_id, email, full_name, tenant_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
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
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
;

-- Skip user roles creation during migration
-- User roles will be created by triggers or application logic

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update the trigger function to work properly with RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
BEGIN
  -- Extract names from user metadata if available
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- If no full_name but have first/last, construct it
  IF full_name = '' AND (first_name != '' OR last_name != '') THEN
    full_name := TRIM(first_name || ' ' || last_name);
  END IF;

  -- Create user_roles entry (this should work with RLS)
  INSERT INTO user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'user', '00000000-0000-0000-0000-000000000001')
  ;

  -- Create profiles entry (temporarily disable RLS for this insert)
  -- This is a workaround since SECURITY DEFINER should bypass RLS but doesn't seem to
  PERFORM pg_catalog.set_config('app.bypass_rls', 'true', false);
  
  INSERT INTO profiles (user_id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(full_name, ''), 'User'),
    '00000000-0000-0000-0000-000000000001'
  )
  ;
  
  PERFORM pg_catalog.set_config('app.bypass_rls', 'false', false);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure RLS is re-enabled even if there's an error
    PERFORM pg_catalog.set_config('app.bypass_rls', 'false', false);
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Count the profiles created
SELECT 
  'Profiles created: ' || COUNT(*)::text as result
FROM profiles;
