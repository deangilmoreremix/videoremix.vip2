-- AgentOS seed data: routable model catalog and the integration directory.
--
-- The model catalog is the single source of truth for what a worker may be
-- routed to. Credit rates mirror supabase/functions/_shared/creditRates.ts
-- (the billing authority) so the UI cannot promise a cheaper price than the
-- runtime charges.
--
-- The integration directory is descriptive only: it records what the platform
-- supports. Entries marked 'unsupported' are intentionally NOT wired into the
-- runtime — an unsupported integration must never appear as a working tool.

BEGIN;

-- ---------------------------------------------------------------------------
-- Model catalog (OpenAI only: this platform routes every AgentOS execution
-- through the OpenAI Responses API service already used by the 130-app catalog
-- runner. Other providers are represented as provider_config rows only when a
-- BYOK credential has been verified, never as implicit defaults.)
-- ---------------------------------------------------------------------------
INSERT INTO agentos.model_catalog
  (id, provider, display_name, family, context_window, capabilities,
   credit_rate_in, credit_rate_out, status)
VALUES
  ('gpt-5',                 'openai', 'GPT-5',                 'gpt-5',     400000, ARRAY['text','vision','tools','reasoning'], 15,   120, 'active'),
  ('gpt-5-mini',            'openai', 'GPT-5 mini',            'gpt-5',     400000, ARRAY['text','vision','tools'],             3,    24,  'active'),
  ('gpt-4o',                'openai', 'GPT-4o',                'gpt-4o',    128000, ARRAY['text','vision','tools','audio'],    2.5,  10,  'active'),
  ('gpt-4o-mini',           'openai', 'GPT-4o mini',           'gpt-4o',    128000, ARRAY['text','vision','tools'],             0.15, 0.6, 'active'),
  ('o3',                    'openai', 'o3',                    'reasoning', 200000, ARRAY['text','vision','tools','reasoning'], 10,   40,  'active'),
  ('o4-mini',               'openai', 'o4-mini',               'reasoning', 200000, ARRAY['text','tools','reasoning'],          1.1,  4.4, 'active'),
  ('text-embedding-3-large','openai', 'text-embedding-3-large','embedding',  8191,  ARRAY['embeddings'],                        0.13,  0,  'active')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  family = EXCLUDED.family,
  context_window = EXCLUDED.context_window,
  capabilities = EXCLUDED.capabilities,
  credit_rate_in = EXCLUDED.credit_rate_in,
  credit_rate_out = EXCLUDED.credit_rate_out,
  status = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- Integration directory
--
-- support semantics:
--   supported  — the runtime has a real, exercised execution path
--   limited    — usable through the generic HTTP/key tool with degraded scope
--   unsupported — deliberately not wired; must never render as a working tool
-- ---------------------------------------------------------------------------
INSERT INTO agentos.integrations
  (key, name, description, category, auth_type, capabilities, support, docs_url)
VALUES
  ('openai_responses', 'OpenAI Responses API',
   'Primary model runtime: streaming text, structured tool calls, file search, code interpreter, web search.',
   'ai', 'api_key', ARRAY['chat','tools','streaming','embeddings'], 'supported',
   'https://platform.openai.com/docs/api-reference/responses'),
  ('openai_file_search', 'OpenAI Vector Stores',
   'Retrieval over files uploaded to an OpenAI vector store (file_search tool).',
   'ai', 'api_key', ARRAY['retrieval'], 'supported',
   'https://platform.openai.com/docs/guides/retrieval'),
  ('videoremix_apps', 'VideoRemix App Catalog',
   'The canonical 130-app catalog. Workers invoke an app capability through the same runner and credit system as the dashboard.',
   'platform', 'none', ARRAY['app_invocation'], 'supported', ''),
  ('videoremix_personalizer', 'VideoRemix Personalizer',
   'Prospect scan, personalization generation and media generation jobs.',
   'platform', 'none', ARRAY['app_invocation'], 'supported', ''),
  ('web_fetch', 'Web Fetch',
   'Server-side HTTP fetch with response-size and content-type limits.',
   'web', 'none', ARRAY['fetch'], 'supported', ''),
  ('supabase_storage', 'Supabase Storage',
   'Artifact persistence in the user workspace bucket with per-tenant prefixes.',
   'platform', 'api_key', ARRAY['files'], 'supported', ''),
  ('browser_session', 'Isolated Browser Session',
   'Dedicated browser context for account-based web surfaces. Requires an explicitly provisioned browser worker.',
   'browser', 'browser_session', ARRAY['browser_automation'], 'limited', ''),
  ('telegram', 'Telegram Channels',
   'Channel routing for notifications and agent replies.',
   'messaging', 'oauth2', ARRAY['notifications','channel_routing'], 'limited', ''),
  ('slack', 'Slack',
   'Workspace messaging channel routing.',
   'messaging', 'oauth2', ARRAY['notifications','channel_routing'], 'limited', ''),
  ('gmail', 'Gmail',
   'Mailbox read/compose surfaces.',
   'messaging', 'oauth2', ARRAY['email'], 'limited', ''),
  ('google_drive', 'Google Drive',
   'Document ingestion from a connected Drive.',
   'files', 'oauth2', ARRAY['files'], 'limited', ''),
  ('notion', 'Notion',
   'Workspace documents and databases.',
   'files', 'oauth2', ARRAY['files','documents'], 'limited', ''),
  ('github', 'GitHub',
   'Repository and issue surfaces.',
   'developer', 'oauth2', ARRAY['code','issues'], 'limited', ''),
  ('openclaw_gateway', 'OpenClaw Gateway',
   'Intentionally EXCLUDED from this port. No runtime path exists and none will be added.',
   'excluded', 'none', ARRAY[]::text[], 'unsupported', '')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  auth_type = EXCLUDED.auth_type,
  capabilities = EXCLUDED.capabilities,
  support = EXCLUDED.support,
  docs_url = EXCLUDED.docs_url;

-- ---------------------------------------------------------------------------
-- Tools the runtime dispatches by key
--
-- agentos-tools resolves the requested key against this directory BEFORE its
-- dispatch switch, so a key that is missing here is unreachable: 'vector_search'
-- and 'artifact_write' both answered "Unknown tool" even though the runtime
-- implements them. They are inserted on their own with DO NOTHING so the
-- fourteen catalog rows above are never rewritten or reordered.
-- ---------------------------------------------------------------------------
INSERT INTO agentos.integrations
  (key, name, description, category, auth_type, capabilities, support, docs_url)
VALUES
  ('vector_search', 'Vector Search',
   'Keyword and recency search over the durable memories of a worker.',
   'knowledge', 'none', ARRAY['search'], 'supported', ''),
  ('artifact_write', 'Artifact Write',
   'Persist a text artifact for the run.',
   'storage', 'none', ARRAY['files'], 'supported', '')
ON CONFLICT (key) DO NOTHING;

-- Defensive: if an OpenClaw row exists under a different key, it is recorded as
-- unsupported rather than silently wired.
UPDATE agentos.integrations
  SET support = 'unsupported',
      capabilities = ARRAY[]::text[],
      description = 'Intentionally EXCLUDED from this port. No runtime path exists and none will be added.'
  WHERE key ILIKE '%openclaw%' AND support <> 'unsupported';

COMMIT;
