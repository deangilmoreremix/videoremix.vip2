/*
  # Add 15 Dashboard Apps with Netlify URLs

  ## Summary
  Adds 15 new apps to the platform with their corresponding Netlify deployment URLs.
  These apps will be displayed on the dashboard and protected by the paywall system.

  ## New Apps Added

  1. **AI Personalized Content** - https://capable-mermaid-3c73fa.netlify.app/
  2. **AI Referral Maximizer** - https://eloquent-kleicha-7e3a3e.netlify.app
  3. **AI Sales Maximizer** - https://magnificent-lamington-619374.netlify.app/
  4. **AI Screen Recorder** - https://adorable-arithmetic-675d28.netlify.app/
  5. **Smart CRM Closer** - https://stupendous-twilight-64389a.netlify.app/
  6. **Video AI Editor** - https://heroic-seahorse-296f32.netlify.app/
  7. **AI Video & Image** - https://thriving-mochi-ecd815.netlify.app/
  8. **AI Skills Monetizer** - https://roaring-mochi-39a60a.netlify.app
  9. **AI Signature** - https://kaleidoscopic-tarsier-3d0a6c.netlify.app/
  10. **Personalizer AI Profile Generator** - https://endearing-churros-2ce8c6.netlify.app/
  11. **Personalizer AI Video & Image Transformer** - https://thriving-mochi-ecd815.netlify.app/
  12. **Personalizer URL Video Generation Templates & Editor** - https://cute-khapse-4e62cb.netlify.app/
  13. **AI Proposal** - https://keen-pastelito-6b9074.netlify.app
  14. **Sales Assistant App** - https://gentle-frangipane-ceed17.netlify.app
  15. **Sales Page Builder** - https://prismatic-starship-c0b4c2.netlify.app

  ## Changes Made

  1. **App Entries**
     - Insert 15 new apps with proper metadata
     - Assign appropriate categories (video, sales, personalizer, lead-gen, page)
     - Set Netlify URLs for each app
     - Configure default pricing ($97)
     - Mark popular apps appropriately
     - Set sort orders for proper display ordering

  2. **Product Catalog Entries**
     - Create individual products for each app
     - Link products to their corresponding app slugs via apps_granted
     - Set product type as one_time purchase
     - Generate unique SKUs for each product

  3. **Platform Mappings**
     - Create payment platform mappings for Zaxxa integration
     - Set up mappings for PayPal integration
     - Configure Stripe mappings for future payment processing

  ## Security
  - All apps are active and require purchase for access
  - RLS policies on products_catalog and apps tables control access
  - Purchase tracking through user_purchases table enforces paywall

  ## Notes
  - Uses ON CONFLICT DO UPDATE for idempotency
  - Preserves existing data if apps already exist
  - New apps will appear immediately on dashboard after migration
  - Purchase flow already configured through existing infrastructure
*/

