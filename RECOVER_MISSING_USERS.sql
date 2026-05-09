-- Direct SQL Import for Missing Users
-- Execute this in Supabase SQL Editor

-- Create missing auth users from profile data
DO $$
DECLARE
  profile_record RECORD;
  temp_password TEXT;
BEGIN
  -- For each profile without an auth user, create the auth user
  FOR profile_record IN
    SELECT p.user_id, p.email, p.full_name
    FROM profiles p
    LEFT JOIN auth.users au ON p.user_id = au.id
    WHERE au.id IS NULL
  LOOP
    -- Generate a temporary password
    temp_password := 'TempPass' || extract(epoch from now())::text || profile_record.user_id::text;
    
    -- Create the auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      role,
      is_super_admin
    ) VALUES (
      profile_record.user_id,
      profile_record.email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object(
        'full_name', profile_record.full_name,
        'created_via', 'sql_import_recovery'
      ),
      'authenticated',
      false
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created auth user for: %', profile_record.email;
  END LOOP;
  
  RAISE NOTICE 'Auth user creation completed';
END $$;

-- Verify the results
SELECT 
  'Auth users:' as type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 
  'Profiles:', COUNT(*) FROM profiles
UNION ALL  
SELECT
  'Users with both:', COUNT(*) 
FROM auth.users au 
JOIN profiles p ON au.id = p.user_id;
