# Manual Migration Guide

This guide provides step-by-step instructions for manually applying migrations and setting up the subscription access control system using the Supabase SQL Editor.

---

## Prerequisites

- Access to your Supabase Dashboard
- Super admin privileges
- The migration files in `supabase/migrations/`

---

## Part 1: Apply Database Migrations

### Step 1: Access SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Apply Migration 1 - Purchase Management System

**File:** `supabase/migrations/20251003151741_create_purchase_management_system.sql`

**Copy the ENTIRE file contents and paste into SQL Editor, then click Run.**

This creates:
- `products_catalog`
- `platform_product_mappings`
- `purchases`
- `user_app_access`
- `subscription_status`
- `webhook_logs`

**Expected Result:** "Success. No rows returned"

**If you get an error:**
- If "relation already exists" - tables were already created, safe to continue
- If "permission denied" - verify you're logged in as super admin
- Any other error - copy the error message and debug

**Verify tables exist:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN (
  'products_catalog',
  'platform_product_mappings',
  'purchases',
  'user_app_access',
  'subscription_status',
  'webhook_logs'
)
ORDER BY tablename;
```

Should return 6 table names.

---

### Step 3: Apply Migration 2 - Personalizer Products Setup

**File:** `supabase/migrations/20251007000001_setup_personalizer_products.sql`

**Copy and run the entire file.**

This inserts:
- 8 products into products_catalog
- Product mappings for PayPal product names

**Verify products exist:**
```sql
SELECT id, name, product_type, apps_granted FROM products_catalog ORDER BY name;
```

Should return 8 products:
1. Personalizer AI Agency (Monthly)
2. Personalizer AI Agency (Lifetime)
3. FE Bundle
4. Master Reseller Package
5. OTO2 - Creator's Advantage
6. OTO3 - Reseller Advantage
7. Realtime Graphics Toolkit
8. Social Video Toolkit

---

### Step 4: Apply Migration 3 - Subscription Expiration Checker

**File:** `supabase/migrations/20251007000002_subscription_expiration_checker.sql`

**Copy and run the entire file.**

This creates:
- Function `check_expired_subscriptions()`
- Can be called manually or scheduled as cron job

**Test the function:**
```sql
SELECT check_expired_subscriptions();
```

Should return 0 (no expired subscriptions yet, because we haven't created any).

---

## Part 2: Import Purchase Data from CSV

Now we need to populate the purchases table with data from your CSV file.

### Option A: Use Import Script (Recommended)

If you have Node.js set up:

```bash
node import-purchases.mjs
```

This automatically:
1. Reads the CSV
2. Matches emails to user IDs
3. Creates purchase records
4. Links to products

**Skip to Part 3 if using this method.**

---

### Option B: Manual SQL Import

If you need to manually import, follow these steps:

#### Step 1: Get Product IDs

First, save the product IDs for reference:

```sql
SELECT id, name, slug FROM products_catalog ORDER BY name;
```

Copy these IDs - you'll need them below.

#### Step 2: Create a Temporary Table for CSV Data

```sql
CREATE TEMP TABLE temp_csv_import (
  email text,
  name text,
  product_name text,
  transaction_id text,
  purchase_date text,
  amount text,
  status text
);
```

#### Step 3: Import CSV Data

In Supabase SQL Editor:
1. Click the **Import CSV** button
2. Select your CSV file
3. Map columns to temp_csv_import table
4. Click Import

Alternatively, if you have CSV as text, insert manually:

```sql
INSERT INTO temp_csv_import (email, name, product_name, transaction_id, purchase_date, amount, status)
VALUES
('larrylawrence1@gmail.com', 'Larry Lawrence', 'Personalizer AI Agency (Subscription)', 'txn_001', '2024-11-11', '29.00', 'Completed'),
('trcole3@theritegroup.com', 'Truman Cole', 'Personalizer AI Agency (Subscription)', 'txn_002', '2024-10-20', '29.00', 'Completed'),
-- ... add all rows from your CSV
;
```

#### Step 4: Match Products and Create Purchases

```sql
INSERT INTO purchases (
  user_id,
  email,
  platform,
  platform_transaction_id,
  product_id,
  product_name,
  amount,
  currency,
  status,
  is_subscription,
  purchase_date
)
SELECT
  u.id as user_id,
  csv.email,
  'paypal' as platform,
  csv.transaction_id as platform_transaction_id,
  pc.id as product_id,
  csv.product_name,
  csv.amount::numeric,
  'USD' as currency,
  CASE LOWER(csv.status)
    WHEN 'completed' THEN 'completed'
    WHEN 'refunded' THEN 'refunded'
    ELSE 'completed'
  END as status,
  CASE
    WHEN csv.product_name ILIKE '%subscription%' OR csv.product_name ILIKE '%monthly%' THEN true
    ELSE false
  END as is_subscription,
  csv.purchase_date::timestamptz
