# Admin Accounts Setup Guide

This guide will help you create three admin accounts for VideoRemix.vip.

## Issue Identified

The `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file is for a different Supabase project than your current `VITE_SUPABASE_URL`. This prevents automated account creation via the Admin API.

## Account Details to Create

| Name   | Email                     | Password                  | Role        |
|--------|---------------------------|---------------------------|-------------|
| Dean   | dean@videoremix.vip       | VideoRemix2025!Dean       | super_admin |
| Victor | victor@videoremix.vip     | VideoRemix2025!Victor     | super_admin |
| Samuel | samuel@videoremix.vip     | VideoRemix2025!Samuel     | super_admin |

## Option 1: Update Service Role Key (Recommended)

If you want to use the automated scripts:

1. Go to your Supabase project dashboard:
   ```
   https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/settings/api
   ```

2. Copy the **service_role** secret key (not the anon key)

3. Update your `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

4. Run the automated script:
   ```bash
   node create-three-admins.mjs
   ```

## Option 2: Create Via Supabase Dashboard

### Step 1: Create Auth Users

1. Go to the Auth Users page:
   ```
   https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/auth/users
   ```

2. Click **"Add User"** and create each account with:
   - **Email**: dean@videoremix.vip
   - **Password**: VideoRemix2025!Dean
   - **Auto Confirm Email**: YES (check this box)

3. Repeat for Victor and Samuel using their respective credentials

### Step 2: Assign Super Admin Roles

1. Go to the SQL Editor:
   ```
   https://supabase.com/dashboard/project/hppbanjiifninnbioxyp/sql/new
   ```

2. Run this SQL script (it handles all three users at once):

```sql
-- Update Dean to super_admin
UPDATE user_roles
SET role = 'super_admin', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dean@videoremix.vip'
);

UPDATE admin_profiles
SET full_name = 'Dean', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dean@videoremix.vip'
);

-- Update Victor to super_admin
UPDATE user_roles
SET role = 'super_admin', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'victor@videoremix.vip'
);

UPDATE admin_profiles
SET full_name = 'Victor', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'victor@videoremix.vip'
);

-- Update Samuel to super_admin
UPDATE user_roles
SET role = 'super_admin', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'samuel@videoremix.vip'
);

UPDATE admin_profiles
SET full_name = 'Samuel', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'samuel@videoremix.vip'
);

-- Verify the roles were updated correctly
SELECT
  u.email,
  ur.role,
  ap.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN admin_profiles ap ON ap.user_id = u.id
WHERE u.email IN (
  'dean@videoremix.vip',
  'victor@videoremix.vip',
  'samuel@videoremix.vip'
)
ORDER BY u.email;
```

3. Verify the output shows all three users with `super_admin` role

## Option 3: Use Admin Sign Up Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin signup page:
   ```
   http://localhost:5173/admin/signup
   ```

3. Create each account using the form (use the credentials from the table above)

4. After creating all three accounts, go to Supabase SQL Editor and run the SQL from Option 2, Step 2 to upgrade them to super_admin

## Verification

After creating the accounts, verify they work by:

1. Going to the admin login page:
   ```
   http://localhost:5173/admin/login
   ```

2. Test login with one of the accounts:
   - Email: dean@videoremix.vip
   - Password: VideoRemix2025!Dean

3. You should be redirected to `/admin` dashboard

## Security Notes

- All passwords follow strong security requirements (8+ chars, uppercase, lowercase, numbers, special characters)
- Email confirmation is enabled by default
- All accounts have `super_admin` role with full privileges
- Consider having each user change their password on first login
- Store these credentials securely and share them only with the intended recipients

## Login Information

- **Admin Login URL**: `/admin/login`
- **Production URL**: `https://yourdomain.com/admin/login`
- **Role**: All accounts have `super_admin` privileges
- **Access**: Full access to admin dashboard and all management features

## Troubleshooting

### "User does not have admin privileges" error
- The user exists but doesn't have the admin role assigned
- Run the SQL script from Option 2, Step 2 to fix this

### "Invalid email or password" error
- Double-check the email and password (case-sensitive)
- Verify the user was created in Supabase Dashboard

### "Account locked" error
- Too many failed login attempts
- Wait 5-30 minutes or contact support to unlock

## Scripts Available

- `create-three-admins.mjs` - Automated creation (requires correct service role key)
- `create-three-admins-manual.mjs` - Displays this guide in terminal
- `check-users.mjs` - Check if users exist and their roles
- `check-admin-role.mjs` - Verify admin role assignments

## Next Steps

After creating the accounts:

1. Share credentials securely with Dean, Victor, and Samuel
2. Ask them to login and test access
3. Consider implementing password reset functionality
4. Document any additional admin permissions needed
5. Set up 2FA if required for enhanced security
