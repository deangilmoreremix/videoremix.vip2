# Super Admin Setup Guide

## Overview

This guide will help you set up three super admin accounts for VideoRemix:
- dean@smartcrm.vip
- samuel@smartcrm.vip
- victor@smartcrm.vip

## Quick Setup (Recommended)

### Step 1: Create Users in Supabase Dashboard

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** button
4. For each email address, create a user:

**User 1:**
- Email: `dean@smartcrm.vip`
- Password: `TempPassword2024!` (or your chosen password)
- ✅ Check "Auto Confirm User"
- Click **Create user**

**User 2:**
- Email: `samuel@smartcrm.vip`
- Password: `TempPassword2024!` (or your chosen password)
- ✅ Check "Auto Confirm User"
- Click **Create user**

**User 3:**
- Email: `victor@smartcrm.vip`
- Password: `TempPassword2024!` (or your chosen password)
- ✅ Check "Auto Confirm User"
- Click **Create user**

### Step 2: Assign Super Admin Roles

1. In your Supabase project, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `setup-super-admins.sql`
4. Click **Run** or press `Ctrl+Enter`
5. Check the output messages - should see success for each email

### Step 3: Verify Setup

Run this query in the SQL Editor:

```sql
SELECT
  u.email,
  ur.role,
  ap.full_name,
  u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.admin_profiles ap ON u.id = ap.user_id
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip')
ORDER BY u.email;
```

**Expected Result:**
```
email                  | role        | full_name | user_created_at
-----------------------|-------------|-----------|------------------
dean@smartcrm.vip      | super_admin | Dean      | 2025-11-05 ...
samuel@smartcrm.vip    | super_admin | Samuel    | 2025-11-05 ...
victor@smartcrm.vip    | super_admin | Victor    | 2025-11-05 ...
```

### Step 4: Test Login

1. Go to https://videoremix.vip/admin
2. Try logging in with each account:
   - Email: `dean@smartcrm.vip`
   - Password: `TempPassword2024!` (or the password you set)
3. ✅ Should successfully log into admin dashboard
4. ⚠️ **IMPORTANT:** Change the password after first login!

## Alternative Method: Using Edge Function

If you prefer to create users programmatically:

### Prerequisites
- Supabase CLI installed
- Environment variables configured

### Steps

1. Deploy the create-super-admin function:
```bash
supabase functions deploy create-super-admin
```

2. Call the function for each admin:
```bash
# For Dean
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-super-admin' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"dean@smartcrm.vip","password":"TempPassword2024!","fullName":"Dean"}'

# For Samuel
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-super-admin' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"samuel@smartcrm.vip","password":"TempPassword2024!","fullName":"Samuel"}'

# For Victor
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-super-admin' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"victor@smartcrm.vip","password":"TempPassword2024!","fullName":"Victor"}'
```

## Troubleshooting

### Users Already Exist

If the users already exist in your system but don't have super_admin role:

1. Run the SQL script from `setup-super-admins.sql`
2. It will update existing roles to super_admin

### Users Can't Login

Check these common issues:

1. **Email not confirmed:**
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = now()
   WHERE email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip');
   ```

2. **Missing user_roles entry:**
   - Run the setup SQL script again

3. **Wrong password:**
   - Reset password in Supabase Dashboard
   - Authentication → Users → Click user → Reset password

### Role Not Working

Verify the role is correctly set:

```sql
SELECT
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip');
```

If role is NULL or not 'super_admin', update it:

```sql
UPDATE public.user_roles ur
SET role = 'super_admin', updated_at = now()
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip');
```

## Security Best Practices

### 1. Change Default Passwords

All three users should change their passwords immediately after first login:

1. Login to https://videoremix.vip/admin
2. Go to Profile settings
3. Change password to a strong, unique password
4. Use a password manager to store it securely

### 2. Enable MFA (Recommended)

If your Supabase project supports MFA:

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Enable MFA
4. Each admin should set up MFA on first login

### 3. Monitor Admin Activity

Regularly check admin activity logs:

```sql
SELECT
  u.email,
  u.last_sign_in_at,
  u.created_at
FROM auth.users u
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip')
ORDER BY u.last_sign_in_at DESC;
```

## Admin Permissions

Super admins have full access to:
- ✅ User management
- ✅ App management
- ✅ Purchase management
- ✅ Subscription management
- ✅ Feature management
- ✅ Video management
- ✅ CSV import system
- ✅ Product mapping
- ✅ System settings

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase connection
3. Check SQL query results
4. Review Supabase logs in Dashboard
5. Test with different browsers

## Quick Reference

### Login URL
https://videoremix.vip/admin

### Admin Emails
- dean@smartcrm.vip
- samuel@smartcrm.vip
- victor@smartcrm.vip

### Default Password
TempPassword2024! (change on first login)

### Supabase Dashboard
https://app.supabase.com

### SQL Files
- `setup-super-admins.sql` - Role assignment script
- `setup-super-admins.mjs` - Node.js setup script (alternative)

---

**Status:** ✅ Ready to implement
**Estimated Time:** 5-10 minutes
**Difficulty:** Easy
**Risk:** Low
