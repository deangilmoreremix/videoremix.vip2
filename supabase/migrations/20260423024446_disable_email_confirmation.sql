-- Email confirmation is already disabled via Supabase dashboard/API
-- This migration is not needed as authentication works without confirmation
-- Skipping auth.users table modifications to avoid permission errors
SELECT 'Email confirmation already disabled - migration skipped' as status;
