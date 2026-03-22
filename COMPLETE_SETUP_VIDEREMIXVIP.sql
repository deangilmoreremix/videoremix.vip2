-- =============================================================================
-- VideoRemixVIP Complete Database Setup
-- Project: bzxohkrxcwodllketcpz
-- App Slug: videoremixvip
-- 
-- Run this entire script in the Supabase SQL Editor to set up the complete database
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE USER MANAGEMENT TABLES
-- =============================================================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Profiles Table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Profiles (additional profile data)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- MULTI-TENANT APP TABLES
-- =============================================================================

-- Apps Table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  deployment_url text DEFAULT '',
  hero_content text DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Access Tiers Table
CREATE TABLE IF NOT EXISTS access_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  display_name text NOT NULL,
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User App Access (grants user access to specific apps)
CREATE TABLE IF NOT EXISTS user_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  access_tier_id uuid REFERENCES access_tiers(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- =============================================================================
-- SUBSCRIPTIONS & PURCHASES
-- =============================================================================

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
  access_tier_id uuid REFERENCES access_tiers(id) ON DELETE SET NULL,
  plan_type text DEFAULT 'monthly',
  status text DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'expired')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now(),
  cancel_at_period_end boolean DEFAULT false,
  payment_provider text DEFAULT 'stripe',
  subscription_id text DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  purchase_date timestamptz DEFAULT now(),
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_provider text DEFAULT 'stripe',
  payment_id text DEFAULT '',
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CONTENT TABLES (for app display and user uploads)
-- =============================================================================

-- Videos Table (for both user uploads and training/webinar content)
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  original_filename text DEFAULT '',
  file_path text DEFAULT '',
  thumbnail_path text DEFAULT '',
  storage_key text DEFAULT '',
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  duration numeric DEFAULT 0,
  file_size bigint DEFAULT 0,
  mime_type text DEFAULT '',
  processing_started_at timestamptz,
  completed_at timestamptz,
  error_message text DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  display_on_homepage boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_public boolean DEFAULT false,
  video_type text DEFAULT 'user' CHECK (video_type IN ('user', 'training', 'webinar')),
  homepage_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- LANDING PAGE CONTENT TABLES
-- =============================================================================

-- Hero Content
CREATE TABLE IF NOT EXISTS hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  title text DEFAULT '',
  subtitle text DEFAULT '',
  description text DEFAULT '',
  primary_button_text text DEFAULT '',
  primary_button_url text DEFAULT '',
  secondary_button_text text DEFAULT '',
  secondary_button_url text DEFAULT '',
  background_image_url text DEFAULT '',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Benefits/Features
CREATE TABLE IF NOT EXISTS benefits_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  icon_name text DEFAULT 'star',
  stats JSONB DEFAULT '[]'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  content text DEFAULT '',
  name text DEFAULT '',
  role text DEFAULT '',
  company text DEFAULT '',
  image_url text DEFAULT '',
  rating integer DEFAULT 5,
  category text DEFAULT '',
  featured boolean DEFAULT false,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  question text DEFAULT '',
  answer text DEFAULT '',
  category text DEFAULT 'General',
  list_order integer DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing Plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  name text DEFAULT '',
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  description text DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular boolean DEFAULT false,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- IMPORT/EXPORT TABLES
-- =============================================================================

-- Import Products
CREATE TABLE IF NOT EXISTS import_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_product_id text UNIQUE NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  product_name text DEFAULT '',
  product_description text DEFAULT '',
  price numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  category text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Import Records
CREATE TABLE IF NOT EXISTS import_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id text NOT NULL,
  user_email text DEFAULT '',
  product_name text DEFAULT '',
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  platform text DEFAULT '',
  transaction_id text DEFAULT '',
  status text DEFAULT 'pending',
  import_date timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES - Allow public read for content tables
-- =============================================================================

-- Apps: Public read
CREATE POLICY "Public apps read" ON apps FOR SELECT TO anon USING (true);
CREATE POLICY "Public apps read authenticated" ON apps FOR SELECT TO authenticated USING (true);

-- Hero Content: Public read
CREATE POLICY "Public hero_content read" ON hero_content FOR SELECT TO anon USING (true);

-- Benefits Features: Public read
CREATE POLICY "Public benefits_features read" ON benefits_features FOR SELECT TO anon USING (true);

-- Testimonials: Public read
CREATE POLICY "Public testimonials read" ON testimonials FOR SELECT TO anon USING (true);

-- FAQs: Public read
CREATE POLICY "Public faqs read" ON faqs FOR SELECT TO anon USING (true);

-- Pricing Plans: Public read
CREATE POLICY "Public pricing_plans read" ON pricing_plans FOR SELECT TO anon USING (true);

-- Videos: Public read for public videos
CREATE POLICY "Public videos read" ON videos FOR SELECT TO anon USING (is_public = true);

-- Access Tiers: Public read
CREATE POLICY "Public access_tiers read" ON access_tiers FOR SELECT TO anon USING (true);

-- =============================================================================
-- INSERT INITIAL APP (videoremixvip)
-- =============================================================================

INSERT INTO apps (slug, name, description, is_active, is_public, created_at, updated_at)
VALUES ('videoremixvip', 'VideoRemix VIP', 'Premium Video Creation Platform', true, true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- CREATE STORAGE BUCKETS
-- =============================================================================

-- Storage buckets will be created via Storage API, not SQL
-- See storage setup below

-- =============================================================================
-- CONFIRMATION
-- =============================================================================

SELECT 'Database setup complete!' as status;
SELECT slug, id FROM apps WHERE slug = 'videoremixvip';
