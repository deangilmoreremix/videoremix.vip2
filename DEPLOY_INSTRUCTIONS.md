# Admin Functions Deployment Instructions

## Current Situation

The admin edge functions cannot be deployed automatically from this environment because:
- Supabase CLI requires interactive login (`supabase login`)
- Management API requires a personal access token
- Both require user authentication that can't be automated

## Deployment Options

### Option 1: Deploy via Supabase Dashboard (Recommended - Easiest)

This is the fastest way to get your admin panel working:

1. **Go to Supabase Functions Dashboard:**
   https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions

2. **Deploy each function by clicking "New Function" or selecting existing ones:**

   For each function below, copy the code from the local file and paste into the dashboard:

   #### admin-dashboard-stats
   - File: `supabase/functions/admin-dashboard-stats/index.ts`
   - Click: New Function → Name: `admin-dashboard-stats` → Paste code → Deploy

   #### admin-apps
   - File: `supabase/functions/admin-apps/index.ts`
   - Click: New Function → Name: `admin-apps` → Paste code → Deploy

   #### admin-users
   - File: `supabase/functions/admin-users/index.ts`
   - Click: New Function → Name: `admin-users` → Paste code → Deploy

   #### admin-purchases
   - File: `supabase/functions/admin-purchases/index.ts`
   - Click: New Function → Name: `admin-purchases` → Paste code → Deploy

   #### admin-features
   - File: `supabase/functions/admin-features/index.ts`
   - Click: New Function → Name: `admin-features` → Paste code → Deploy

   #### admin-subscriptions
   - File: `supabase/functions/admin-subscriptions/index.ts`
   - Click: New Function → Name: `admin-subscriptions` → Paste code → Deploy

   #### admin-products
   - File: `supabase/functions/admin-products/index.ts`
   - Click: New Function → Name: `admin-products` → Paste code → Deploy

   #### admin-videos
   - File: `supabase/functions/admin-videos/index.ts`
   - Click: New Function → Name: `admin-videos` → Paste code → Deploy

3. **Verify JWT is enabled** for each function (should be checked by default)

### Option 2: Deploy via Local CLI (On Your Machine)

If you have the project cloned locally:

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
npx supabase login

# 3. Link your project
npx supabase link --project-ref gadedbrnqzpfqtsdfzcg

# 4. Deploy all functions
npx supabase functions deploy admin-dashboard-stats
npx supabase functions deploy admin-apps
npx supabase functions deploy admin-users
npx supabase functions deploy admin-purchases
npx supabase functions deploy admin-features
npx supabase functions deploy admin-subscriptions
npx supabase functions deploy admin-products
npx supabase functions deploy admin-videos
```

### Option 3: Use the Deployment Script

Run this on your local machine (not in this environment):

```bash
./deploy-admin-functions.sh
```

When prompted, type `y` and press Enter.

## After Deployment

1. **Test the deployment:**
   Go to `/admin/login` and sign in with:
   - Email: `dev@videoremix.vip`
   - Password: `Admin123!@#`

2. **Verify all tabs work:**
   - Dashboard (shows real stats)
   - Apps Management
   - Features Management
   - Users Management
   - Purchases Management
   - Import Purchases
   - Subscriptions
   - Videos

3. **Check function logs:**
   https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions

## Troubleshooting

### Functions still showing 404

- **Cause:** Functions not deployed yet
- **Fix:** Use Option 1 (Dashboard) to deploy manually

### "Authorization required" error

- **Cause:** Not logged in or token expired
- **Fix:** Log out and log back in at `/admin/login`

### "Admin access required" error

- **Cause:** User doesn't have admin role
- **Fix:** Run the grant-admin-access script or check user_roles table

### Function deployment fails

- **Cause:** Syntax errors or missing dependencies
- **Fix:** Check function logs in Supabase dashboard for error details

## Function URLs After Deployment

Once deployed, functions will be available at:

```
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-apps
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-users
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-purchases
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-features
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-subscriptions
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-products
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-videos
```

## Quick Test

After deployment, test with curl:

```bash
# Get your admin token from browser console after logging in
TOKEN="your_admin_token_here"

# Test dashboard stats
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats" \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"success": true, "data": {...}}
```

## Summary

**What's ready:**
✅ All 8 edge functions written
✅ Frontend components configured
✅ Admin user created
✅ Database tables set up
✅ Project builds successfully

**What's needed:**
⏳ Deploy functions (use Option 1 - Dashboard method recommended)

The deployment through the Supabase Dashboard (Option 1) is the fastest and most reliable method from where you are now.
