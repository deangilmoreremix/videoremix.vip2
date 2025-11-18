# Email Templates Setup Guide

## Overview

All authentication email templates have been redesigned to match your VideoRemix.vip brand with:

- Dark theme with black to dark blue gradients
- Blue accent colors (#0ea5e9 to #3b82f6)
- Professional typography and spacing
- Mobile-responsive design
- Modern shadows and visual effects
- Inline CSS for maximum email client compatibility

## Templates Created

### 1. **confirm-signup.html**
- **Purpose**: Email confirmation for new user signups
- **Key Features**:
  - Welcome badge with green gradient
  - Lists 4 key features users get access to
  - 24-hour expiration notice
  - Alternative text link for compatibility

### 2. **magic-link.html**
- **Purpose**: Passwordless sign-in via magic link
- **Key Features**:
  - Security badge with blue gradient
  - 15-minute expiration warning
  - Dashboard preview features
  - Security notice for unauthorized requests

### 3. **reset-password.html**
- **Purpose**: Password reset requests
- **Key Features**:
  - Orange security badge
  - Strong password tips with checkmarks
  - 60-minute expiration notice
  - Red-bordered security warning

### 4. **email-change.html**
- **Purpose**: Confirming email address changes
- **Key Features**:
  - Purple update badge
  - Displays new email address prominently
  - Step-by-step what happens next
  - 24-hour expiration with security warning

### 5. **invite.html**
- **Purpose**: Inviting new users to the platform
- **Key Features**:
  - Pink/purple invitation badge
  - Lists 5 key benefits
  - Getting started tips
  - 7-day expiration notice

## Template Variables

Each template uses these Supabase variables:

- `{{ .ConfirmationURL }}` - The action link (confirm, reset, etc.)
- `{{ .Email }}` - User's email address (used in email-change template)
- `{{ .SiteURL }}` - Your site URL (optional, for additional links)
- `{{ .TokenHash }}` - Token hash (for alternative implementations)

## How to Install in Supabase

### Method 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Navigate to Your Project**
   - Select your VideoRemix.vip project

3. **Go to Authentication Settings**
   - Click "Authentication" in left sidebar
   - Click "Email Templates" tab

4. **Update Each Template**

   **For Confirm Signup:**
   - Click "Confirm signup" template
   - Copy content from `confirm-signup.html`
   - Paste into the editor
   - Click "Save"

   **For Magic Link:**
   - Click "Magic Link" template
   - Copy content from `magic-link.html`
   - Paste and save

   **For Reset Password:**
   - Click "Reset Password" template
   - Copy content from `reset-password.html`
   - Paste and save

   **For Change Email Address:**
   - Click "Change Email Address" template
   - Copy content from `email-change.html`
   - Paste and save

   **For Invite User:**
   - Click "Invite User" template
   - Copy content from `invite.html`
   - Paste and save

### Method 2: Via Supabase CLI

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy email templates
supabase db remote commit
```

Note: CLI method requires additional configuration. Dashboard method is simpler.

## Testing Your Email Templates

### Test Each Template

1. **Confirm Signup**
   ```bash
   # Create a test account
   curl -X POST 'https://your-project.supabase.co/auth/v1/signup' \
     -H 'apikey: your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@example.com", "password": "testpass123"}'
   ```

2. **Magic Link**
   ```bash
   # Request magic link
   curl -X POST 'https://your-project.supabase.co/auth/v1/magiclink' \
     -H 'apikey: your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@example.com"}'
   ```

3. **Reset Password**
   ```bash
   # Request password reset
   curl -X POST 'https://your-project.supabase.co/auth/v1/recover' \
     -H 'apikey: your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@example.com"}'
   ```

4. **Change Email**
   - Change email from user profile in your app
   - Check both old and new email inboxes

5. **Invite User**
   - Use admin panel to invite a user
   - Check invited user's inbox

### Email Client Testing

Test across these clients for best coverage:

**Desktop:**
- Gmail (web)
- Outlook (web + desktop app)
- Apple Mail (macOS)
- Yahoo Mail
- ProtonMail

**Mobile:**
- Gmail (iOS + Android)
- Apple Mail (iOS)
- Outlook (iOS + Android)
- Samsung Email (Android)

**Dark Mode:**
- Test on clients with dark mode enabled
- Verify text remains readable

## Customization

### Update Brand Colors

Find and replace these hex codes in all templates:

**Current Blues:**
- `#0ea5e9` - Light blue
- `#3b82f6` - Medium blue
- `#6366f1` - Indigo blue
- `#60a5fa` - Link blue

**Background Gradients:**
- `#1a1a2e` - Dark blue
- `#16213e` - Navy
- `#0f3460` - Deep blue

### Update URLs

Replace these placeholder URLs:

```html
<!-- In footer of all templates -->
<a href="https://videoremix.vip">Visit Website</a>
<a href="https://videoremix.vip/help">Help Center</a>
<a href="https://videoremix.vip/contact">Contact Support</a>
```

### Update Logo

To add an actual logo image instead of text:

```html
<!-- Replace this in header: -->
<h1 style="...">VideoRemix.vip</h1>

<!-- With this: -->
<img src="https://your-cdn.com/logo-white.png"
     alt="VideoRemix.vip"
     style="max-width: 200px; height: auto;" />
```

## Plain Text Versions

Supabase also allows plain text fallbacks. Here are simplified versions:

### Confirm Signup (Plain Text)
```
VideoRemix.vip - AI-Powered Personalization

WELCOME ABOARD!

Confirm Your Email Address

Hi there!

Thanks for signing up for VideoRemix.vip! You're one step away from unlocking powerful AI tools that will transform how you create personalized content.

Confirm your email by clicking this link:
{{ .ConfirmationURL }}

What you'll get access to:
✓ 53+ AI-powered apps and tools
✓ Create personalized videos at scale
✓ Instant access to your dashboard
✓ Professional templates and resources

This confirmation link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
VideoRemix.vip - AI-Powered Video Personalization Platform
Visit: https://videoremix.vip | Help: https://videoremix.vip/help
© 2024 VideoRemix.vip. All rights reserved.
```

### Magic Link (Plain Text)
```
VideoRemix.vip - AI-Powered Personalization

SECURE SIGN IN

Sign In to Your Account

Click the link below to securely sign in to your VideoRemix.vip account. No password required!

{{ .ConfirmationURL }}

This magic link will expire in 15 minutes for your security.

Your dashboard awaits with:
✓ All your AI-powered tools
✓ Your personalized content library
✓ Project history and analytics

Didn't request this? Ignore this email - your account remains secure.

---
VideoRemix.vip
© 2024 VideoRemix.vip. All rights reserved.
```

### Reset Password (Plain Text)
```
VideoRemix.vip - AI-Powered Personalization

PASSWORD RESET

Reset Your Password

We received a request to reset your password for your VideoRemix.vip account.

Click this link to create a new password:
{{ .ConfirmationURL }}

Tips for a Strong Password:
✓ Use at least 8 characters
✓ Mix uppercase and lowercase letters
✓ Include numbers and special characters
✓ Avoid common words or patterns

This password reset link will expire in 60 minutes.

If you didn't request this, please ignore this email. Your password will remain unchanged.

---
VideoRemix.vip
© 2024 VideoRemix.vip. All rights reserved.
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Settings**
   - Go to Supabase Dashboard > Project Settings > Auth
   - Verify SMTP configuration
   - Test SMTP connection

2. **Check Rate Limits**
   - Supabase free tier: 3 emails/hour per recipient
   - Consider upgrading or using custom SMTP

3. **Check Spam Folders**
   - Add SPF/DKIM records to your domain
   - Use a verified sender domain

### Template Not Updating

1. **Clear Cache**
   - Hard refresh browser (Ctrl+Shift+R)
   - Try incognito/private mode

2. **Verify Saving**
   - Check for save confirmation message
   - Re-open template to verify changes

3. **Check for Syntax Errors**
   - Ensure all HTML tags are closed
   - Validate template variables syntax

### Images Not Loading

1. **Use Absolute URLs**
   ```html
   <!-- Good -->
   <img src="https://cdn.example.com/logo.png" />

   <!-- Bad -->
   <img src="/images/logo.png" />
   ```

2. **Host Images Externally**
   - Use CDN or image hosting service
   - Don't rely on localhost or relative paths

### Rendering Issues

1. **Test Inline CSS**
   - All styles must be inline for email clients
   - Avoid external stylesheets

2. **Use Tables for Layout**
   - Email clients don't support flexbox/grid well
   - Tables ensure consistent rendering

3. **Simplify Complex Gradients**
   - Some clients don't support CSS gradients
   - Provide solid color fallbacks

## Email Deliverability Best Practices

### Domain Configuration

1. **Add SPF Record**
   ```
   v=spf1 include:_spf.supabase.co ~all
   ```

2. **Add DKIM Record**
   - Get from Supabase SMTP settings
   - Add to your DNS

3. **Add DMARC Record**
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

### Content Best Practices

1. **Balance Text and Images**
   - Don't use image-only emails
   - Include sufficient text content

2. **Avoid Spam Triggers**
   - Don't use ALL CAPS in subject
   - Avoid excessive exclamation marks!!!
   - Don't use spam trigger words

3. **Include Plain Text Version**
   - Always provide text alternative
   - Some users prefer text-only

4. **Test Before Deploying**
   - Use Mail Tester or similar tools
   - Check spam score before going live

## Maintenance

### Regular Updates

- Review templates quarterly
- Update links if your site structure changes
- Keep branding consistent with website updates
- Test across new email clients as they emerge

### Version Control

```bash
# Keep templates in version control
git add supabase/templates/*.html
git commit -m "Update email templates"
git push
```

### Monitor Performance

Track these metrics:
- **Delivery Rate**: % of emails delivered
- **Open Rate**: % of recipients who open
- **Click Rate**: % who click links
- **Bounce Rate**: % of failed deliveries
- **Spam Complaints**: Monitor carefully

## Support

If you need help:
- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Community: https://github.com/supabase/supabase/discussions
- Support: support@videoremix.vip

---

**All templates are ready to use!** Simply copy them into your Supabase dashboard and test thoroughly before going live.
