-- User Recovery Migration - Clean Version
-- Execute this to recover missing auth users

DO $$
DECLARE
  profile_record RECORD;
  temp_password TEXT;
BEGIN
  -- Create missing auth users from profile data
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
        'created_via', 'migration_recovery'
      ),
      'authenticated',
      false
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created auth user for: %', profile_record.email;
  END LOOP;
  
  RAISE NOTICE 'Auth user recovery completed';
END $$;

-- Show results
SELECT 
  'Auth users: ' || COUNT(*)::text FROM auth.users
UNION ALL
SELECT 'Profiles: ' || COUNT(*)::text FROM profiles
UNION ALL  
SELECT 'Recovered users: ' || (
  SELECT COUNT(*) FROM auth.users au 
  JOIN profiles p ON au.id = p.user_id 
  WHERE au.raw_user_meta_data->>'created_via' = 'migration_recovery'
)::text;
