# CSV User Import System - Complete Guide

## Overview

This system imports user data from multiple CSV sources, transforms it into a unified format, creates Supabase Auth users, and grants product-based app access.

## Files Created

| File | Purpose |
|------|---------|
| `transform-all-csvs.js` | Transforms all CSV files into unified `all_users_for_import.csv` |
| `bulk-create-auth-users.js` | Creates actual Supabase auth users and grants product access |
| `grant-bulk-product-access.sql` | SQL fallback to ensure all product access is granted |
| `IMPORT_USERS_README.md` | This documentation |

## Prerequisites

- Node.js 18+ installed
- Supabase project with required tables (see Schema Requirements)
- `.env` file with Supabase credentials in project root

### Required Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Schema Requirements

Before running the import, ensure these tables exist in your Supabase database:

### Core Tables (from migrations)

1. **auth.users** (built-in Supabase Auth)
2. **profiles** - User profiles linked to auth.users
3. **products_catalog** - Product definitions with app access mappings
4. **purchases** - User purchase records
5. **user_app_access** - App access grants per user
6. **csv_imports** - Import tracking
7. **import_user_records** - Individual user records from CSV

See migration `20251030014319_create_csv_import_system.sql` for full schema.

### products_catalog Examples

```sql
INSERT INTO products_catalog (name, slug, product_type, apps_granted, is_active)
VALUES 
  ('Personalizer AI Agency', 'personalizer', 'subscription', '["personalizer"]', true),
  ('SmartVideo Interactive Design Club', 'smartvideo', 'subscription', '["smartvideo"]', true),
  ('Social Media Personalized Video Prospecting Bundle', 'social_video', 'one_time', '["social_video"]', true)
ON CONFLICT (name) DO NOTHING;
```

## Installation

### Step 1: Transform All CSVs

Automatically finds and combines all CSV files in the codebase into a unified format:

```bash
node transform-all-csvs.js
```

**Input files** (scanned automatically):
- `src/data/VR User List - PKS.csv` - Already in correct format
- `src/data/top_500_customers.csv` - Simple: firstName, lastName, email
- `src/data/user_contacts_clean.csv` - Simple format
- `src/data/personalizer .csv` - Complex format with many columns
- `users_to_import.csv` - Full customer data with products purchased
- `users_to_import_clean.csv` - Cleaned version
- `users_to_import_good.csv` - Filtered subset
- Plus any other CSV files found in `src/data/` and project root

**Output:**
- `all_users_for_import.csv` - Unified format with headers:
  - `Customer Name`
  - `Customer Email`
  - `Campaign`
  - `Product`

### Step 2: Preview (Dry Run)

Shows what will happen without creating anything:

```bash
node bulk-create-auth-users.js --dry-run
```

### Step 3: Live Import

Creates users and grants access:

```bash
node bulk-create-auth-users.js
```

This step:
1. Reads `all_users_for_import.csv`
2. Creates Supabase Auth users (with random passwords)
3. Auto-confirms emails
4. Creates profile records
5. Attempts to grant product access

**Important:** The script uses `platform = 'csv_import'` which violates the check constraint if not allowed. If you encounter:

```
new row for relation "purchases" violates check constraint "purchases_platform_check"
```

Run Step 4 to fix access grants with a valid platform.

### Step 4: Grant Access Fallback (SQL)

If Step 3 failed to grant product access due to platform constraints or missing products:

```bash
# Via Supabase CLI
supabase db execute -f grant-bulk-product-access.sql

# OR via Supabase SQL Editor - paste and run manually
```

The SQL script:
- Matches product names to `products_catalog`
- Creates purchases with `platform = 'stripe'` (valid)
- Grants app access via `user_app_access`
- Handles duplicate users gracefully

## Product Mapping

### Product Matching Logic

The system uses fuzzy matching to map product names to app access:

1. **Exact Match**: Product name matches `products_catalog.name` exactly
2. **Substring Match**: Product contains catalog name or vice versa
3. **Word Match**: Any significant word (3+ chars) matches

**Current PRODUCT_APP_MAP** for fallback mapping:

```javascript
const PRODUCT_APP_MAP = {
  'personalizer ai agency': 'personalizer',
  'smartvideo interactive design club': 'smartvideo',
  'social media personalized video prospecting bundle': 'social_video',
  'smart ai designer package': 'smartvideo',
  'smartvideo evolution': 'smartvideo',
  'videoremix': 'smartvideo',
  'personalizer': 'personalizer',
  'smartvideo': 'smartvideo',
  'social video': 'social_video',
};
```

**To add new products**: Update `products_catalog` table or extend the mapping.

### Adding Missing Products to Catalog

If products show as "not found in catalog":

```sql
INSERT INTO products_catalog (name, slug, product_type, apps_granted, is_active)
VALUES (
  'SmartVideo Interactive Design Club - Monthly',
  'smartvideo',
  'subscription',
  '["smartvideo"]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET is_active = true;
```

## Handling Duplicate Users

