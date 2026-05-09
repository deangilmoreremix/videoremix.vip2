-- Grant Bulk Product Access Fallback
-- =====================================
-- This script grants app access to users based on their imported product purchases.
-- Use this if the initial import script failed to grant access due to missing products
-- or platform constraint violations.
--
-- HOW TO USE:
-- 1. Open Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
--
-- OR via CLI:
-- supabase db execute -f grant-bulk-product-access.sql
--
-- WHAT IT DOES:
-- 1. Identifies users from import_user_records with 'pending' or 'failed' status
-- 2. Matches product names to products_catalog (case-insensitive fuzzy match)
-- 3. Creates missing purchases with correct platform (stripe)
-- 4. Grants app access based on products_catalog.apps_granted
-- 5. Updates import_user_records status to 'processed' on success

-- First, let's see what products are in our catalog
-- This helps you understand what product names to match
SELECT id, name, apps_granted FROM products_catalog WHERE is_active = true ORDER BY name;

-- Let's also see what unique products we have in the import
SELECT DISTINCT product_name, COUNT(*) as user_count 
FROM import_user_records 
WHERE processing_status IN ('pending', 'failed')
GROUP BY product_name 
ORDER BY user_count DESC;

-- Main grant access procedure
DO $$
DECLARE
  v_user RECORD;
  v_product_record RECORD;
  v_purchase_id uuid;
  v_app_slug text;
  v_access_count integer := 0;
  v_user_count integer := 0;
  v_total_products integer := 0;
BEGIN
  RAISE NOTICE 'Starting bulk product access grant...';
  
  -- Get distinct users with pending/failed records
  FOR v_user IN 
    SELECT DISTINCT 
      iur.user_id,
      iur.customer_email,
      iur.customer_name
    FROM import_user_records iur
    WHERE iur.processing_status IN ('pending', 'failed')
      AND iur.user_id IS NOT NULL
    ORDER BY iur.customer_email
  LOOP
    v_user_count := v_user_count + 1;
    
    -- Process each product for this user
    FOR v_product_record IN 
      SELECT DISTINCT 
        iur.product_name,
        pc.id as product_id,
        pc.name as catalog_name,
        pc.apps_granted
      FROM import_user_records iur
      LEFT JOIN products_catalog pc 
        ON LOWER(TRIM(iur.product_name)) = LOWER(TRIM(pc.name))
        OR LOWER(TRIM(iur.product_name)) LIKE '%' || LOWER(TRIM(pc.name)) || '%'
        OR LOWER(TRIM(pc.name)) LIKE '%' || LOWER(TRIM(iur.product_name)) || '%'
      WHERE iur.user_id = v_user.user_id
        AND iur.processing_status IN ('pending', 'failed')
        AND pc.id IS NOT NULL  -- Only matched products
      LIMIT 10  -- Prevent runaway loops
    LOOP
      v_total_products := v_total_products + 1;
      
      -- Check if purchase already exists
      SELECT id INTO v_purchase_id FROM purchases 
      WHERE user_id = v_user.user_id 
        AND product_id = v_product_record.product_id
      LIMIT 1;
      
      IF v_purchase_id IS NULL THEN
        -- Create purchase
        INSERT INTO purchases (
          user_id, 
          email, 
          platform, 
          platform_transaction_id,
          platform_customer_id,
          product_id, 
          product_name, 
          amount, 
          currency, 
          status, 
          is_subscription,
          purchase_date,
          processed,
          processed_at,
          tenant_id
        ) VALUES (
          v_user.user_id,
          v_user.customer_email,
          'stripe',  -- Default platform for CSV imports
          'import_' || gen_random_uuid()::text,
          'import_customer_' || gen_random_uuid()::text,
          v_product_record.product_id,
          v_product_record.catalog_name,
          0,  -- Amount unknown for imports
          'USD',
          'completed',
          false,
          NOW(),
          true,
          NOW(),
          '00000000-0000-0000-0000-000000000001'
        ) RETURNING id INTO v_purchase_id;
      END IF;
      
      -- Grant app access for each app in apps_granted array
      IF v_product_record.apps_granted IS NOT NULL AND jsonb_array_length(v_product_record.apps_granted) > 0 THEN
        FOR v_app_slug IN 
          SELECT value::text 
          FROM jsonb_array_elements(v_product_record.apps_granted)
        LOOP
          -- Upsert app access (avoid duplicates)
          INSERT INTO user_app_access (
            user_id,
            app_slug,
            purchase_id,
            access_type,
            is_active,
            granted_at,
            tenant_id
          ) VALUES (
            v_user.user_id,
            v_app_slug,
            v_purchase_id,
            'lifetime',
            true,
            NOW(),
            '00000000-0000-0000-0000-000000000001'
          )
          ON CONFLICT (user_id, app_slug) 
          DO UPDATE SET 
            is_active = true,
            updated_at = NOW();
            
          v_access_count := v_access_count + 1;
        END LOOP;
      END IF;
      
      -- Update the import record status
      UPDATE import_user_records 
      SET processing_status = 'processed',
          processed_at = NOW()
      WHERE user_id = v_user.user_id 
        AND product_name = v_product_record.product_name;
        
    END LOOP;
    
    -- Optional: Update any records that still don't match any product
    UPDATE import_user_records 
    SET processing_status = 'failed',
        error_message = 'Product not found in catalog'
    WHERE user_id = v_user.user_id 
      AND processing_status = 'pending';
      
  END LOOP;
  
  RAISE NOTICE 'Bulk grant complete: % users processed, % products matched, % access grants created', 
    v_user_count, v_total_products, v_access_count;
