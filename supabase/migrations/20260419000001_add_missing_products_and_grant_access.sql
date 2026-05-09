-- Add missing products discovered during CSV import
-- and grant app access to users based on their purchases
--
-- This migration:
-- 1. Adds products that were missing from products_catalog
-- 2. Matches import_user_records to products
-- 3. Creates purchase records for unmatched users
-- 4. Grants app access based on product mappings

BEGIN;

-- Insert missing products (all active)
INSERT INTO products_catalog (name, slug, product_type, description, apps_granted, is_active)
VALUES 
  -- Personalizer Products
  ('Personalizer AI Agency', 'personalizer', 'subscription', 'AI agency automation tool', '["personalizer"]', true),
  ('Personalizer AI Agency (Monthly)', 'personalizer', 'subscription', 'AI agency automation tool - Monthly', '["personalizer"]', true),
  ('Personalizer AI Agency (Yearly)', 'personalizer', 'subscription', 'AI agency automation tool - Yearly', '["personalizer"]', true),
  ('Personalizer AI Agency (Lifetime)', 'personalizer', 'one_time', 'AI agency automation tool - Lifetime', '["personalizer"]', true),
  ('Personalizer AI Writing Toolkit (Lifetime)', 'personalizer', 'one_time', 'AI writing toolkit lifetime', '["personalizer"]', true),
  ('Personalizer Advanced Text-Video AI Editor (Lifetime)', 'personalizer', 'one_time', 'Advanced text-video editor', '["personalizer"]', true),
  ('Personalizer Interactive Shopping (Lifetime)', 'personalizer', 'one_time', 'Interactive shopping tool', '["personalizer"]', true),

  -- SmartVideo Products
  ('SmartVideo Interactive Design Club', 'smartvideo', 'subscription', 'Video design club membership', '["smartvideo"]', true),
  ('SmartVideo Interactive Design Club - Monthly', 'smartvideo', 'subscription', 'Video design club - Monthly', '["smartvideo"]', true),
  ('SmartVideo Ultimate', 'smartvideo', 'one_time', 'Ultimate smartvideo package', '["smartvideo"]', true),
  ('SmartVideo Ultra - Monthly', 'smartvideo', 'subscription', 'Ultra tier - Monthly', '["smartvideo"]', true),
  ('SmartVideo Upgrade 1 (OTO1) - Monthly', 'smartvideo', 'one_time', 'Upgrade 1 offer', '["smartvideo"]', true),
  ('SmartVideo Main - Yearly', 'smartvideo', 'subscription', 'Main product yearly', '["smartvideo"]', true),
  ('SmartVideo Evolution Beta Launch - Monthly', 'smartvideo', 'subscription', 'Beta launch monthly', '["smartvideo"]', true),
  ('SmartVideo Evolution Beta Launch - Yearly', 'smartvideo', 'subscription', 'Beta launch yearly', '["smartvideo"]', true),
  ('SmartVideo Evolution - Template Collective', 'smartvideo', 'subscription', 'Template collective monthly', '["smartvideo"]', true),
  ('SmartVideo Evolution A.I. Access', 'smartvideo', 'subscription', 'AI access for smartvideo', '["smartvideo"]', true),
  ('Smart AI Designer Package - Bundle Package', 'smartvideo', 'one_time', 'AI designer bundle', '["smartvideo"]', true),
  ('Smart Marketer Elite - Private Promo Yearly', 'smartvideo', 'subscription', 'Marketer elite yearly', '["smartvideo"]', true),
  ('VideoRemix Link-ED (YEARLY)', 'smartvideo', 'subscription', 'Link-ED yearly access', '["smartvideo"]', true),
  ('VideoRemix Insider Training - Monthly', 'smartvideo', 'subscription', 'Insider training monthly', '["smartvideo"]', true),
  ('VideoRemix Connect - Yearly - Special', 'smartvideo', 'subscription', 'Connect yearly special', '["smartvideo"]', true),
  ('Video Remix Google Smart Maps - Annual', 'smartvideo', 'subscription', 'Google smart maps annual', '["smartvideo"]', true),
  ('Smart AI Mentor Unlimited - Upgrade', 'smartvideo', 'one_time', 'Mentor unlimited upgrade', '["smartvideo"]', true),
  ('Smart AI Mentor Millionaire''s Club', 'smartvideo', 'subscription', 'Mentor millionaire club', '["smartvideo"]', true),
  ('Smart AI Mentor Millionaire''s Club - Two Pay', 'smartvideo', 'subscription', 'Mentor club two-pay', '["smartvideo"]', true),
  ('GO-AI Design Club: GO-AI OTO1', 'smartvideo', 'one_time', 'GO-AI design club OTO1', '["smartvideo"]', true),
  ('GO-AI Professional: GO-AI Main', 'smartvideo', 'one_time', 'GO-AI professional main', '["smartvideo"]', true),
  ('GO-AI Bundle', 'smartvideo', 'one_time', 'GO-AI complete bundle', '["smartvideo"]', true),

  -- Social Video Products
  ('Social Media Personalized Video Prospecting Bundle', 'social_video', 'one_time', 'Social video prospecting bundle', '["social_video"]', true),

  -- Agency & Growth Products
  ('Agency Growth Accelerator - Yearly', 'smartvideo', 'subscription', 'Agency growth accelerator yearly', '["smartvideo"]', true),
  ('Financial Accelerator - Yearly', 'smartvideo', 'subscription', 'Financial accelerator yearly', '["smartvideo"]', true),
  ('Local360 - Template Vault - Monthly (Special Promo) - OTO1', 'smartvideo', 'one_time', 'Local360 template vault OTO1', '["smartvideo"]', true),

  -- Lead Generation Products
  ('Attorney Lead Generator - Yearly', 'smartvideo', 'subscription', 'Attorney leads yearly', '["smartvideo"]', true),
  ('Lead Generator Agency - One Time Special', 'smartvideo', 'one_time', 'Lead generator agency special', '["smartvideo"]', true),

  -- Conversion Kit
  ('Smart Conversion Kit - Monthly', 'smartvideo', 'subscription', 'Conversion kit monthly', '["smartvideo"]', true),

  -- Additional known products
  ('VideoRemix White Label - Basics - Monthly', 'smartvideo', 'subscription', 'White label basics monthly', '["smartvideo"]', true)

