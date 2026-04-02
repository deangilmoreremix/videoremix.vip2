# CSV Import Instructions for Supabase

## Overview
This guide explains how to import your CSV user data (`users_to_import.csv`) into Supabase using the provided tools.

## Current Status
✅ **Database schema is already applied** (profiles, products_catalog, purchases, user_app_access tables exist)

## Recommended Approach: Use the Node.js Processing Script

You already have a working Node.js script: `process-user-purchases.cjs` that handles the complete import process.

### Step 1: Prepare Your CSV
Your `users_to_import.csv` file is already in the correct format:
- Columns: first_name,last_name,email,total_spend,total_orders,last_purchase,segment,products_purchased
- products_purchased column contains pipe-separated product names (e.g., "ProductA|ProductB|ProductC")
- Uses "nan" or empty value for users with no products purchased

### Step 2: Run the Processing Script
```bash
node process-user-purchases.cjs /workspaces/videoremix.vip2/users_to_import.csv
```

### Step 3: Monitor the Output
The script will show:
- Users created vs. found (existing)
- Products matched and processed
- Purchase records created
- App access grants granted
- Any errors or warnings

### Step 4: Verify Results
After running, check the summary output for counts of:
- 👤 Users created
- 👥 Users found (existing)
- 🛒 Purchases processed
- 🔐 Access grants
- ❌ Errors

## Alternative: SQL Import Method

If you prefer to use SQL directly:

### Option A: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor → New Query
2. Paste the contents of `import_users_from_csv_fixed.sql`
3. **IMPORTANT**: You need to load your CSV data into the staging table first
   - Either use the Supabase dashboard's "Import Data" feature on a regular table
   - Or manually insert sample data for testing
4. Click Run

### Option B: Manual Table Loading
1. Create staging table:
   ```sql
   CREATE TEMP TABLE stg_user_import (
       first_name TEXT,
       last_name TEXT,
       email TEXT,
       total_spend TEXT,
       total_orders TEXT,
       last_purchase TEXT,
       segment TEXT,
       products_purchased TEXT
   );
   ```
2. Load your CSV data into this table (via dashboard import or manual INSERTs)
3. Run the SQL script from `import_users_from_csv_fixed.sql`

## Expected Results

After successful import:
- **Users**: New accounts created in both `auth.users` and `public.profiles` (existing users updated)
- **Purchases**: Records created in `public.purchases` for each user/product combination
- **Access Grants**: Records created in `public.user_app_access` based on what apps each product provides
- **Duplicates Prevented**: The script avoids creating duplicate users, purchases, or access grants

## Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check recent profiles
SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check recent purchases from import
SELECT COUNT(*) FROM public.purchases WHERE platform = 'stripe' AND processed_at > NOW() - INTERVAL '1 hour';

-- Check recent app access grants
SELECT COUNT(*) FROM public.user_app_access WHERE created_at > NOW() - INTERVAL '1 hour';

-- Sample user with their apps
SELECT pa.email, uaa.app_slug 
FROM public.profiles pa
JOIN public.user_app_access uaa ON pa.user_id = uaa.user_id
WHERE pa.created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

## Troubleshooting

- **Product not found warnings**: Check that product names in your CSV match those in `public.products_catalog`
- **No progress**: The script shows processing updates every 50 users
- **Errors**: Check the console output for specific error messages
- **Performance**: For very large files, consider processing in smaller batches

## Files Available
- `process-user-purchases.cjs` - Main processing script (Node.js)
- `import_users_from_csv_fixed.sql` - SQL alternative
- `users_to_import.csv` - Your data file
- `README_IMPORT.md` - Technical details (this file)