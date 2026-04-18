-- Fix Profile Creation Trigger
-- Ensure the trigger exists and is working properly

-- First, check if the function exists and recreate it if needed
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
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create profiles entry with all available data
  INSERT INTO profiles (user_id, email, full_name, tenant_id)
  VALUES (NEW.id, NEW.email, COALESCE(NULLIF(full_name, ''), 'User'), '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger by checking if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE EXCEPTION 'Trigger on_auth_user_created was not created successfully';
  END IF;
  
  RAISE NOTICE 'Trigger on_auth_user_created exists and is active';
END $$;
