-- Verify and Fix Profile Creation Trigger

-- Check if trigger exists and is properly attached
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pg_function_is_visible(oid)
  ) INTO function_exists;
  
  -- Check if trigger exists on auth.users
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_created'
    AND c.relname = 'users'
    AND n.nspname = 'auth'
  ) INTO trigger_exists;
  
  RAISE NOTICE 'Function exists: %, Trigger exists: %', function_exists, trigger_exists;
  
  IF NOT function_exists THEN
    RAISE EXCEPTION 'handle_new_user function does not exist';
  END IF;
  
  IF NOT trigger_exists THEN
    RAISE EXCEPTION 'on_auth_user_created trigger does not exist on auth.users';
  END IF;
  
  RAISE NOTICE 'Trigger verification successful';
END $$;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger by manually calling it (this should create a profile for existing users without one)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users without profiles and create them
  FOR user_record IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    RAISE NOTICE 'Creating profile for user: %', user_record.email;
    
    -- Call the trigger function logic manually
    PERFORM public.handle_new_user();
    
    -- Actually create the profile (since we can't call the trigger directly)
    INSERT INTO public.profiles (user_id, email, full_name, tenant_id)
    VALUES (
      user_record.id, 
      user_record.email, 
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
      '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Profile created for: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Profile creation check completed';
END $$;
