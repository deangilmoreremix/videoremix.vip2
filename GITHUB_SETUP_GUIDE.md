# GitHub Repository Setup Guide

This guide will help you connect your VideoRemix project to GitHub and set up automatic deployments with Netlify.

## Step 1: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Fill in the repository details:
   - **Repository name**: `videoremix` (or your preferred name)
   - **Description**: "AI-Powered Video Tools Platform with admin system and multi-app architecture"
   - **Visibility**: Choose Private or Public (recommend Private for production)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **Create repository**

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create videoremix --private --source=. --remote=origin
```

## Step 2: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Follow these steps:

1. Copy the repository URL (should look like: `https://github.com/YOUR_USERNAME/videoremix.git`)

2. Add the remote repository:
```bash
git remote add origin https://github.com/YOUR_USERNAME/videoremix.git
```

3. Push your code to GitHub:
```bash
git push -u origin main
```

4. Verify the push was successful by visiting your repository on GitHub

## Step 3: Connect Netlify to GitHub

### 3.1: Access Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Find your existing VideoRemix site (currently deployed at videoremix.vip)
3. Click on the site to open settings

### 3.2: Link GitHub Repository

1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Under **Build settings**, click **Link repository** or **Configure continuous deployment**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub account (if not already done)
5. Select your **videoremix** repository
6. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **Save** or **Deploy site**

## Step 4: Configure Environment Variables in Netlify

**CRITICAL**: Environment variables must be set in Netlify for the build to work correctly.

1. In Netlify Dashboard, go to **Site settings** → **Environment variables**
2. Click **Add a variable** or **Add environment variables**
3. Add the following variables:

### Required Supabase Variables

```
VITE_SUPABASE_URL
Value: https://hppbanjiifninnbioxyp.supabase.co

VITE_SUPABASE_ANON_KEY
Value: [Your Supabase anon key - from .env file]
```

### Optional Variables (for full functionality)

```
SUPABASE_SERVICE_ROLE_KEY
Value: [Your service role key - keep secret!]

STRIPE_WEBHOOK_SECRET
Value: [Your Stripe webhook secret]

VITE_STRIPE_PUBLISHABLE_KEY
Value: [Your Stripe publishable key]

PAYPAL_WEBHOOK_ID
Value: [Your PayPal webhook ID]

OPENAI_API_KEY
Value: [Your OpenAI API key]

GEMINI_API_KEY
Value: [Your Gemini API key]
```

**Important**:
- Only frontend variables need the `VITE_` prefix
- Service role keys should NEVER be exposed to frontend (no `VITE_` prefix)
- Click **Save** after adding all variables

## Step 5: Custom Domain Configuration

Your site is configured to use **videoremix.vip** as the custom domain.

### 5.1: Verify Domain in Netlify

1. Go to **Domain settings** → **Custom domains**
2. Your domain `videoremix.vip` should be listed
3. Check the status:
   - ✅ **Netlify DNS** - Domain is fully managed by Netlify
   - ✅ **External DNS** - Domain is managed elsewhere but pointing to Netlify
   - ⚠️ **Awaiting External DNS** - DNS records need to be updated

### 5.2: If DNS Needs Configuration

If your domain shows "Awaiting External DNS", update your DNS records:

#### If Using External DNS Provider (like Namecheap, GoDaddy, Cloudflare):

Add these DNS records:

**For Apex Domain (videoremix.vip):**
```
Type: A
Name: @ (or leave blank)
Value: 75.2.60.5
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: [your-site-name].netlify.app
```

**For App Subdomains (ai-personalizedcontent, ai-funnelcraft, etc.):**
```
Type: CNAME
Name: ai-personalizedcontent
Value: [your-site-name].netlify.app

Type: CNAME
Name: ai-funnelcraft
Value: [your-site-name].netlify.app

[Repeat for each subdomain]
```

#### If Using Netlify DNS:

