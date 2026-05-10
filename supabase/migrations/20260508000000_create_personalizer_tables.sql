-- Create personalizer tables for VideoRemix.vip AI Creative Personalizer
-- Run this in Supabase SQL Editor

-- Profile scan results (public-only, optional)
CREATE TABLE IF NOT EXISTS profile_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_name TEXT NOT NULL,
  target_handle TEXT,
  scan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization projects
CREATE TABLE IF NOT EXISTS personalization_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cold-email', 'video-email', 'proposal', 'sales-page', 'thumbnail', 'content-campaign', 'agency-pitch', 'lead-summary')),
  target_name TEXT NOT NULL,
  target_company TEXT,
  manual_notes TEXT,
  scan_id UUID REFERENCES profile_scan_results(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'complete', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated outputs
CREATE TABLE IF NOT EXISTS personalization_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES personalization_projects(id) ON DELETE CASCADE NOT NULL,
  output_type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt templates
CREATE TABLE IF NOT EXISTS personalizer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('system', 'user')) NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS personalizer_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  default_offer TEXT,
  default_goal TEXT,
  default_tone TEXT DEFAULT 'professional',
  default_cta TEXT,
  theme JSONB DEFAULT '{"primary": "#8B5CF6", "secondary": "#06B6D4"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (critical for scale)
CREATE INDEX IF NOT EXISTS idx_profile_scan_results_user_id ON profile_scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_scan_results_created_at ON profile_scan_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_scan_results_user_created ON profile_scan_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_personalization_projects_user_id ON personalization_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_app_mode ON personalization_projects(app_id, mode);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_created_at ON personalization_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_user_created ON personalization_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalization_projects_status ON personalization_projects(status);

CREATE INDEX IF NOT EXISTS idx_personalization_outputs_project_id ON personalization_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_personalization_outputs_created_at ON personalization_outputs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_personalizer_templates_app_mode ON personalizer_templates(app_id, mode);
CREATE INDEX IF NOT EXISTS idx_personalizer_templates_default ON personalizer_templates(is_default) WHERE is_default = TRUE;

-- Enable Row Level Security on all user data tables
ALTER TABLE profile_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizer_settings ENABLE ROW LEVEL SECURITY;
-- Note: personalizer_templates has mixed access (public read for defaults, admin write)
ALTER TABLE personalizer_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- profile_scan_results policies
CREATE POLICY IF NOT EXISTS "Users can view own scan results" ON profile_scan_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own scan results" ON profile_scan_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own scan results" ON profile_scan_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own scan results" ON profile_scan_results
  FOR DELETE USING (auth.uid() = user_id);

-- personalization_projects policies
CREATE POLICY IF NOT EXISTS "Users can manage own projects" ON personalization_projects
  FOR ALL USING (auth.uid() = user_id);

-- personalization_outputs policies (access via project ownership)
CREATE POLICY IF NOT EXISTS "Users can view outputs via project" ON personalization_outputs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM personalization_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create outputs via project" ON personalization_outputs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personalization_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- personalizer_settings policies
CREATE POLICY IF NOT EXISTS "Users can manage own settings" ON personalizer_settings
  FOR ALL USING (auth.uid() = user_id);

-- personalizer_templates policies (public read for defaults, authenticated users can read all)
CREATE POLICY IF NOT EXISTS "Anyone can read templates" ON personalizer_templates
  FOR SELECT USING (true);

-- Note: For admin write access to templates, create a separate admin role check
-- CREATE POLICY "Admins can manage templates" ON personalizer_templates
--   FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_personalization_projects_updated_at ON personalization_projects;
CREATE TRIGGER update_personalization_projects_updated_at
    BEFORE UPDATE ON personalization_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personalizer_settings_updated_at ON personalizer_settings;
CREATE TRIGGER update_personalizer_settings_updated_at
    BEFORE UPDATE ON personalizer_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default prompt templates
INSERT INTO personalizer_templates (app_id, mode, template_type, content, is_default) VALUES
('videoremix-vip', 'cold-email', 'system', 'You are a professional email writer for VideoRemix.vip. Use the provided target information to personalize a cold email. Focus on business value, keep it non-creepy, use language like "your public presence suggests" when referencing profile data. Never use private/surveillance language.', TRUE),
('videoremix-vip', 'cold-email', 'user', 'Generate a cold email for {{target_name}} at {{target_company}}. Goal: {{goal}}. Offer: {{offer}}. Tone: {{tone}}. CTA: {{cta}}. Profile summary: {{scanData}}. Manual notes: {{manual_notes}}.', TRUE)
ON CONFLICT DO NOTHING;

-- Optional: Cleanup old data (uncomment and run via pg_cron if available)
-- SELECT cron.schedule('cleanup-old-personalizer-data', '0 2 * * *', $$
--   DELETE FROM profile_scan_results WHERE created_at < NOW() - INTERVAL '30 days';
--   DELETE FROM personalization_projects WHERE status = 'draft' AND created_at < NOW() - INTERVAL '90 days';
--   DELETE FROM personalization_projects WHERE status = 'complete' AND created_at < NOW() - INTERVAL '180 days';
-- $$);
-- If pg_cron is not available, you can use Supabase Edge Functions or Netlify scheduled functions instead.
