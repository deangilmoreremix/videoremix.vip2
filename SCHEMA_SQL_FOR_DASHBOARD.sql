-- ============================================
-- VIDEOREMIX DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- APPS TABLE - Add RLS policies
-- ============================================
ALTER TABLE IF EXISTS apps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON apps;
CREATE POLICY "Enable read access for all users" ON apps FOR SELECT TO anon USING (true);

-- ============================================
-- HERO CONTENT TABLE
-- ============================================
DROP TABLE IF EXISTS hero_content;
CREATE TABLE hero_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL DEFAULT '',
  subtitle VARCHAR(500) DEFAULT '',
  description TEXT DEFAULT '',
  primary_button_text VARCHAR(100) DEFAULT '',
  primary_button_url VARCHAR(500) DEFAULT '',
  secondary_button_text VARCHAR(100) DEFAULT '',
  secondary_button_url VARCHAR(500) DEFAULT '',
  background_image_url VARCHAR(500) DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON hero_content FOR SELECT TO anon USING (true);

-- Insert sample data
INSERT INTO hero_content (title, subtitle, description, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, enabled)
VALUES (
  'Transform Your Videos with AI',
  'Create stunning video remixes in seconds',
  'VideoRemix uses advanced AI to transform your videos into amazing new creations.',
  'Get Started Free',
  '/signup',
  'Watch Demo',
  '/demo',
  true
);

-- ============================================
-- BENEFITS FEATURES TABLE
-- ============================================
DROP TABLE IF EXISTS benefits_features;
CREATE TABLE benefits_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  icon_name VARCHAR(100) DEFAULT 'star',
  stats JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE benefits_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON benefits_features FOR SELECT TO anon USING (true);

-- Insert sample data
INSERT INTO benefits_features (title, description, icon_name, stats, enabled) VALUES
('Lightning Fast', 'Process videos in seconds', 'zap', '[{"label":"Speed","value":"10x faster"}]', true),
('AI-Powered', 'Advanced ML models', 'brain', '[{"label":"Accuracy","value":"99%"}]', true),
('Cloud-Based', 'Works in browser', 'cloud', '[{"label":"Uptime","value":"99.9%"}]', true);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
DROP TABLE IF EXISTS testimonials;
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(100) DEFAULT '',
  company VARCHAR(255) DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  rating INTEGER DEFAULT 5,
  category VARCHAR(100) DEFAULT '',
  featured BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON testimonials FOR SELECT TO anon USING (true);

-- Insert sample data
INSERT INTO testimonials (content, name, role, company, rating, featured, enabled) VALUES
('Amazing product!', 'John Doe', 'CEO', 'TechCorp', 5, true, true);

-- ============================================
-- FAQs TABLE
-- ============================================
DROP TABLE IF EXISTS faqs;
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question VARCHAR(500) NOT NULL DEFAULT '',
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  list_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON faqs FOR SELECT TO anon USING (true);

-- Insert sample data
INSERT INTO faqs (question, answer, category, list_order, enabled) VALUES
('How does it work?', 'Upload a video and AI processes it automatically.', 'General', 1, true),
('Is it free?', 'We offer a free tier with limits.', 'Pricing', 2, true);

-- ============================================
-- PRICING PLANS TABLE
-- ============================================
DROP TABLE IF EXISTS pricing_plans;
CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL DEFAULT '',
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  description TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON pricing_plans FOR SELECT TO anon USING (true);

-- Insert sample data
INSERT INTO pricing_plans (name, price_monthly, price_yearly, description, features, is_popular, enabled) VALUES
('Free', 0, 0, 'Perfect for trying', '["5 videos/month", "720p"]', false, true),
('Pro', 9.99, 99, 'For creators', '["Unlimited", "1080p", "All effects"]', true, true),
('Enterprise', 49.99, 499, 'For teams', '["4K", "API", "Support"]', false, true);

-- ============================================
-- VIDEOS TABLE
-- ============================================
DROP TABLE IF EXISTS videos;
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  original_filename VARCHAR(500) DEFAULT '',
  file_path VARCHAR(500) DEFAULT '',
  thumbnail_path VARCHAR(500) DEFAULT '',
  status VARCHAR(50) DEFAULT 'uploaded',
  duration DECIMAL(10,2) DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT '',
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  display_on_homepage BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  homepage_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON videos FOR SELECT TO anon USING (is_public = true);

-- ============================================
-- PURCHASES TABLE
-- ============================================
DROP TABLE IF EXISTS purchases;
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  app_id UUID REFERENCES apps(id),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_provider VARCHAR(50) DEFAULT 'stripe',
  payment_id VARCHAR(255) DEFAULT '',
  status VARCHAR(50) DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
DROP TABLE IF EXISTS subscriptions;
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  app_id UUID REFERENCES apps(id),
  plan_type VARCHAR(50) DEFAULT 'monthly',
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_provider VARCHAR(50) DEFAULT 'stripe',
  subscription_id VARCHAR(255) DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

SELECT '✅ Schema created successfully!' as status;
