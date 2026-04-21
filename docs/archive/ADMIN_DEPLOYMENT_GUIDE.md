# Admin Panel Deployment Guide

## Overview

Your admin panel is fully configured with all edge functions ready to deploy. The functions are NOT yet deployed to Supabase, which is why they appear non-functional.

## Admin Credentials

**Email:** `dev@videoremix.vip`
**Password:** `Admin123!@#`
**Role:** `super_admin`

## Functions to Deploy

All 8 admin edge functions are ready:

1. **admin-dashboard-stats** - Real-time statistics dashboard
2. **admin-apps** - Apps CRUD operations
3. **admin-users** - User management with bulk import
4. **admin-purchases** - Purchase tracking & import
5. **admin-features** - Feature flags management
6. **admin-subscriptions** - Subscription monitoring
7. **admin-products** - Product catalog management
8. **admin-videos** - Video content management

## Deployment Methods

### Method 1: Automated Script (Recommended)

Run the deployment script:

```bash
./deploy-admin-functions.sh
```

This will:
- Deploy all 8 admin functions
- Show progress for each function
- Provide a summary of successful/failed deployments

### Method 2: Manual Deployment via CLI

Deploy each function individually:

```bash
# Login to Supabase (first time only)
npx supabase login

# Link your project (first time only)
npx supabase link --project-ref gadedbrnqzpfqtsdfzcg

# Deploy functions one by one
npx supabase functions deploy admin-dashboard-stats
npx supabase functions deploy admin-apps
npx supabase functions deploy admin-users
npx supabase functions deploy admin-purchases
npx supabase functions deploy admin-features
npx supabase functions deploy admin-subscriptions
npx supabase functions deploy admin-products
npx supabase functions deploy admin-videos
```

### Method 3: Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions
2. Click **"New Function"** or **"Deploy new version"**
3. For each function, copy the content from `supabase/functions/[function-name]/index.ts`
4. Paste into the dashboard editor
5. Click **"Deploy"**

## Function Details

### admin-dashboard-stats
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats`
- Gets real-time counts of apps, users, purchases
- Calculates growth percentages
- Returns aggregated statistics

### admin-apps
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-apps`
- GET: List all apps
- POST: Toggle app active status
- DELETE: Remove app

### admin-users
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-users`
- GET: List all users with roles
- POST: Create user (single or bulk)
- POST /toggle: Ban/unban user
- DELETE: Remove user

### admin-purchases
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-purchases`
- GET: List all purchases
- POST /import: Bulk import purchases

### admin-features
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-features`
- GET: List all feature flags
- Returns mock data (ready for implementation)

### admin-subscriptions
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-subscriptions`
- GET: List all subscriptions with user details
- Shows expiration dates and access counts

### admin-products
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-products`
- GET: List all products
- Ordered by name

### admin-videos
**URL:** `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-videos`
- GET: List all videos
- POST: Create video
- PUT: Update video
- DELETE: Remove video

## Testing After Deployment

### 1. Test Dashboard Stats

```bash
TOKEN="your_admin_token_here"

curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "totalApps": { "count": 12, "active": 8, "inactive": 4 },
    "features": { "count": 24, "enabled": 18, "disabled": 6 },
    "users": { "count": 1247, "growth": "+12% from last month" }
  }
}
```

### 2. Test Apps Management

```bash
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-apps" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Users Management

```bash
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-users" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### "Function not found" Error

The function hasn't been deployed yet. Use one of the deployment methods above.

### "Authorization required" Error

Make sure you're sending the JWT token from `localStorage.getItem('admin_token')` in the Authorization header.

### "Admin access required" Error

Your user doesn't have admin role. Verify:
```sql
SELECT * FROM user_roles WHERE user_id = 'your_user_id';
```

### Deployment Fails

If deployment fails:
1. Check you're logged in: `npx supabase login`
2. Check project is linked: `npx supabase link --project-ref gadedbrnqzpfqtsdfzcg`
3. Try deploying functions individually
4. Check Supabase dashboard for error logs

## What Happens After Deployment

Once deployed, the admin panel will be fully functional:

✅ Real-time dashboard statistics
✅ Apps management (view, toggle, delete)
✅ Users management (create, ban, delete, bulk import)
✅ Purchases tracking and import
✅ Subscriptions monitoring
✅ Products catalog
✅ Videos content management

## Security Notes

- All functions check for admin role before allowing access
- JWT tokens are validated on every request
- Service role key is used server-side only
- CORS is configured for browser access

## Next Steps

1. Deploy the functions using your preferred method
2. Log in to admin panel at `/admin`
3. Verify all tabs are working
4. Start managing your application!