ON CONFLICT (name) DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Now grant access to users based on their purchases
-- This DO block processes pending/failed import_user_records
DO $$
DECLARE
  v_user RECORD;
  v_product RECORD;
  v_purchase_id uuid;
  v_access_count integer := 0;
  v_user_count integer := 0;
BEGIN
  RAISE NOTICE 'Granting app access from import_user_records...';

  FOR v_user IN 
    SELECT DISTINCT 
      iur.user_id,
      iur.customer_email,
      iur.customer_name
    FROM import_user_records iur
    WHERE iur.processing_status IN ('pending', 'failed')
      AND iur.user_id IS NOT NULL
  LOOP
    v_user_count := v_user_count + 1;
    
    FOR v_product IN 
      SELECT DISTINCT 
        iur.product_name,
        pc.id as product_id,
        pc.apps_granted
      FROM import_user_records iur
      JOIN products_catalog pc 
        ON LOWER(TRIM(iur.product_name)) = LOWER(TRIM(pc.name))
        OR LOWER(TRIM(iur.product_name)) LIKE '%' || LOWER(TRIM(pc.name)) || '%'
        OR LOWER(TRIM(pc.name)) LIKE '%' || LOWER(TRIM(iur.product_name)) || '%'
      WHERE iur.user_id = v_user.user_id
        AND iur.processing_status IN ('pending', 'failed')
        AND pc.is_active = true
    LOOP
      -- Check if purchase already exists
      SELECT id INTO v_purchase_id FROM purchases 
      WHERE user_id = v_user.user_id AND product_id = v_product.product_id
      LIMIT 1;
      
      IF v_purchase_id IS NULL THEN
        INSERT INTO purchases (
          user_id, email, platform, platform_transaction_id,
          platform_customer_id, product_id, product_name, amount,
          currency, status, is_subscription, purchase_date,
          processed, processed_at, tenant_id
        ) VALUES (
          v_user.user_id,
          v_user.customer_email,
          'stripe',
          'import_' || gen_random_uuid()::text,
          'import_customer_' || gen_random_uuid()::text,
          v_product.product_id,
          (SELECT name FROM products_catalog WHERE id = v_product.product_id),
          0,
          'USD',
          'completed',
          false,
          NOW(),
          true,
          NOW(),
          '00000000-0000-0000-0000-000000000001'
        ) RETURNING id INTO v_purchase_id;
      END IF;
      
      -- Grant app access
      IF v_product.apps_granted IS NOT NULL AND jsonb_array_length(v_product.apps_granted) > 0 THEN
        FOR app_slug IN 
          SELECT value::text FROM jsonb_array_elements(v_product.apps_granted)
        LOOP
          INSERT INTO user_app_access (
            user_id, app_slug, purchase_id, access_type,
            is_active, granted_at, tenant_id
          ) VALUES (
            v_user.user_id, app_slug, v_purchase_id, 'lifetime',
            true, NOW(), '00000000-0000-0000-0000-000000000001'
          )
          ON CONFLICT (user_id, app_slug) 
          DO UPDATE SET is_active = true, updated_at = NOW();
          
          v_access_count := v_access_count + 1;
        END LOOP;
      END IF;
      
      -- Mark as processed
      UPDATE import_user_records 
      SET processing_status = 'processed', processed_at = NOW()
      WHERE user_id = v_user.user_id 
        AND product_name = (SELECT name FROM products_catalog WHERE id = v_product.product_id);
        
    END LOOP;
    
    -- Mark unmatched products as failed
    UPDATE import_user_records 
    SET processing_status = 'failed', error_message = 'Product not matched'
    WHERE user_id = v_user.user_id AND processing_status = 'pending';
  END LOOP;
  
  RAISE NOTICE 'Completed: % users, % access grants', v_user_count, v_access_count;
END $$;

-- Summary report
SELECT 
  'Products' as category, COUNT(*) as count FROM products_catalog
UNION ALL
SELECT 
  'Purchases created this run' as category, COUNT(*) as count 
  FROM purchases 
  WHERE created_at > NOW() - INTERVAL '5 minutes'
UNION ALL
SELECT 
  'App access grants this run' as category, COUNT(*) as count 
  FROM user_app_access 
  WHERE created_at > NOW() - INTERVAL '5 minutes'
UNION ALL
SELECT 
  'Processed import records' as category, COUNT(*) as count 
  FROM import_user_records 
  WHERE processing_status = 'processed' AND processed_at > NOW() - INTERVAL '5 minutes';

-- Check for any remaining pending/failed
SELECT processing_status, COUNT(*) FROM import_user_records 
GROUP BY processing_status;

COMMIT;