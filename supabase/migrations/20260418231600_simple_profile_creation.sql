-- Simple Profile Creation for Existing Users
-- Create profiles for users who don't have them, without calling triggers

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on profiles.user_id';
  END IF;
END $$;

-- Create profiles for all existing users without them
INSERT INTO profiles (user_id, email, full_name, tenant_id)
SELECT
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
  '00000000-0000-0000-0000-000000000001'
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
;

-- Report results
SELECT 
  'Auth users: ' || (SELECT COUNT(*) FROM auth.users)::text as auth_count,
  'Profiles: ' || (SELECT COUNT(*) FROM profiles)::text as profile_count,
  'User roles: ' || (SELECT COUNT(*) FROM user_roles)::text as role_count;
