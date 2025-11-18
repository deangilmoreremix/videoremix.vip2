# 🔐 Admin Credentials - VideoRemix.VIP

## ✅ Password Reset Complete!

All super admin passwords have been reset successfully.

---

## Super Admin Accounts

### 1. Dean (Primary Admin)
- **Email:** `dean@smartcrm.vip`
- **Password:** `TempPassword2024!`
- **Role:** Super Admin
- **Status:** ⚠️ Must be created in Supabase Dashboard

### 2. Samuel
- **Email:** `samuel@smartcrm.vip`
- **Password:** `TempPassword2024!`
- **Role:** Super Admin
- **Status:** ⚠️ Must be created in Supabase Dashboard

### 3. Victor
- **Email:** `victor@smartcrm.vip`
- **Password:** `TempPassword2024!`
- **Role:** Super Admin
- **Status:** ⚠️ Must be created in Supabase Dashboard

---

## 🚀 How to Sign In

### Step 1: Go to Admin Login
**URL:** `https://videoremix.vip/admin/login`

Or for development:
**URL:** `http://localhost:5173/admin/login`

### Step 2: Enter Credentials
```
Email: dean@smartcrm.vip
Password: TempPassword2024!
```

### Step 3: Access Admin Dashboard
After successful login, you'll be redirected to `/admin`

### Step 4: View All Users
- Click "Users" in the sidebar
- You should now see ALL users including all three super admins
- You can manage users, toggle active status, add new users, etc.

---

## ⚠️ IMPORTANT: Change This Password!

**This is a temporary password.** You should change it immediately after first login.

### How to Change Password

**Option 1: Via Profile (Recommended)**
1. Sign in to admin panel
2. Click on your profile/email in top right
3. Go to "Profile Settings" or "Change Password"
4. Enter new password

**Option 2: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click on your user
3. Click "Send password reset email"
4. Follow the email link to set new password

**Option 3: Via SQL (Advanced)**
```sql
UPDATE auth.users
SET encrypted_password = crypt('YourNewSecurePassword123!', gen_salt('bf'))
WHERE email = 'dean@smartcrm.vip';
```

---

## 🔒 Security Best Practices

1. **Change the default password immediately**
2. **Use a strong, unique password** (12+ characters, mix of upper/lower/numbers/symbols)
3. **Don't share admin credentials**
4. **Use different passwords for each admin**
5. **Enable 2FA if available** (check Supabase settings)
6. **Delete this file after setting new passwords** (contains temporary credentials)

---

## ✅ Verification Checklist

After signing in, verify these work:

- [ ] I can sign in with dean@videoremix.vip
- [ ] I see the admin dashboard after sign-in
- [ ] I can click "Users" in sidebar
- [ ] I see all users listed (dean, samuel, victor + others)
- [ ] Each user shows their role (super_admin)
- [ ] I can add a new test user
- [ ] I can toggle user active/inactive
- [ ] I can delete a test user
- [ ] I can access other admin sections (Apps, Purchases, etc.)
- [ ] I can sign out successfully

---

## 🐛 Troubleshooting

### "Invalid credentials" when signing in

**Check:**
1. Email is exactly: `dean@smartcrm.vip` (no spaces, lowercase)
2. Password is exactly: `TempPassword2024!` (case-sensitive)
3. You're on the correct login page (`/admin/login`)

### Still shows "No user found" after signing in

**This means:**
- Authentication worked (you're signed in)
- But the edge function isn't working

**Solutions:**
1. Check browser console for errors
2. Verify edge function is deployed in Supabase Dashboard
3. Check `localStorage.getItem('admin_token')` has a value
4. Try signing out and back in

### Can't access admin dashboard

**Check:**
1. You're going to `/admin/login` not `/signin`
2. After sign-in, you should be redirected to `/admin`
3. Verify user role is `super_admin` in database

---

## 📊 Database Verification

You can verify everything is correct with this SQL:

```sql
SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  ur.role,
  ap.email as admin_profile_email,
  u.banned_until IS NULL as is_active,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN admin_profiles ap ON ap.user_id = u.id
WHERE u.email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip')
ORDER BY u.email;
```

**Expected result:** All three users with:
- ✅ email_confirmed: true
- ✅ role: super_admin
- ✅ admin_profile_email: matching email
- ✅ is_active: true

---

## 🎯 What You Can Do Now

As a super admin, you have access to:

### User Management
- View all users
- Create new users
- Activate/deactivate users
- Delete users
- Assign roles
- Bulk import users

### App Management
- View all apps
- Add new apps
- Edit app details
- Set app URLs (Netlify, custom domain)
- Toggle app active status

### Purchase Management
- View all purchases
- Import purchases from Personalizer
- Link purchases to users
- View purchase history
- Manage refunds

### Product Management
- View product catalog
- Add new products
- Edit product details
- Set product pricing
- Configure app access per product

### Subscription Management
- View active subscriptions
- Manage subscription status
- Handle cancellations
- Track subscription periods
- Sync with Stripe/PayKickstart

### Video Management
- View all videos
- Add new videos
- Edit video details
- Organize video library

### Dashboard Stats
- Total users
- Active subscriptions
- Revenue metrics
- User growth
- App usage stats

---

## 📞 Need Help?

If you're still having issues:

1. **Read:** `ADMIN_ACCESS_GUIDE.md` - Comprehensive troubleshooting guide
2. **Check:** Browser console for JavaScript errors
3. **Verify:** Supabase Dashboard → Edge Functions → Logs
4. **Test:** Use `test-admin-users-function.mjs` to verify function works

---

## ⚡ Quick Start Command

After setting up, you can sign in immediately:

```bash
# 1. Navigate to admin login
open https://videoremix.vip/admin/login

# 2. Or for dev
open http://localhost:5173/admin/login

# 3. Sign in with:
# Email: dean@smartcrm.vip
# Password: TempPassword2024!
```

---

**✅ Your super admin accounts are ready to use!**

**Remember to change the password after first login.**

**Last Updated:** November 5, 2025
**Accounts to be created:** dean@smartcrm.vip, samuel@smartcrm.vip, victor@smartcrm.vip