1. In Netlify, go to **Domain settings** → **DNS**
2. Click **Set up Netlify DNS**
3. Follow the wizard to transfer DNS management to Netlify
4. Update your domain registrar's nameservers to Netlify's nameservers

### 5.3: Enable HTTPS

1. In **Domain settings** → **HTTPS**
2. Netlify should automatically provision an SSL certificate
3. Wait 5-10 minutes for certificate issuance
4. Verify HTTPS is enabled (green lock icon)

## Step 6: Configure Subdomain Redirects

Your app uses multiple subdomains (ai-personalizedcontent.videoremix.vip, etc.).

### Option A: Using Netlify DNS (Recommended)

If using Netlify DNS, add CNAME records for all subdomains pointing to your Netlify site.

### Option B: Configure Subdomain Routing in netlify.toml

The `netlify.toml` file already includes redirect rules. Verify this section exists:

```toml
[[redirects]]
  from = "https://videoremix.netlify.app/*"
  to = "https://videoremix.vip/:splat"
  status = 301
  force = true
```

## Step 7: Test Deployment

### 7.1: Trigger a Deployment

1. Make a small change to your code (e.g., update README.md)
2. Commit and push:
```bash
git add .
git commit -m "Test deployment"
git push origin main
```

3. Watch the deployment in Netlify Dashboard → **Deploys**
4. Wait for "Site is live" notification

### 7.2: Verify Deployment

Test these URLs:
- ✅ https://videoremix.vip - Main landing page
- ✅ https://videoremix.vip/admin/login - Admin login
- ✅ https://videoremix.vip/dashboard - User dashboard
- ✅ https://ai-personalizedcontent.videoremix.vip - App subdomain

### 7.3: Check for Errors

1. Open browser DevTools (F12) → Console
2. Look for any errors related to:
   - Supabase credentials
   - CORS issues
   - 404 errors
3. If errors appear, check environment variables in Netlify

## Step 8: Set Up Deploy Previews

Deploy previews allow you to test changes before merging to main.

1. In Netlify, go to **Site settings** → **Build & deploy** → **Deploy contexts**
2. Enable **Deploy previews** for all pull requests
3. This creates a unique URL for each PR to test changes

## Troubleshooting

### Issue: Build Fails

**Solution:**
- Check build logs in Netlify Dashboard → **Deploys** → Click on failed deploy
- Common issues:
  - Missing dependencies: Run `npm install` locally first
  - TypeScript errors: Run `npm run build` locally to verify
  - Environment variables not set

### Issue: Site Loads But Features Don't Work

**Solution:**
- Check browser console for JavaScript errors
- Verify environment variables are set correctly in Netlify
- Trigger a new build: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Issue: Custom Domain Not Working

**Solution:**
- Verify DNS records are correct and propagated (use [DNS Checker](https://dnschecker.org))
- DNS propagation can take 24-48 hours
- Check SSL certificate is issued in Netlify **Domain settings** → **HTTPS**

### Issue: Admin Page Blank

**Solution:**
- This is usually caused by missing environment variables
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Netlify
- Trigger a new deployment after setting variables
- Clear browser cache and test in incognito mode

## Repository Best Practices

### Branch Protection

1. Go to GitHub repository → **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

### Commit Conventions

Use clear commit messages:
```
feat: Add new CSV import feature
fix: Resolve admin authentication issue
docs: Update deployment guide
refactor: Simplify user access logic
```

### .env File Security

**NEVER** commit the `.env` file to GitHub!

- The `.gitignore` file already excludes it
- Always use `.env.example` as a template for others
- Store production secrets securely in Netlify dashboard

## Next Steps

1. ✅ Repository connected to GitHub
2. ✅ Automatic deployments configured
3. ✅ Environment variables set
4. ✅ Custom domain configured
5. ✅ SSL certificate enabled

Your VideoRemix platform is now fully integrated with GitHub and Netlify!

## Support Resources

- [Netlify Documentation](https://docs.netlify.com)
- [GitHub Documentation](https://docs.github.com)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: October 31, 2025
