-- Create content tables for all 104 apps to support multi-tenancy
-- Users get access via user_app_access, and their generated content is saved per-user

-- ============================================
-- AI IMAGE TOOLS (30+ apps)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_image_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text NOT NULL REFERENCES apps(slug),
  project_name text NOT NULL,
  input_image_url text,
  output_image_url text,
  generation_type text, -- headshot, logo, pet, renovation, etc.
  settings jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ai_image_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own image projects"
  ON ai_image_projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_image_projects_user ON ai_image_projects(user_id);
CREATE INDEX idx_ai_image_projects_app ON ai_image_projects(app_slug);

-- ============================================
-- BRANDING APPS (5 apps)
-- ============================================
CREATE TABLE IF NOT EXISTS branding_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text NOT NULL REFERENCES apps(slug),
  project_name text NOT NULL,
  brand_name text,
  brand_description text,
  logo_url text,
  color_palette jsonb DEFAULT '[]'::jsonb,
  fonts jsonb DEFAULT '[]'::jsonb,
  guidelines jsonb DEFAULT '{}'::jsonb,
  output_urls jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE branding_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own branding projects"
  ON branding_projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_branding_projects_user ON branding_projects(user_id);
CREATE INDEX idx_branding_projects_app ON branding_projects(app_slug);

-- ============================================
-- CREATIVE APPS (12 apps)
-- ============================================
CREATE TABLE IF NOT EXISTS creative_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text NOT NULL REFERENCES apps(slug),
  project_name text NOT NULL,
  project_type text, -- storyboard, presentation, social-pack, meme, etc.
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  output_urls jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE creative_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own creative projects"
  ON creative_projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_creative_projects_user ON creative_projects(user_id);
CREATE INDEX idx_creative_projects_app ON creative_projects(app_slug);

-- ============================================
-- LEAD-GEN APPS (25+ apps)
-- ============================================
CREATE TABLE IF NOT EXISTS leadgen_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text NOT NULL REFERENCES apps(slug),
  project_name text NOT NULL,
  project_type text, -- landing-page, crm, funnel, recruiter, etc.
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  published_url text,
  form_config jsonb DEFAULT '{}'::jsonb,
  analytics jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE leadgen_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leadgen projects"
  ON leadgen_projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_leadgen_projects_user ON leadgen_projects(user_id);
CREATE INDEX idx_leadgen_projects_app ON leadgen_projects(app_slug);

-- ============================================
-- APP USAGE TRACKING (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS app_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  app_slug text NOT NULL REFERENCES apps(slug),
  action text NOT NULL, -- 'opened', 'generated', 'saved', 'exported'
  duration_seconds integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own usage logs"
  ON app_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs"
  ON app_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_app_usage_logs_user ON app_usage_logs(user_id);
CREATE INDEX idx_app_usage_logs_app ON app_usage_logs(app_slug);

-- ============================================
-- GRANT ACCESS FUNCTION (checks multi-tenant access)
-- ============================================
CREATE OR REPLACE FUNCTION user_can_access_app(check_user_id uuid, check_app_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_app_access
    WHERE user_id = check_user_id
    AND app_slug = check_app_slug
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- ============================================
-- UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_image_projects_updated_at BEFORE UPDATE ON ai_image_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branding_projects_updated_at BEFORE UPDATE ON branding_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creative_projects_updated_at BEFORE UPDATE ON creative_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leadgen_projects_updated_at BEFORE UPDATE ON leadgen_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_image_projects, branding_projects, creative_projects, leadgen_projects, app_usage_logs TO authenticated;
