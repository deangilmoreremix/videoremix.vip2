# ⚠️ IMPORTANT: Apply These Migrations in Supabase Dashboard

The automated migration tools cannot apply these migrations. You need to **manually copy and paste the SQL** into your Supabase Dashboard.

---

## Quick Link

🔗 **Go here NOW**: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/sql

---

## Step-by-Step Instructions

### Migration 1: Create Purchase Management System

1. Click **"New Query"**
2. Copy **ALL** of the SQL from: `supabase/migrations/20251003151741_create_purchase_management_system.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. Wait for "Success. No rows returned"

### Migration 2: Setup Personalizer Products

1. Click **"New Query"** again
2. Copy **ALL** of the SQL from: `supabase/migrations/20251007000001_setup_personalizer_products.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. Wait for "Success"

### Migration 3: Subscription Expiration Checker

1. Click **"New Query"** again
2. Copy **ALL** of the SQL from: `supabase/migrations/20251007000002_subscription_expiration_checker.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. Wait for "Success"

---

## After Migrations Are Applied

Run these commands in your terminal to complete the setup:

```bash
# 1. Check migrations were applied
node apply-migrations-simple.mjs

# 2. Import purchases from CSV
node import-purchases.mjs

# 3. Grant app access
node grant-app-access.mjs

# 4. Set up subscription tracking
node setup-subscriptions.mjs
```

---

## Verification

After running all scripts, verify everything is working:

```bash
# Check database status
node apply-migrations-simple.mjs
```

Should show all tables exist and provide next steps.

---

## Need Help?

See `MANUAL_MIGRATION_GUIDE.md` for detailed SQL instructions and troubleshooting.
