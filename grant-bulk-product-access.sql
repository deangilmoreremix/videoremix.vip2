-- ============================================================================
-- Grant Bulk Product Access Migration
-- ============================================================================
-- This SQL grants product access to users imported via the bulk import script
-- Run this AFTER running bulk-create-auth-users.js
-- ============================================================================

-- First, let's see what products we have and how they map to apps
SELECT 'Products in import_user_records' as info, product_name, count(*) as cnt
FROM import_user_records
WHERE product_name IS NOT NULL AND product_name != ''
GROUP BY product_name
ORDER BY cnt DESC;

-- Check existing user_app_access
SELECT 'Current user_app_access entries' as info, count(*) as total_rows FROM user_app_access;

-- ============================================================================
-- Function to grant access based on product name patterns
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_access_for_imported_users()
RETURNS void AS $$
DECLARE
  rec RECORD;
  app_slug TEXT;
BEGIN
  -- Grant access for each unique product-user combination
  FOR rec IN 
    SELECT DISTINCT 
      irr.user_id,
      irr.customer_email,
      irr.product_name
    FROM import_user_records irr
    LEFT JOIN user_app_access uaa ON uaa.user_id = irr.user_id
    WHERE irr.user_id IS NOT NULL
      AND irr.product_name IS NOT NULL
      AND irr.product_name != ''
      AND (
        uaa.id IS NULL 
        OR uaa.app_slug NOT IN (
          SELECT app_slug FROM products_catalog WHERE product_name = irr.product_name
        )
      )
  LOOP
    -- Map product to app
    app_slug := (
      SELECT app_slug FROM products_catalog 
      WHERE lower(product_name) LIKE '%' || lower(rec.product_name) || '%'
      OR lower(rec.product_name) LIKE '%' || lower(product_name) || '%'
      LIMIT 1
    );
    
    -- If no mapping found, try common patterns
    IF app_slug IS NULL THEN
      IF lower(rec.product_name) LIKE '%personalizer%' THEN
        app_slug := 'personalizer';
      ELSIF lower(rec.product_name) LIKE '%smartvideo%' THEN
        app_slug := 'smartvideo';
      ELSIF lower(rec.product_name) LIKE '%social media%' OR lower(rec.product_name) LIKE '%social_video%' THEN
        app_slug := 'social_video';
      END IF;
    END IF;
    
    -- Grant access if app found
    IF app_slug IS NOT NULL THEN
      -- Check if already has access
      IF NOT EXISTS (
        SELECT 1 FROM user_app_access 
        WHERE user_id = rec.user_id AND app_slug = grant_access_for_imported_users.app_slug
      ) THEN
        INSERT INTO user_app_access (user_id, app_slug, granted_via_product, access_source, is_active, granted_at)
        VALUES (rec.user_id, app_slug, rec.product_name, 'bulk_import', true, now());
        RAISE NOTICE 'Granted % access to user % via product %', app_slug, rec.customer_email, rec.product_name;
      END IF;
    ELSE
      RAISE WARNING 'No app mapping found for product: %', rec.product_name;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function
SELECT grant_access_for_imported_users();

-- Verify access was granted
SELECT 
  uaa.app_slug,
  COUNT(*) as access_count
FROM user_app_access uaa
GROUP BY uaa.app_slug
ORDER BY access_count DESC;

-- Show users with no access (for investigation)
SELECT 
  p.email,
  irr.product_name
FROM import_user_records irr
JOIN profiles p ON p.id = irr.user_id
LEFT JOIN user_app_access uaa ON uaa.user_id = irr.user_id
WHERE uaa.id IS NULL
  AND irr.user_id IS NOT NULL
GROUP BY p.email, irr.product_name;

-- Cleanup: Drop the helper function
DROP FUNCTION IF EXISTS grant_access_for_imported_users();
