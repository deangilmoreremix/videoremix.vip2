# Fix: Admin Page Blank - Environment Variables Not Loading

## Problem Identified

The browser console shows:
```
Supabase credentials are not set. Please check your environment variables.
Uncaught Error: supabaseKey is required.
```

**Root Cause:** The Netlify deployment was built BEFORE environment variables were set, so they're not included in the JavaScript bundle.

---

## Critical Issue: Mismatched Supabase Projects

Your `.env` file has credentials from TWO different Supabase projects:

```
VITE_SUPABASE_URL=https://hppbanjiifninnbioxyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (from hppbanjiifninnbioxyp)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (from mohueeozazjxyzmiqdbs) ⚠️ WRONG PROJECT!
```

The anon key and service role key are from **different Supabase projects**. This will cause authentication and admin functions to fail.

---

## Solution: Fix Environment Variables & Redeploy

### Step 1: Determine Which Supabase Project to Use

You need to decide which Supabase project is the correct one:

**Option A: Use `hppbanjiifninnbioxyp.supabase.co`**
- This is what your frontend variables point to
- You'll need to get the SERVICE_ROLE_KEY from this project

**Option B: Use `mohueeozazjxyzmiqdbs.supabase.co`**
- This is what your SERVICE_ROLE_KEY points to
- You'll need to update the URL and ANON_KEY to match this project

**How to decide:**
1. Go to https://supabase.com/dashboard
2. Check which project has your production data
3. Check which project has the admin users we verified earlier
4. Use that project's credentials for ALL variables

### Step 2: Get the Correct Credentials

Once you've determined the correct project:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy these values:

```
Project URL: https://[your-project-ref].supabase.co
anon/public key: eyJhbGci...
service_role key: eyJhbGci... (⚠️ keep secret!)
```

### Step 3: Update Netlify Environment Variables

1. Go to Netlify Dashboard: https://app.netlify.com
2. Select your `videoremix.vip` site
3. Go to **Site settings** → **Environment variables**
4. Update/add these variables with the MATCHING credentials from ONE Supabase project:

```
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

**IMPORTANT:** Both values must be from the SAME Supabase project!

### Step 4: Trigger a New Deployment

After updating the environment variables:

1. In Netlify Dashboard, go to **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for the deployment to complete (usually 2-5 minutes)
4. You'll see a success message when done

### Step 5: Test the Admin Page

1. **Clear your browser cache completely**:
   - Chrome/Edge: Press `Ctrl+Shift+Delete` → Clear "Cached images and files"
   - OR use Incognito/Private mode

2. Visit: `https://videoremix.vip/admin/login`

3. Login with:
   - Email: `dean@videoremix.vip`
   - Password: `Admin123!VideoRemix`

4. After successful login, visit: `https://videoremix.vip/admin`

5. The admin dashboard should now load!

---

## Why This Happens

Vite (the build tool) **embeds environment variables at BUILD TIME**. This means:

- ✅ Variables set BEFORE build → Included in JavaScript
- ❌ Variables set AFTER build → NOT included in JavaScript

**The fix:** Trigger a new build AFTER setting environment variables in Netlify.

---

## Verification Checklist

After redeploying, verify:

- [ ] Open browser DevTools (F12) → Console tab
- [ ] NO error: "Supabase credentials are not set"
- [ ] You see: "AdminContext - Verifying auth..."
- [ ] Login page at `/admin/login` loads correctly
- [ ] Can login successfully
- [ ] Admin dashboard at `/admin` loads (not blank!)
- [ ] Can see dashboard stats and navigate between tabs

---

## If It Still Doesn't Work

### Check Console Logs

After the new deployment, check the browser console again:

**If you see:**
```
AdminContext - Verifying auth...
AdminContext - No session found
```
→ **Solution:** You need to login at `/admin/login` first

**If you see:**
```
AdminContext - Session found for user: dean@videoremix.vip
AdminContext - Admin user verified
```
→ **Great!** Authentication is working

**If you still see:**
```
Supabase credentials are not set
```
→ **The deployment didn't pick up the variables:**
1. Double-check variables are saved in Netlify
2. Make sure they start with `VITE_` prefix
3. Try deploying again with "Clear cache and deploy site"

### Common Mistakes

1. **Variables not saved** - Click "Save" after entering variables in Netlify
2. **Wrong variable names** - Must be exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. **Didn't redeploy** - Variables only apply to NEW builds
4. **Browser cache** - Old JavaScript still loaded, use incognito mode
5. **Mismatched credentials** - URL and key must be from the SAME Supabase project

---

## Quick Test: Which Supabase Project Has Your Data?

To find out which Supabase project has your admin users, you can test both:

### Test Project 1: hppbanjiifninnbioxyp

1. Go to: https://supabase.com/dashboard/project/hppbanjiifninnbioxyp
2. Go to **Table Editor** → Find `user_roles` table
3. Check if you see the admin users (dean@videoremix.vip, etc.)

### Test Project 2: mohueeozazjxyzmiqdbs

1. Go to: https://supabase.com/dashboard/project/mohueeozazjxyzmiqdbs
2. Go to **Table Editor** → Find `user_roles` table
3. Check if you see the admin users

**Use the project that has the admin users!**

---

## Summary

**The fix is simple:**

1. ✅ Choose ONE Supabase project (the one with your admin users)
2. ✅ Update Netlify environment variables with credentials from that project
3. ✅ Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY match the same project
4. ✅ Trigger a new deployment with "Clear cache and deploy site"
5. ✅ Clear browser cache and test in incognito mode
6. ✅ Login at `/admin/login` first, then visit `/admin`

After these steps, the admin dashboard should work perfectly!

---

**Created:** October 28, 2025
**Issue:** Environment variables not embedded in build
**Solution:** Update Netlify variables and redeploy with cache clear
