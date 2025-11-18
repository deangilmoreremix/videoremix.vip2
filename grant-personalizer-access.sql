-- ============================================================================
-- Grant Personalizer Access to All Purchasers
-- ============================================================================
--
-- This SQL script grants app access to users based on CSV purchase data.
-- Run this in the Supabase SQL Editor after importing the CSV data.
--
-- IMPORTANT: This assumes purchase data has been imported into the
-- `import_user_records` table via CSV import.
--
-- If you haven't imported the CSV yet, you need to either:
-- 1. Use the admin dashboard CSV import feature, OR
-- 2. Manually insert records into import_user_records
-- ============================================================================

-- First, let's create a helper function to grant access based on product names
CREATE OR REPLACE FUNCTION grant_personalizer_access_from_csv()
RETURNS TABLE (
  processed_count INT,
  success_count INT,
  failed_count INT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed INT := 0;
  v_success INT := 0;
  v_failed INT := 0;
  v_details JSONB := '[]'::jsonb;
  v_user_id UUID;
  v_product_name TEXT;
  v_product_catalog RECORD;
  v_app_slug TEXT;
  v_access_type TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_email TEXT;
BEGIN
  -- Loop through all Personalizer purchase records from CSV imports
  FOR v_user_email, v_product_name IN
    SELECT DISTINCT
      LOWER(TRIM(customer_email)) as email,
      TRIM(product_name) as product
    FROM import_user_records
    WHERE LOWER(product_name) LIKE '%personalizer%'
      AND processing_status IN ('pending', 'failed')
  LOOP
    v_processed := v_processed + 1;

    -- Find the user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = v_user_email
    LIMIT 1;

    IF v_user_id IS NULL THEN
      -- Try to find in profiles table
      SELECT user_id INTO v_user_id
      FROM profiles
      WHERE LOWER(email) = v_user_email
      LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
      v_failed := v_failed + 1;
      v_details := v_details || jsonb_build_object(
        'email', v_user_email,
        'product', v_product_name,
        'status', 'failed',
        'reason', 'User not found'
      );
      CONTINUE;
    END IF;

    -- Find matching product in catalog
    SELECT * INTO v_product_catalog
    FROM products_catalog
    WHERE is_active = true
      AND (
        LOWER(name) = LOWER(v_product_name)
        OR LOWER(name) LIKE '%' || LOWER(REGEXP_REPLACE(v_product_name, '\s*\([^)]*\)', '', 'g')) || '%'
        OR LOWER(v_product_name) LIKE '%' || LOWER(name) || '%'
      )
    ORDER BY
      CASE
        WHEN LOWER(name) = LOWER(v_product_name) THEN 1
        ELSE 2
      END
    LIMIT 1;

    IF v_product_catalog.id IS NULL THEN
      v_failed := v_failed + 1;
      v_details := v_details || jsonb_build_object(
        'email', v_user_email,
        'product', v_product_name,
        'status', 'failed',
        'reason', 'Product not found in catalog'
      );
      CONTINUE;
    END IF;

    -- Determine access type
    v_access_type := CASE
      WHEN LOWER(v_product_name) LIKE '%monthly%' THEN 'subscription'
      WHEN LOWER(v_product_name) LIKE '%yearly%' THEN 'subscription'
      WHEN LOWER(v_product_name) LIKE '%lifetime%' THEN 'lifetime'
      ELSE 'lifetime'
    END;

    -- Calculate expiration date
    v_expires_at := CASE
      WHEN LOWER(v_product_name) LIKE '%monthly%' THEN now() + INTERVAL '1 month'
      WHEN LOWER(v_product_name) LIKE '%yearly%' THEN now() + INTERVAL '1 year'
      ELSE NULL -- Lifetime doesn't expire
    END;

    -- Grant access to each app
    FOR v_app_slug IN
      SELECT jsonb_array_elements_text(v_product_catalog.apps_granted)
    LOOP
      -- Insert or update access record
      INSERT INTO user_app_access (
        user_id,
        app_slug,
        access_type,
        granted_at,
        expires_at,
        is_active
      )
      VALUES (
        v_user_id,
        v_app_slug,
        v_access_type,
        now(),
        v_expires_at,
        true
      )
      ON CONFLICT (user_id, app_slug)
      DO UPDATE SET
        is_active = true,
        expires_at = EXCLUDED.expires_at,
        updated_at = now();
    END LOOP;

    -- Mark import record as processed
    UPDATE import_user_records
    SET
      processing_status = 'processed',
      processed_at = now(),
      user_id = v_user_id
    WHERE LOWER(TRIM(customer_email)) = v_user_email
      AND TRIM(product_name) = v_product_name;

    v_success := v_success + 1;
    v_details := v_details || jsonb_build_object(
      'email', v_user_email,
      'product', v_product_name,
      'catalog_product', v_product_catalog.name,
      'apps_granted', jsonb_array_length(v_product_catalog.apps_granted),
      'status', 'success'
    );

  END LOOP;

  RETURN QUERY SELECT v_processed, v_success, v_failed, v_details;
END;
$$;

-- ============================================================================
-- STEP 1: Review what will be processed
-- ============================================================================
-- Run this first to see what records will be processed

SELECT
  LOWER(TRIM(customer_email)) as email,
  TRIM(product_name) as product_name,
  COUNT(*) as purchase_count,
  MAX(created_at) as last_purchase
FROM import_user_records
WHERE LOWER(product_name) LIKE '%personalizer%'
  AND processing_status IN ('pending', 'failed')
GROUP BY LOWER(TRIM(customer_email)), TRIM(product_name)
ORDER BY purchase_count DESC;

-- ============================================================================
-- STEP 2: Check which products will map to catalog
-- ============================================================================

SELECT DISTINCT
  iur.product_name as csv_product,
  pc.name as catalog_product,
  pc.slug as catalog_slug,
  jsonb_array_length(pc.apps_granted) as apps_count,
  CASE
    WHEN pc.id IS NULL THEN '❌ NO MATCH'
    ELSE '✅ MAPPED'
  END as mapping_status
FROM import_user_records iur
LEFT JOIN products_catalog pc ON (
  pc.is_active = true
  AND (
    LOWER(pc.name) = LOWER(iur.product_name)
    OR LOWER(pc.name) LIKE '%' || LOWER(REGEXP_REPLACE(iur.product_name, '\s*\([^)]*\)', '', 'g')) || '%'
    OR LOWER(iur.product_name) LIKE '%' || LOWER(pc.name) || '%'
  )
)
WHERE LOWER(iur.product_name) LIKE '%personalizer%'
  AND iur.processing_status IN ('pending', 'failed')
ORDER BY csv_product;

-- ============================================================================
-- STEP 3: Check which users exist vs need to sign up
-- ============================================================================

WITH csv_emails AS (
  SELECT DISTINCT LOWER(TRIM(customer_email)) as email
  FROM import_user_records
  WHERE LOWER(product_name) LIKE '%personalizer%'
    AND processing_status IN ('pending', 'failed')
),
existing_users AS (
  SELECT LOWER(email) as email, id
  FROM auth.users
  WHERE LOWER(email) IN (SELECT email FROM csv_emails)
)
SELECT
  ce.email,
  CASE
    WHEN eu.id IS NOT NULL THEN '✅ User exists'
    ELSE '⚠️ Needs to sign up'
  END as user_status,
  eu.id as user_id
FROM csv_emails ce
LEFT JOIN existing_users eu ON eu.email = ce.email
ORDER BY user_status, ce.email;

-- ============================================================================
-- STEP 4: Run the access grant process
-- ============================================================================
-- IMPORTANT: Only run this after reviewing the above queries!
-- This will grant access to all matched users.

SELECT * FROM grant_personalizer_access_from_csv();

-- ============================================================================
-- STEP 5: Verify the results
-- ============================================================================

-- Check how many access grants were created
SELECT
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_access_grants,
  access_type,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as with_expiration,
  COUNT(*) FILTER (WHERE expires_at IS NULL) as lifetime
FROM user_app_access
WHERE app_slug IN (
  SELECT DISTINCT jsonb_array_elements_text(apps_granted)
  FROM products_catalog
  WHERE name LIKE '%Personalizer%'
)
GROUP BY access_type
ORDER BY access_type;

-- Check specific apps granted
SELECT
  app_slug,
  COUNT(DISTINCT user_id) as users_with_access,
  COUNT(*) FILTER (WHERE access_type = 'lifetime') as lifetime_users,
  COUNT(*) FILTER (WHERE access_type = 'subscription') as subscription_users
FROM user_app_access
WHERE app_slug IN (
  SELECT DISTINCT jsonb_array_elements_text(apps_granted)
  FROM products_catalog
  WHERE name LIKE '%Personalizer%'
)
GROUP BY app_slug
ORDER BY users_with_access DESC;

-- Check import processing status
SELECT
  processing_status,
  COUNT(*) as record_count,
  COUNT(DISTINCT customer_email) as unique_emails
FROM import_user_records
WHERE LOWER(product_name) LIKE '%personalizer%'
GROUP BY processing_status
ORDER BY processing_status;

-- ============================================================================
-- STEP 6: Handle users who need to sign up
-- ============================================================================
-- This query shows which emails need accounts

WITH csv_emails AS (
  SELECT DISTINCT
    LOWER(TRIM(customer_email)) as email,
    customer_name,
    STRING_AGG(DISTINCT product_name, ', ') as products_purchased
  FROM import_user_records
  WHERE LOWER(product_name) LIKE '%personalizer%'
  GROUP BY LOWER(TRIM(customer_email)), customer_name
),
existing_users AS (
  SELECT LOWER(email) as email
  FROM auth.users
)
SELECT
  ce.email,
  ce.customer_name,
  ce.products_purchased
FROM csv_emails ce
LEFT JOIN existing_users eu ON eu.email = ce.email
WHERE eu.email IS NULL
ORDER BY ce.email;

-- ============================================================================
-- CLEANUP: Drop the helper function (optional)
-- ============================================================================
-- Run this only if you want to remove the function after use
-- DROP FUNCTION IF EXISTS grant_personalizer_access_from_csv();
