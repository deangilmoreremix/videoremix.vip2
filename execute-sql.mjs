/**
 * Execute SQL directly using Supabase REST API
 * This script creates all missing tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('='.repeat(60))
console.log('EXECUTING SQL SCHEMA')
console.log('='.repeat(60))

// Create a raw SQL client using fetch
async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SQL execution failed: ${error}`)
  }
  
  return await response.json()
}

// SQL statements to execute one by one
const sqlStatements = [
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

  // Apps table RLS policies
  `ALTER TABLE IF EXISTS apps ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Enable read access for all users" ON apps`,
  `CREATE POLICY "Enable read access for all users" ON apps FOR SELECT TO anon USING (true)`,

  // Hero Content
  `CREATE TABLE IF NOT EXISTS hero_content (
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
  )`,
  `ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read access" ON hero_content FOR SELECT TO anon USING (true)`,

  // Benefits Features
  `CREATE TABLE IF NOT EXISTS benefits_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    icon_name VARCHAR(100) DEFAULT 'star',
    stats JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  `ALTER TABLE benefits_features ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read access" ON benefits_features FOR SELECT TO anon USING (true)`,

  // Testimonials
  `CREATE TABLE IF NOT EXISTS testimonials (
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
  )`,
  `ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read access" ON testimonials FOR SELECT TO anon USING (true)`,

  // FAQs
  `CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question VARCHAR(500) NOT NULL DEFAULT '',
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    list_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,
  `ALTER TABLE faqs ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read access" ON faqs FOR SELECT TO anon USING (true)`,

  // Pricing Plans
  `CREATE TABLE IF NOT EXISTS pricing_plans (
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
  )`,
  `ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read access" ON pricing_plans FOR SELECT TO anon USING (true)`,

  // Videos
  `CREATE TABLE IF NOT EXISTS videos (
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
  )`,
  `ALTER TABLE videos ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "Public read" ON videos FOR SELECT TO anon USING (is_public = true)`,

  // Purchases
  `CREATE TABLE IF NOT EXISTS purchases (
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
  )`,
  `ALTER TABLE purchases ENABLE ROW LEVEL SECURITY`,

  // Subscriptions
  `CREATE TABLE IF NOT EXISTS subscriptions (
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
  )`,
  `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY`
]

async function run() {
  let success = 0
  let failed = 0

  for (const sql of sqlStatements) {
    try {
      await executeSQL(sql)
      console.log(`✅ Success`)
      success++
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 80)}...`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(60))
}

run().catch(console.error)
