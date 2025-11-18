# Setup Summary - Super Admin Configuration

## What Was Done

I've configured the system to set up three super admin accounts with the following email addresses:

1. **dean@smartcrm.vip** - Super Admin
2. **samuel@smartcrm.vip** - Super Admin
3. **victor@smartcrm.vip** - Super Admin

## Files Created

### 1. **setup-super-admins.sql**
SQL script to assign super_admin roles to the three accounts.

**Usage:**
- Run this in Supabase SQL Editor after creating the users
- Automatically handles role assignment and profile creation

### 2. **setup-super-admins.mjs**
Node.js script for programmatic setup (alternative method).

**Usage:**
```bash
node setup-super-admins.mjs
```
Note: Requires valid Supabase service role key in `.env`

### 3. **SUPER_ADMIN_SETUP_GUIDE.md**
Comprehensive step-by-step guide with:
- Instructions for creating users in Supabase Dashboard
- SQL scripts for role assignment
- Troubleshooting tips
- Security best practices

### 4. **ADMIN_CREDENTIALS.md** (Updated)
Quick reference document with:
- Login credentials
- Default password: `TempPassword2024!`
- Login URL: https://videoremix.vip/admin
- Troubleshooting steps

## Files Modified

### **supabase/functions/create-super-admin/index.ts**
Fixed a bug where the Edge Function was trying to UPDATE instead of INSERT when creating new user roles. Now it properly checks if a role exists and either updates or inserts accordingly.

## How to Complete Setup

### Quick Method (Recommended)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Navigate to your project

2. **Create the Users**
   - Go to: Authentication → Users
   - Click "Add user" for each email:
     - dean@smartcrm.vip
     - samuel@smartcrm.vip
     - victor@smartcrm.vip
   - Set password: `TempPassword2024!`
   - ✅ Enable "Auto Confirm User"

3. **Assign Roles**
   - Go to: SQL Editor
   - Open `setup-super-admins.sql`
   - Click "Run" or press Ctrl+Enter
   - Verify success messages

4. **Test Login**
   - Go to: https://videoremix.vip/admin
   - Login with: dean@smartcrm.vip / TempPassword2024!
   - Should see admin dashboard

## What Each User Can Do

All three super_admin accounts have full access to:

✅ **User Management**
- Create, edit, delete users
- Assign roles and permissions
- Manage user access to apps
- Bulk import users

✅ **App Management**
- Add/edit/remove apps
- Configure deployment URLs
- Manage app visibility and settings

✅ **Purchase Management**
- View and manage all purchases
- Bulk import purchases
- Link products to apps

✅ **Subscription Management**
- View active subscriptions
- Manage subscription status
- Configure subscription products

✅ **System Administration**
- CSV import system
- Product mapping
- Feature management
- Video management
- Analytics and reporting

## Security Notes

🔐 **IMPORTANT:**

1. **Temporary Password:** `TempPassword2024!` is temporary
2. **Must Change:** Each user should change password on first login
3. **Unique Passwords:** Use different passwords for each admin
4. **Password Manager:** Store passwords securely
5. **Enable MFA:** If available in Supabase settings

## Verification

After setup, verify with this SQL query:

```sql
SELECT
  u.email,
  ur.role,
  ap.full_name,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.admin_profiles ap ON u.id = ap.user_id
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip')
ORDER BY u.email;
```

**Expected Result:**
- All three emails present
- Role: super_admin for each
- Email confirmed: true
- Full names assigned

## Troubleshooting

### Can't Create Users in Dashboard

**Solution:** Make sure you're in the correct Supabase project

### SQL Script Fails

**Possible causes:**
- Users don't exist yet (create them first in Dashboard)
- Wrong project selected
- Insufficient permissions

**Fix:** Create users in Dashboard first, then run SQL script

### Users Can't Login

**Check:**
1. Email is confirmed (email_confirmed_at is not NULL)
2. Role is assigned correctly (user_roles table)
3. Password is correct (case-sensitive)
4. Using correct login URL (/admin)

### Role Not Working

**Fix with SQL:**
```sql
UPDATE public.user_roles ur
SET role = 'super_admin', updated_at = now()
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip');
```

## Next Steps

After completing setup:

1. ✅ Test login with all three accounts
2. ✅ Each user changes their password
3. ✅ Verify admin dashboard access
4. ✅ Test user management features
5. ✅ Enable MFA (if available)
6. ✅ Document new passwords securely
7. ✅ Delete ADMIN_CREDENTIALS.md after passwords are changed

## Support Resources

- **Setup Guide:** `SUPER_ADMIN_SETUP_GUIDE.md`
- **Credentials:** `ADMIN_CREDENTIALS.md`
- **SQL Script:** `setup-super-admins.sql`
- **Node Script:** `setup-super-admins.mjs`
- **Edge Function:** `supabase/functions/create-super-admin/index.ts`

## Questions?

Refer to `SUPER_ADMIN_SETUP_GUIDE.md` for:
- Detailed step-by-step instructions
- Alternative setup methods
- Comprehensive troubleshooting
- Security best practices
- FAQ section

---

**Status:** ✅ Ready for Implementation
**Estimated Time:** 5-10 minutes
**Difficulty:** Easy
**Risk Level:** Low

**Last Updated:** November 5, 2025
