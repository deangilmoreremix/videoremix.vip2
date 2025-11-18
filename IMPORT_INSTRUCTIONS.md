# Step-by-Step: Import Your Personalizer Purchases

## Current Status
❌ **Users have NOT been added to Supabase yet**

We've created the system, but haven't executed the import. Here's how to do it:

---

## Step 1: Apply Database Migrations

You need to apply two migrations to your Supabase database. You have 3 options:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20251007000001_setup_personalizer_products.sql`
5. Paste and click **Run**
6. Repeat for `supabase/migrations/20251007000002_subscription_expiration_checker.sql`

### Option B: Using Supabase CLI

```bash
cd /tmp/cc-agent/57975023/project

# If you have Supabase CLI installed
supabase db push

# Or apply specific migrations
supabase db execute -f supabase/migrations/20251007000001_setup_personalizer_products.sql
supabase db execute -f supabase/migrations/20251007000002_subscription_expiration_checker.sql
```

### Option C: Manual SQL Execution

I can help you run the SQL directly if you prefer.

---

## Step 2: Deploy the Import Edge Function

### Option A: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Deploy new function**
3. Name it: `import-personalizer-purchases`
4. Copy the code from `supabase/functions/import-personalizer-purchases/index.ts`
5. Click **Deploy**

### Option B: Using Supabase CLI

```bash
cd /tmp/cc-agent/57975023/project

# Deploy the function
supabase functions deploy import-personalizer-purchases
```

---

## Step 3: Import Your CSV Data

Once the migrations and function are deployed:

### Method 1: Through Admin Dashboard (Recommended)

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/admin`
3. Log in with your super admin credentials
4. Click on **"Import Purchases"** tab
5. Click the upload area
6. Select: `src/data/personalizer .csv`
7. Wait for processing (1-2 minutes)
8. Review the results

### Method 2: Direct API Call

```bash
# Read your CSV file
CSV_PATH="src/data/personalizer .csv"

# Call the Edge Function directly
curl -X POST \
  'https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/import-personalizer-purchases' \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d @parsed_csv.json
```

---

## What Will Happen During Import

### Your 109 purchases will be processed:

✅ **~90-95 "Completed" purchases**:
- Create user accounts
- Grant immediate app access
- Set up subscription tracking

⏸️ **3 "Pending" purchases**:
- Create purchase records
- Hold access until payment confirms

🚫 **7 "Refunded" purchases**:
- Automatically skipped

### Unique Users Created:
- Approximately 30-40 user accounts
- Each gets a secure random password
- Email will be their username

### Subscriptions Tracked:
- **Monthly**: Larry Lawrence, Truman Cole, Edward Owens, Darren Paramore, etc.
- **Yearly**: Bob Lazor, Steven Barrett, Kenneth SApp, Eric Hodgson, etc.
- **Lifetime**: 60+ users with permanent access

---

## Step 4: Verify the Import

After importing, check:

### 1. User Count
```sql
SELECT COUNT(*) FROM auth.users;
```

### 2. Purchase Count
```sql
SELECT COUNT(*), status FROM purchases GROUP BY status;
```

### 3. Active Access Grants
```sql
SELECT COUNT(*) FROM user_app_access WHERE is_active = true;
```

### 4. Active Subscriptions
```sql
SELECT COUNT(*), status FROM subscription_status GROUP BY status;
```

---

## Expected Results

After successful import:

- **Users**: 30-40 new accounts created
- **Purchases**: 95-100 completed purchases recorded
- **Access Grants**: 200-300 app access records (multiple apps per user)
- **Subscriptions**: 30-35 active subscription tracking records

---

## Need Help?

If you encounter errors:
1. Check the browser console (F12)
2. Check Supabase logs in the Dashboard
3. Verify migrations were applied successfully
4. Ensure Edge Function is deployed

Would you like me to help execute any of these steps?
