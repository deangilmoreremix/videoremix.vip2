# Bulk User Import Guide

This document describes how to import thousands of users into Supabase with proper authentication accounts and product access.

## Overview

The import process involves:
1. **Transform** all CSV source files into a unified format
2. **Create Auth Users** in Supabase Authentication
3. **Grant Product Access** based on purchased products

## Source Files

Located in `src/data/`:

| File | Rows | Format | Status |
|------|------|--------|--------|
| VR User List - PKS.csv | ~950 | Customer Name, Email, Campaign, Product | ✅ Ready |
| top_500_customers.csv | ~500 | firstName, lastName, email | To transform |
| user_contacts_clean.csv | ~53 | firstName, lastName, email | To transform |
| personalizer .csv | ~109 | Complex payment export | To transform |
| users_for_import.csv | ~4,400 | Pre-transformed (legacy) | To merge |

## Scripts

### 1. transform-all-csvs.js

Transforms all CSV files into the unified `all_users_for_import.csv` format.

```bash
node transform-all-csvs.js
```

**Output:**
- `all_users_for_import.csv` - Combined and deduplicated user data
- Shows statistics: unique users, total rows, sample data

### 2. bulk-create-auth-users.js

Creates actual Supabase Auth users and grants product access.

**Usage:**

```bash
# Dry run (preview without making changes)
node bulk-create-auth-users.js --dry-run

# Live import
node bulk-create-auth-users.js
```

**What it does:**
- Reads `all_users_for_import.csv`
- Checks if user already exists
- Creates new auth users with auto-generated passwords
- Grants product access based on purchased products
- Creates import records for tracking

**Output:**
- New Supabase auth users
- Product access in `user_app_access` table
- Import tracking in `csv_imports` and `import_user_records`

### 3. grant-bulk-product-access.sql

SQL migration to grant product access. Run this AFTER the JS script if any access was missed.

**Usage:**
```bash
# Via Supabase CLI
supabase db execute -f grant-bulk-product-access.sql

# Or paste directly into Supabase SQL Editor
```

## Process Summary

```bash
# Step 1: Transform all CSVs into unified format
node transform-all-csvs.js

# Step 2: Preview what will be created
node bulk-create-auth-users.js --dry-run

# Step 3: Create auth users and grant access
node bulk-create-auth-users.js

# Step 4: (Optional) Run SQL to ensure all access is granted
supabase db execute -f grant-bulk-product-access.sql
```

## Product to App Mapping

The scripts map products to apps based on these patterns:

| Product Pattern | App Slug |
|----------------|----------|
| personalizer | personalizer |
| smartvideo | smartvideo |
| social media / social_video | social_video |

Edit `PRODUCT_APP_MAP` in `bulk-create-auth-users.js` to add more mappings.

## Troubleshooting

### User already exists error
- The script automatically skips existing users
- New product access will still be granted

### Product access not granted
- Check that the product name matches a pattern in `PRODUCT_APP_MAP`
- Run `grant-bulk-product-access.sql` as a fallback

### Auth user creation fails
- Check Supabase quotas and limits
- Verify the service role key has admin permissions

## Verification Queries

```sql
-- Check total users in auth
SELECT count(*) FROM auth.users;

-- Check total users with profiles
SELECT count(*) FROM profiles;

-- Check product access by app
SELECT app_slug, count(*) FROM user_app_access GROUP BY app_slug;

-- Check users without any access
SELECT p.email FROM profiles p
LEFT JOIN user_app_access uaa ON uaa.user_id = p.id
WHERE uaa.id IS NULL;
```

## Notes

- Passwords are auto-generated (16 characters, mixed case, numbers, symbols)
- Users have `email_confirm: true` so they can login immediately
- Consider sending password reset emails after import for security
