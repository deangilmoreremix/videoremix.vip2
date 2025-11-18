# Grant Personalizer Access to All Purchasers

This guide explains how to grant app access to all users who purchased Personalizer products from your CSV data.

## Overview

The system will:
1. Parse the CSV file containing purchase records
2. Match product names to the product catalog
3. Find users by email addresses
4. Grant access to appropriate apps based on their purchases
5. Handle both one-time and subscription purchases

## Prerequisites

- Access to Supabase dashboard
- CSV file with purchase data (already in `src/data/personalizer .csv`)
- Service role key for your Supabase project

## Method 1: Using the Automated Script (Recommended)

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to Project Settings > API
3. Copy the `service_role` key (NOT the anon key)
4. Update your `.env` file with the correct service role key

### Step 2: Run the Script

```bash
# Make sure you have the correct SUPABASE_SERVICE_ROLE_KEY in .env
node grant-personalizer-access.mjs "./src/data/personalizer .csv"
```

The script will:
- ✅ Parse all 109 purchase records from the CSV
- ✅ Identify 8 unique Personalizer products
- ✅ Match each product to the catalog
- ✅ Find users by email
- ✅ Grant access to appropriate apps
- ✅ Generate a detailed report

### What the Script Does

1. **Product Detection**: Finds these Personalizer products in your CSV:
   - Personalizer AI Agency (Monthly) - 42 purchases
   - Personalizer AI Agency (Lifetime) - 47 purchases
   - Personalizer AI Agency (Yearly) - 8 purchases
   - Personalizer AI Writing Toolkit (Lifetime) - 5 purchases
   - Personalizer Advanced Text-Video AI Editor (Lifetime) - 4 purchases
   - Personalizer URL Video Generation Templates & Editor (Lifetime) - 1 purchase
   - Personalizer Interactive Shopping (Lifetime) - 1 purchase
   - Personalizer AI Video and Image Transformer (Yearly) - 1 purchase

2. **Product Mapping**: Automatically maps CSV products to catalog:
   - Monthly/Yearly → Core Personalizer tools
   - Lifetime → All Personalizer tools
   - Individual toolkits → Specific apps only

3. **User Matching**: Finds users by email (case-insensitive)

4. **Access Grant**: Creates entries in `user_app_access` table

5. **Subscription Handling**: Sets expiration dates for monthly/yearly plans

## Method 2: Manual SQL Approach

If you prefer to run SQL directly in Supabase:

### Step 1: Review Products in CSV

```sql
-- Check what products are in the system
SELECT
  name,
  slug,
  product_type,
  apps_granted,
  is_active
FROM products_catalog
WHERE name ILIKE '%personalizer%'
ORDER BY name;
```

### Step 2: Check Existing Purchases (if imported)

```sql
-- See if purchases were already imported
SELECT
  email,
  product_name,
  status,
  purchase_date
FROM purchases
WHERE product_name ILIKE '%personalizer%'
ORDER BY purchase_date DESC
LIMIT 20;
```

### Step 3: Grant Access Manually (Example)

```sql
-- Example: Grant access for a specific user
-- Replace 'user@example.com' with actual email
-- Replace 'personalizer-lifetime' with actual product slug

WITH user_info AS (
  SELECT id FROM auth.users WHERE email ILIKE 'user@example.com'
),
product_info AS (
  SELECT apps_granted FROM products_catalog WHERE slug = 'personalizer-lifetime'
)
INSERT INTO user_app_access (user_id, app_slug, access_type, granted_at, is_active)
SELECT
  user_info.id,
  jsonb_array_elements_text(product_info.apps_granted),
  'lifetime',
  now(),
  true
FROM user_info, product_info
ON CONFLICT (user_id, app_slug) DO UPDATE
SET is_active = true, updated_at = now();
```

## Method 3: Using the Import System

### Step 1: Create a CSV Import Record

Use the admin dashboard CSV import feature:

1. Go to Admin Dashboard
2. Navigate to "CSV Import" section
3. Upload `src/data/personalizer .csv`
4. Review detected products
5. Map products to apps with access tiers
6. Process the import

This approach provides:
- ✅ Visual product mapping interface
- ✅ Import history and audit trail
- ✅ Error handling and retry options
- ✅ Detailed statistics and reports

## Verification

After granting access, verify it worked:

```sql
-- Check access grants for a specific user
SELECT
  uaa.app_slug,
  uaa.access_type,
  uaa.granted_at,
  uaa.expires_at,
  uaa.is_active,
  a.name as app_name
FROM user_app_access uaa
JOIN apps a ON a.slug = uaa.app_slug
WHERE uaa.user_id = (SELECT id FROM auth.users WHERE email ILIKE 'user@example.com')
ORDER BY uaa.granted_at DESC;
```

```sql
-- Count total Personalizer access grants
SELECT
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_grants,
  access_type
FROM user_app_access
WHERE app_slug IN (
  'voice-coach',
  'resume-amplifier',
  'personalizer-recorder',
  'personalizer-profile',
  'thumbnail-generator',
  'ai-skills-monetizer',
  'ai-signature',
  'personalizer-text-ai-editor',
  'personalizer-advanced-text-video-editor',
  'personalizer-writing-toolkit',
  'personalizer-video-image-transformer',
  'personalizer-url-video-generation'
)
GROUP BY access_type;
```

## App Access Mapping

Based on the product catalog, here's what each product grants:

### Personalizer AI Agency (Monthly)
Grants access to core tools:
- voice-coach
- resume-amplifier
- personalizer-recorder
- personalizer-profile
- thumbnail-generator
- ai-skills-monetizer
- ai-signature

### Personalizer AI Agency (Yearly)
Grants access to all core tools plus:
- personalizer-text-ai-editor
- personalizer-advanced-text-video-editor
- personalizer-writing-toolkit

### Personalizer AI Agency (Lifetime)
Grants access to everything:
- All tools from Monthly + Yearly
- personalizer-video-image-transformer
- personalizer-url-video-generation

### Individual Toolkits
- **AI Writing Toolkit**: personalizer-writing-toolkit, personalizer-text-ai-editor
- **Text-Video Editor**: personalizer-advanced-text-video-editor, personalizer-text-ai-editor
- **URL Video Generation**: personalizer-url-video-generation
- **Interactive Shopping**: interactive-shopping
- **Video & Image Transformer**: personalizer-video-image-transformer, ai-video-image

## Troubleshooting

### "User not found" errors
- Users need to create accounts with the email they used for purchase
- Access will be automatically granted when they sign up
- Alternatively, manually create accounts for them

### "No catalog match" errors
- Check if the product exists in `products_catalog` table
- Verify product names match (case-insensitive)
- Add missing products to the catalog

### "Invalid API key" errors
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check VITE_SUPABASE_URL matches your project
- Ensure keys haven't expired

### Access not working
- Check RLS policies on `user_app_access` table
- Verify app slugs match entries in `apps` table
- Test with `resolve-user-access` edge function

## Next Steps

After granting access:

1. **Test Access**: Log in as a test user and verify they see their apps
2. **Monitor Usage**: Track which apps are being accessed
3. **Handle New Purchases**: Set up webhook automation for future purchases
4. **Communication**: Notify users they now have access to their purchased tools

## Support

If you encounter issues:
1. Check the Supabase logs for errors
2. Review RLS policies
3. Verify product mappings in the database
4. Test with a single user first before bulk processing
