# Supabase Authentication Testing Guide

## Overview
This guide will help you test the complete authentication flow for your VideoRemix.vip application, which uses Supabase for user authentication.

## Current Setup Status

✅ **Supabase Configuration**
- Supabase URL: `https://hppbanjiifninnbioxyp.supabase.co`
- Anonymous Key: Configured in `.env`
- Service Role Key: Configured for admin operations
- Current users in database: **3 users**

✅ **Authentication Features Implemented**
- User Sign Up with email/password
- User Sign In with email/password
- Password Reset flow
- User Profile Updates
- Session Management
- Protected Routes

## Testing Checklist

### 1. Sign Up Flow Test

**Steps to Test:**

1. **Navigate to Sign Up Page**
   - Go to `/signup` or click "Sign Up" from the homepage
   - Verify the page loads correctly with all form fields

2. **Test Form Validation**
   - Try submitting empty form → Should show validation errors
   - Try password less than 6 characters → Should show "Password must be at least 6 characters"
   - Try mismatched passwords → Should show "Passwords do not match"
   - Try invalid email format → Should show email validation error

3. **Create New Account**
   - Email: `test-user-$(date +%s)@example.com` (use timestamp to ensure uniqueness)
   - Password: `Test123456!`
   - Confirm Password: `Test123456!`
   - First Name: `Test`
   - Last Name: `User`
   - Click "Create Account"

4. **Expected Behavior:**
   - ✅ Success message: "Account created successfully! Redirecting to your dashboard..."
   - ✅ Automatic redirect to `/dashboard` after 2 seconds
   - ✅ User should be logged in and see dashboard

5. **Verify in Database:**
   ```sql
   SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```

### 2. Sign In Flow Test

**Steps to Test:**

1. **Sign Out First** (if logged in)
   - Navigate to dashboard
   - Click "Sign Out" button
   - Verify redirect to homepage

2. **Navigate to Sign In Page**
   - Go to `/signin` or click "Sign In" from homepage
   - Verify the page loads correctly

3. **Test Invalid Credentials**
   - Email: `wrong@example.com`
   - Password: `wrongpassword`
   - Click "Sign In"
   - **Expected:** Error message displayed (e.g., "Invalid login credentials")

4. **Test Valid Credentials**
   - Use the email and password from your sign-up test
   - Click "Sign In"
   - **Expected:** Successful login and redirect to `/dashboard`

5. **Verify Session Persistence**
   - Refresh the page
   - **Expected:** User should remain logged in
   - Navigate to different pages
   - **Expected:** User session persists across navigation

### 3. Password Reset Flow Test

**Steps to Test:**

1. **Navigate to Forgot Password**
   - Go to `/signin`
   - Click "Forgot Password?" link
   - Should navigate to `/forgot-password`

2. **Request Password Reset**
   - Enter a valid email address (one that exists in your system)
   - Click "Send Reset Link"
   - **Expected:** Success message displayed

3. **Check Email** (Important)
   - Check the email inbox for the reset link
   - **Note:** By default, Supabase sends emails from their domain
   - If email confirmation is DISABLED (default), password resets will work without email verification

4. **Complete Password Reset**
   - Click the reset link from email (if received)
   - Should navigate to `/reset-password` with a token
   - Enter new password
   - Confirm new password
   - Click "Reset Password"
   - **Expected:** Success message and redirect to sign-in

5. **Test New Password**
   - Try signing in with the new password
   - **Expected:** Successful login

### 4. Session Management Test

**Steps to Test:**

1. **Test Session Persistence**
   - Sign in successfully
   - Close the browser tab
   - Reopen the application
   - **Expected:** User should still be logged in

2. **Test Session Expiry**
   - Sign in successfully
   - Wait for session expiry (default: 1 hour)
   - Try to access protected route
   - **Expected:** Session should remain valid or prompt re-authentication

3. **Test Protected Routes**
   - While logged out, try to access `/dashboard`
   - **Expected:** Should redirect to sign-in page or show authentication error