FROM temp_csv_import csv
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(csv.email)
LEFT JOIN products_catalog pc ON (
  pc.name ILIKE '%' || SPLIT_PART(csv.product_name, ' ', 1) || '%'
  OR pc.slug ILIKE '%' || SPLIT_PART(csv.product_name, '-', 1) || '%'
)
WHERE u.id IS NOT NULL
ON CONFLICT (platform, platform_transaction_id) DO NOTHING;
```

#### Step 5: Verify Import

```sql
SELECT
  COUNT(*) as total_purchases,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN is_subscription THEN 1 END) as subscriptions,
  COUNT(CASE WHEN NOT is_subscription THEN 1 END) as one_time
FROM purchases;
```

#### Step 6: Check for Unmatched Records

```sql
-- Users in CSV but not in database
SELECT DISTINCT csv.email
FROM temp_csv_import csv
LEFT JOIN auth.users u ON LOWER(u.email) = LOWER(csv.email)
WHERE u.id IS NULL;

-- Purchases that couldn't match a product
SELECT DISTINCT product_name
FROM purchases
WHERE product_id IS NULL;
```

#### Step 7: Clean Up Temp Table

```sql
DROP TABLE temp_csv_import;
```

---

## Part 3: Grant App Access

Now create user_app_access records based on purchases.

### Option A: Use Script (Recommended)

```bash
node grant-app-access.mjs
```

**Skip to Part 4 if using this method.**

---

### Option B: Manual SQL Grant

#### Step 1: Grant Access for Lifetime Purchases

```sql
INSERT INTO user_app_access (user_id, app_slug, purchase_id, access_type, is_active)
SELECT
  p.user_id,
  jsonb_array_elements_text(pc.apps_granted) as app_slug,
  p.id as purchase_id,
  'lifetime' as access_type,
  true as is_active
FROM purchases p
JOIN products_catalog pc ON pc.id = p.product_id
WHERE p.is_subscription = false
  AND p.status = 'completed'
  AND p.user_id IS NOT NULL
ON CONFLICT (user_id, app_slug) DO NOTHING;
```

#### Step 2: Grant Access for Subscription Purchases

For subscriptions, we need to set expiration dates:

```sql
WITH last_payments AS (
  SELECT
    user_id,
    product_id,
    MAX(purchase_date) as last_payment_date
  FROM purchases
  WHERE is_subscription = true
    AND status = 'completed'
  GROUP BY user_id, product_id
)
INSERT INTO user_app_access (
  user_id,
  app_slug,
  purchase_id,
  access_type,
  expires_at,
  is_active
)
SELECT
  lp.user_id,
  jsonb_array_elements_text(pc.apps_granted) as app_slug,
  p.id as purchase_id,
  'subscription' as access_type,
  (lp.last_payment_date + INTERVAL '30 days') as expires_at,
  CASE
    WHEN (lp.last_payment_date + INTERVAL '30 days') > NOW() THEN true
    ELSE false
  END as is_active
