-- Personalization Intelligence Platform Schema
-- Adds 7 new tables for advanced personalization with identity graph and async processing

-- Scan Jobs for async processing
CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_username TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  total_steps INTEGER DEFAULT 5,
  error_message TEXT,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan Events for realtime progress tracking
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL CHECK (step_name IN ('initiate', 'scan', 'analyze', 'graph', 'generate', 'complete')),
  step_number INTEGER NOT NULL,
  total_steps INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'progress', 'completed', 'error')),
  message TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization Profiles (enhanced)
CREATE TABLE IF NOT EXISTS personalization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_name TEXT NOT NULL,
  target_company TEXT,
  target_username TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score FLOAT,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Profiles (from Maigret scan)
CREATE TABLE IF NOT EXISTS platform_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  platform_username TEXT,
  profile_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('found', 'not_found', 'error', 'pending')),
  confidence_score FLOAT,
  title TEXT,
  description TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity Graph Nodes
CREATE TABLE IF NOT EXISTS identity_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.5,
  evidence JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity Graph Edges
CREATE TABLE IF NOT EXISTS identity_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID REFERENCES identity_graph_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES identity_graph_nodes(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.5,
  evidence JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Assets
CREATE TABLE IF NOT EXISTS generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('email', 'video_script', 'proposal', 'thumbnail', 'social_post', 'blog_outline')),
  content TEXT NOT NULL,
  title TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intelligence Profiles (aggregated insights)
CREATE TABLE IF NOT EXISTS intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES personalization_profiles(id) ON DELETE CASCADE NOT NULL,
  personality_traits JSONB,
  communication_style JSONB,
  interests TEXT[],
  platforms_active TEXT[],
  influence_score FLOAT,
  demographics JSONB,
  content_preferences JSONB,
  confidence_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_jobs
CREATE POLICY "Users can manage own scan jobs" ON scan_jobs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for scan_events
CREATE POLICY "Users can view events for their jobs" ON scan_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scan_jobs WHERE scan_jobs.id = scan_events.job_id AND scan_jobs.user_id = auth.uid())
  );

-- RLS Policies for personalization_profiles
CREATE POLICY "Users can manage own profiles" ON personalization_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for platform_profiles
CREATE POLICY "Users can view profiles through parent" ON platform_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM personalization_profiles WHERE personalization_profiles.id = platform_profiles.profile_id AND personalization_profiles.user_id = auth.uid())
  );

-- RLS Policies for identity_graph_nodes
CREATE POLICY "Users can view graph nodes through profile" ON identity_graph_nodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM personalization_profiles WHERE personalization_profiles.id = identity_graph_nodes.profile_id AND personalization_profiles.user_id = auth.uid())
  );

-- RLS Policies for identity_graph_edges
CREATE POLICY "Users can view graph edges through nodes" ON identity_graph_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM identity_graph_nodes n
      JOIN personalization_profiles p ON p.id = n.profile_id
      WHERE (n.id = identity_graph_edges.source_node_id OR n.id = identity_graph_edges.target_node_id)
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for generated_assets
CREATE POLICY "Users can view assets through profile" ON generated_assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM personalization_profiles WHERE personalization_profiles.id = generated_assets.profile_id AND personalization_profiles.user_id = auth.uid())
  );

-- RLS Policies for intelligence_profiles
CREATE POLICY "Users can view intelligence through profile" ON intelligence_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM personalization_profiles WHERE personalization_profiles.id = intelligence_profiles.profile_id AND personalization_profiles.user_id = auth.uid())
  );

-- Enable realtime for scan_events (required for progress streaming)
-- This must be done in the Supabase dashboard or via SQL
-- ALTER TABLE scan_events ENABLE REPLICA IDENTITY FULL;