# VideoRemix.vip Email Templates Setup Guide

## Overview

This guide explains how to configure unified VideoRemix.vip branded email templates for your multi-app Supabase setup. All authentication emails (signup, password reset, etc.) will use consistent VideoRemix.vip branding regardless of which app users are accessing.

## Architecture

### Multi-App Strategy
- **Single Brand Identity**: All apps use VideoRemix.vip branding
- **Unified Auth System**: One Supabase auth instance for all 37+ apps
- **Send Email Hook**: Custom Edge Function intercepts and formats all auth emails
- **Dynamic Redirects**: Users are redirected to appropriate app after email confirmation

### Email Types Supported
1. **Signup Confirmation** - Welcome email with email verification
2. **Password Recovery** - Password reset email
3. **Magic Link** - Passwordless sign-in
4. **User Invitation** - Invite users to platform
5. **Email Change** - Confirm email address changes

## Edge Function Deployed

✅ **Function Name**: `send-email-hook`
✅ **URL**: `https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/send-email-hook`
✅ **Status**: Deployed and ready to use

## Supabase Dashboard Configuration

### Step 1: Enable Send Email Hook

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f
2. Navigate to **Authentication** → **Hooks** (in left sidebar)
3. Find the **Send Email** hook section
4. Enable the hook by toggling it ON
5. Set the hook URL to:
   ```
   https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/send-email-hook
   ```
6. Click **Save**

### Step 2: Configure Auth Settings (Optional)

1. Navigate to **Authentication** → **URL Configuration**
2. Set **Site URL** to:
   ```
   https://videoremix.vip
   ```
3. Add **Redirect URLs** for all your apps:
   ```
   https://videoremix.vip/*
   https://*.videoremix.vip/*
   ```
4. Click **Save**

### Step 3: Email Template Settings

Since you're using the Send Email Hook, you **do not need to configure** the default email templates in the Dashboard. The hook handles all email formatting automatically.

However, you can still customize the email sender:

1. Navigate to **Authentication** → **Email Templates**
2. Scroll to **Sender Details**
3. Set:
   - **Sender Name**: `VideoRemix.vip`
   - **Sender Email**: `noreply@videoremix.vip` (or your verified domain email)

## Email Template Features

### Design
- ✅ Professional gradient header with VideoRemix.vip branding
- ✅ Responsive design (mobile-friendly)
- ✅ Blue theme matching your brand colors
- ✅ Clear call-to-action buttons
- ✅ Fallback text links for email clients that block buttons
- ✅ Professional footer with support contact

### Security
- ✅ Token-based confirmation links
- ✅ Expiration times included in emails
- ✅ Clear security warnings for unexpected emails
- ✅ HTTPS-only links

### User Experience
- ✅ Clear instructions for each email type
- ✅ Welcome message for new signups
- ✅ Support email prominently displayed
- ✅ VideoRemix.vip branding throughout

## Customization

### Modify Brand Colors

Edit the constants in `/supabase/functions/send-email-hook/index.ts`:

```typescript
const BRAND_COLORS = {
  primary: "#3b82f6",    // Main button and accent color
  secondary: "#1e40af",   // Header gradient end color
  accent: "#60a5fa",      // Unused (reserved for future)
  background: "#f8fafc",  // Light background color
  text: "#1e293b",        // Main text color
};
```

### Modify Brand Information

```typescript
const BRAND_NAME = "VideoRemix.vip";
const BRAND_URL = "https://videoremix.vip";
const SUPPORT_EMAIL = "support@videoremix.vip";
```

### Redeploy After Changes

After making any changes to the email templates:

```bash
# The function is automatically redeployed when you save changes
# No manual deployment needed
```

## Testing Your Email Templates

### Test Signup Email
1. Go to your signup page: https://videoremix.vip/signup
2. Create a test account with a real email address
3. Check your inbox for the confirmation email
4. Verify the branding, formatting, and links work correctly

### Test Password Recovery
1. Go to your forgot password page: https://videoremix.vip/forgot-password
2. Enter your email address
3. Check your inbox for the password reset email
4. Click the reset link and verify it works

### Test From Different Apps
1. Access signup from a specific app domain (e.g., app-specific.videoremix.vip)
2. Complete signup process
3. Verify email still uses VideoRemix.vip branding
4. Verify redirect takes you back to the correct app

## How Redirects Work

