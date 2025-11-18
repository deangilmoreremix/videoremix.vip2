# Email Template Link Validation Guide

## Overview

This guide ensures all email templates use the correct Supabase variables to generate working links.

## Supabase Template Variables

Supabase provides these variables for email templates:

### 1. `{{ .ConfirmationURL }}`
**What it is:** Complete URL with token for email confirmation/verification
**Format:** `https://your-site.com/auth/confirm?token_hash=xxx&type=yyy`
**Use in:**
- Confirm Signup
- Invite User
- Magic Link
- Change Email Address
- Reauthentication

**Example:**
```html
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```

### 2. `{{ .SiteURL }}`
**What it is:** Your configured Site URL from Supabase settings
**Format:** `https://videoremix.vip` or `http://localhost:5173`
**Use in:**
- Custom redirect URLs
- Reset password (to build custom link)

**Example:**
```html
<a href="{{ .SiteURL }}/dashboard">Go to Dashboard</a>
```

### 3. `{{ .TokenHash }}`
**What it is:** Hashed version of the authentication token
**Format:** Alphanumeric hash string
**Use in:**
- Reset Password (to build custom reset URL)

**Example:**
```html
<a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

### 4. `{{ .Token }}`
**What it is:** 6-digit One-Time Password (OTP)
**Format:** `123456`
**Use in:**
- OTP-based authentication (optional)
- As alternative to clickable links

**Example:**
```html
<p>Your verification code: <strong>{{ .Token }}</strong></p>
```

### 5. `{{ .Email }}`
**What it is:** User's email address
**Format:** `user@example.com`
**Use in:**
- Personalization
- Displaying current email

**Example:**
```html
<p>Email sent to: {{ .Email }}</p>
```

### 6. `{{ .NewEmail }}`
**What it is:** New email address (when changing email)
**Format:** `newemail@example.com`
**Use in:**
- Change Email Address template only

**Example:**
```html
<p>Confirming change to: {{ .NewEmail }}</p>
```

### 7. `{{ .RedirectTo }}`
**What it is:** Custom redirect URL from API call
**Format:** URL string
**Use in:**
- Custom post-authentication redirects

### 8. `{{ .Data }}`
**What it is:** User metadata from `auth.users.user_metadata`
**Format:** Object with custom fields
**Use in:**
- Personalization with user data

**Example:**
```html
<p>Hello {{ .Data.first_name }}!</p>
```

## Template-Specific Link Configuration

### ✅ Confirm Signup Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Confirm Your Email</a>
```

**Status:** ✅ CORRECT

**What Supabase generates:**
```
https://videoremix.vip/auth/confirm?token_hash=abc123&type=signup
```

**Your app must handle:** `/auth/confirm` route that calls `supabase.auth.verifyOtp()`

---

### ✅ Invite User Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Accept Invitation</a>
```

**Status:** ✅ CORRECT

**What Supabase generates:**
```
https://videoremix.vip/auth/confirm?token_hash=abc123&type=invite
```

**Your app must handle:** `/auth/confirm` route

---

### ✅ Magic Link Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Sign In to VideoRemix.VIP</a>
```

**Status:** ✅ CORRECT

**What Supabase generates:**
```
https://videoremix.vip/auth/confirm?token_hash=abc123&type=magiclink
```

**Your app must handle:** `/auth/confirm` route

---

### ✅ Change Email Address Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Confirm Email Change</a>
```

**Status:** ✅ CORRECT

**What Supabase generates:**
```
https://videoremix.vip/auth/confirm?token_hash=abc123&type=email_change
```

**Your app must handle:** `/auth/confirm` route

---

### ✅ Reset Password Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Reset My Password</a>
```

**Status:** ✅ CORRECT (using ConfirmationURL)

**What Supabase generates:**
```
https://videoremix.vip/reset-password?token_hash=abc123&type=recovery
```

**Your app must handle:** `/reset-password` page that:
1. Extracts `token_hash` from URL
2. Shows password reset form
3. Calls `supabase.auth.updateUser({ password: newPassword })`

