# CSV Import Instructions for Supabase

This script imports users from a CSV file into Supabase, handling:
1. User creation in `auth.users` and `public.profiles`
2. Product purchase processing
3. App access grants based on purchased products

## Prerequisites

1. Supabase project with the schema already applied
2. CSV file formatted as follows:
   - Columns: first_name, last_name, email, total_spend, total_orders, last_purchase, segment, products_purchased
   - products_purchased column contains pipe-separated product names (e.g., "ProductA|ProductB|ProductC")
   - Use "nan" or empty value for users with no products purchased

## Steps to Import

### Option 1: Supabase Dashboard (Recommended for most users)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `import_users_from_csv.sql`
5. **IMPORTANT**: Replace the sample INSERT statements at the bottom with your actual CSV data loading:
   - Uncomment and modify the `\copy` command to load your actual CSV file
   - OR replace the sample INSERT statements with data from your CSV
6. Click **Run**

### Option 2: Using psql Command Line

If you have psql installed and can connect to your Supabase database:

1. Save your CSV file (e.g., `users_to_import.csv`)
2. Modify the script to load your CSV:
   ```sql
   -- Uncomment and modify this line:
   \copy stg_user_import FROM '/path/to/your/users_to_import.csv' CSV HEADER;
   ```
   And comment out or remove the sample INSERT statements
3. Run the script:
   ```bash
   psql "YOUR_SUPABASE_CONNECTION_STRING" -f import_users_from_csv.sql
   ```

### Option 3: Using Supabase CLI

1. Install Supabase CLI if not already installed
2. Link to your project: `supabase link`
3. Start db push: `supabase db push` (if you need to apply schema changes first)
4. Run SQL: `supabase db execute --file import_users_from_csv.sql`

## Customizing the Script

### Tenant ID
The script uses tenant ID: `00000000-0000-0000-0000-000000000001`
- To use a different tenant, change the `tenant_id` variable declaration in the DO block

### Platform
The script sets platform to `'stripe'` for all imported purchases
- To change this, modify the `platform_const` variable declaration
- Valid values: 'stripe', 'paykickstart', 'zaxxa' (based on table constraint)

### Access Type
All imports are granted `'lifetime'` access by default
- To change this, modify the `access_type` value in the user_app_access INSERT

## Expected Results

After running the script:
- New users will be created in both `auth.users` and `public.profiles`
- Existing users (by email) will have their profiles updated
- Purchase records will be created for each user/product combination
- App access will be granted based on what apps each product provides access to
- Duplicate purchases and access grants will be prevented

## Troubleshooting

If you encounter errors:

1. **Foreign key violations**: Make sure the products in your CSV exist in `public.products_catalog`
2. **Unique constraint violations**: The script includes checks to prevent duplicates, but if you still get errors, check that your data doesn't have conflicting values
3. **Permission errors**: Ensure your service role key has sufficient permissions to insert into all the tables

## Verification

After importing, you can verify results with:

```sql
-- Check imported profiles
SELECT COUNT(*) FROM public.profiles;

-- Check purchases
SELECT COUNT(*) FROM public.purchases WHERE platform = 'stripe';

-- Check app access grants
SELECT COUNT(*) FROM public.user_app_access;

-- Check a specific user's access
SELECT pa.email, uaa.app_slug 
FROM public.profiles pa
JOIN public.user_app_access uaa ON pa.user_id = uaa.user_id
WHERE pa.email = 'user@example.com';
```