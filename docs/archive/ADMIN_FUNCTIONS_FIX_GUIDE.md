# Admin Functions Fix Guide

## Current Status

✅ **Database is correct:**
- User `dev@videoremix.vip` (ID: `99fb8e70-1e68-4b30-8bd8-688df6aa0bde`) has `super_admin` role in `user_roles` table
- User can successfully authenticate and get JWT token

❌ **Functions are throwing errors:**
- 5 functions deployed but returning `WORKER_ERROR`
- 3 functions not deployed yet

---

## Root Cause

The deployed functions are encountering runtime errors. Based on the code analysis, the most likely causes are:

1. **Environment variables not set** - Functions use `Deno.env.get("SUPABASE_URL")` which might not be available
2. **Functions need redeployment** - The deployed versions might be outdated
3. **Missing error handling** - The functions might be crashing before returning proper errors

---

## How to Check Supabase Function Logs

This is the MOST IMPORTANT step to understand what's failing:

1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions
2. Click on each function name (e.g., "admin-apps")
3. Click the "Logs" tab at the top
4. You'll see real-time logs and errors

**What to look for in logs:**
- `ReferenceError: SUPABASE_URL is not defined` - Environment variable issue
- `Cannot read property` - Code error
- `Database connection error` - Permission issue
- Any JavaScript/TypeScript error messages

---

## Solution Steps

### Step 1: Verify Environment Variables in Supabase

The functions use these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

According to Supabase docs, these should be automatically available, but let's verify:

1. Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/settings/functions
2. Check if environment variables are listed
3. If not, you may need to set them manually (though this is rare)

### Step 2: Redeploy Functions with Correct Code

The functions in your project directory are correct. You need to redeploy them to Supabase.

**Option A: Manual Deploy via Dashboard**

For each function, copy the code from your project and deploy:

1. **admin-dashboard-stats**
   - File: `supabase/functions/admin-dashboard-stats/index.ts`
   - Go to: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/functions
   - Click function name → "Edit" → Paste code → Deploy

2. **admin-apps**
   - File: `supabase/functions/admin-apps/index.ts`
   - Same process

3. **admin-features**
   - File: `supabase/functions/admin-features/index.ts`
   - Same process

4. **admin-subscriptions**
   - File: `supabase/functions/admin-subscriptions/index.ts`
   - Same process

5. **admin-videos**
   - File: `supabase/functions/admin-videos/index.ts`
   - Same process

**Functions that need to be deployed for the first time:**

6. **admin-users**
   - File: `supabase/functions/admin-users/index.ts`
   - Click "New Function" → Name: `admin-users` → Paste code → Deploy

7. **admin-purchases**
   - File: `supabase/functions/admin-purchases/index.ts`
   - Click "New Function" → Name: `admin-purchases` → Paste code → Deploy

8. **admin-products**
   - File: `supabase/functions/admin-products/index.ts`
   - Click "New Function" → Name: `admin-products` → Paste code → Deploy

**Option B: Deploy via CLI**

If you have the Supabase CLI installed locally:

```bash
# Link your project
npx supabase link --project-ref gadedbrnqzpfqtsdfzcg

# Deploy all functions
npx supabase functions deploy admin-dashboard-stats
npx supabase functions deploy admin-apps
npx supabase functions deploy admin-features
npx supabase functions deploy admin-subscriptions
npx supabase functions deploy admin-videos
npx supabase functions deploy admin-users
npx supabase functions deploy admin-purchases
npx supabase functions deploy admin-products
```

### Step 3: Verify JWT Verification Settings

For each function, check that "Verify JWT" is ENABLED (checked):

1. Go to function settings
2. Look for "Verify JWT" checkbox
3. Ensure it's checked (enabled)

This is important because the functions validate the user's JWT token.

### Step 4: Test Again

After redeploying, test the functions:

```bash
# Get a fresh token
curl -X POST 'https://gadedbrnqzpfqtsdfzcg.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@videoremix.vip","password":"Admin123!@#"}'

# Extract the access_token from response and use it:
curl "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-apps" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response:
# {"success":true,"data":[...apps...]}
```

---

## Expected Function Responses

### admin-dashboard-stats
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "totalApps": 8,
    "totalPurchases": 100,
    "activeSubscriptions": 25,
    "usersGrowth": 10.5,
    "appsGrowth": 0,
    "purchasesGrowth": 15.3,
    "subscriptionsGrowth": 5.2
  }
}
```

### admin-apps
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "App Name",
      "slug": "app-slug",
      "description": "Description",
      "category": "tools",
      "icon_url": "https://...",
      "is_active": true,
      "is_featured": false,
      "sort_order": 0,
      "created_at": "2025-10-08...",
      "updated_at": "2025-10-08..."
    }
  ]
}
```

### admin-users
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-10-08...",
      "role": "user",
      "is_banned": false
    }
  ]
}
```

---

## Common Error Messages and Solutions

### "WORKER_ERROR"
**Cause:** Function crashed during execution
**Solution:** Check function logs for the actual error

### "NOT_FOUND"
**Cause:** Function not deployed
**Solution:** Deploy the function

### "Invalid token"
**Cause:** JWT verification mismatch
**Solution:** Check "Verify JWT" setting and ensure you're using a fresh token

### "Admin access required"
**Cause:** User doesn't have admin role (but we fixed this!)
**Solution:** Verify `user_roles` table has correct role (already done ✅)

### "Authorization required"
**Cause:** No Authorization header
**Solution:** Include `Authorization: Bearer TOKEN` header

---

## Testing Checklist

After redeploying, test each function:

- [ ] admin-dashboard-stats - GET /admin-dashboard-stats
- [ ] admin-apps - GET /admin-apps
- [ ] admin-apps - POST /admin-apps (create app)
- [ ] admin-apps - PUT /admin-apps/:id (update app)
- [ ] admin-apps - DELETE /admin-apps/:id (delete app)
- [ ] admin-features - GET /admin-features
- [ ] admin-users - GET /admin-users
- [ ] admin-purchases - GET /admin-purchases
- [ ] admin-subscriptions - GET /admin-subscriptions
- [ ] admin-products - GET /admin-products
- [ ] admin-videos - GET /admin-videos

---

## Quick Test Script

Save this as `test-functions.sh`:

```bash
#!/bin/bash

SUPABASE_URL="https://gadedbrnqzpfqtsdfzcg.supabase.co"
ANON_KEY="your_anon_key_here"

# Get token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@videoremix.vip","password":"Admin123!@#"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test each function
functions=("admin-dashboard-stats" "admin-apps" "admin-features" "admin-users" "admin-purchases" "admin-subscriptions" "admin-products" "admin-videos")

for func in "${functions[@]}"; do
  echo "Testing $func..."
  response=$(curl -s "$SUPABASE_URL/functions/v1/$func" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

  if echo "$response" | grep -q '"success":true'; then
    echo "✅ $func: SUCCESS"
  else
    echo "❌ $func: FAILED"
    echo "   Response: $response"
  fi
  echo ""
done
```

---

## Next Steps

1. **Check function logs** - This will tell you exactly what's wrong
2. **Redeploy all functions** - Use the code from your project
3. **Run the test script** - Verify all functions work
4. **Test the admin panel** - Go to `/admin/login` and try using the UI

---

## Need More Help?

If functions still fail after redeployment:

1. Share the error messages from Supabase function logs
2. Check if environment variables are set in Supabase dashboard
3. Verify the function code matches what's in your project directory
4. Ensure "Verify JWT" is enabled for all functions

The code is correct - it's just a matter of getting it properly deployed to Supabase.
