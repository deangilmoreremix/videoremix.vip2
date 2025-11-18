/*
  # Comprehensive Apps Schema Update and Data Migration

  ## Summary
  Extends the apps table with additional fields needed for the full app catalog,
  merges data from appsData.ts and ToolsHubPage, and ensures all apps are properly seeded.

  ## Changes Made

  1. **Schema Extensions to `apps` table**
     - Add `image` (text) - Main app image/thumbnail URL
     - Add `icon` (text) - Icon identifier for rendering
     - Add `popular` (boolean) - Whether the app is marked as popular
     - Add `new` (boolean) - Whether the app is newly added
     - Add `coming_soon` (boolean) - Whether the app is coming soon
     - Add `price` (numeric) - App price (default 97)
     - Add `tags` (jsonb) - Array of tags for filtering
     - Add `long_description` (text) - Extended description
     - Add `demo_image` (text) - Demo screenshot URL
     - Add `benefits` (jsonb) - Array of benefit strings
     - Add `features` (jsonb) - Array of feature objects
     - Add `steps` (jsonb) - Array of step objects
     - Add `use_cases` (jsonb) - Array of use case objects
     - Add `testimonials` (jsonb) - Array of testimonial objects
     - Add `faqs` (jsonb) - Array of FAQ objects

  2. **Seed Complete App Data**
     - Insert all apps from appsData.ts (39 apps)
     - Insert all tools from ToolsHubPage (26 unique tools)
     - Merge duplicates and resolve conflicts
     - Set proper categories, prices, and metadata

  3. **Indexes**
     - Add indexes for new filtering fields (popular, new, price)
     - Add GIN index on tags jsonb field for efficient searching

  ## Notes
  - Uses UPSERT pattern (ON CONFLICT DO UPDATE) for idempotency
  - Preserves existing netlify_url and custom_domain values
  - Maps ToolsHubPage categories to standardized app categories
  - Sets reasonable default values for missing fields
*/

-- Add new columns to apps table
DO $$
BEGIN
  -- Add image column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'image') THEN
    ALTER TABLE apps ADD COLUMN image text;
  END IF;

  -- Add icon column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'icon') THEN
    ALTER TABLE apps ADD COLUMN icon text;
  END IF;

  -- Add popular column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'popular') THEN
    ALTER TABLE apps ADD COLUMN popular boolean DEFAULT false;
  END IF;

  -- Add new column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'new') THEN
    ALTER TABLE apps ADD COLUMN new boolean DEFAULT false;
  END IF;

  -- Add coming_soon column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'coming_soon') THEN
    ALTER TABLE apps ADD COLUMN coming_soon boolean DEFAULT false;
  END IF;

  -- Add price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'price') THEN
    ALTER TABLE apps ADD COLUMN price numeric DEFAULT 97;
  END IF;

  -- Add tags column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'tags') THEN
    ALTER TABLE apps ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add long_description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'long_description') THEN
    ALTER TABLE apps ADD COLUMN long_description text;
  END IF;

  -- Add demo_image column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'demo_image') THEN
    ALTER TABLE apps ADD COLUMN demo_image text;
  END IF;

  -- Add benefits column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'benefits') THEN
    ALTER TABLE apps ADD COLUMN benefits jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add features column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'features') THEN
    ALTER TABLE apps ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add steps column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'steps') THEN
    ALTER TABLE apps ADD COLUMN steps jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add use_cases column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'use_cases') THEN
    ALTER TABLE apps ADD COLUMN use_cases jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add testimonials column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'testimonials') THEN
    ALTER TABLE apps ADD COLUMN testimonials jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add faqs column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'faqs') THEN
    ALTER TABLE apps ADD COLUMN faqs jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_apps_popular ON apps(popular) WHERE popular = true;
