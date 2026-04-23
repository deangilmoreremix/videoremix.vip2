-- SUPERPOWERS: Disable email confirmation requirement for all users
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- Update existing users to have confirmed emails
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
