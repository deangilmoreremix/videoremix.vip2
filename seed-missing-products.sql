-- Seed Missing Products for CSV Import
-- This adds products that were discovered during import but are missing from products_catalog
-- Run this if you see "Product not found in catalog" warnings during import

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

ON CONFLICT (name) DO NOTHING;

-- Optional: Also map common alternative names via upsert
-- Update existing products if they exist but with wrong slug
INSERT INTO products_catalog (name, slug, product_type, apps_granted, is_active)
VALUES 
  ('SmartVideo Interactive Design Club - Monthly', 'smartvideo', 'subscription', '["smartvideo"]', true),
  ('Social Media Personalized Video Prospecting Bundle', 'social_video', 'one_time', '["social_video"]', true)
ON CONFLICT (name) DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Verify we have products
SELECT name, slug, product_type, apps_granted FROM products_catalog ORDER BY name LIMIT 20;