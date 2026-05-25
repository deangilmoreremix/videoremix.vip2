-- Add updated_at column if missing (for existing table without it)
ALTER TABLE app_api_requirements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Ensure trigger exists for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_api_requirements_updated_at ON app_api_requirements;
CREATE TRIGGER update_app_api_requirements_updated_at
  BEFORE UPDATE ON app_api_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Streamlit apps to app_api_requirements
INSERT INTO app_api_requirements (app_id, required_providers, description) VALUES
  ('agentic-rag-math-agent', '["openai"]', 'Math tutoring agent using OpenAI'),
  ('devpulse-ai', '["openai"]', 'Developer signal intelligence using OpenAI'),
  ('gpt-oss-critique-loop', '["openai"]', 'Iterative text improvement using OpenAI'),
  ('ai-aqi-analysis', '["openai", "firecrawl"]', 'Air quality analysis using OpenAI + Firecrawl')
ON CONFLICT (app_id) DO UPDATE SET
  required_providers = EXCLUDED.required_providers,
  description = EXCLUDED.description;