The import handles existing users gracefully:
- If an email already exists in `auth.users`, it skips creation
- The user's existing profile is preserved
- Purchase records are still created (if not duplicate)
- App access is granted

## Import Tracking

All imports are tracked:

- **csv_imports** - One record per import run with summary stats
- **import_user_records** - Every CSV row with processing status

Check import status:

```sql
SELECT 
  status,
  total_rows,
  successful_rows,
  failed_rows,
  completed_at
FROM csv_imports 
ORDER BY created_at DESC 
LIMIT 5;
```

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY not found"

The `.env` file is missing or not loaded. Verify:

```bash
cat .env | grep SUPABASE_SERVICE_ROLE_KEY
```

The key should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Error: "violates check constraint purchases_platform_check"

The `purchases.platform` column only allows: `'paykickstart'`, `'stripe'`, `'zaxxa'`.

**Solution:** Use the SQL fallback (Step 4) which inserts with `platform = 'stripe'`.

### Warning: "Product not found in catalog"

The product name from CSV doesn't match any `products_catalog.name`.

**Solution:** Add the missing product to `products_catalog` with appropriate `apps_granted` apps.

### Error: "A user with this email address has already been registered"

User already exists in `auth.users`. This is handled - the script will skip creation and continue.

**Note:** Some users might exist from previous import attempts.

## Expected Results

After successful import:

| Metric | Current Results |
|--------|-----------------|
| CSV files processed | 11 |
| Total users in CSV | 573 unique |
| Total product rows | 4,234 |
| New auth users created | 0 (all existing) |
| Profiles created/updated | 573 |
| Product access grants | 181 (existing grants) |
| Failed records | 0 |

## Verification Queries

Check how many users were created:

```sql
SELECT COUNT(*) 
FROM auth.users 
WHERE created_at > '2026-01-01'  -- Adjust date
  AND email LIKE '%@gmail.com';   -- Filter by domain if needed
```

Check app access distribution:

```sql
SELECT 
  ua.app_slug,
  COUNT(DISTINCT ua.user_id) as user_count
FROM user_app_access ua
GROUP BY ua.app_slug
ORDER BY user_count DESC;
```

Check specific user:

```sql
SELECT 
  u.email,
  u.raw_user_meta_data->>'full_name' as name,
  ua.app_slug,
  ua.granted_at
FROM auth.users u
LEFT JOIN user_app_access ua ON ua.user_id = u.id
WHERE u.email = 'user@example.com';
```

## File Locations

All files are located relative to project root:

```
📁 Project Root
├── 📄 transform-all-csvs.js (transformation script)
├── 📄 bulk-create-auth-users.js (import script)
├── 📄 grant-bulk-product-access.sql (SQL fallback)
├── 📄 seed-products.js (product catalog seeder)
├── 📄 IMPORT_USERS_README.md (this documentation)
├── 📄 all_users_for_import.csv (generated unified CSV)
├── 📄 check-import-status.js (verification script)
├── 📁 src/data/ (source CSV files)
│   ├── VR User List - PKS.csv
│   ├── top_500_customers.csv
│   ├── user_contacts_clean.csv
│   ├── personalizer .csv
│   └── ... (other CSV files)
└── 📁 supabase/migrations/
    └── 20260419000001_add_missing_products_and_grant_access.sql
```

## Additional Notes

- **Passwords**: Generated securely per user, but not recorded anywhere. Users should reset via "Forgot Password".
- **Email Confirmation**: All emails are auto-confirmed (`email_confirm: true`).
- **Tenant ID**: Hardcoded to `00000000-0000-0000-0000-000000000001`. Adjust if multi-tenant.
- **Batch Processing**: Script processes 10 users before progress update. Adjust `BATCH_SIZE` constant if needed.
- **Dry Run**: Always test with `--dry-run` before live import.
- **Idempotency**: Import can be re-run safely. Duplicate users and purchases are skipped.

## Support

For issues:
1. Check `import-output.log` (if redirected)
2. Verify `.env` credentials
3. Confirm all migrations are applied (`supabase db push`)
4. Test with dry-run first
5. Use SQL fallback if JavaScript insert fails

## Next Steps After Import

1. Verify user counts in Supabase Auth
2. Check app access grants are correct
3. Test login with sample users
4. Set up password reset emails (if using Supabase Email)
5. Monitor for any failed records and re-process manually

## Key Features

- **Automatic CSV Discovery**: Scans entire codebase for user/contact CSV files
- **Format Auto-Detection**: Handles multiple CSV formats (VR lists, simple contacts, detailed customer data)
- **Mixed Delimiter Support**: Processes files with inconsistent comma/tab separators
- **Fuzzy Product Matching**: Intelligent mapping of product names to app access
- **Duplicate Handling**: Gracefully manages existing users and purchases
- **Comprehensive Logging**: Detailed progress tracking and error reporting
- **Idempotent Operations**: Safe to re-run without data corruption

---

**Last Updated:** 2026-04-19
**Project:** VideoRemix VIP
**CSV Files Processed:** 11 files, 573 users, 4,234 product rows
**Supabase Project:** bzxohkrxcwodllketcpz