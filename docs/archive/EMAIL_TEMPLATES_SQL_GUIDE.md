# Email Templates Configuration Guide for VideoRemix.VIP

## Overview

This comprehensive guide explains how to configure and manage Supabase email templates for VideoRemix.VIP authentication flows. While Supabase email templates cannot be directly modified via SQL, this guide provides multiple approaches for template management.

## Table of Contents

1. [Understanding Email Template Management](#understanding-email-template-management)
2. [Three Approaches to Template Configuration](#three-approaches-to-template-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Configuration via Dashboard](#production-configuration-via-dashboard)
5. [Programmatic Configuration via API](#programmatic-configuration-via-api)
6. [SQL Migration for URL Configuration](#sql-migration-for-url-configuration)
7. [Authentication Routes](#authentication-routes)
8. [Testing Email Templates](#testing-email-templates)
9. [Troubleshooting](#troubleshooting)

---

## Understanding Email Template Management

### Important Limitation

**Supabase email templates CANNOT be directly modified via SQL.** The auth configuration, including email templates, is managed at the project level and is not accessible through the database schema.

### Why This Limitation Exists

- Email templates are part of the Supabase Auth service configuration
- They are stored in the project configuration, not in database tables
- Direct SQL access would bypass security and validation checks
- Templates use Go templating language which requires server-side processing

### What CAN Be Done via SQL

The SQL migration in this project (`20251114180322_configure_email_auth_urls.sql`) creates:

1. **Documentation Tables**: Track email template metadata and auth URL configuration
2. **Helper Functions**: Retrieve email configuration for admin dashboards
3. **Reference Data**: Document which templates correspond to which routes

---

## Three Approaches to Template Configuration

### 1. Supabase Dashboard (Production - Recommended)

**Best for**: Production deployments, manual updates, testing

**Steps**:
1. Log into [Supabase Dashboard](https://supabase.com)
2. Select your VideoRemix.VIP project
3. Navigate to **Authentication** → **Email Templates**
4. Select template type (e.g., "Confirm signup")
5. Copy HTML from `supabase/email-templates/*.html`
6. Paste into HTML Template field
7. Copy plain text from `supabase/email-templates/plain-text-versions.txt`
8. Paste into Plain Text field
9. Update subject line
10. Click **Save**

**Pros**:
- Visual interface
- Immediate preview
- No CLI required
- Works from anywhere

**Cons**:
- Manual process
- No version control
- Requires dashboard access

---

### 2. config.toml (Local Development)

**Best for**: Local development, testing, team consistency

**Location**: `supabase/config.toml`

**Configuration Example**:

```toml
[auth.email.template.confirmation]
subject = "Welcome to VideoRemix.VIP - Confirm Your Email"
content_path = "./supabase/email-templates/confirm-signup.html"
```

**How to Use**:

1. Ensure `supabase/config.toml` exists (already created)
2. Install Supabase CLI: `npm install -g supabase`
3. Start local Supabase: `supabase start`
4. Access local Inbucket for email testing: `http://localhost:54324`

**Pros**:
- Version controlled
- Team consistency
- Automatic local setup
- Easy testing

**Cons**:
- Local development only
- Requires Supabase CLI
- Doesn't affect production

---

### 3. Management API (Programmatic)

**Best for**: CI/CD pipelines, automated deployments, bulk updates

**API Endpoint**:
```bash
PATCH https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth
```

**Authentication**:
```bash
Authorization: Bearer $SUPABASE_ACCESS_TOKEN
```

**Example Request**:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Welcome to VideoRemix.VIP - Confirm Your Email",
    "mailer_templates_confirmation_content": "<html>...</html>"
  }'
```

**Template Field Names**:
- `mailer_subjects_confirmation` - Confirm signup subject
- `mailer_templates_confirmation_content` - Confirm signup HTML
- `mailer_subjects_invite` - Invite user subject
- `mailer_templates_invite_content` - Invite user HTML
- `mailer_subjects_magic_link` - Magic link subject
- `mailer_templates_magic_link_content` - Magic link HTML
- `mailer_subjects_change_email` - Change email subject
- `mailer_templates_change_email_content` - Change email HTML
- `mailer_subjects_recovery` - Password recovery subject
- `mailer_templates_recovery_content` - Password recovery HTML
- `mailer_subjects_reauthentication` - Reauthentication subject
- `mailer_templates_reauthentication_content` - Reauthentication HTML

**Pros**:
- Fully automated
- CI/CD integration
- Bulk updates
- Scriptable

**Cons**:
- Requires access token
- More complex setup
- API rate limits apply

---

## Local Development Setup

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### Initialize Local Environment

```bash
# Start Supabase services
supabase start

# This will start:
# - PostgreSQL database (port 54322)
# - Kong API Gateway (port 54321)
# - Supabase Studio (port 54323)
# - Inbucket SMTP server (port 54325)
```

### Test Email Templates Locally

1. **Access Inbucket**: Open `http://localhost:54324`
2. **Trigger Auth Flow**: Sign up a test user in your app
3. **Check Inbucket**: View the email in Inbucket interface
4. **Verify Template**: Ensure styling and links work correctly

### config.toml Configuration

The `supabase/config.toml` file has been created with all email templates configured:

```toml
[auth.email.template.confirmation]
subject = "Welcome to VideoRemix.VIP - Confirm Your Email"
content_path = "./supabase/email-templates/confirm-signup.html"

[auth.email.template.invite]
subject = "You've Been Invited to VideoRemix.VIP"
content_path = "./supabase/email-templates/invite-user.html"

[auth.email.template.magic_link]
subject = "Your Sign-In Link - VideoRemix.VIP"
content_path = "./supabase/email-templates/magic-link.html"

[auth.email.template.email_change]
subject = "Confirm Your New Email Address - VideoRemix.VIP"
content_path = "./supabase/email-templates/change-email.html"

[auth.email.template.recovery]
subject = "Reset Your Password - VideoRemix.VIP"
content_path = "./supabase/email-templates/reset-password.html"

[auth.email.template.reauthentication]
subject = "Confirm Your Identity - VideoRemix.VIP"
content_path = "./supabase/email-templates/reauthentication.html"
```

---

## Production Configuration via Dashboard

### Step-by-Step Guide

#### 1. Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://videoremix.vip`
3. Click **Save**

#### 2. Configure Redirect URLs

Add these URLs to the **Redirect URLs** list:

```
https://videoremix.vip/**
https://videoremix.vip/auth/confirm
https://videoremix.vip/auth/invite
https://videoremix.vip/auth/magic-link
https://videoremix.vip/auth/change-email
https://videoremix.vip/auth/reauthenticate
https://videoremix.vip/auth/recovery
https://videoremix.vip/auth/reset-password
https://videoremix.vip/auth/callback
https://videoremix.vip/dashboard
https://videoremix.vip/profile
```

The `**` wildcard allows all subpaths under the domain.

#### 3. Upload Email Templates

For each template type, follow these steps:

##### Confirm Signup Template

1. Navigate to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. **Subject**: `Welcome to VideoRemix.VIP - Confirm Your Email`
4. **HTML Template**: Copy contents from `supabase/email-templates/confirm-signup.html`
5. **Plain Text**: Copy Section 1 from `supabase/email-templates/plain-text-versions.txt`
6. Click **Save**

##### Invite User Template

1. Select **Invite user**
2. **Subject**: `You've Been Invited to VideoRemix.VIP`
3. **HTML Template**: Copy from `supabase/email-templates/invite-user.html`
4. **Plain Text**: Copy Section 2 from plain-text-versions.txt
5. Click **Save**

##### Magic Link Template

1. Select **Magic Link**
2. **Subject**: `Your Sign-In Link - VideoRemix.VIP`
3. **HTML Template**: Copy from `supabase/email-templates/magic-link.html`
4. **Plain Text**: Copy Section 3 from plain-text-versions.txt
5. Click **Save**

##### Change Email Template

1. Select **Change Email Address**
2. **Subject**: `Confirm Your New Email Address - VideoRemix.VIP`
3. **HTML Template**: Copy from `supabase/email-templates/change-email.html`
4. **Plain Text**: Copy Section 4 from plain-text-versions.txt
5. Click **Save**

##### Reset Password Template

1. Select **Reset password**
2. **Subject**: `Reset Your Password - VideoRemix.VIP`
3. **HTML Template**: Copy from `supabase/email-templates/reset-password.html`
4. **Plain Text**: Copy Section 5 from plain-text-versions.txt
5. Click **Save**

##### Reauthentication Template

1. Select **Reauthenticate** (if available)
2. **Subject**: `Confirm Your Identity - VideoRemix.VIP`
3. **HTML Template**: Copy from `supabase/email-templates/reauthentication.html`
4. **Plain Text**: Copy Section 6 from plain-text-versions.txt
5. Click **Save**

---

## Programmatic Configuration via API

### Prerequisites

1. **Supabase Access Token**: Get from Supabase Dashboard → Settings → API
2. **Project Reference**: Your project ID from the dashboard URL

### Create Deployment Script

Create `scripts/deploy-email-templates.sh`:

```bash
#!/bin/bash

# Configuration
PROJECT_REF="your-project-ref"
SUPABASE_ACCESS_TOKEN="your-access-token"
API_URL="https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"

# Read email templates
CONFIRM_SIGNUP=$(cat supabase/email-templates/confirm-signup.html | jq -Rs .)
INVITE_USER=$(cat supabase/email-templates/invite-user.html | jq -Rs .)
MAGIC_LINK=$(cat supabase/email-templates/magic-link.html | jq -Rs .)
CHANGE_EMAIL=$(cat supabase/email-templates/change-email.html | jq -Rs .)
RESET_PASSWORD=$(cat supabase/email-templates/reset-password.html | jq -Rs .)
REAUTHENTICATION=$(cat supabase/email-templates/reauthentication.html | jq -Rs .)

# Update email templates
curl -X PATCH "$API_URL" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_subjects_confirmation\": \"Welcome to VideoRemix.VIP - Confirm Your Email\",
    \"mailer_templates_confirmation_content\": $CONFIRM_SIGNUP,
    \"mailer_subjects_invite\": \"You've Been Invited to VideoRemix.VIP\",
    \"mailer_templates_invite_content\": $INVITE_USER,
    \"mailer_subjects_magic_link\": \"Your Sign-In Link - VideoRemix.VIP\",
    \"mailer_templates_magic_link_content\": $MAGIC_LINK,
    \"mailer_subjects_change_email\": \"Confirm Your New Email Address - VideoRemix.VIP\",
    \"mailer_templates_change_email_content\": $CHANGE_EMAIL,
    \"mailer_subjects_recovery\": \"Reset Your Password - VideoRemix.VIP\",
    \"mailer_templates_recovery_content\": $RESET_PASSWORD,
    \"mailer_subjects_reauthentication\": \"Confirm Your Identity - VideoRemix.VIP\",
    \"mailer_templates_reauthentication_content\": $REAUTHENTICATION
  }"

echo "Email templates deployed successfully!"
```

### Usage

```bash
chmod +x scripts/deploy-email-templates.sh
./scripts/deploy-email-templates.sh
```

---

## SQL Migration for URL Configuration

### What the Migration Does

The migration `20251114180322_configure_email_auth_urls.sql` creates:

#### 1. auth_url_configuration Table

Tracks all authentication URLs and their purposes:

```sql
CREATE TABLE public.auth_url_configuration (
  id uuid PRIMARY KEY,
  route_path text NOT NULL UNIQUE,
  route_purpose text NOT NULL,
  email_template_used text,
  redirect_after_action text,
  is_production_ready boolean,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### 2. email_template_metadata Table

Documents email template versions and configuration:

```sql
CREATE TABLE public.email_template_metadata (
  id uuid PRIMARY KEY,
  template_name text NOT NULL UNIQUE,
  template_file_path text NOT NULL,
  subject_line text NOT NULL,
  description text,
  variables_used text[],
  last_updated_in_dashboard timestamptz,
  version text,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### 3. Helper Functions

**get_email_auth_configuration()**: Retrieves auth URL configuration (admin-only)

```sql
SELECT * FROM public.get_email_auth_configuration();
```

**get_email_template_details()**: Lists email template metadata (public)

```sql
SELECT * FROM public.get_email_template_details();
```

### Apply the Migration

#### Using Supabase Dashboard

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase/migrations/20251114180322_configure_email_auth_urls.sql`
4. Click **Run**

#### Using Supabase CLI (Local)

```bash
supabase db push
```

#### Using Migration Tool

```bash
node apply-migrations.mjs
```

---

## Authentication Routes

### Complete Route Mapping

| Route | Purpose | Email Template | Redirect After |
|-------|---------|---------------|----------------|
| `/auth/confirm` | Email confirmation | confirm-signup.html | /dashboard |
| `/auth/invite` | User invitation | invite-user.html | /dashboard |
| `/auth/magic-link` | Passwordless sign-in | magic-link.html | /dashboard |
| `/auth/change-email` | Email change confirmation | change-email.html | /profile |
| `/auth/reauthenticate` | Identity verification | reauthentication.html | original-page |
| `/auth/recovery` | Password recovery | reset-password.html | /auth/reset-password |
| `/auth/reset-password` | Password reset form | reset-password.html | /signin |
| `/auth/callback` | OAuth callback | none | /dashboard |
| `/dashboard` | Main dashboard | none | none |
| `/profile` | User profile | none | none |

### Route Configuration in App

All routes are already configured in `src/App.tsx`:

```tsx
<Route path="/auth/confirm" element={<EmailConfirmPage />} />
<Route path="/auth/callback" element={<SignInPage />} />
<Route path="/auth/recovery" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

### Supabase Template Variables

All templates use these Supabase-provided variables:

- `{{ .ConfirmationURL }}` - The action URL with authentication token
- `{{ .Token }}` - Raw token (rarely used, URL is preferred)
- `{{ .TokenHash }}` - Hashed token for verification
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .Email }}` - User's email address

**Important**: Do not modify these variable names. Supabase automatically replaces them.

---

## Testing Email Templates

### Local Testing with Inbucket

1. **Start Local Supabase**:
   ```bash
   supabase start
   ```

2. **Access Inbucket**: Open `http://localhost:54324`

3. **Trigger Auth Flow**:
   - Sign up a new user
   - Request password reset
   - Change email address
   - Request magic link

4. **View Emails**: Check Inbucket inbox for test@example.com

5. **Verify**:
   - HTML renders correctly
   - Links work properly
   - Variables are replaced
   - Mobile responsive

### Production Testing Checklist

- [ ] Sign up confirmation email
- [ ] Password reset email
- [ ] Email change confirmation
- [ ] Magic link email (if enabled)
- [ ] User invitation email (if used)
- [ ] Test in Gmail web
- [ ] Test in Outlook web
- [ ] Test in Apple Mail
- [ ] Test on mobile devices
- [ ] Test in dark mode
- [ ] Verify links redirect correctly
- [ ] Check spam folder placement

### Email Client Compatibility

Templates are tested and compatible with:

- Gmail (web, iOS, Android)
- Outlook (web, 2016+, iOS, Android)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Proton Mail
- Thunderbird

---

## Troubleshooting

### Emails Not Arriving

**Check Spam Folder**:
- Look in spam/junk folders
- Add sender to contacts: `noreply@mail.app.supabase.io`

**Verify Configuration**:
```sql
-- Check auth URL configuration
SELECT * FROM public.get_email_auth_configuration();

-- Check email template metadata
SELECT * FROM public.get_email_template_details();
```

**Check Supabase Logs**:
1. Go to Dashboard → Logs
2. Filter by "auth"
3. Look for email delivery errors

**Custom SMTP Recommended**:

For production with .vip domain, use custom SMTP:
- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- Amazon SES (62,000 emails/month with EC2)

Configure in: Dashboard → Settings → Auth → SMTP Settings

### Links Not Working

**Token Expired**:
- Confirmation links: 24 hours
- Password reset: 1 hour
- Magic links: 1 hour
- Request new link if expired

**Wrong Redirect URL**:
```bash
# Verify redirect URLs are whitelisted
# Dashboard → Authentication → URL Configuration
```

**CORS Issues**:
- Check browser console for CORS errors
- Verify API keys are correct
- Ensure origin is allowed in Supabase

### Templates Not Updating

**Clear Browser Cache**:
```bash
# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Verify Dashboard Save**:
- Ensure "Save" was clicked
- Check for error messages
- Try different browser

**Wait for Propagation**:
- Changes may take 1-2 minutes
- Test with new signup to see changes

### SQL Functions Not Working

**Check Admin Role**:
```sql
-- Verify you have admin role
SELECT * FROM public.user_roles
WHERE user_id = auth.uid();
```

**Grant Admin Role**:
```sql
-- If needed, grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin');
```

---

## Best Practices

### Version Control

1. **Track Template Changes**:
   - Commit email template HTML to git
   - Update version in email_template_metadata table
   - Document changes in migration notes

2. **Update Metadata After Dashboard Changes**:
   ```sql
   UPDATE public.email_template_metadata
   SET last_updated_in_dashboard = now(),
       dashboard_configuration_notes = 'Updated CTA button color'
   WHERE template_name = 'Confirm Signup';
   ```

### Security

1. **Never Include Sensitive Data**: No passwords, API keys, or tokens in emails
2. **Set Appropriate Expiration**: Balance security vs. user experience
3. **Monitor Suspicious Activity**: Track unusual email patterns
4. **Educate Users**: Include phishing warnings in emails

### Deliverability

1. **Use Custom SMTP**: Essential for .vip domain
2. **Maintain Good Sender Reputation**: Monitor bounce rates
3. **Include Plain Text**: Always provide plain text version
4. **Keep Email Size Small**: Under 100KB recommended
5. **Avoid Spam Triggers**: Be careful with promotional language

### Maintenance

1. **Regular Testing**: Test all email flows quarterly
2. **Update Copyright Year**: Change annually in footer
3. **Review Analytics**: Monitor email open and click rates
4. **User Feedback**: Collect feedback on email clarity

---

## Additional Resources

### Supabase Documentation

- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Auth Configuration](https://supabase.com/docs/guides/auth/auth-configuration)
- [Management API Reference](https://supabase.com/docs/reference/api)

### Email Design Resources

- [Really Good Emails](https://reallygoodemails.com/) - Email inspiration
- [Can I Email](https://www.caniemail.com/) - CSS support reference
- [Litmus](https://www.litmus.com/) - Email testing platform

### Project Files

- **Templates**: `supabase/email-templates/*.html`
- **Plain Text**: `supabase/email-templates/plain-text-versions.txt`
- **Config**: `supabase/config.toml`
- **Migration**: `supabase/migrations/20251114180322_configure_email_auth_urls.sql`
- **Implementation Guide**: `supabase/email-templates/IMPLEMENTATION_GUIDE.md`

---

## Summary

While Supabase email templates cannot be directly modified via SQL, this comprehensive setup provides:

1. **config.toml** for local development with automatic template loading
2. **SQL migration** that documents routes and creates helper functions
3. **Three approaches** for production: Dashboard, config.toml, or Management API
4. **Complete documentation** for setup and troubleshooting
5. **Production-ready templates** in `supabase/email-templates/`

For production deployment, use the Supabase Dashboard approach outlined in this guide. The SQL migration provides valuable documentation and helper functions but does not directly control email templates.

---

**Questions or Issues?**

Contact: support@videoremix.vip

**Last Updated**: November 14, 2024
**Version**: 1.0.0
