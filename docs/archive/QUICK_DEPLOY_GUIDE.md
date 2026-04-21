# Quick Deploy Guide - Fix Blank Admin Page

## The Problem

Your browser console shows:
```
Supabase credentials are not set. Please check your environment variables.
Uncaught Error: supabaseKey is required.
```

**Root Cause:** The currently deployed site on Netlify was built BEFORE you set the environment variables. Even though the variables are now set in Netlify, the old build doesn't have them.

---

## The Solution (2 minutes)

### Step 1: Trigger New Deployment in Netlify

1. Go to: https://app.netlify.com
2. Select your **videoremix.vip** site
3. Click on **Deploys** tab
4. Click the **Trigger deploy** button (top right)
5. Select **"Clear cache and deploy site"**
6. Wait 2-3 minutes for build to complete

### Step 2: Clear Browser Cache

After deployment finishes:

**Option A: Hard Refresh**
- Windows/Linux: Press `Ctrl + Shift + R`
- Mac: Press `Cmd + Shift + R`

**Option B: Use Incognito Mode** (Recommended)
- Chrome/Edge: `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
- Firefox: `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)

### Step 3: Test Admin Login

1. In your fresh browser (incognito), go to:
   ```
   https://videoremix.vip/admin/login
   ```

2. Login with:
   - Email: `dean@videoremix.vip`
   - Password: `Admin123!VideoRemix`

3. After successful login, you'll be redirected to:
   ```
   https://videoremix.vip/admin
   ```

4. Admin dashboard should now load completely!

---

## Why This Happens

**Vite Environment Variables:**
- Vite (your build tool) embeds environment variables INTO the JavaScript at BUILD TIME
- Variables set AFTER a build are NOT included in that build's JavaScript
- You must rebuild for the variables to be embedded

**Timeline:**
1. Build created without env vars → JavaScript has empty strings
2. You set env vars in Netlify
3. Site still serves old build (with empty strings)
4. Trigger new build → Env vars embedded in new build
5. Site now serves new build (with correct values)

---

## That's It!

After triggering the new deployment and clearing your browser cache, the admin dashboard should work perfectly.

**Time Required:** 2 minutes
