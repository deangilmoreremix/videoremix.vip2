# Supabase Email Template Configuration Guide

This guide will walk you through configuring professional, branded email templates for your VideoRemix.vip authentication system in Supabase.

## Table of Contents
1. [Accessing Supabase Email Settings](#accessing-supabase-email-settings)
2. [Configuring Site URL and Redirect URLs](#configuring-site-url-and-redirect-urls)
3. [Customizing Email Templates](#customizing-email-templates)
4. [Testing Email Delivery](#testing-email-delivery)
5. [Troubleshooting](#troubleshooting)

---

## Accessing Supabase Email Settings

### Step 1: Log into Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your VideoRemix.vip project from the project list

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click on **Authentication** (the key icon)
2. Click on **Email Templates** in the sub-menu
3. You should see a list of available email templates

---

## Configuring Site URL and Redirect URLs

Before customizing email templates, you need to configure where users will be redirected after clicking email links.

### Step 1: Set Site URL
1. In the Authentication section, click on **URL Configuration**
2. Find the **Site URL** field
3. Enter your application's URL:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://yourproductiondomain.com`
4. Click **Save**

### Step 2: Configure Redirect URLs
1. Scroll down to **Redirect URLs**
2. Add the following URLs (one per line):
   ```
   http://localhost:5173/**
   https://yourproductiondomain.com/**
   http://localhost:5173/reset-password
   https://yourproductiondomain.com/reset-password
   ```
3. The `**` wildcard allows redirects to any path under your domain
4. Click **Save**

---

## Customizing Email Templates

Supabase provides several email templates that you can customize. Here's how to configure each one for VideoRemix.vip.

### 1. Confirm Signup Email

This email is sent when users create a new account.

#### When to Use
- **Email Confirmation Enabled**: Users must verify their email before accessing the dashboard
- **Email Confirmation Disabled**: Users can access immediately but receive a welcome email

#### Customization Steps
1. Go to **Authentication** > **Email Templates**
2. Select **Confirm signup**
3. Replace the default template with the following:

```html
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1a1a1a;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #6366f1;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #4b5563;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VideoRemix.vip</h1>
      <p>Marketing Personalization Platform</p>
    </div>

    <div class="content">
      <h2>Welcome to VideoRemix.vip! 🎉</h2>

      <p>Hi there,</p>

      <p>Thank you for signing up! We're excited to help you create personalized marketing campaigns that drive real results.</p>

      <p>To get started and verify your email address, please click the button below:</p>

      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">
          Confirm Your Email
        </a>
      </div>

      <div class="info-box">
        <p><strong>Note:</strong> This confirmation link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      </div>

      <p>Once confirmed, you'll have access to:</p>
      <ul style="color: #666666; font-size: 16px;">
        <li>37+ marketing personalization tools</li>
        <li>Unlimited audience segmentation</li>
        <li>AI-powered campaign creation</li>
        <li>Multi-channel marketing automation</li>
      </ul>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6366f1; font-size: 14px;">{{ .ConfirmationURL }}</p>
    </div>

    <div class="footer">
      <p>Need help? Contact us at <a href="mailto:support@videoremix.vip">support@videoremix.vip</a></p>
      <p style="margin-top: 15px;">&copy; 2024 VideoRemix.vip. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

4. Click **Save**

---

### 2. Reset Password Email

This email is sent when users request to reset their password.

#### Customization Steps
1. Go to **Authentication** > **Email Templates**
2. Select **Reset password**
3. Replace the default template with:

```html
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1a1a1a;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VideoRemix.vip</h1>
    </div>

    <div class="content">
      <h2>Reset Your Password 🔒</h2>

      <p>Hi there,</p>

      <p>We received a request to reset the password for your VideoRemix.vip account. Click the button below to create a new password:</p>

      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">
          Reset Password
        </a>
      </div>

      <div class="warning-box">
        <p><strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request this, please ignore this email or contact support if you have concerns about your account security.</p>
      </div>

      <p><strong>Security Tips:</strong></p>
      <ul style="color: #666666; font-size: 16px;">
        <li>Never share your password with anyone</li>
        <li>Use a strong password with at least 6 characters</li>
        <li>Consider using a password manager</li>
      </ul>

      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6366f1; font-size: 14px;">{{ .ConfirmationURL }}</p>
    </div>

    <div class="footer">
      <p>Need help? Contact us at <a href="mailto:support@videoremix.vip" style="color: #6366f1;">support@videoremix.vip</a></p>
      <p style="margin-top: 15px;">&copy; 2024 VideoRemix.vip. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

4. Click **Save**

---

### 3. Magic Link Email (Optional)

If you want to enable passwordless authentication:

1. Go to **Authentication** > **Email Templates**
2. Select **Magic Link**
3. Customize with similar branding as above
4. Replace `{{ .ConfirmationURL }}` placeholders with your magic link

---

### 4. Email Change Confirmation

This email is sent when users change their email address:

1. Go to **Authentication** > **Email Templates**
2. Select **Change Email Address**
3. Customize with VideoRemix.vip branding
4. Include security messaging about the email change

---

## Testing Email Delivery

### Step 1: Test in Development
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173/signup`
3. Create a test account with a real email address you have access to
4. Check your inbox (and spam folder) for the confirmation email
5. Click the confirmation link and verify it redirects to the correct page

### Step 2: Test Password Reset
1. Navigate to `http://localhost:5173/forgot-password`
2. Enter your test email address
3. Check your inbox for the password reset email
4. Click the reset link
5. Verify you're redirected to `/reset-password` with the correct token
6. Set a new password and verify successful reset

### Step 3: Test Multiple Email Clients
Test your email templates in various email clients to ensure proper rendering:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- ProtonMail

### Step 4: Check Spam Scores
Use tools to check if your emails might land in spam:
- [Mail-Tester](https://www.mail-tester.com/)
- [Litmus Spam Testing](https://www.litmus.com/spam-testing/)

---

## Troubleshooting

### Emails Not Being Received

**Check Supabase Email Settings:**
1. Go to **Authentication** > **Settings**
2. Verify **Enable Email Confirmations** is set according to your needs
3. Check **Email Rate Limits** - you may be rate-limited during testing

**Check Your Email Provider:**
- Look in spam/junk folders
- Add `noreply@mail.app.supabase.io` to your contacts
- Check email forwarding rules

**Verify Site URL Configuration:**
- Ensure Site URL matches your actual application URL
- Check Redirect URLs include the correct paths
- Verify there are no typos

### Email Links Not Working

**Token Expired:**
- Confirmation links expire after 24 hours
- Password reset links expire after 1 hour
- Request a new link if expired

**Wrong Redirect URL:**
1. Check **Authentication** > **URL Configuration**
2. Ensure redirect URLs include your reset password page
3. Add any missing URLs and save

**CORS Issues:**
- Verify your application's origin is allowed in Supabase
- Check browser console for CORS errors

### Emails Look Broken

**HTML Rendering Issues:**
- Test in multiple email clients
- Use inline CSS (already done in templates above)
- Avoid advanced CSS features not supported by email clients
- Use tables for complex layouts

**Images Not Loading:**
- Use absolute URLs for images (e.g., `https://yourdomain.com/logo.png`)
- Host images on a reliable CDN
- Provide alt text for accessibility

### Rate Limiting

Supabase has rate limits on emails to prevent abuse:

**Development:**
- Limited to a few emails per hour for free tier
- Use test email addresses sparingly

**Production:**
- Upgrade to a paid plan for higher limits
- Monitor usage in Supabase dashboard
- Consider implementing your own SMTP server for higher volume

---

## Custom SMTP Configuration (Optional)

For production, you may want to use your own SMTP server for better deliverability and higher limits.

### Step 1: Access SMTP Settings
1. Go to **Project Settings** > **Auth**
2. Scroll down to **SMTP Settings**
3. Click **Enable Custom SMTP**

### Step 2: Configure SMTP
Enter your SMTP server details:
- **Host**: Your SMTP server hostname
- **Port**: Usually 587 (TLS) or 465 (SSL)
- **Username**: Your SMTP username
- **Password**: Your SMTP password
- **Sender Email**: The email address to send from
- **Sender Name**: VideoRemix.vip

Popular SMTP providers:
- **SendGrid**: Great for high volume
- **Mailgun**: Developer-friendly
- **Amazon SES**: Cost-effective
- **Postmark**: High deliverability

### Step 3: Test SMTP Configuration
1. Save your SMTP settings
2. Send a test email through the Supabase dashboard
3. Verify delivery and check email headers

---

## Email Verification Settings

### Require Email Confirmation

To require users to confirm their email before accessing the dashboard:

1. Go to **Authentication** > **Settings**
2. Find **Email Confirmations**
3. Toggle **Enable email confirmations** to ON
4. Users must click the confirmation link before they can sign in

### Allow Immediate Access

To let users access immediately without email verification:

1. Go to **Authentication** > **Settings**
2. Find **Email Confirmations**
3. Toggle **Enable email confirmations** to OFF
4. Users can sign in immediately after signup
5. They'll still receive a welcome email

---

## Best Practices

### Email Content
- Keep subject lines clear and concise
- Use action-oriented button text
- Include security information
- Provide alternative text link if button doesn't work
- Add contact information for support

### Branding
- Use consistent colors matching your application
- Include your logo (consider hosting it externally)
- Maintain consistent voice and tone
- Mobile-responsive design

### Security
- Never include sensitive information in emails
- Set appropriate expiration times for links
- Include security tips in password reset emails
- Warn users about phishing attempts

### Deliverability
- Use a recognizable sender name
- Keep email size under 100KB
- Avoid spam trigger words
- Test thoroughly before production
- Monitor bounce and spam rates

---

## Next Steps

After configuring your email templates:

1. **Test thoroughly** in development with real email addresses
2. **Review templates** on mobile devices
3. **Update production URLs** before deploying
4. **Monitor email delivery** rates in Supabase dashboard
5. **Set up custom SMTP** for production if needed
6. **Create support documentation** for users about email-related issues

---

## Support

If you encounter issues:
- Check [Supabase Documentation](https://supabase.com/docs/guides/auth/auth-email)
- Visit [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- Contact Supabase support through their dashboard
- Review application logs for authentication errors

---

**Last Updated**: October 2024
**Version**: 1.0.0