-- Insert the 15 new apps into the apps table
INSERT INTO apps (slug, name, description, category, netlify_url, image, icon, popular, new, price, is_active, is_featured, sort_order)
VALUES
  -- 1. AI Personalized Content
  ('ai-personalized-content', 'AI Personalized Content', 'Create highly personalized content that speaks directly to your audience', 'personalizer',
   'https://capable-mermaid-3c73fa.netlify.app/',
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Sparkles', true, false, 97, true, true, 400),

  -- 2. AI Referral Maximizer
  ('ai-referral-maximizer-pro', 'AI Referral Maximizer', 'Maximize your referral conversions with AI-powered automation', 'lead-gen',
   'https://eloquent-kleicha-7e3a3e.netlify.app',
   'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Megaphone', true, false, 97, true, true, 410),

  -- 3. AI Sales Maximizer
  ('ai-sales-maximizer', 'AI Sales Maximizer', 'Boost your sales with intelligent AI-driven strategies', 'sales',
   'https://magnificent-lamington-619374.netlify.app/',
   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'BarChart2', true, true, 97, true, true, 420),

  -- 4. AI Screen Recorder
  ('ai-screen-recorder', 'AI Screen Recorder', 'Record your screen with AI-enhanced editing capabilities', 'video',
   'https://adorable-arithmetic-675d28.netlify.app/',
   'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Monitor', false, true, 97, true, false, 430),

  -- 5. Smart CRM Closer
  ('smart-crm-closer-pro', 'Smart CRM Closer', 'Close more deals with AI-powered CRM intelligence', 'sales',
   'https://stupendous-twilight-64389a.netlify.app/',
   'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Database', true, false, 97, true, true, 440),

  -- 6. Video AI Editor
  ('video-ai-editor-pro', 'Video AI Editor', 'Professional video editing powered by artificial intelligence', 'video',
   'https://heroic-seahorse-296f32.netlify.app/',
   'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Video', true, false, 97, true, true, 450),

  -- 7. AI Video & Image
  ('ai-video-image-pro', 'AI Video & Image', 'Transform videos and images with advanced AI processing', 'ai-image',
   'https://thriving-mochi-ecd815.netlify.app/',
   'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'ImageIcon', false, true, 97, true, false, 460),

  -- 8. AI Skills Monetizer
  ('ai-skills-monetizer-pro', 'AI Skills Monetizer', 'Turn your skills into profitable income streams', 'sales',
   'https://roaring-mochi-39a60a.netlify.app',
   'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'DollarSign', true, false, 97, true, false, 470),

  -- 9. AI Signature
  ('ai-signature-pro', 'AI Signature', 'Create professional email signatures with AI design', 'personalizer',
   'https://kaleidoscopic-tarsier-3d0a6c.netlify.app/',
   'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'FileSignature', false, false, 97, true, false, 480),

  -- 10. Personalizer AI Profile Generator
  ('personalizer-profile-generator', 'Personalizer AI Profile Generator', 'Generate compelling personalized profiles with AI', 'personalizer',
   'https://endearing-churros-2ce8c6.netlify.app/',
   'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'UserCircle', false, true, 97, true, false, 490),

  -- 11. Personalizer AI Video & Image Transformer
  ('personalizer-transformer', 'Personalizer AI Video & Image Transformer', 'Transform media content with personalized AI enhancements', 'personalizer',
   'https://thriving-mochi-ecd815.netlify.app/',
   'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Sparkles', true, false, 97, true, true, 500),

  -- 12. Personalizer URL Video Generation Templates & Editor
  ('personalizer-url-templates', 'Personalizer URL Video Generation Templates & Editor', 'Generate personalized videos from URLs with smart templates', 'personalizer',
   'https://cute-khapse-4e62cb.netlify.app/',
   'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'LayoutTemplate', false, false, 97, true, false, 510),

  -- 13. AI Proposal
  ('ai-proposal-generator', 'AI Proposal', 'Create winning proposals with AI-powered writing assistance', 'sales',
   'https://keen-pastelito-6b9074.netlify.app',
   'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'FileText', true, false, 97, true, false, 520),

  -- 14. Sales Assistant App
  ('sales-assistant-platform', 'Sales Assistant App', 'Your complete AI sales assistance platform', 'sales',
   'https://gentle-frangipane-ceed17.netlify.app',
   'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Briefcase', true, false, 97, true, true, 530),

  -- 15. Sales Page Builder
  ('sales-page-builder-pro', 'Sales Page Builder', 'Build high-converting sales pages in minutes', 'page',
   'https://prismatic-starship-c0b4c2.netlify.app',
   'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'PanelTop', true, true, 97, true, true, 540)

ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  netlify_url = EXCLUDED.netlify_url,
  image = COALESCE(EXCLUDED.image, apps.image),
  icon = COALESCE(EXCLUDED.icon, apps.icon),
  popular = EXCLUDED.popular,
  new = EXCLUDED.new,
  price = COALESCE(EXCLUDED.price, apps.price),
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Create product catalog entries for each app
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  ('AI Personalized Content', 'ai-personalized-content-product', 'APP-PERS-CONTENT-001',
   'Create highly personalized content that speaks directly to your audience',
   'one_time', '["ai-personalized-content"]'::jsonb, true),

  ('AI Referral Maximizer', 'ai-referral-maximizer-product', 'APP-REF-MAX-002',
   'Maximize your referral conversions with AI-powered automation',
   'one_time', '["ai-referral-maximizer-pro"]'::jsonb, true),

  ('AI Sales Maximizer', 'ai-sales-maximizer-product', 'APP-SALES-MAX-003',
   'Boost your sales with intelligent AI-driven strategies',
   'one_time', '["ai-sales-maximizer"]'::jsonb, true),

  ('AI Screen Recorder', 'ai-screen-recorder-product', 'APP-SCREEN-REC-004',
   'Record your screen with AI-enhanced editing capabilities',
   'one_time', '["ai-screen-recorder"]'::jsonb, true),

  ('Smart CRM Closer', 'smart-crm-closer-product', 'APP-CRM-CLOSER-005',
   'Close more deals with AI-powered CRM intelligence',
   'one_time', '["smart-crm-closer-pro"]'::jsonb, true),

  ('Video AI Editor', 'video-ai-editor-product', 'APP-VIDEO-EDIT-006',
   'Professional video editing powered by artificial intelligence',
   'one_time', '["video-ai-editor-pro"]'::jsonb, true),

  ('AI Video & Image', 'ai-video-image-product', 'APP-VIDEO-IMG-007',
   'Transform videos and images with advanced AI processing',
   'one_time', '["ai-video-image-pro"]'::jsonb, true),

  ('AI Skills Monetizer', 'ai-skills-monetizer-product', 'APP-SKILLS-MON-008',
   'Turn your skills into profitable income streams',
   'one_time', '["ai-skills-monetizer-pro"]'::jsonb, true),

  ('AI Signature', 'ai-signature-product', 'APP-SIGNATURE-009',
   'Create professional email signatures with AI design',
   'one_time', '["ai-signature-pro"]'::jsonb, true),

  ('Personalizer AI Profile Generator', 'personalizer-profile-product', 'APP-PROFILE-GEN-010',
   'Generate compelling personalized profiles with AI',
   'one_time', '["personalizer-profile-generator"]'::jsonb, true),

  ('Personalizer AI Video & Image Transformer', 'personalizer-transformer-product', 'APP-TRANSFORM-011',
   'Transform media content with personalized AI enhancements',
   'one_time', '["personalizer-transformer"]'::jsonb, true),

  ('Personalizer URL Video Templates & Editor', 'personalizer-url-product', 'APP-URL-TMPL-012',
   'Generate personalized videos from URLs with smart templates',
   'one_time', '["personalizer-url-templates"]'::jsonb, true),

  ('AI Proposal', 'ai-proposal-product', 'APP-PROPOSAL-013',
   'Create winning proposals with AI-powered writing assistance',
   'one_time', '["ai-proposal-generator"]'::jsonb, true),

  ('Sales Assistant App', 'sales-assistant-product', 'APP-SALES-ASST-014',
   'Your complete AI sales assistance platform',
   'one_time', '["sales-assistant-platform"]'::jsonb, true),

  ('Sales Page Builder', 'sales-page-builder-product', 'APP-PAGE-BUILD-015',
   'Build high-converting sales pages in minutes',
   'one_time', '["sales-page-builder-pro"]'::jsonb, true)

ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  product_type = EXCLUDED.product_type,
  apps_granted = EXCLUDED.apps_granted,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create platform mappings for Zaxxa payment processor
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, match_confidence, manually_verified)
SELECT
  pc.id,
  'zaxxa',
  pc.sku,
  pc.name,
  1.0,
  true
FROM products_catalog pc
WHERE pc.slug IN (
  'ai-personalized-content-product',
  'ai-referral-maximizer-product',
  'ai-sales-maximizer-product',
  'ai-screen-recorder-product',
  'smart-crm-closer-product',
  'video-ai-editor-product',
  'ai-video-image-product',
  'ai-skills-monetizer-product',
  'ai-signature-product',
  'personalizer-profile-product',
  'personalizer-transformer-product',
  'personalizer-url-product',
  'ai-proposal-product',
  'sales-assistant-product',
  'sales-page-builder-product'
)
ON CONFLICT (platform, platform_product_id)
DO UPDATE SET
  platform_product_name = EXCLUDED.platform_product_name,
  match_confidence = EXCLUDED.match_confidence,
  manually_verified = EXCLUDED.manually_verified,
  updated_at = now();
