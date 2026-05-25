-- Add onboarding_answers column to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS onboarding_answers JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add index for querying users by onboarding status (useful for admin analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at 
  ON profiles(onboarding_completed_at) 
  WHERE onboarding_completed_at IS NOT NULL;

-- Optional: Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_answers IS 'Stores user onboarding wizard selections: goals (string[]), niche (string), selectedCategories (string[])';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed the onboarding wizard';
