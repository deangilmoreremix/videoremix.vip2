-- Setup Super Admin Accounts
-- This script creates three super admin accounts for VideoRemix
-- Run this in the Supabase SQL Editor

-- IMPORTANT: These users need to be created through Supabase Auth first
-- This script only updates their roles to super_admin

-- Instructions:
-- 1. First, create the users in Supabase Dashboard:
--    - Go to Authentication > Users
--    - Click "Add user" for each email
--    - Use these emails: dean@smartcrm.vip, samuel@smartcrm.vip, victor@smartcrm.vip
--    - Set a temporary password (they will change it on first login)
--    - Enable "Auto Confirm User"
--
-- 2. Then run this script to set their roles to super_admin

DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_count int;
BEGIN
  -- Array of super admin emails
  FOR v_email IN
    SELECT unnest(ARRAY['dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip'])
  LOOP
    -- Get the user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NULL THEN
      RAISE NOTICE 'User not found: %. Please create this user in Supabase Dashboard first.', v_email;
      CONTINUE;
    END IF;

    -- Check if user_roles entry exists
    SELECT COUNT(*) INTO v_count
    FROM public.user_roles
    WHERE user_id = v_user_id;

    IF v_count > 0 THEN
      -- Update existing role
      UPDATE public.user_roles
      SET
        role = 'super_admin',
        updated_at = now()
      WHERE user_id = v_user_id;

      RAISE NOTICE 'Updated % to super_admin', v_email;
    ELSE
      -- Insert new role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'super_admin');

      RAISE NOTICE 'Created super_admin role for %', v_email;
    END IF;

    -- Create or update admin profile
    INSERT INTO public.admin_profiles (user_id, full_name)
    VALUES (
      v_user_id,
      CASE
        WHEN v_email = 'dean@smartcrm.vip' THEN 'Dean'
        WHEN v_email = 'samuel@smartcrm.vip' THEN 'Samuel'
        WHEN v_email = 'victor@smartcrm.vip' THEN 'Victor'
      END
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      updated_at = now();

  END LOOP;

  RAISE NOTICE 'Super admin setup complete!';
END $$;

-- Verify the setup
SELECT
  u.email,
  ur.role,
  ap.full_name,
  u.created_at as user_created_at,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.admin_profiles ap ON u.id = ap.user_id
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip')
ORDER BY u.email;