FROM last_payments lp
JOIN products_catalog pc ON pc.id = lp.product_id
JOIN purchases p ON p.user_id = lp.user_id AND p.product_id = lp.product_id
WHERE lp.user_id IS NOT NULL
ON CONFLICT (user_id, app_slug) DO UPDATE SET
  expires_at = EXCLUDED.expires_at,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

#### Step 3: Verify Access Grants

```sql
SELECT
  u.email,
  COUNT(uaa.id) as total_apps,
  COUNT(CASE WHEN uaa.access_type = 'lifetime' THEN 1 END) as lifetime_apps,
  COUNT(CASE WHEN uaa.access_type = 'subscription' THEN 1 END) as subscription_apps,
  COUNT(CASE WHEN uaa.is_active = true THEN 1 END) as active_apps
FROM auth.users u
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id
GROUP BY u.email
ORDER BY total_apps DESC;
```

---

## Part 4: Set Up Subscription Tracking

Create subscription_status records for monthly subscribers.

### Option A: Use Script (Recommended)

```bash
node setup-subscriptions.mjs
```

**Skip to Part 5 if using this method.**

---

### Option B: Manual SQL Setup

#### Step 1: Create Subscription Status Records

```sql
WITH last_subscription_payment AS (
  SELECT
    user_id,
    subscription_id,
    platform,
    MAX(purchase_date) as last_payment_date,
    MAX(id) as purchase_id
  FROM purchases
  WHERE is_subscription = true
    AND status = 'completed'
    AND subscription_id IS NOT NULL
  GROUP BY user_id, subscription_id, platform
)
INSERT INTO subscription_status (
  user_id,
  purchase_id,
  platform,
  platform_subscription_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
)
SELECT
  lsp.user_id,
  lsp.purchase_id,
  lsp.platform,
  lsp.subscription_id,
  CASE
    WHEN (lsp.last_payment_date + INTERVAL '30 days') > NOW() THEN 'active'
    ELSE 'expired'
  END as status,
  lsp.last_payment_date as current_period_start,
  (lsp.last_payment_date + INTERVAL '30 days') as current_period_end,
  false as cancel_at_period_end
FROM last_subscription_payment lsp
ON CONFLICT (platform_subscription_id) DO UPDATE SET
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  status = EXCLUDED.status,
  updated_at = NOW();
```

#### Step 2: Verify Subscription Status

```sql
SELECT
  u.email,
  ss.platform,
  ss.status,
  ss.current_period_start,
  ss.current_period_end,
  CASE
    WHEN ss.current_period_end < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as current_status,
  (ss.current_period_end - NOW()) as time_remaining
FROM subscription_status ss
JOIN auth.users u ON u.id = ss.user_id
ORDER BY ss.current_period_end DESC;
```

---

## Part 5: Mark Expired Subscriptions

Run the expiration checker to update any expired subscriptions:

```sql
SELECT check_expired_subscriptions();
```

This will return the number of subscriptions that were marked as expired.

**Verify the update:**

```sql
SELECT
  status,
  COUNT(*) as count
FROM subscription_status
GROUP BY status;
```

Should show counts for 'active' and 'expired' status.

**Check affected users:**

```sql
SELECT
  u.email,
  ss.status,
  uaa.app_slug,
  uaa.is_active,
  uaa.expires_at
FROM subscription_status ss
JOIN auth.users u ON u.id = ss.user_id
LEFT JOIN user_app_access uaa ON uaa.user_id = ss.user_id AND uaa.access_type = 'subscription'
WHERE ss.status = 'expired'
ORDER BY u.email, uaa.app_slug;
```

Users with expired subscriptions should have `is_active = false`.

---

## Part 6: Schedule Automatic Expiration Checking

To automatically check for expired subscriptions daily:

### Step 1: Enable pg_cron Extension

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 2: Schedule Daily Check

```sql
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 0 * * *',
  'SELECT check_expired_subscriptions();'
);
```

This runs at midnight UTC every day.

### Step 3: Verify Cron Job

