/*
  # Fix handle_new_user Function

  ## Summary
  Fixes the handle_new_user() trigger function to only create user_roles entries.
  The admin_profiles table should only be populated for actual admin users, not all users.

  ## Changes Made

  1. **Update handle_new_user() Function**
     - Remove automatic insertion into admin_profiles table
     - Only create user_roles entry with default 'user' role
     - This prevents sign-up failures for regular users

  ## Notes
  - Admin profiles should be created separately when a user is promoted to admin
  - Regular users only need an entry in user_roles table
*/

-- Drop and recreate the function with the fix
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create user_roles entry, not admin_profiles
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
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
