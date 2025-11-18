# User Access & Features Guide

## System Overview

Your VideoRemix.vip platform has a complete access control system with **53 apps** that users can access based on their purchases.

### ✅ What's Already Set Up

1. **53 Active Apps** including:
   - Advanced Text Video Editor
   - AI Art Generator
   - AI Background Remover
   - AI Creative Studio
   - AI Sales Assistant
   - AI Video Creator
   - Voice Coach Pro
   - Resume Amplifier
   - And 45 more...

2. **8 Product Packages** configured with app bundles:
   - Personalizer AI Agency (Monthly) - 7 apps
   - Personalizer AI Agency (Yearly) - 10 apps
   - Personalizer AI Agency (Lifetime) - 12 apps
   - Personalizer AI Writing Toolkit - 2 apps
   - Personalizer Advanced Text-Video AI Editor - 2 apps
   - And 3 more specialized packages...

3. **Access Control Tables**:
   - `apps` - All available applications
   - `products_catalog` - Product definitions with `apps_granted` array
   - `purchases` - User purchase records
   - `user_app_access` - Granted access per user per app

4. **Edge Functions**:
   - `resolve-user-access` - Returns user's apps and access levels
   - `import-personalizer-purchases` - Imports CSV purchases and grants access
   - Admin functions for managing apps, users, and purchases

---

## How the Access System Works

### Purchase → Access Flow:

```
1. Purchase is recorded in `purchases` table
   ↓
2. Purchase is linked to `products_catalog` via product_id
   ↓
3. Product's `apps_granted` array lists app slugs
   ↓
4. System creates records in `user_app_access` for each app
   ↓
5. User sees apps in their dashboard
```

### Access Types:

- **Lifetime**: Never expires (`expires_at = null`)
- **Subscription**: Has expiration date (`expires_at = date`)
- **Inactive**: Subscription expired (`is_active = false`)

---

## How to Grant Access to Users Who Already Purchased

### Option 1: Import Purchase CSV (Recommended for Bulk)

**From Admin Dashboard:**

1. **Login to Admin** at `/admin/login`
   - Use your super admin credentials

2. **Go to Import Purchases Tab**
   - Click "Import Purchases" in the admin navigation

3. **Upload CSV File**
   - Format should match Zaxxa/PayKickstart export:
     ```
     NO,DATE,PRODUCT NAME,AMOUNT,PAYMENT TYPE,PAYMENT STATUS,BUYER COUNTRY,CUSTOMER NAME,TOTAL AMOUNT,ZAXAA TXN ID,PAYPAL TXN ID,CURRENCY,PAYMENT PROCESSOR,CUSTOMER EMAIL,PAYPAL PREAPPROVAL KEY,START FROM,RECURRING PERIOD
     ```

4. **System Automatically**:
   - Creates user accounts (if they don't exist)
   - Records purchases
   - Grants app access based on product
   - Sets expiration dates for subscriptions

### Option 2: Using Scripts (For Server-Side Processing)

**Prerequisites:**
```bash
# Make sure you have Node.js installed
node --version

# Make sure .env file has correct credentials
cat .env
```

**Step-by-step:**

1. **Import Purchase Data First:**
```bash
# If you have a CSV of purchases
node import-purchases.mjs
```

2. **Grant Access Based on Purchases:**
```bash
# This reads purchases table and grants access
node grant-app-access.mjs
```

3. **For Personalizer-specific CSV:**
```bash
node import-zaxxa-users.mjs
```

### Option 3: Manual Grant via Admin Panel

**From Admin Dashboard:**

1. Go to **Users Management** tab
2. Find or create the user
3. Go to **Purchases Management** tab
4. Click "Add Purchase" manually
5. Select product and user
6. System will auto-grant apps from that product

### Option 4: Direct SQL (Advanced)

**Grant access directly to a user:**

```sql
-- Grant lifetime access to specific apps for a user
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active)
VALUES
  ('user-uuid-here', 'video-creator', 'lifetime', true),
  ('user-uuid-here', 'ai-art', 'lifetime', true);

-- Or grant all apps from a product
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active)
SELECT
  'user-uuid-here',
  unnest(apps_granted::text[]),
  'lifetime',
  true
FROM products_catalog
WHERE slug = 'personalizer-lifetime';
```

---

## Checking User Access

### Via Admin Dashboard:

1. **Users Tab** → Shows all users
2. **Click user** → See their purchases
3. **Access column** → Shows # of apps they can access

### Via SQL Query:

```sql
-- See what access a specific user has
SELECT
  uaa.app_slug,
  uaa.access_type,
  uaa.is_active,
  uaa.expires_at,
  a.name as app_name
FROM user_app_access uaa
JOIN apps a ON a.slug = uaa.app_slug
WHERE uaa.user_id = 'user-uuid-here'
ORDER BY a.name;

-- Count users per app
SELECT
  app_slug,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_users
FROM user_app_access
GROUP BY app_slug
ORDER BY user_count DESC;
```

---

## Testing User Access

### As a User:

1. **Sign in to account** at `/signin`
2. **Go to Dashboard** at `/dashboard`
3. **Click any app** in the tools section
4. **Apps you have access to** → Opens directly
5. **Apps you don't have** → Shows "Purchase Required" overlay

### Via API:

```javascript
// Frontend code to check access
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/resolve-user-access`,
  {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  }
);

