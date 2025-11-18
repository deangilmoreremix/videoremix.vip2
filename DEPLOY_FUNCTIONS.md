# How to Deploy Edge Functions to Your Supabase Project

## Important: You're Using Supabase (Not "Bolt Database")

Your project uses **Supabase** for the database and edge functions. There's no separate "bolt database" - everything runs on Supabase.

Your Supabase Project URL: `https://gadedbrnqzpfqtsdfzcg.supabase.co`

---

## Deployment Method: Supabase Dashboard (Easiest)

### Step 1: Access Supabase Dashboard

Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions

### Step 2: Deploy Each Function

**Functions to Deploy:**
1. admin-dashboard-stats
2. admin-apps
3. admin-features
4. admin-users (NEW)
5. admin-purchases (NEW)
6. admin-subscriptions
7. admin-products (NEW)
8. admin-videos

**For EXISTING functions:**
1. Click on the function name
2. Click "Edit" button
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Paste and click "Deploy"
5. Ensure "Verify JWT" is checked

**For NEW functions:**
1. Click "New Function"
2. Enter function name
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Paste and click "Deploy"
5. Ensure "Verify JWT" is checked

---

## After Deployment

### Test the Functions

```bash
# Get your anon key from .env file
# Then get auth token:
curl -X POST 'https://gadedbrnqzpfqtsdfzcg.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@videoremix.vip","password":"Admin123!@#"}'

# Use the access_token from response to test:
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-apps" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test in Admin Panel

1. Go to `/admin/login`
2. Login with: `dev@videoremix.vip` / `Admin123!@#`
3. All tabs should now work without errors