```sql
SELECT * FROM cron.job;
```

Should show your scheduled job.

**Alternative:** Use Supabase Dashboard → Database → Cron Jobs to set this up visually.

---

## Verification Queries

Use these queries to verify everything is set up correctly:

### Check All Tables Exist

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('products_catalog', 'purchases', 'user_app_access', 'subscription_status')
ORDER BY tablename;
```

### Count Records in Each Table

```sql
SELECT
  (SELECT COUNT(*) FROM products_catalog) as products,
  (SELECT COUNT(*) FROM purchases) as purchases,
  (SELECT COUNT(*) FROM user_app_access) as app_access_records,
  (SELECT COUNT(*) FROM subscription_status) as subscriptions;
```

### Check Specific User's Access

Replace email with actual user email:

```sql
SELECT
  u.email,
  uaa.app_slug,
  uaa.access_type,
  uaa.is_active,
  uaa.expires_at,
  CASE
    WHEN uaa.access_type = 'lifetime' THEN 'PERMANENT'
    WHEN uaa.expires_at > NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM auth.users u
JOIN user_app_access uaa ON uaa.user_id = u.id
WHERE u.email = 'larrylawrence1@gmail.com'
ORDER BY uaa.app_slug;
```

### List All Active Subscriptions

```sql
SELECT
  u.email,
  ss.status,
  ss.current_period_end,
  (ss.current_period_end - NOW()) as time_until_renewal
FROM subscription_status ss
JOIN auth.users u ON u.id = ss.user_id
WHERE ss.status = 'active'
ORDER BY ss.current_period_end;
```

### List All Expired Subscriptions

```sql
SELECT
  u.email,
  ss.status,
  ss.current_period_end,
  (NOW() - ss.current_period_end) as days_expired
FROM subscription_status ss
JOIN auth.users u ON u.id = ss.user_id
WHERE ss.status = 'expired'
ORDER BY ss.current_period_end DESC;
```

---

## Troubleshooting

### Problem: Purchases Not Linking to Products

**Solution:** Check product name matching:

```sql
SELECT DISTINCT p.product_name
FROM purchases p
WHERE p.product_id IS NULL;
```

Manually update with correct product_id:

```sql
UPDATE purchases
SET product_id = (SELECT id FROM products_catalog WHERE name ILIKE '%Personalizer%' AND product_type = 'subscription')
WHERE product_name ILIKE '%personalizer%subscription%'
  AND product_id IS NULL;
```

### Problem: User_id is NULL in Purchases

**Solution:** Find users that need accounts:

```sql
SELECT DISTINCT email
FROM purchases
WHERE user_id IS NULL;
```

Create missing user accounts or update purchases with correct user_id:

```sql
UPDATE purchases p
SET user_id = u.id
FROM auth.users u
WHERE LOWER(p.email) = LOWER(u.email)
  AND p.user_id IS NULL;
```

### Problem: Subscriptions Not Expiring

**Solution:** Run expiration checker manually:

```sql
SELECT check_expired_subscriptions();
```

Check if function exists:

```sql
SELECT proname FROM pg_proc WHERE proname = 'check_expired_subscriptions';
```

If not found, re-run Migration 3.

### Problem: Access Granted but User Can't Access App

**Solution:** Check RLS policies:

```sql
-- Test as user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'USER_ID_HERE';

SELECT * FROM user_app_access WHERE user_id = 'USER_ID_HERE';

RESET ROLE;
```

If no results, RLS policies may be blocking. Check policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_app_access';
```

---

## Summary

After completing this manual migration guide, you should have:

✅ All database tables created
✅ Products catalog populated
✅ Purchase records imported from CSV
✅ App access granted to users
✅ Subscription tracking set up
✅ Expired subscriptions marked
✅ Automatic expiration checking scheduled

**Total Time:** 30-45 minutes for manual setup

For troubleshooting or questions, refer to `COMPLETE_SETUP_INSTRUCTIONS.md`.
