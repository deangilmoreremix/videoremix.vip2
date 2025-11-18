# How to Sign Into Admin (Dev Mode)

## Quick Steps

### 1. Navigate to Admin Login
Go to: `http://localhost:5173/admin/login`

### 2. Create Admin User via Supabase Dashboard

Since we need to create the first admin user, follow these steps:

#### Option A: Use Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (`hppbanjiifninnbioxyp`)
3. Go to **Authentication** → **Users**
4. Click **Add User** button
5. Enter:
   - **Email:** `dev@videoremix.vip`
   - **Password:** `DevPassword123!`
   - Check "Auto Confirm Email"
6. Click **Create User**

7. Now go to **SQL Editor** in the dashboard
8. Run this SQL to make the user a super admin:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'dev@videoremix.vip';

-- Copy the user ID from above, then run this (replace YOUR_USER_ID):
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

#### Option B: Use the create-super-admin Edge Function

If you have curl or Postman:

```bash
curl -X POST \
  'https://hppbanjiifninnbioxyp.supabase.co/functions/v1/create-super-admin' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "dev@videoremix.vip",
    "password": "DevPassword123!"
  }'
```

### 3. Login

Once the admin user is created, go to `/admin/login` and either:

**Option 1:** Click the yellow "Dev Login" button (only visible in development mode)

**Option 2:** Enter credentials manually:
- **Email:** `dev@videoremix.vip`
- **Password:** `DevPassword123!`

### 4. Access Admin Dashboard

After successful login, you'll be redirected to `/admin` where you can:
- Manage apps
- Manage features
- Manage users
- View purchases
- Manage subscriptions
- Manage videos

## Troubleshooting

### "User does not have admin privileges"
This means the user exists but doesn't have the correct role. Run this SQL:

```sql
-- Check current role
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'dev@videoremix.vip';

-- Update to super_admin
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dev@videoremix.vip');
```

### "Authentication required"
- Make sure your Supabase project is running
- Check that `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Try restarting the dev server

### "Invalid credentials"
- Double-check email: `dev@videoremix.vip`
- Double-check password: `DevPassword123!`
- Make sure the user was created in Supabase Auth

### Dev Login Button Not Showing
- Make sure you're running in development mode (`npm run dev`)
- Check that you're on `localhost` or the dev server URL

## Environment Variables Check

Your `.env` should have:
```env
VITE_SUPABASE_URL=https://hppbanjiifninnbioxyp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Security Note

The dev admin credentials are only for **local development**. In production:
1. Use strong, unique passwords
2. Enable 2FA for admin accounts
3. Never commit admin credentials to git
4. Regularly rotate admin passwords
