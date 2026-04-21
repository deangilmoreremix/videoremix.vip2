# Admin Access Guide - VideoRemix.VIP

## Quick Summary

✅ **Your super admin accounts exist and are correctly configured:**
- dean@videoremix.vip
- samuel@videoremix.vip
- victor@videoremix.vip

⚠️ **The "no user found" message means you need to sign in first to see the users list.**

---

## How to Access the Admin Dashboard

### Method 1: Sign In Through Admin Login Page

1. **Go to:** `https://videoremix.vip/admin/login` (or `http://localhost:5173/admin/login` for dev)

2. **Sign in with one of these accounts:**
   - Email: `dean@videoremix.vip`
   - Password: [The password you set when creating the account]

3. **After successful login:** You'll be redirected to `/admin` dashboard

4. **You should now see all users** in the Admin Users Management section

---

## Problem: "I don't know the password"

If you don't remember the password for the admin accounts, here are your options:

### Option 1: Reset Password via Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → Authentication → Users
2. Find `dean@videoremix.vip`
3. Click on the user
4. Click "Send password reset email"
5. Check the email inbox for dean@videoremix.vip
6. Click the reset link and set a new password

### Option 2: Use the Reset Admin Password Edge Function

1. **Call the edge function:**
   ```bash
   curl -X POST "https://your-project.supabase.co/functions/v1/reset-admin-password" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "dean@videoremix.vip",
       "new_password": "YourNewSecurePassword123!"
     }'
   ```

2. **Use the new password to sign in**

### Option 3: Set Password Directly in Supabase (Manual)

Run this SQL in Supabase SQL Editor:

```sql
-- Set a new password for dean@videoremix.vip
-- Replace 'YourNewPassword123!' with your desired password
UPDATE auth.users
SET encrypted_password = crypt('YourNewPassword123!', gen_salt('bf'))
WHERE email = 'dean@videoremix.vip';
```

**⚠️ Warning:** This directly updates the password. Use a strong password!

---

## Why You See "No User Found"

The admin users management page (`AdminUsersManagement.tsx`) calls the `admin-users` edge function, which requires:

1. ✅ **Authentication:** You must be signed in
2. ✅ **Authorization:** Your account must have `super_admin` or `admin` role
3. ✅ **Valid Token:** Your session token must be valid

**Current Issue:** You're not signed in, so the frontend has no authentication token to pass to the edge function.

---

## Testing the Admin Users Function

### Quick Test (Using Browser Console)

1. **Sign in to admin panel** at `/admin/login`

2. **Open browser console** (F12)

3. **Run this code:**
   ```javascript
   const token = localStorage.getItem('admin_token');
   const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
     headers: {
       'Authorization': `Bearer ${token}`,
     },
   });
   const data = await response.json();
   console.log('Users:', data);
   ```

4. **You should see all users** including dean, samuel, and victor

### Test Using Node Script

I've created a test script: `test-admin-users-function.mjs`

**To use it:**

1. **Edit the script** and add the actual password for dean@videoremix.vip on line 22:
   ```javascript
   password: 'your-actual-password-here',
   ```

2. **Run the test:**
   ```bash
   node test-admin-users-function.mjs
   ```

3. **Expected output:**
   ```
   ✅ Successfully fetched users!
   📊 Total Users: 3

   👥 Users List:
   1. dean@videoremix.vip
      Role: super_admin
      Active: ✅ Yes

   2. samuel@videoremix.vip
      Role: super_admin
      Active: ✅ Yes

   3. victor@videoremix.vip
      Role: super_admin
      Active: ✅ Yes
   ```

---

## Verifying Super Admin Status

### Check via SQL (Supabase Dashboard)

Run this in SQL Editor:

```sql
SELECT
  u.email,
  u.email_confirmed_at,
  ur.role,
  ap.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN admin_profiles ap ON ap.user_id = u.id
WHERE u.email IN ('dean@videoremix.vip', 'samuel@videoremix.vip', 'victor@videoremix.vip')
ORDER BY u.email;
```

**Expected result:**

| email | email_confirmed_at | role | full_name | created_at |
|-------|-------------------|------|-----------|------------|
| dean@videoremix.vip | 2025-10-03... | super_admin | | 2025-10-03... |
| samuel@videoremix.vip | 2025-10-03... | super_admin | | 2025-10-03... |
| victor@videoremix.vip | 2025-10-03... | super_admin | | 2025-10-03... |

✅ All three should show `super_admin` role

---

## Step-by-Step: First Time Admin Access

### 1. Reset Password (If Needed)

**Option A - Via Supabase Dashboard:**
1. Supabase Dashboard → Authentication → Users
2. Click on dean@videoremix.vip
3. Click "Send password reset email"
4. Check email and follow reset link

**Option B - Via SQL:**
```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'dean@videoremix.vip';
```

### 2. Sign In to Admin Panel

1. Navigate to: `https://videoremix.vip/admin/login`
2. Email: `dean@videoremix.vip`
3. Password: [Your new password]
4. Click "Sign In"

