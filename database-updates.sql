-- SQL commands to run in Supabase Dashboard → SQL Editor

-- Insert all the converted OpenAI apps into app_api_requirements
INSERT INTO app_api_requirements (app_id, required_providers, description) VALUES
  -- Manually converted apps
  ('agentic-rag-math-agent', '["openai"]', 'Math tutoring agent using OpenAI'),
  ('devpulse-ai', '["openai"]', 'Developer signal intelligence using OpenAI'),
  ('gpt-oss-critique-loop', '["openai"]', 'Iterative text improvement using OpenAI'),
  ('ai-aqi-analysis', '["openai", "firecrawl"]', 'Air quality analysis using OpenAI + Firecrawl'),

  -- Auto-converted framework apps (16 apps)
  ('ai-tic-tac-toe-agent', '["openai"]', 'Tic-tac-toe agent using Agno + OpenAI'),
  ('ai-real-estate-agent-team', '["openai"]', 'Real estate agent team using Agno + OpenAI'),
  ('ai-travel-planner-agent-team', '["openai"]', 'Travel planner agent team using Agno + OpenAI'),
  ('multimodal-coding-agent-team', '["openai"]', 'Coding agent team using Agno + OpenAI'),
  ('multimodal-design-agent-team', '["openai"]', 'Design agent team using Agno + OpenAI'),
  ('ai-health-fitness-agent', '["openai"]', 'Health fitness agent using Agno + OpenAI'),
  ('ai-movie-production-agent', '["openai"]', 'Movie production agent using Agno + OpenAI'),
  ('ai-system-architect-r1', '["openai"]', 'System architect agent using Agno + OpenAI'),
  ('windows-use-autonomous-agent', '["openai"]', 'Windows automation agent using LangChain + OpenAI'),
  ('agentic-rag-with-reasoning', '["openai"]', 'RAG with reasoning using Agno + OpenAI'),
  ('ai-blog-search', '["openai"]', 'Blog search agent using LangChain + OpenAI'),
  ('rag-chain', '["openai"]', 'RAG chain using LangChain + OpenAI'),
  ('ai-breakup-recovery-agent', '["openai"]', 'Breakup recovery agent using Agno + OpenAI'),
  ('ai-medical-imaging-agent', '["openai"]', 'Medical imaging agent using Agno + OpenAI'),
  ('multimodal-ai-agent', '["openai"]', 'Multimodal AI agent using Agno + OpenAI'),

  -- Already OpenAI compatible (9 apps)
  ('ai-reasoning-agent', '["openai"]', 'AI reasoning agent using OpenAI'),
  ('openai-research-agent', '["openai"]', 'Research agent using OpenAI SDK'),
  ('web-scraping-ai-agent', '["openai"]', 'Web scraping agent using OpenAI'),
  ('ai-audio-tour-agent', '["openai"]', 'Audio tour agent using OpenAI'),
  ('customer-support-voice-agent', '["openai"]', 'Voice support agent using OpenAI'),
  ('openai-sdk-crash-course', '["openai"]', 'OpenAI SDK tutorial apps')

ON CONFLICT (app_id) DO UPDATE SET
  required_providers = EXCLUDED.required_providers,
  description = EXCLUDED.description;

-- Verify the insertions
SELECT app_id, required_providers, description
FROM app_api_requirements
WHERE app_id IN (
  'agentic-rag-math-agent', 'devpulse-ai', 'gpt-oss-critique-loop',
  'ai-tic-tac-toe-agent', 'ai-blog-search', 'openai-sdk-crash-course'
)
ORDER BY app_id;</content>
<parameter name="filePath">database-updates.sql