**Alternative Implementation (if needed):**
```html
<a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

---

### ✅ Reauthentication Template

**Current Implementation:**
```html
<a href="{{ .ConfirmationURL }}">Verify My Identity</a>
```

**Status:** ✅ CORRECT

**What Supabase generates:**
```
https://videoremix.vip/auth/confirm?token_hash=abc123&type=reauthentication
```

**Your app must handle:** `/auth/confirm` route

---

## Required Route Handlers in Your App

### 1. `/auth/confirm` Handler

**Purpose:** Handle all auth confirmations except password reset

**Implementation Example:**
```typescript
// React Router example
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function AuthConfirm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get token_hash and type from URL
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get('token_hash');
    const type = params.get('type');

    if (token_hash && type) {
      // Verify the OTP
      supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      }).then(({ data, error }) => {
        if (error) {
          console.error('Verification error:', error);
          navigate('/signin?error=verification_failed');
        } else {
          // Success! User is now authenticated
          navigate('/dashboard');
        }
      });
    }
  }, [navigate]);

  return <div>Verifying your email...</div>;
}
```

### 2. `/reset-password` Handler

**Purpose:** Handle password reset flow

**Implementation Example:**
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Supabase automatically reads the token from the URL
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    setLoading(false);

    if (error) {
      alert('Error resetting password: ' + error.message);
    } else {
      alert('Password reset successful!');
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleResetPassword}>
      <h2>Reset Your Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
```

## Supabase Configuration

### Site URL Configuration

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Development:**
```
Site URL: http://localhost:5173
```

**Production:**
```
Site URL: https://videoremix.vip
```

**Important:** This determines what `{{ .SiteURL }}` resolves to and where users are redirected.

### Redirect URLs Configuration

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Add these redirect URLs:**
```
http://localhost:5173/**
http://localhost:5173/auth/confirm
http://localhost:5173/reset-password
http://localhost:5173/dashboard
https://videoremix.vip/**
https://videoremix.vip/auth/confirm
https://videoremix.vip/reset-password
https://videoremix.vip/dashboard
```

**Why `**` wildcard:** Allows redirects to any path under your domain.

## Testing Links

### Test 1: Confirm Signup Link

**Steps:**
1. Sign up with test email
2. Check email inbox
3. Click "Confirm Your Email" button
4. Verify URL format:
   ```
   https://videoremix.vip/auth/confirm?token_hash=...&type=signup
   ```
5. Should redirect to `/dashboard` after verification

**Expected Result:** User is authenticated and redirected

### Test 2: Password Reset Link

**Steps:**
1. Click "Forgot Password"
2. Enter email and submit
3. Check email inbox
4. Click "Reset My Password" button
5. Verify URL format:
   ```
   https://videoremix.vip/reset-password?token_hash=...&type=recovery
   ```
6. Should show password reset form

**Expected Result:** User can enter new password and reset successfully

### Test 3: Magic Link

**Steps:**
1. Request magic link sign-in
2. Check email inbox
3. Click "Sign In to VideoRemix.VIP" button
4. Verify URL format:
   ```
   https://videoremix.vip/auth/confirm?token_hash=...&type=magiclink
   ```

**Expected Result:** User is signed in automatically

### Test 4: Email Change

**Steps:**
1. Sign in to account
2. Change email address
3. Check NEW email inbox
4. Click "Confirm Email Change" button
5. Verify URL format:
   ```
   https://videoremix.vip/auth/confirm?token_hash=...&type=email_change
   ```

**Expected Result:** Email is updated, user remains signed in

## Common Issues and Solutions

### Issue 1: "Invalid or expired link"

**Causes:**
- Link has expired (24 hours for signup, 1 hour for password reset)
- Token already used (one-time use only)
- Wrong redirect URL configuration

**Solutions:**
- Request new link
- Check Supabase redirect URL whitelist
- Verify Site URL is correct

### Issue 2: "Redirect URL not allowed"

**Causes:**
- URL not whitelisted in Supabase
- Typo in redirect URL configuration
- Missing wildcard `**` for dynamic paths

**Solutions:**
- Add URL to Supabase redirect URLs
- Use `**` wildcard: `https://videoremix.vip/**`
- Check for http vs https mismatch

### Issue 3: Link goes to wrong domain

**Causes:**
- Site URL not configured correctly
- Multiple environments using same Supabase project

