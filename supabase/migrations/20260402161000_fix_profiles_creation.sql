/*
  # Fix Profile Creation on User Signup

  ## Summary
  Updates the handle_new_user() trigger function to create both user_roles and profiles entries
  when a new user signs up. This ensures all user data is properly initialized.

  ## Changes Made

  1. **Update handle_new_user() Function**
     - Add insertion into profiles table with user metadata
     - Keep existing user_roles insertion
     - Extract name from user_metadata if available

  ## Notes
  - Profiles are needed for user display and management
  - This fixes the issue where auth users exist but profiles don't
*/

-- Update the function to create both user_roles and profiles
CREATE OR REPLACE FUNCTION handle_new_user()
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

  -- Create profiles entry
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, full_name)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();