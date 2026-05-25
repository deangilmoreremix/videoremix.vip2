/**
 * Database Schema Creation Script
 * Creates all missing tables in Supabase
 * 
 * Run with: npx tsx create-database-schema.test.ts
 * 
 * IMPORTANT: This uses the SERVICE ROLE KEY which bypasses RLS
 * Run this in Supabase SQL Editor for safer execution
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required')
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false }
})

// SQL schema for all missing tables
const schemaSQL = `
-- ============================================
-- DATABASE SCHEMA FOR VIDEOREMIX APP
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- APPS TABLE (already exists - adding RLS)
-- ============================================
ALTER TABLE IF EXISTS apps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for apps
DROP POLICY IF EXISTS "Enable read access for all users" ON apps;
CREATE POLICY "Enable read access for all users" ON apps FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Enable read for authenticated users" ON apps;
CREATE POLICY "Enable read for authenticated users" ON apps FOR SELECT TO authenticated USING (true);

-- ============================================
-- HERO CONTENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hero_content (
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
CREATE POLICY "Authenticated read access" ON hero_content FOR SELECT TO authenticated USING (true);

-- ============================================
-- BENEFITS FEATURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS benefits_features (
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
CREATE POLICY "Authenticated read access" ON benefits_features FOR SELECT TO authenticated USING (true);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
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
CREATE POLICY "Authenticated read access" ON testimonials FOR SELECT TO authenticated USING (true);

-- ============================================
-- FAQs TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
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
CREATE POLICY "Authenticated read access" ON faqs FOR SELECT TO authenticated USING (true);

-- ============================================
-- PRICING PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_plans (
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
CREATE POLICY "Authenticated read access" ON pricing_plans FOR SELECT TO authenticated USING (true);

-- ============================================
-- VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
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
CREATE POLICY "Public read access for public videos" ON videos FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Users read own videos" ON videos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own videos" ON videos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own videos" ON videos FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================
-- PURCHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
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
CREATE POLICY "Users read own purchases" ON purchases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin read all purchases" ON purchases FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%'));

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
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
CREATE POLICY "Users read own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin read all subscriptions" ON subscriptions FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%admin%'));

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
INSERT INTO hero_content (title, subtitle, description, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, enabled)
VALUES (
  'Transform Your Videos with AI',
  'Create stunning video remixes in seconds',
  'VideoRemix uses advanced AI to transform your videos into amazing new creations. Simply upload, choose your style, and let AI do the magic.',
  'Get Started Free',
  '/signup',
  'Watch Demo',
  '/demo',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO benefits_features (title, description, icon_name, stats, enabled)
VALUES 
  ('Lightning Fast', 'Process videos in seconds with our optimized AI engine', 'zap', '[{"label": "Processing Speed", "value": "10x faster"}]', true),
  ('AI-Powered', 'Advanced machine learning models for stunning results', 'brain', '[{"label": "Accuracy", "value": "99%"}]', true),
  ('Cloud-Based', 'No installation required, works in your browser', 'cloud', '[{"label": "Uptime", "value": "99.9%"}]', true)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (content, name, role, company, rating, featured, enabled)
VALUES 
  ('VideoRemix has completely transformed how we create content. Highly recommended!', 'Sarah Johnson', 'Content Creator', 'MediaPro', 5, true, true),
  ('The AI-powered features are incredible. Saved us hours of editing time.', 'Mike Chen', 'Marketing Director', 'TechStart', 5, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO faqs (question, answer, category, list_order, enabled)
VALUES 
  ('How does VideoRemix work?', 'Upload your video, choose a style or effect, and our AI will process it automatically.', 'General', 1, true),
  ('Is it free to use?', 'We offer a free tier with limited features. Upgrade for unlimited access.', 'Pricing', 2, true),
  ('What video formats are supported?', 'MP4, MOV, AVI, and WebM formats are supported.', 'Technical', 3, true)
ON CONFLICT DO NOTHING;

INSERT INTO pricing_plans (name, price_monthly, price_yearly, description, features, is_popular, enabled)
VALUES 
  ('Free', 0, 0, 'Perfect for trying out', '["5 videos per month", "720p export", "Basic effects"]', false, true),
  ('Pro', 9.99, 99, 'For content creators', '["Unlimited videos", "1080p export", "All effects", "Priority processing"]', true, true),
  ('Enterprise', 49.99, 499, 'For teams and businesses', '["Everything in Pro", "4K export", "API access", "Dedicated support"]', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_is_public ON videos(is_public);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_app_id ON purchases(app_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_sort_order ON apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

SELECT '✅ Database schema created successfully!';
`

async function createSchema() {
  console.log('='.repeat(60))
  console.log('DATABASE SCHEMA CREATION')
  console.log('='.repeat(60))
  console.log(`Project: ${SUPABASE_URL}`)
  console.log('='.repeat(60))
  console.log('\n📋 Creating tables and policies...\n')

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL })

    if (error) {
      console.log('Note: RPC exec_sql not available, providing SQL for manual execution')
      console.log('\n' + '='.repeat(60))
      console.log('📝 COPY THIS SQL AND RUN IN SUPABASE SQL EDITOR')
      console.log('='.repeat(60))
      console.log(schemaSQL)
      console.log('='.repeat(60))
    } else {
      console.log('✅ All tables created successfully!')
      console.log('\nCreated tables:')
      console.log('  - apps (RLS policies added)')
      console.log('  - hero_content')
      console.log('  - benefits_features')
      console.log('  - testimonials')
      console.log('  - faqs')
      console.log('  - pricing_plans')
      console.log('  - videos')
      console.log('  - purchases')
      console.log('  - subscriptions')
    }
  } catch (err: any) {
    console.log('Note: Direct SQL execution not available')
    console.log('\n' + '='.repeat(60))
    console.log('📝 PLEASE RUN THIS SQL IN SUPABASE DASHBOARD')
    console.log('Go to: https://supabase.com/dashboard → SQL Editor')
    console.log('='.repeat(60))
    console.log('\n' + schemaSQL + '\n')
    console.log('='.repeat(60))
  }
}

createSchema()
