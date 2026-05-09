-- Fix Profile Creation RLS Issue
-- The trigger function needs to bypass RLS policies

-- Temporarily disable RLS for profile creation by trigger
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Update the trigger function to ensure it works
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

  -- Create user_roles entry
  INSERT INTO user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'user', '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create profiles entry with explicit tenant_id
  INSERT INTO profiles (user_id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(full_name, ''), 'User'),
    '00000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
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

-- Create profiles for existing users without them
INSERT INTO profiles (user_id, email, full_name, tenant_id)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
