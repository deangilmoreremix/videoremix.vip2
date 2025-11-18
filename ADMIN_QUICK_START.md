# Admin Panel - Quick Start

## Current Status

✅ **Frontend** - Fully configured and built successfully
✅ **Edge Functions** - All 8 functions written and ready
✅ **Database** - Tables and permissions set up
✅ **Admin User** - Created with super_admin role

⏳ **Deployment** - Functions need to be deployed to Supabase

## The Problem

The admin panel functions are **not deployed** to Supabase yet. This is why when you access the admin panel, the API calls fail with 404 errors.

## The Solution

Deploy the edge functions using the automated script:

```bash
./deploy-admin-functions.sh
```

Or manually deploy each function:

```bash
npx supabase functions deploy admin-dashboard-stats
npx supabase functions deploy admin-apps
npx supabase functions deploy admin-users
npx supabase functions deploy admin-purchases
npx supabase functions deploy admin-features
npx supabase functions deploy admin-subscriptions
npx supabase functions deploy admin-products
npx supabase functions deploy admin-videos
```

## Login After Deployment

1. Go to `/admin/login`
2. Email: `dev@videoremix.vip`
3. Password: `Admin123!@#`

## What Each Function Does

| Function | Purpose | Endpoint |
|----------|---------|----------|
| admin-dashboard-stats | Real-time statistics | GET |
| admin-apps | Manage applications | GET, POST, DELETE |
| admin-users | User management | GET, POST, DELETE |
| admin-purchases | Purchase tracking | GET, POST |
| admin-features | Feature flags | GET |
| admin-subscriptions | Subscription monitoring | GET |
| admin-products | Product catalog | GET |
| admin-videos | Video management | GET, POST, PUT, DELETE |

## Verification

After deployment, test each endpoint:

```bash
# Get your token after logging in
TOKEN=$(echo 'localStorage.getItem("admin_token")' | npx browser-run)

# Test dashboard stats
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats" \
  -H "Authorization: Bearer $TOKEN"

# Should return: {"success": true, "data": {...}}
```

## File Locations

- **Frontend Components**: `src/components/admin/*.tsx`
- **Edge Functions**: `supabase/functions/admin-*/index.ts`
- **Deployment Script**: `deploy-admin-functions.sh`
- **Full Guide**: `ADMIN_DEPLOYMENT_GUIDE.md`

## Need Help?

See the full deployment guide: `ADMIN_DEPLOYMENT_GUIDE.md`
