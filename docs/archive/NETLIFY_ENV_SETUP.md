# Netlify Environment Variables Setup Guide

## Problem

The browser console shows:
```
Supabase credentials are not set
```

Even though you've set the variables in Netlify, they're not being picked up by the build.

---

## Solution: Verify Netlify Environment Variables

### Step 1: Check Variable Names (EXACT match required)

1. Go to: https://app.netlify.com
2. Select your **videoremix.vip** site
3. Go to: **Site configuration** → **Environment variables**

The variable names must be EXACTLY (case-sensitive):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Common mistakes:**
- ❌ `SUPABASE_URL` (missing `VITE_` prefix)
- ❌ `Vite_Supabase_Url` (wrong capitalization)
- ❌ `VITE_SUPABASE_KEY` (should be `ANON_KEY`)
- ✅ `VITE_SUPABASE_URL` (correct!)
- ✅ `VITE_SUPABASE_ANON_KEY` (correct!)

### Step 2: Check Variable Values

**For VITE_SUPABASE_URL:**
- Should start with `https://`
- Should end with `.supabase.co`
- Should look like: `https://mohueeozazjxyzmikdbs.supabase.co`
- Should NOT have quotes around it
- Should NOT have spaces

**For VITE_SUPABASE_ANON_KEY:**
- Should start with `eyJ`
- Should be about 200+ characters long
- Should NOT have quotes around it
- Should NOT have spaces
- Should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...`

### Step 3: Check Variable Scopes

In Netlify, each variable has scopes (checkboxes):
- ✅ **Production** (must be checked)
- ✅ **Deploy Previews** (optional)
- ✅ **Branch deploys** (optional)

**IMPORTANT:** At minimum, "Production" must be checked!

### Step 4: How to Set Variables in Netlify

If variables are missing or incorrect:

1. In Netlify Dashboard → Site configuration → Environment variables
2. Click **Add a variable** or **Edit** on existing variable
3. Enter variable name: `VITE_SUPABASE_URL`
4. Enter variable value: `https://mohueeozazjxyzmikdbs.supabase.co`
5. Select scopes: Check **Production**
6. Click **Save**
7. Repeat for `VITE_SUPABASE_ANON_KEY`

### Step 5: Trigger New Deployment

After setting variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete
4. Check the build logs for any errors

---

## Verify Variables Are Working

After the new deployment completes:

1. Open your site in an **incognito/private window**
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for this log:
   ```
   Environment check: {
     hasUrl: true,
     hasKey: true,
     urlValue: "https://hppbanjiifninnbioxyp...",
     keyLength: 209,
     allEnvVars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]
   }
   ```

**If you see:**
- `hasUrl: false` → Variable `VITE_SUPABASE_URL` is not set or has wrong name
- `hasKey: false` → Variable `VITE_SUPABASE_ANON_KEY` is not set or has wrong name
- `allEnvVars: []` → No VITE_ variables are being passed to build
- `hasUrl: true, hasKey: true` → ✅ Variables are working!

---

## Common Issues

### Issue 1: Variables not in build logs

**Check build logs:**
1. Go to Deploys → Click latest deploy
2. Look through the logs
3. You should NOT see the actual variable values (they're hidden for security)
4. But you should see a successful build

**If build fails with "command not found" or similar:**
- Variables are fine, but there's a build configuration issue

### Issue 2: Variables have quotes

**Wrong:**
```
VITE_SUPABASE_URL = "https://mohueeozazjxyzmikdbs.supabase.co"
```

**Correct:**
```
VITE_SUPABASE_URL = https://mohueeozazjxyzmikdbs.supabase.co
```

Netlify UI should NOT have quotes around values. Enter values directly without quotes.

### Issue 3: Copied from .env file with format

If you copied from `.env` file, make sure you didn't copy the entire line:

**Wrong (copied from .env):**
```
VITE_SUPABASE_URL=https://...
```

**Correct (in Netlify UI):**
- Key: `VITE_SUPABASE_URL`
- Value: `https://...`

### Issue 4: Variables set but not deployed

Remember: Setting variables doesn't automatically redeploy!

**You must:**
1. Set variables in Netlify UI
2. **Trigger a new deployment**
3. Wait for deployment to complete
4. Then test the site

---

## Your Correct Values

Based on your `.env` file, use these values in Netlify:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://mohueeozazjxyzmikdbs.supabase.co`
- Scopes: ✅ Production

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaHVlZW96YXpqeHl6bWlrZGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODAyNTQsImV4cCI6MjA3NTk1NjI1NH0.Vvjn_lrscvltl-EGLGWFvq_SKZtHClcjMCjE_I4JS0I`
- Scopes: ✅ Production

---

## Quick Checklist

Before triggering new deployment:

- [ ] Variable name is exactly `VITE_SUPABASE_URL` (with underscore, not dash)
- [ ] Variable name is exactly `VITE_SUPABASE_ANON_KEY`
- [ ] Both values have NO quotes around them
- [ ] Both values have NO spaces at the beginning or end
- [ ] URL starts with `https://` and ends with `.supabase.co`
- [ ] Anon key starts with `eyJ` and is ~200 characters
- [ ] Production scope is checked for both variables
- [ ] Variables are saved (not just entered)

After checklist complete:
- [ ] Trigger deploy → Clear cache and deploy site
- [ ] Wait for deployment to complete
- [ ] Open site in incognito mode
- [ ] Check console for "Environment check" log
- [ ] Verify hasUrl: true and hasKey: true

---

## Next Steps After Variables Are Set

1. Trigger new deployment with cache clear
2. Check browser console for debug logs
3. Share the console output with me
4. If variables are correct, the admin page will load

The debug logging I added will show us exactly what Netlify is passing to the build.
