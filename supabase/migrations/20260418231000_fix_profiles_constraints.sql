-- Fix Profiles Table Constraints
-- Add unique constraint on user_id for proper conflict resolution

-- Check if unique constraint exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on profiles.user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on profiles.user_id already exists';
  END IF;
END $$;

-- Also ensure the primary key is set correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_pkey' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key constraint on profiles.id';
  ELSE
    RAISE NOTICE 'Primary key constraint on profiles.id already exists';
  END IF;
END $$;
