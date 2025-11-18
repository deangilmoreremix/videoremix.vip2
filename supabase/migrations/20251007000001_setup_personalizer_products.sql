/*
  # Personalizer Product Catalog Setup

  ## Overview
  This migration sets up the product catalog for Personalizer apps and creates platform
  mappings for Zaxxa payment processor integration.

  ## 1. Product Catalog Entries

  Creates products for:
  - Personalizer AI Agency (Monthly subscription)
  - Personalizer AI Agency (Lifetime purchase)
  - Personalizer AI Agency (Yearly subscription)
  - Personalizer AI Writing Toolkit
  - Personalizer Advanced Text-Video AI Editor
  - Personalizer URL Video Generation Templates & Editor
  - Personalizer Interactive Shopping

  ## 2. App Slug Mappings

  Maps products to the following app slugs from the personalizer category:
  - voice-coach
  - resume-amplifier
  - personalizer-recorder
  - personalizer-profile
  - thumbnail-generator
  - ai-skills-monetizer
  - ai-signature
  - personalizer-text-ai-editor
  - personalizer-advanced-text-video-editor
  - personalizer-writing-toolkit
  - personalizer-video-image-transformer
  - personalizer-url-video-generation

  ## 3. Platform Mappings

  Creates Zaxxa platform product mappings for webhook processing

  ## 4. Important Notes

  - Monthly subscriptions grant access to core Personalizer apps
  - Lifetime purchases grant access to all Personalizer apps
  - Individual toolkits grant access to specific apps only
  - All products are marked as active by default
*/

-- Insert Personalizer AI Agency products
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  (
    'Personalizer AI Agency (Monthly)',
    'personalizer-monthly',
    'PERS-MONTHLY',
    'Monthly subscription to Personalizer AI Agency with access to core personalizer tools',
    'subscription',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Agency (Lifetime)',
    'personalizer-lifetime',
    'PERS-LIFETIME',
    'Lifetime access to all Personalizer AI Agency apps and tools',
    'one_time',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature", "personalizer-text-ai-editor", "personalizer-advanced-text-video-editor", "personalizer-writing-toolkit", "personalizer-video-image-transformer", "personalizer-url-video-generation"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Agency (Yearly)',
    'personalizer-yearly',
    'PERS-YEARLY',
    'Yearly subscription to Personalizer AI Agency with access to all personalizer tools',
    'subscription',
    '["voice-coach", "resume-amplifier", "personalizer-recorder", "personalizer-profile", "thumbnail-generator", "ai-skills-monetizer", "ai-signature", "personalizer-text-ai-editor", "personalizer-advanced-text-video-editor", "personalizer-writing-toolkit"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Writing Toolkit',
    'personalizer-writing-toolkit',
    'PERS-WRITING',
    'AI-powered writing toolkit for personalized content creation',
    'one_time',
    '["personalizer-writing-toolkit", "personalizer-text-ai-editor"]'::jsonb,
    true
  ),
  (
    'Personalizer Advanced Text-Video AI Editor',
    'personalizer-text-video-editor',
    'PERS-TEXT-VIDEO',
    'Advanced AI editor for personalized text and video content',
    'one_time',
    '["personalizer-advanced-text-video-editor", "personalizer-text-ai-editor"]'::jsonb,
    true
  ),
  (
    'Personalizer URL Video Generation Templates & Editor',
    'personalizer-url-video',
    'PERS-URL-VIDEO',
    'Generate videos from URLs with smart template matching',
    'one_time',
    '["personalizer-url-video-generation"]'::jsonb,
    true
  ),
  (
    'Personalizer Interactive Shopping',
    'personalizer-interactive-shopping',
    'PERS-SHOPPING',
    'Create engaging interactive shopping experiences',
    'one_time',
    '["interactive-shopping"]'::jsonb,
    true
  ),
  (
    'Personalizer AI Video and Image Transformer',
    'personalizer-video-transformer',
    'PERS-TRANSFORMER',
    'Transform videos and images with advanced AI processing',
    'subscription',
    '["personalizer-video-image-transformer", "ai-video-image"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  apps_granted = EXCLUDED.apps_granted,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create platform mappings for Zaxxa
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, match_confidence, manually_verified)
SELECT
  pc.id,
  'zaxxa',
  CASE
    WHEN pc.slug = 'personalizer-monthly' THEN 'PERS-MONTHLY-ZAXXA'
    WHEN pc.slug = 'personalizer-lifetime' THEN 'PERS-LIFETIME-ZAXXA'
    WHEN pc.slug = 'personalizer-yearly' THEN 'PERS-YEARLY-ZAXXA'
    WHEN pc.slug = 'personalizer-writing-toolkit' THEN 'PERS-WRITING-ZAXXA'
    WHEN pc.slug = 'personalizer-text-video-editor' THEN 'PERS-TEXT-VIDEO-ZAXXA'
    WHEN pc.slug = 'personalizer-url-video' THEN 'PERS-URL-VIDEO-ZAXXA'
    WHEN pc.slug = 'personalizer-interactive-shopping' THEN 'PERS-SHOPPING-ZAXXA'
    WHEN pc.slug = 'personalizer-video-transformer' THEN 'PERS-TRANSFORMER-ZAXXA'
  END,
  pc.name,
  1.0,
  true
FROM products_catalog pc
WHERE pc.slug IN (
  'personalizer-monthly',
  'personalizer-lifetime',
  'personalizer-yearly',
  'personalizer-writing-toolkit',
  'personalizer-text-video-editor',
  'personalizer-url-video',
  'personalizer-interactive-shopping',
  'personalizer-video-transformer'
)
ON CONFLICT (platform, platform_product_id) DO UPDATE SET
  platform_product_name = EXCLUDED.platform_product_name,
  match_confidence = EXCLUDED.match_confidence,
  manually_verified = EXCLUDED.manually_verified,
  updated_at = now();

-- Create additional platform mappings for common product name variations
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, match_confidence, manually_verified)
SELECT
  pc.id,
  'zaxxa',
  'PERS-AGENCY-MONTHLY',
  'Personalizer AI Agency (Monthly)',
  1.0,
  true
FROM products_catalog pc
WHERE pc.slug = 'personalizer-monthly'
ON CONFLICT (platform, platform_product_id) DO NOTHING;

INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, match_confidence, manually_verified)
SELECT
  pc.id,
  'zaxxa',
  'PERS-AGENCY-LIFETIME',
  'Personalizer AI Agency (Lifetime)',
  1.0,
  true
FROM products_catalog pc
WHERE pc.slug = 'personalizer-lifetime'
ON CONFLICT (platform, platform_product_id) DO NOTHING;

-- Create indexes for better query performance on new fields
CREATE INDEX IF NOT EXISTS idx_products_catalog_slug ON products_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_products_catalog_sku ON products_catalog(sku);
CREATE INDEX IF NOT EXISTS idx_products_catalog_type ON products_catalog(product_type);
CREATE INDEX IF NOT EXISTS idx_platform_mappings_platform ON platform_product_mappings(platform);

-- Add comment for documentation
COMMENT ON TABLE products_catalog IS 'Catalog of all products available for purchase, mapping to app access grants';
COMMENT ON COLUMN products_catalog.apps_granted IS 'JSONB array of app slug identifiers that this product grants access to';
COMMENT ON TABLE platform_product_mappings IS 'Maps payment platform product IDs to internal product catalog';
