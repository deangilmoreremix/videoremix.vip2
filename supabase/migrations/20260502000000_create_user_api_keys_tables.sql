-- Enable pgcrypto for encryption functions if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User API Keys Table
-- Stores encrypted API keys for each user and provider
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'gemini', 'elevenlabs', 'cohere', 'together', 'xai', 'google', 'aws', 'azure', 'custom')),
  encrypted_api_key TEXT NOT NULL,
  key_hint TEXT, -- optional hint/label user can set (e.g., "My OpenAI key")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Row Level Security: Users can only access their own keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- App API Requirements Table
-- Maps each app to the API providers it requires
CREATE TABLE IF NOT EXISTS app_api_requirements (
  app_id VARCHAR(100) PRIMARY KEY,
  required_providers JSONB NOT NULL DEFAULT '[]', -- array of provider strings
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup by app_id
CREATE INDEX IF NOT EXISTS idx_app_api_requirements_app_id ON app_api_requirements(app_id);

-- Seed some common app requirements (will be populated gradually)
INSERT INTO app_api_requirements (app_id, required_providers, description) VALUES
  ('reasoning-agent', '["openai"]', 'Standard OpenAI chat completion'),
  ('ai-blog-to-podcast-agent', '["openai", "elevenlabs"]', 'OpenAI for script, ElevenLabs for TTS'),
  ('chat-with-pdf', '["openai"]', 'OpenAI embeddings and chat'),
  ('ai-travel-agent', '["openai"]', 'OpenAI for planning and recommendations'),
  ('ai-data-analysis-agent', '["openai"]', 'OpenAI for data analysis and code execution')
ON CONFLICT (app_id) DO NOTHING;

-- API Usage Logs (optional, for analytics/quotas)
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  app_id VARCHAR(100) REFERENCES app_api_requirements(app_id),
  provider VARCHAR(50),
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10,4) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for usage analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_app ON api_usage_logs(user_id, app_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);

-- Function to log API usage (can be called from Edge Functions)
CREATE OR REPLACE FUNCTION log_api_usage(
  p_user_id UUID,
  p_app_id VARCHAR(100),
  p_provider VARCHAR(50),
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_estimate DECIMAL(10,4) DEFAULT 0.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO api_usage_logs (user_id, app_id, provider, tokens_used, cost_estimate)
  VALUES (p_user_id, p_app_id, p_provider, p_tokens_used, p_cost_estimate);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute on log_api_usage, only allow authenticated calls via service role
REVOKE ALL ON FUNCTION log_api_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_api_usage TO authenticated;

-- Helper function to check if user has required API keys for an app
CREATE OR REPLACE FUNCTION user_has_api_keys(
  p_user_id UUID,
  p_app_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
  required_providers JSONB;
  missing_count INTEGER;
BEGIN
  -- Get required providers for the app
  SELECT required_providers INTO required_providers
  FROM app_api_requirements
  WHERE app_id = p_app_id;

  IF required_providers IS NULL THEN
    -- No requirements defined, assume accessible
    RETURN TRUE;
  END IF;

  -- Count how many required providers the user has keys for
  SELECT COUNT(*) INTO missing_count
  FROM jsonb_array_elements_text(required_providers) AS req_provider
  WHERE NOT EXISTS (
    SELECT 1 FROM user_api_keys
    WHERE user_id = p_user_id
      AND provider = req_provider::VARCHAR(50)
  );

  RETURN missing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION user_has_api_keys FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_has_api_keys TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_api_requirements_updated_at
  BEFORE UPDATE ON app_api_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