const { success, data } = await response.json();
// data.apps = array of apps user has access to
// data.products = array of products user owns
```

---

## Features Are Functional ✅

**Yes, all features are fully functional:**

1. ✅ Apps database is populated (53 apps)
2. ✅ Products catalog is configured with app bundles
3. ✅ Access control system is in place
4. ✅ Edge functions are deployed and working
5. ✅ Frontend hooks check access properly
6. ✅ Protected route system prevents unauthorized access
7. ✅ Admin panel can manage everything

**What You Need to Do:**

1. **Import your purchase data** (CSV from Zaxxa/PayKickstart)
   - OR manually add purchases in admin panel
   - OR use scripts to bulk import

2. **Access will be automatically granted** based on:
   - Product purchased
   - Apps defined in that product's `apps_granted` array

---

## Common Issues & Solutions

### Issue: User purchased but has no access

**Check:**
1. Is purchase recorded in `purchases` table?
2. Is purchase marked as `processed = true`?
3. Is `user_id` linked to purchase?
4. Does product have `apps_granted` array populated?

**Solution:**
```bash
# Re-run the access grant script
node grant-app-access.mjs
```

### Issue: Subscription expired

**Check:**
```sql
SELECT * FROM user_app_access
WHERE expires_at < NOW() AND is_active = true;
```

**Solution:**
```bash
# Run subscription checker
node setup-subscriptions.mjs
```

### Issue: App shows as locked even though user has access

**Check:**
1. User is logged in?
2. Check browser console for errors
3. Verify `resolve-user-access` edge function returns user's apps

**Solution:**
- Have user refresh the page
- Check edge function logs in Supabase dashboard

---

## Quick Reference

### Key URLs:
- Admin: `/admin`
- Dashboard: `/dashboard`
- Apps: `/app/{slug}`
- User Profile: `/profile`

### Key Tables:
- `apps` - Application definitions
- `products_catalog` - Product + app bundles
- `purchases` - Purchase history
- `user_app_access` - Granted access records
- `user_roles` - Admin/user roles

### Key Edge Functions:
- `resolve-user-access` - Get user's apps
- `import-personalizer-purchases` - Import CSV
- `admin-users` - Manage users
- `admin-purchases` - Manage purchases

### Key Scripts:
- `grant-app-access.mjs` - Grant access from purchases
- `import-purchases.mjs` - Import purchase CSV
- `setup-subscriptions.mjs` - Update subscription status

---

## Next Steps

1. **Import your existing purchase data**:
   - Go to `/admin` → Import Purchases
   - Upload Zaxxa/PayKickstart CSV

2. **Verify users have access**:
   - Check Users tab → See access count
   - Login as test user → Check dashboard

3. **Monitor subscriptions**:
   - Set up cron job for `setup-subscriptions.mjs`
   - Checks expiration dates daily

4. **Add new products**:
   - Go to Admin → Product Mapping
   - Define which apps each product grants

---

Need help? All systems are working and ready to use!
