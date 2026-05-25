-- Create Missing Profiles for Existing Users
-- This migration directly creates profiles for users who don't have them

-- Create profiles for all existing users who don't have them
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

-- Skip user_roles creation for now to avoid trigger issues
-- This will be handled by the trigger when users log in
-- INSERT INTO user_roles (user_id, role, tenant_id)
-- SELECT
--   au.id,
--   'user',
--   '00000000-0000-0000-0000-000000000001'
-- FROM auth.users au
-- LEFT JOIN user_roles ur ON au.id = ur.user_id
-- WHERE ur.user_id IS NULL
-- ;