END;
$$;

-- Verify results
SELECT 
  COUNT(DISTINCT user_id) as users_with_access,
  COUNT(*) as total_access_grants,
  COUNT(DISTINCT app_slug) as unique_apps
FROM user_app_access 
WHERE granted_at > NOW() - INTERVAL '1 hour';

-- Show any remaining unprocessed records
SELECT 
  processing_status,
  COUNT(*) as count,
  array_agg(DISTINCT product_name) as sample_products
FROM import_user_records 
GROUP BY processing_status;

-- ============================================================
-- MANUAL MAPPING (If fuzzy matching doesn't work)
-- ============================================================
-- If the above didn't match all products, you may need to manually
-- add products to the products_catalog table first.
--
-- Example: Add a missing product
-- INSERT INTO products_catalog (name, slug, product_type, apps_granted, is_active)
-- VALUES (
--   'SmartVideo Interactive Design Club - Monthly',
--   'smartvideo',
--   'subscription',
--   '["smartvideo"]'::jsonb,
--   true
-- ) ON CONFLICT (name) DO UPDATE SET is_active = true;
--
-- After adding missing products, re-run the DO block above.

-- ============================================================
-- USEFUL QUERIES
-- ============================================================
-- See what access each user has:
-- SELECT 
--   u.customer_email,
--   u.customer_name,
--   u.product_name,
--   pc.name as matched_product,
--   ua.app_slug,
--   ua.granted_at
-- FROM import_user_records u
-- LEFT JOIN products_catalog pc ON LOWER(TRIM(u.product_name)) = LOWER(TRIM(pc.name))
-- LEFT JOIN user_app_access ua ON ua.user_id = u.user_id
-- WHERE u.processing_status = 'processed'
-- ORDER BY u.customer_email;

-- List users with no app access (products matched but no apps_granted):
-- SELECT DISTINCT iur.customer_email, iur.product_name, pc.apps_granted
-- FROM import_user_records iur
-- JOIN products_catalog pc ON LOWER(TRIM(iur.product_name)) = LOWER(TRIM(pc.name))
-- WHERE iur.processing_status = 'processed'
--   AND (pc.apps_granted IS NULL OR jsonb_array_length(pc.apps_granted) = 0);