4. **Test Sign Out**
   - Sign in successfully
   - Click "Sign Out" button
   - **Expected:**
     - User logged out
     - Redirect to homepage
     - Cannot access protected routes anymore

### 5. Error Handling Test

**Test these scenarios:**

1. **Network Error Simulation**
   - Turn off internet connection
   - Try to sign in
   - **Expected:** Appropriate error message displayed

2. **Duplicate Email Registration**
   - Try to sign up with an email that already exists
   - **Expected:** Error message: "User already registered"

3. **Invalid Token Reset**
   - Try to access reset password with invalid/expired token
   - **Expected:** Error message about invalid token

## Common Issues & Solutions

### Issue 1: Email Confirmation Required
**Symptom:** After sign up, user can't log in immediately

**Solution:**
1. Check Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations" if you want instant access
3. Or check email inbox for confirmation link

### Issue 2: "Invalid login credentials" on Valid Credentials
**Possible Causes:**
- Email confirmation pending (if enabled)
- Incorrect password
- User doesn't exist in database
- Case-sensitive email mismatch

**Solution:**
```sql
-- Check if user exists
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Issue 3: Session Not Persisting
**Possible Causes:**
- Browser blocking cookies
- Incorrect Supabase URL or Key
- CORS issues

**Solution:**
- Check browser console for errors
- Verify `.env` variables are loaded
- Check browser cookie settings

### Issue 4: Password Reset Email Not Received
**Possible Causes:**
- Email in spam folder
- Supabase email service not configured
- Email confirmation disabled

**Solution:**
1. Check spam/junk folder
2. Verify email settings in Supabase Dashboard
3. Consider setting up custom SMTP (optional)

## Database Verification Queries

### Check All Users
```sql
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
```

### Check User Metadata
```sql
SELECT
  email,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email = 'test@example.com';
```

### Check User Roles
```sql
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;
```

## Authentication Flow Diagram

```
┌─────────────┐
│  Sign Up    │
│   Page      │
└──────┬──────┘
       │
       ├─ Validate Input
       │
       ├─ Call supabase.auth.signUp()
       │
       ├─ Success? ─────────┐
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│   Error     │      │  Create     │
│  Display    │      │  Session    │
└─────────────┘      └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Redirect   │
                     │  Dashboard  │
                     └─────────────┘
```

## Expected Success Criteria

✅ **Sign Up**
- User can create account with valid email/password
- User metadata (first_name, last_name) is saved
- User is automatically logged in after signup
- Redirects to dashboard within 2 seconds

✅ **Sign In**
- User can log in with correct credentials
- Session is created and persists
- User is redirected to dashboard
- Invalid credentials show appropriate error

✅ **Sign Out**
- User can successfully log out
- Session is cleared
- Redirects to homepage
- Cannot access protected routes after logout

✅ **Password Reset**
- User can request password reset
- Reset email is sent (if email configured)
- User can set new password
- Can log in with new password

✅ **Session Management**
- Session persists across page refreshes
- Session persists across browser tabs
- Protected routes are inaccessible when logged out
- Auth state changes are reflected in UI

## Next Steps After Testing

1. **If all tests pass:** Authentication is working correctly!
2. **If issues found:** Document them and refer to "Common Issues & Solutions"
3. **Configure email settings:** Set up custom SMTP in Supabase for branded emails
4. **Add social auth (optional):** Google, GitHub, etc. if needed
5. **Implement MFA (optional):** For enhanced security

## Testing Commands

```bash
# Check if Supabase is accessible
curl -I https://hppbanjiifninnbioxyp.supabase.co

# Build project to ensure no TypeScript errors
npm run build

# Run development server
npm run dev
```

## Contact & Support

If you encounter issues that aren't covered in this guide:
1. Check Supabase Dashboard logs (Authentication → Logs)
2. Check browser console for JavaScript errors
3. Verify environment variables are loaded correctly
4. Check Supabase Status page: https://status.supabase.com/
