-- =============================================================================
-- Create Missing Tables Migration
-- =============================================================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text DEFAULT '',
  status text DEFAULT 'active',
  plan_id text DEFAULT '',
  plan_name text DEFAULT '',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now(),
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hero Content table
CREATE TABLE IF NOT EXISTS hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text DEFAULT '',
  description text DEFAULT '',
  cta_text text DEFAULT '',
  cta_link text DEFAULT '',
  background_image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Benefits Features table
CREATE TABLE IF NOT EXISTS benefits_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  company text DEFAULT '',
  content text NOT NULL,
  avatar_url text DEFAULT '',
  rating integer DEFAULT 5,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing Plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  isPopular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Import Records table
CREATE TABLE IF NOT EXISTS import_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  import_type text NOT NULL,
  status text DEFAULT 'pending',
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  file_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Add tenant_id to these tables if not exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hero_content') THEN
    ALTER TABLE hero_content ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'benefits_features') THEN
    ALTER TABLE benefits_features ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testimonials') THEN
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faqs') THEN
    ALTER TABLE faqs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_plans') THEN
    ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'import_records') THEN
    ALTER TABLE import_records ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Set default tenant_id for existing records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'tenant_id') THEN
    UPDATE subscriptions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hero_content' AND column_name = 'tenant_id') THEN
    UPDATE hero_content SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'benefits_features' AND column_name = 'tenant_id') THEN
    UPDATE benefits_features SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'tenant_id') THEN
    UPDATE testimonials SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faqs' AND column_name = 'tenant_id') THEN
    UPDATE faqs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_plans' AND column_name = 'tenant_id') THEN
    UPDATE pricing_plans SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'import_records' AND column_name = 'tenant_id') THEN
    UPDATE import_records SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hero_content_tenant ON hero_content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benefits_features_tenant ON benefits_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_tenant ON testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faqs_tenant ON faqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tenant ON pricing_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_records_tenant ON import_records(tenant_id);
