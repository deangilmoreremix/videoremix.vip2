# Complete Setup Instructions for Subscription Access Control

## Overview

This guide will take you from having 50 users in your database with NO access control to a fully functional subscription management system that tracks purchases, grants app access, and manages monthly subscriptions.

---

## Current Status

✅ **Completed:**
- 50 users imported from CSV into Supabase auth
- User accounts created with emails and metadata

❌ **Not Completed:**
- Database tables for purchase management
- Purchase records from CSV data
- App access grants
- Subscription status tracking

---

## Step-by-Step Setup Process

### Phase 1: Apply Database Migrations (5 minutes)

These migrations create all the tables needed for access control.

#### Migration 1: Purchase Management System
**File:** `supabase/migrations/20251003151741_create_purchase_management_system.sql`

**What it creates:**
- `products_catalog` - Master list of products (Personalizer AI Agency, toolkits, etc.)
- `platform_product_mappings` - Links PayPal/Stripe product IDs to your products
- `purchases` - All transaction records from all platforms
- `user_app_access` - Controls which users can access which apps
- `subscription_status` - Tracks subscription lifecycle (active/cancelled/expired)
- `webhook_logs` - Logs all incoming webhooks for debugging

**How to apply:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Click "New Query"
3. Copy the entire contents of the migration file
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

#### Migration 2: Personalizer Products Setup
**File:** `supabase/migrations/20251007000001_setup_personalizer_products.sql`

**What it creates:**
- Pre-populated products for all Personalizer offerings:
  - Personalizer AI Agency (Monthly) - $29/month - 7 apps
  - Personalizer AI Agency (Lifetime) - $499 - 12 apps
  - Individual toolkits (Master Reseller, FE Bundle, OTO2, etc.)
- Mappings to PayPal product names for automatic matching

**How to apply:**
1. Same process as Migration 1
2. Copy contents of migration file
3. Paste into SQL Editor
4. Run

#### Migration 3: Subscription Expiration Checker
**File:** `supabase/migrations/20251007000002_subscription_expiration_checker.sql`

**What it creates:**
- Database function `check_expired_subscriptions()` that:
  - Finds subscriptions where current_period_end < now()
  - Marks them as "expired"
  - Revokes app access by setting is_active = false
- Can be run manually or scheduled as a daily cron job

**How to apply:**
1. Same process as previous migrations
2. Copy, paste, run

**Verification:**
After applying all 3 migrations, run this query in SQL Editor:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('products_catalog', 'purchases', 'user_app_access', 'subscription_status')
ORDER BY tablename;
```

You should see all 4 tables listed.

---

### Phase 2: Process CSV Purchase Data (10 minutes)

Now that tables exist, we need to populate them with the purchase data from your CSV.

#### Step 1: Review the CSV Data
Your CSV contains 192 transactions from 50 customers with these columns:
- Email
- Name
- Product Name
- Transaction ID
- Date
- Amount
- Status

#### Step 2: Run the Purchase Import Script

**Option A: Automatic Import (Recommended)**

Run the provided import script:
```bash
node import-purchases.mjs
```

This script will:
1. Read the CSV file
2. Match each email to a user_id from auth.users
3. Determine product type (subscription vs lifetime)
4. Create purchase records
5. Match purchases to products in products_catalog
6. Handle duplicate transactions gracefully

**Option B: Manual Import via SQL**

If you prefer manual control, see `MANUAL_MIGRATION_GUIDE.md` for detailed SQL commands.

#### Step 3: Verify Purchase Import

Run this query to check:
```sql
SELECT
  COUNT(*) as total_purchases,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN is_subscription THEN 1 END) as subscription_purchases,
  COUNT(CASE WHEN NOT is_subscription THEN 1 END) as one_time_purchases
FROM purchases;
```

Expected results:
- total_purchases: ~192
- unique_users: 50
- subscription_purchases: ~65 (monthly payments)
- one_time_purchases: ~127 (lifetime + upsells)

---

### Phase 3: Grant App Access (5 minutes)

Now we'll create user_app_access records based on what each user purchased.

#### Run the Access Grant Script

```bash
node grant-app-access.mjs
```

This script will:
1. Find all completed purchases
2. Look up which apps each product grants
3. Create user_app_access records
4. Set appropriate access_type (subscription vs lifetime)
5. Calculate expires_at for subscriptions (last payment date + 30 days)

#### Verification Query

```sql
SELECT
  u.email,
  COUNT(uaa.id) as apps_granted,
  MAX(CASE WHEN uaa.access_type = 'subscription' THEN 'Has Subscription' END) as subscription_status,
  MAX(CASE WHEN uaa.access_type = 'lifetime' THEN 'Has Lifetime' END) as lifetime_status
FROM auth.users u
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id
GROUP BY u.email
ORDER BY u.email;
```

---

### Phase 4: Set Up Subscription Tracking (5 minutes)

For users with monthly subscriptions, create subscription_status records.

#### Run the Subscription Setup Script

```bash
node setup-subscriptions.mjs
```

This script will:
1. Find all subscription purchases
2. Group by user + subscription ID
3. Find the most recent payment for each subscription
4. Create subscription_status records with:
   - current_period_start: last payment date
   - current_period_end: last payment date + 30 days
   - status: "active" if not expired, "expired" if > 30 days ago

#### Check Subscription Status

```sql
SELECT
  u.email,
  ss.status,
  ss.current_period_end,
  CASE
    WHEN ss.current_period_end < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as access_status,
  ss.current_period_end - NOW() as time_remaining
