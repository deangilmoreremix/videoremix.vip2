# Environment Variables Audit Report

## Current Status

This document provides an audit of the environment variables in your VideoRemix project and identifies critical issues that need to be resolved.

---

## Critical Issue Found: Mismatched Supabase Projects

### The Problem

Your `.env` file currently contains credentials from **TWO DIFFERENT** Supabase projects:

```
VITE_SUPABASE_URL=https://hppbanjiifninnbioxyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (from project: hppbanjiifninnbioxyp)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (from project: mohueeozazjxyzmiqdbs) ⚠️ DIFFERENT!
```

### Why This is a Problem

1. **Authentication Failures**: Frontend uses one project, backend uses another
2. **Data Inconsistency**: User data may be split across two databases
3. **Admin Functions Fail**: Edge functions can't access the correct database
4. **Security Risk**: Mismatched keys can expose unauthorized access

---

## Action Required: Consolidate to One Supabase Project

You must choose which Supabase project to use for production.

### Step 1: Determine the Correct Project

#### Option A: Project hppbanjiifninnbioxyp

**Check this project if:**
- Your frontend is currently working
- Users can log in successfully
- You see user data in this project's dashboard

**To verify:**
1. Go to: https://supabase.com/dashboard/project/hppbanjiifninnbioxyp
2. Check **Table Editor** → `user_roles` table
3. Look for admin users (dean@videoremix.vip, etc.)
4. Check **Authentication** → Users list

#### Option B: Project mohueeozazjxyzmiqdbs

**Check this project if:**
- Your service role key is from here
- Edge functions are configured here
- Database migrations were applied here

**To verify:**
1. Go to: https://supabase.com/dashboard/project/mohueeozazjxyzmiqdbs
2. Check **Table Editor** → `user_roles` table
3. Look for admin users and production data
4. Check **Authentication** → Users list

### Step 2: Get ALL Credentials from the Correct Project

Once you've identified the correct project:

1. Open the Supabase project dashboard
2. Go to **Project Settings** → **API**
3. Copy these values:

```
Project URL: https://[your-project-ref].supabase.co
anon/public key: eyJhbGci...
service_role key: eyJhbGci... (⚠️ SENSITIVE - NEVER expose to frontend)
```

### Step 3: Update Local .env File

Update your local `.env` file with matching credentials:

```bash
# Supabase Configuration (ALL from same project!)
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-from-same-project]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-from-same-project]

# Stripe Configuration
STRIPE_WEBHOOK_SECRET=whsec_kc29qAYLARBDKi2S6PzLbNYWbMLNoMCV
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51OyF7gDdmNBqrzmWn503WQHDLemPtD8MLID66D4cB89eA08s1O2BdgyPNVAH5txYt3SY9YnNczbMBnkkTkPCDkWz000doOUclm

# PayPal Configuration
PAYPAL_WEBHOOK_ID=2PJ04027LS072544L

# AI API Keys
OPENAI_API_KEY=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
GEMINI_API_KEY=AIzaSyCUcTq2wJAGuUvh06qy_QfA8YfCuaS93bM
```

### Step 4: Update Netlify Environment Variables

**CRITICAL**: Netlify needs these variables for production builds.

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your VideoRemix site
3. Go to **Site settings** → **Environment variables**
4. Update/add these variables:

```
VITE_SUPABASE_URL
Value: https://[your-correct-project-ref].supabase.co

VITE_SUPABASE_ANON_KEY
Value: [anon-key-from-correct-project]

SUPABASE_SERVICE_ROLE_KEY
Value: [service-role-key-from-correct-project]
```

5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Environment Variables Reference

### Frontend Variables (VITE_ prefix)

These are embedded in the JavaScript bundle and visible to users:

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Public anon key for client auth |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⚠️ Optional | Stripe public key for payments |

### Backend Variables (No prefix)

These are server-side only and NOT exposed to frontend:

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Admin operations in Edge Functions |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Optional | Verify Stripe webhook signatures |
| `PAYPAL_WEBHOOK_ID` | ⚠️ Optional | Verify PayPal webhooks |
| `OPENAI_API_KEY` | ⚠️ Optional | OpenAI API access |
| `GEMINI_API_KEY` | ⚠️ Optional | Google Gemini API access |

---

## Verification Checklist

After updating environment variables:

### Local Development
- [ ] Update `.env` file with matching Supabase credentials
- [ ] Run `npm run dev` and verify no console errors
- [ ] Test login at `http://localhost:5173/admin/login`
- [ ] Verify admin dashboard loads correctly

### Production (Netlify)
- [ ] Set all environment variables in Netlify dashboard
- [ ] Trigger new deployment with cache clear
- [ ] Test `https://videoremix.vip/admin/login`
- [ ] Verify admin dashboard at `https://videoremix.vip/admin`
- [ ] Check browser console for errors

### Database
- [ ] Confirm user_roles table exists in production project
- [ ] Verify admin users have correct roles
- [ ] Test Edge Functions are working
- [ ] Verify RLS policies are active

---

## Common Mistakes to Avoid

### ❌ Don't Do This:
```bash
# Mixing projects - WRONG!
VITE_SUPABASE_URL=https://project-a.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[key-from-project-b]
```

### ✅ Do This:
```bash
# All from same project - CORRECT!
VITE_SUPABASE_URL=https://project-a.supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key-from-project-a]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-from-project-a]
```

---

## Security Best Practices

### For `.env` File:
- ✅ Already in `.gitignore` (never commit to Git)
- ✅ Keep backups in secure password manager
- ✅ Use different keys for development/production

### For Netlify:
- ✅ Use environment variables (not hardcoded)
- ✅ Review variable access regularly
- ✅ Rotate keys if compromised

### For Service Role Key:
- ⚠️ NEVER expose in frontend code
- ⚠️ NEVER commit to Git
- ⚠️ NEVER log in console
- ⚠️ Only use in Edge Functions

---

## Testing After Changes

### 1. Test Authentication
```bash
# Local development
npm run dev
# Visit: http://localhost:5173/admin/login
# Login with: dean@videoremix.vip / Admin123!VideoRemix
```

### 2. Test Edge Functions
```bash
# Check function logs in Supabase Dashboard
# Functions → [function-name] → Logs
# Verify no authentication errors
```

### 3. Test Production
```bash
# Visit: https://videoremix.vip/admin/login
# Login with admin credentials
# Check browser console (F12) for errors
```

---

## Next Steps

1. ✅ Identify correct Supabase project
2. ✅ Get all credentials from that project
3. ✅ Update local `.env` file
4. ✅ Update Netlify environment variables
5. ✅ Trigger new deployment
6. ✅ Test authentication and admin access
7. ✅ Verify Edge Functions work correctly

---

## Support

If you need help determining which project to use:

1. Check which project has your production users
2. Check which project has admin users configured
3. Check which project has recent database activity
4. Use that project for ALL credentials

**Remember**: Consistency is key. All credentials MUST be from the same Supabase project!

---

**Created**: October 31, 2025
**Last Updated**: October 31, 2025
**Status**: ⚠️ ACTION REQUIRED