### 3. Verify Admin Dashboard Access

After successful login, you should see:
- ✅ Admin Dashboard page
- ✅ Sidebar with menu options
- ✅ Stats cards at the top
- ✅ Users management section showing all users

### 4. Check Users List

1. Click "Users" in the sidebar (if not already there)
2. You should now see ALL users including:
   - dean@videoremix.vip (super_admin)
   - samuel@videoremix.vip (super_admin)
   - victor@videoremix.vip (super_admin)
   - Plus any other users in the system

---

## Common Issues & Solutions

### Issue 1: "No user found" or Empty User List

**Cause:** Not signed in or invalid session

**Solution:**
1. Make sure you're signed in to the admin panel
2. Check browser console for errors
3. Verify `localStorage.getItem('admin_token')` exists
4. Try signing out and signing in again

### Issue 2: "Authorization required"

**Cause:** Session expired or no token

**Solution:**
1. Sign out: `/admin` → Click "Sign Out"
2. Sign in again: `/admin/login`
3. Check if token is stored: `localStorage.getItem('admin_token')`

### Issue 3: "Admin access required"

**Cause:** User doesn't have admin role

**Solution:**
Verify role in database:
```sql
SELECT u.email, ur.role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'dean@videoremix.vip';
```

Should return `super_admin`

### Issue 4: Can't Sign In - "Invalid credentials"

**Cause:** Wrong password or account doesn't exist

**Solution:**
1. Verify user exists:
   ```sql
   SELECT email, email_confirmed_at
   FROM auth.users
   WHERE email = 'dean@videoremix.vip';
   ```

2. Reset password using one of the methods above

### Issue 5: Edge Function Returns 500 Error

**Cause:** Edge function might not be deployed

**Solution:**
1. Check if function is deployed in Supabase Dashboard → Edge Functions
2. Redeploy if needed (see DEPLOY_FUNCTIONS.md)
3. Check function logs for errors

---

## Dev Mode Bypass (For Testing Only)

If you need to bypass authentication for testing:

1. Open browser console
2. Run:
   ```javascript
   localStorage.setItem('admin_token', 'dev_bypass_token');
   localStorage.setItem('admin_user', JSON.stringify({
     id: 'test-id',
     email: 'dean@videoremix.vip',
     role: 'super_admin',
     is_active: true,
     permissions: {},
     created_at: new Date().toISOString()
   }));
   ```
3. Refresh the page
4. You should now have admin access without signing in

**⚠️ Important:** This only works in development and bypasses security. Remove before production!

---

## Checklist: First Admin Sign-In

Use this checklist to verify everything is working:

- [ ] I can access `/admin/login` page
- [ ] I know the password for dean@videoremix.vip (or have reset it)
- [ ] I can sign in successfully
- [ ] I'm redirected to `/admin` dashboard
- [ ] I see the dashboard stats cards
- [ ] I see the sidebar menu
- [ ] I can click "Users" in the sidebar
- [ ] I see all users listed (dean, samuel, victor, etc.)
- [ ] Each user shows their role (super_admin)
- [ ] Each user shows their status (active/inactive)
- [ ] I can toggle user status (activate/deactivate)
- [ ] I can click "Add User" button
- [ ] I can sign out successfully

---

## Next Steps After Successful Sign-In

Once you're signed in and can see all users:

1. **Verify all super admins are present:**
   - dean@videoremix.vip ✅
   - samuel@videoremix.vip ✅
   - victor@videoremix.vip ✅

2. **Set passwords for other admins** (if needed):
   - Sign in as dean
   - Use password reset for samuel and victor
   - Or use SQL to set passwords

3. **Test admin features:**
   - Create a test user
   - Toggle user active/inactive status
   - View user details
   - Delete test user

4. **Explore other admin sections:**
   - Apps Management
   - Purchases Management
   - Products Management
   - Subscriptions Management

---

## Support & Troubleshooting

If you're still having issues after following this guide:

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** in Dashboard → Logs
3. **Check edge function logs** in Dashboard → Edge Functions → Logs
4. **Verify .env variables** are correct
5. **Try incognito/private browsing** to rule out cache issues

**Database Verification Commands:**

```sql
-- Verify user exists
SELECT * FROM auth.users WHERE email = 'dean@videoremix.vip';

-- Verify role
SELECT * FROM user_roles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dean@videoremix.vip'
);

-- Verify admin profile
SELECT * FROM admin_profiles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'dean@videoremix.vip'
);
```

All three queries should return data. If any return empty, the setup is incomplete.

---

## Summary

**Your super admin accounts are correctly set up in the database.** The "no user found" message simply means you need to:

1. ✅ Sign in to the admin panel at `/admin/login`
2. ✅ Use one of the super admin accounts (dean, samuel, or victor)
3. ✅ Enter the correct password (or reset if forgotten)
4. ✅ After successful login, you'll see all users

**The users ARE there** - you just need to authenticate first to access them!

---

**Last Updated:** October 2024
**Status:** ✅ Super Admins Verified in Database
