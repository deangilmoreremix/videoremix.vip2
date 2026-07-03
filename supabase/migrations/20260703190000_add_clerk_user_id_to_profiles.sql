-- Link Clerk users to Supabase profiles for seamless auth bridging
-- This allows the app to map a Clerk user ID back to the Supabase auth user ID

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
  ON public.profiles USING btree (clerk_user_id);

-- Optional: enforce uniqueness when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_clerk_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_clerk_user_id_key UNIQUE (clerk_user_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON COLUMN public.profiles.clerk_user_id IS 'Clerk user ID used to bridge Clerk authentication to Supabase profiles';