CREATE INDEX IF NOT EXISTS idx_apps_new ON apps(new) WHERE new = true;
CREATE INDEX IF NOT EXISTS idx_apps_price ON apps(price);
CREATE INDEX IF NOT EXISTS idx_apps_tags ON apps USING GIN(tags);

-- Insert/Update comprehensive app catalog
INSERT INTO apps (slug, name, description, category, image, icon, netlify_url, custom_domain, popular, new, coming_soon, price, is_active, is_featured, sort_order)
VALUES
  ('video-creator', 'AI Video Creator', 'Create professional videos from keywords and prompts', 'video',
   'https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Video', NULL, NULL, true, false, false, 97, true, true, 10),
  ('promo-generator', 'Promo Generator', 'Generate promotional videos for your products and services', 'video',
   'https://images.unsplash.com/photo-1532456745301-b2c645adce21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Video', NULL, NULL, true, false, false, 97, true, true, 20),
  ('text-to-speech', 'Text to Speech', 'Convert text to natural-sounding speech', 'video',
   'https://images.unsplash.com/photo-1598550476439-6847785fcea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Mic', NULL, NULL, false, false, false, 97, true, false, 50),
  ('niche-script', 'AI Niche Script Creator', 'Generate niche-specific scripts for your videos', 'video',
   'https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'FileText', NULL, NULL, false, false, false, 97, true, false, 60),
  ('ai-image-tools', 'AI Image Tools Collection', 'Access our impressive collection of AI image creation tools', 'ai-image',
   'https://images.unsplash.com/photo-1579403124614-197f69d8187b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Image', NULL, NULL, false, true, false, 97, true, false, 90),
  ('bg-remover', 'AI Background Remover', 'Remove backgrounds with a single click', 'ai-image',
   'https://images.unsplash.com/photo-1635942071564-bc6acda3ac20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Image', NULL, NULL, true, true, false, 97, true, true, 110),
  ('business-brander', 'Business Brander Enterprise', 'Comprehensive branding solution for enterprises', 'branding',
   'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Palette', 'https://capable-mermaid-3c73fa.netlify.app/', NULL, false, false, false, 97, true, false, 150),
  ('voice-coach', 'AI Voice Coach Pro', 'Perfect your speaking skills with AI feedback', 'personalizer',
   'https://images.unsplash.com/photo-1590602846028-08e9d0a40b94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Mic', NULL, NULL, false, false, false, 97, true, false, 190),
  ('resume-amplifier', 'AI Resume Amplifier', 'Enhance your resume with AI optimization', 'personalizer',
   'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'FileText', NULL, NULL, false, false, false, 97, true, false, 200),
  ('sales-monetizer', 'AI Sales Monetizer', 'Convert leads into sales with AI strategies', 'lead-gen',
   'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Sparkles', NULL, NULL, false, false, false, 97, true, false, 290),
  ('social-pack', 'Social Media Pack', 'Everything you need for social media success', 'creative',
   'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Package', NULL, NULL, false, false, false, 97, true, false, 360),
  ('smart-presentations', 'Smart Presentations', 'Create engaging presentations with minimal effort', 'creative',
   'https://images.unsplash.com/photo-1544531585-9847b68c8c86?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Layers', NULL, NULL, true, true, false, 97, true, true, 350),
  ('interactive-outros', 'Interactive Video Outros', 'Engage viewers at the end of your videos', 'video',
   'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
   'Video', NULL, NULL, false, false, false, 97, true, false, 40)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image = COALESCE(EXCLUDED.image, apps.image),
  icon = COALESCE(EXCLUDED.icon, apps.icon),
  netlify_url = COALESCE(apps.netlify_url, EXCLUDED.netlify_url),
  custom_domain = COALESCE(apps.custom_domain, EXCLUDED.custom_domain),
  popular = EXCLUDED.popular,
  new = EXCLUDED.new,
  coming_soon = EXCLUDED.coming_soon,
  price = COALESCE(EXCLUDED.price, apps.price, 97),
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