**Solutions:**
- Update Site URL in Supabase dashboard
- Use separate Supabase projects for dev/prod
- Check environment variables

### Issue 4: Password reset doesn't work

**Causes:**
- Missing `/reset-password` route handler
- Not calling `supabase.auth.updateUser()`
- Token not being read from URL

**Solutions:**
- Implement `/reset-password` page
- Ensure route is defined in your router
- Supabase automatically reads token from URL

### Issue 5: CORS errors on confirmation

**Causes:**
- API URL not matching redirect URL
- Local development CORS issues

**Solutions:**
- Ensure Supabase URL matches environment
- Check CORS settings in Supabase
- Verify API keys are correct

## Debugging Tools

### 1. Check Email HTML Source

View the raw email HTML to see actual generated URLs:
1. Open email in Gmail
2. Click three dots menu → "Show original"
3. Search for `href=` to see all links
4. Verify URLs match expected format

### 2. Browser Developer Tools

Monitor network requests:
1. Open DevTools → Network tab
2. Click email link
3. Watch for redirects
4. Check for error responses

### 3. Supabase Logs

Check authentication logs:
1. Go to Supabase Dashboard
2. Navigate to Authentication → Logs
3. Look for verification attempts
4. Check for error messages

### 4. URL Parameter Testing

Manually test URLs:
```
https://videoremix.vip/auth/confirm?token_hash=test123&type=signup
```
Your handler should catch and process these parameters.

## Validation Checklist

Use this checklist before deploying:

### Configuration
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs whitelisted (with `**` wildcard)
- [ ] Environment variables set correctly
- [ ] Production URL differs from development

### Route Handlers
- [ ] `/auth/confirm` route exists
- [ ] `/reset-password` route exists
- [ ] Handlers extract `token_hash` from URL
- [ ] Handlers extract `type` from URL
- [ ] Error handling implemented

### Email Templates
- [ ] All templates use correct Supabase variables
- [ ] Button links use `{{ .ConfirmationURL }}`
- [ ] Fallback text links use same variables
- [ ] No hardcoded URLs in templates

### Testing
- [ ] Signup confirmation tested
- [ ] Password reset tested
- [ ] Magic link tested (if enabled)
- [ ] Email change tested
- [ ] Links work on mobile
- [ ] Links work in different email clients

### Production
- [ ] Production URLs configured
- [ ] SSL certificate valid (https)
- [ ] DNS properly configured
- [ ] Custom SMTP configured (recommended)

## Best Practices

### 1. Never Hardcode URLs
❌ Bad:
```html
<a href="https://videoremix.vip/confirm?token=xyz">Confirm</a>
```

✅ Good:
```html
<a href="{{ .ConfirmationURL }}">Confirm</a>
```

### 2. Always Provide Fallback Text Link
```html
<p>If the button doesn't work, copy this link:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 3. Use Consistent Redirect Patterns
All confirmations go to `/auth/confirm` except password reset which goes to `/reset-password`.

### 4. Handle Expired Tokens Gracefully
Show friendly error message and option to request new link.

### 5. Log Verification Attempts
Track successful and failed verifications for security monitoring.

## Summary

### Template Variables Used

| Template | Primary Variable | Status |
|----------|-----------------|--------|
| Confirm Signup | `{{ .ConfirmationURL }}` | ✅ Correct |
| Invite User | `{{ .ConfirmationURL }}` | ✅ Correct |
| Magic Link | `{{ .ConfirmationURL }}` | ✅ Correct |
| Change Email | `{{ .ConfirmationURL }}` | ✅ Correct |
| Reset Password | `{{ .ConfirmationURL }}` | ✅ Correct |
| Reauthentication | `{{ .ConfirmationURL }}` | ✅ Correct |

### Required App Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/auth/confirm` | Handle all confirmations | ⚠️ Needs implementation |
| `/reset-password` | Password reset form | ⚠️ Needs implementation |
| `/dashboard` | Post-auth redirect | ✅ Exists |

**All templates use correct Supabase variables and will generate working links once your app implements the required route handlers.**

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/auth
- Support: support@videoremix.vip

**Last Updated:** October 2024
