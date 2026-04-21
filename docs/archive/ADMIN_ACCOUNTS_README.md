# Admin Accounts Creation - Quick Summary

## Status: Ready for Setup

Three admin accounts have been prepared for creation. Due to a service role key mismatch in the environment configuration, manual creation is required.

## Accounts to Create

| Name   | Email                     | Password                  |
|--------|---------------------------|---------------------------|
| Dean   | dean@videoremix.vip       | VideoRemix2025!Dean       |
| Victor | victor@videoremix.vip     | VideoRemix2025!Victor     |
| Samuel | samuel@videoremix.vip     | VideoRemix2025!Samuel     |

## Quick Setup (Recommended)

### Option A: Automated (Requires Service Role Key Update)

1. Get your service role key from:
   - https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/settings/api

2. Update `.env` file with correct `SUPABASE_SERVICE_ROLE_KEY`

3. Run:
   ```bash
   node create-three-admins.mjs
   ```

### Option B: Manual (Fastest Method)

1. Go to Supabase Dashboard → Auth → Users:
   - https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/auth/users

2. Click "Add User" three times (one for each admin):
   - Use emails and passwords from table above
   - **Important**: Check "Auto Confirm Email" for each

3. Go to SQL Editor and run:
   - https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/sql/new

```sql
-- Upgrade all three to super_admin
UPDATE user_roles SET role = 'super_admin', updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'dean@videoremix.vip',
    'victor@videoremix.vip',
    'samuel@videoremix.vip'
  )
);

-- Set full names
UPDATE admin_profiles ap
SET full_name = CASE
  WHEN u.email = 'dean@videoremix.vip' THEN 'Dean'
  WHEN u.email = 'victor@videoremix.vip' THEN 'Victor'
  WHEN u.email = 'samuel@videoremix.vip' THEN 'Samuel'
END,
updated_at = now()
FROM auth.users u
WHERE ap.user_id = u.id
AND u.email IN ('dean@videoremix.vip', 'victor@videoremix.vip', 'samuel@videoremix.vip');

-- Verify (should show 3 rows with super_admin role)
SELECT u.email, ur.role, ap.full_name
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN admin_profiles ap ON ap.user_id = u.id
WHERE u.email IN ('dean@videoremix.vip', 'victor@videoremix.vip', 'samuel@videoremix.vip');
```

4. Done! All three accounts are ready.

## Verification

Test login at: `/admin/login`

Example:
- Email: dean@videoremix.vip
- Password: VideoRemix2025!Dean

Should redirect to `/admin` dashboard with full access.

## Files Created

- `create-three-admins.mjs` - Automated creation script
- `create-three-admins-manual.mjs` - Display instructions
- `ADMIN_ACCOUNTS_SETUP.md` - Full detailed guide
- `ADMIN_ACCOUNTS_README.md` - This quick reference

## Security Notes

- All passwords meet strong requirements (8+ chars, mixed case, numbers, special chars)
- Accounts have `super_admin` role with full privileges
- Share credentials securely via encrypted channels
- Recommend password change on first login

## Support

For issues, check `ADMIN_ACCOUNTS_SETUP.md` for detailed troubleshooting steps.