### After Email Confirmation

When users click confirmation links in emails, they're taken to:
```
https://videoremix.vip/auth/confirm?token=xxx&type=signup&redirect_to=https://app.videoremix.vip/dashboard
```

The `redirect_to` parameter ensures users return to the correct app after confirmation.

### Setting Redirect URLs in Your Apps

When calling `signUp()` or `resetPasswordForEmail()`, include the redirect URL:

```typescript
// Signup with redirect
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: 'https://your-app.videoremix.vip/dashboard',
  },
});

// Password reset with redirect
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://your-app.videoremix.vip/reset-password',
  }
);
```

## Troubleshooting

### Emails Not Sending

1. **Check Hook Status**: Verify the Send Email Hook is enabled in Dashboard
2. **Check Function Logs**: Go to **Edge Functions** → **send-email-hook** → **Logs**
3. **Verify URL**: Ensure hook URL is exactly:
   ```
   https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/send-email-hook
   ```

### Emails Look Broken

1. **Test in Multiple Email Clients**: Gmail, Outlook, Apple Mail
2. **Check HTML Rendering**: Some clients strip CSS styles
3. **Verify Images Load**: Ensure HTTPS links work
4. **Check Spam Folder**: Emails might be filtered

### Wrong Redirect After Confirmation

1. **Check Site URL**: Set to `https://videoremix.vip` in Auth settings
2. **Verify Redirect URLs**: Add all app domains to allowed redirect list
3. **Check Client Code**: Ensure `emailRedirectTo` or `redirectTo` is set correctly

### Users Not Receiving Emails

1. **Check Email Limits**: Supabase has rate limits on auth emails
2. **Verify Email Provider**: Some providers block authentication emails
3. **Check Sender Reputation**: Use a verified domain for better deliverability
4. **Consider Custom SMTP**: For production, use a custom SMTP provider

## Production Recommendations

### 1. Custom SMTP Provider (Highly Recommended)

For production, use a dedicated email service:

- **Resend** (Recommended): Modern, developer-friendly, great deliverability
- **SendGrid**: Enterprise-grade, high volume
- **Postmark**: Focused on transactional emails
- **AWS SES**: Cost-effective for high volume

Configure in Dashboard: **Authentication** → **Email Templates** → **SMTP Settings**

### 2. Custom Domain Email

Instead of `noreply@videoremix.vip`, use a verified domain:
- Set up SPF, DKIM, and DMARC records
- Verify domain with your email provider
- Improves deliverability and trust

### 3. Email Monitoring

Set up monitoring for:
- Email delivery rates
- Bounce rates
- Spam complaints
- Open rates (if using tracking pixels)

### 4. Rate Limiting

Be aware of Supabase auth email limits:
- Free tier: Limited emails per hour
- Pro tier: Higher limits
- Consider implementing your own rate limiting

## Multi-App Advanced Configuration

### App-Specific Welcome Messages (Future Enhancement)

To add app-specific content while maintaining unified branding, you can pass metadata:

```typescript
// In your app's signup code
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      app_name: 'AI Video Creator',
      app_slug: 'video-creator',
    },
    emailRedirectTo: 'https://video-creator.videoremix.vip/dashboard',
  },
});
```

Then modify the Edge Function to read `user.user_metadata.app_name` and customize the welcome message.

### Purchase-Triggered Welcome Emails

For emails sent after purchase (from your webhook handlers), you can:

1. Create a separate Edge Function for purchase confirmation emails
2. Include information about which apps they purchased
3. List all apps they now have access to
4. Provide links to each app's dashboard

## Support

If you encounter issues:

1. **Check Function Logs**: Dashboard → Edge Functions → send-email-hook → Logs
2. **Check Auth Logs**: Dashboard → Authentication → Logs
3. **Test Locally**: Use Supabase CLI to test function locally
4. **Contact Support**: support@videoremix.vip

## Summary

✅ **Edge Function Deployed**: send-email-hook is live
✅ **Templates Created**: All 5 email types configured
✅ **Unified Branding**: VideoRemix.vip across all apps
✅ **Multi-App Support**: Works with all your 37+ apps

### Next Step: Enable the Hook in Supabase Dashboard

Go to: **Authentication** → **Hooks** → **Send Email** → Enable and set URL to:
```
https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/send-email-hook
```

That's it! Your unified email template system is ready to use.