FROM subscription_status ss
JOIN auth.users u ON u.id = ss.user_id
ORDER BY ss.current_period_end;
```

---

### Phase 5: Mark Expired Subscriptions (2 minutes)

Run the expiration checker to mark any expired subscriptions.

```sql
SELECT check_expired_subscriptions();
```

This will:
1. Find subscriptions where current_period_end < now()
2. Update subscription_status to "expired"
3. Set user_app_access.is_active = false
4. Return count of expired subscriptions

---

### Phase 6: Set Up Webhook Endpoints (Optional - for future payments)

The webhook functions already exist in `supabase/functions/`:
- `webhook-paypal/` - Handles PayPal IPN
- `webhook-stripe/` - Handles Stripe webhooks
- `webhook-paykickstart/` - Handles PayKickstart webhooks

**To enable:**
1. Deploy the functions (already done if you deployed edge functions)
2. Configure webhook URLs in your payment platforms:
   - PayPal: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-paypal`
   - Stripe: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-stripe`
   - PayKickstart: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-paykickstart`

---

## Final Verification Checklist

After completing all phases, verify everything works:

### Database Tables Created ✓
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename LIKE '%purchase%' OR tablename LIKE '%subscription%' OR tablename LIKE '%product%';
```

### Products Catalog Populated ✓
```sql
SELECT name, product_type, apps_granted FROM products_catalog WHERE is_active = true;
```
Should show ~8-10 products

### Purchases Imported ✓
```sql
SELECT COUNT(*) FROM purchases;
```
Should show ~192 records

### App Access Granted ✓
```sql
SELECT COUNT(*) FROM user_app_access;
```
Should show 350-500+ records (each user gets multiple apps)

### Subscriptions Tracked ✓
```sql
SELECT status, COUNT(*) FROM subscription_status GROUP BY status;
```
Should show active and/or expired subscriptions

### Access Control Working ✓
Test with a specific user:
```sql
SELECT
  uaa.app_slug,
  uaa.access_type,
  uaa.expires_at,
  uaa.is_active,
  CASE
    WHEN uaa.access_type = 'lifetime' THEN 'PERMANENT ACCESS'
    WHEN uaa.expires_at > NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM user_app_access uaa
JOIN auth.users u ON u.id = uaa.user_id
WHERE u.email = 'larrylawrence1@gmail.com';
```

---

## Monthly Subscription Users - Current Status

After setup is complete, here's what will happen to your monthly subscribers:

### Users with RECENT payments (within 30 days):
- ✅ `is_active = true`
- ✅ Can access their apps
- ⏰ Access until `expires_at`

### Users with EXPIRED payments (>30 days ago):
- ❌ `is_active = false`
- ❌ Access revoked
- 📧 Should receive email asking them to renew
- ✅ Will regain access when next payment webhook arrives

### Based on Your CSV Data:

**Larry Lawrence** (larrylawrence1@gmail.com)
- Last payment: Aug 13, 2025
- Status: **EXPIRED** (54 days ago)
- Action: Access revoked, needs to renew

**Truman Cole** (trcole3@theritegroup.com)
- Last payment: Aug 1, 2025
- Status: **EXPIRED** (67 days ago)
- Action: Access revoked, needs to renew

**Edward Owens** (ejo1ed@gmail.com)
- Last payment: Jun 22, 2025
- Status: **EXPIRED** (107 days ago)
- Action: Access revoked, needs to renew

**ALL monthly subscribers are expired** because last payments were in Jun-Aug 2025 and it's now Oct 2025.

---

## Going Forward

### Daily Maintenance
Schedule this function to run daily:
```sql
SELECT check_expired_subscriptions();
```

Can be set up as a cron job in Supabase Dashboard → Database → Cron Jobs

### When New Payments Arrive
Webhooks will automatically:
1. Find the user's subscription
2. Extend `current_period_end` by 30 days
3. Set `is_active = true`
4. Update subscription status to "active"

### Admin Management
Super admins can:
- View all purchases in Admin Dashboard
- Manually grant/revoke access
- Check subscription status
- View webhook logs for debugging

---

## Troubleshooting

### "Cannot find user_id for email"
Some emails in CSV might not have user accounts. Import creates a list of missing users.

### "Product not found"
Check that product names in CSV match products_catalog exactly. Use platform_product_mappings to map variations.

### "Access not granted after purchase import"
Run the grant-app-access.mjs script again. It's idempotent (safe to run multiple times).

### "Subscriptions showing as expired when they shouldn't be"
Check the purchase dates in your CSV. If they're historical, the 30-day expiration is calculated from those dates, not today.

---

## Summary

Once complete, you'll have:
- ✅ Complete purchase history for all 50 users
- ✅ Accurate app access control (who can use what)
- ✅ Subscription tracking (active/expired/cancelled)
- ✅ Automatic expiration checking
- ✅ Webhook integration for new payments
- ✅ Admin dashboard for management

Total setup time: **~30 minutes**

**Need help?** See `MANUAL_MIGRATION_GUIDE.md` for detailed SQL commands and troubleshooting.
