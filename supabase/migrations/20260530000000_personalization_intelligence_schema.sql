-- Personalization Intelligence Platform Schema
-- Extends existing personalizer tables with identity graph and async processing

-- Personality profiles (central intelligence model)
CREATE TABLE IF NOT EXISTS personalization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_name TEXT NOT NULL,
  company TEXT,
  website TEXT,
  industry TEXT,
  interests TEXT[],
  communication_style TEXT,
  personality_traits TEXT[],
  buying_signals TEXT[],
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_summary TEXT,
  recommended_hooks TEXT[],
  recommended_offers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform profiles (detailed platform data)
CREATE TABLE IF NOT EXISTS platform_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT,
  username TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  extracted_bio TEXT,
  extracted_interests TEXT[],
  activity_indicators JSONB,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity graph nodes (relationship mapping)
CREATE TABLE IF NOT EXISTS identity_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('username', 'website', 'company', 'domain', 'social')),
  node_value TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB
);

-- Identity graph edges (node relationships)
CREATE TABLE IF NOT EXISTS identity_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID REFERENCES identity_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES identity_graph_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('same_as', 'owned_by', 'works_at', 'related_to')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated assets (universal asset storage)
CREATE TABLE IF NOT EXISTS generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN ('cold_email', 'video_script', 'linkedin_opener', 'proposal_intro', 'meeting_opener', 'thumbnail_copy')
  ),
  title TEXT,
  content JSONB,
  prompt_used TEXT,
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan jobs (async processing)
CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  result_profile_id UUID REFERENCES personalization_profiles(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Scan events (realtime progress)
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL CHECK (step IN ('github', 'websites', 'profiles', 'graph', 'analysis', 'assets')),
  status TEXT CHECK (status IN ('started', 'progress', 'complete', 'failed')) NOT NULL,
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can manage own profiles" ON personalization_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assets" ON generated_assets
  FOR ALL USING (EXISTS (
    SELECT 1 FROM personalization_profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own scan jobs" ON scan_jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scan events" ON scan_events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM scan_jobs s WHERE s.id = job_id AND s.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_personalization_profiles_user_id ON personalization_profiles(user_id);
CREATE INDEX idx_platform_profiles_profile_id ON platform_profiles(profile_id);
CREATE INDEX idx_generated_assets_profile_id ON generated_assets(profile_id);
CREATE INDEX idx_scan_jobs_user_id ON scan_jobs(user_id);
CREATE INDEX idx_scan_events_job_id ON scan_events(job_id);