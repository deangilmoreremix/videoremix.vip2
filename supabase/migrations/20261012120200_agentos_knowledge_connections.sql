-- AgentOS knowledge, model, and connection namespace.
--
-- MEMORY
--   agentos.memories holds per-worker and per-workspace durable context
--   (facts, preferences, notes, and ingested file text). Vector retrieval is
--   performed by the runtime against the optional pgvector `embedding` column
--   when it is available; the table is usable without it (keyword + recency +
--   importance ranking), so memory works on any Supabase project.
--
-- MODELS & PROVIDERS
--   agentos.model_catalog is the read-only catalog of routable models.
--   agentos.provider_configs holds per-user provider wiring. BYOK credentials
--   live ONLY in credential_ref (an opaque server-side pointer) — the frontend
--   can never read a secret from this schema.
--
-- CONNECTED ACCOUNTS
--   agentos.connected_accounts stores the authorization record for an external
--   surface (OAuth connection, API key account, browser session). Secrets and
--   access tokens are never stored here; only credential_ref, scopes, and
--   health metadata are.

BEGIN;

-- ---------------------------------------------------------------------------
-- Memory / durable context
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.memories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE CASCADE,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  kind           text NOT NULL DEFAULT 'note'
                   CHECK (kind IN ('fact', 'preference', 'note', 'knowledge',
                                   'file', 'summary')),
  scope          text NOT NULL DEFAULT 'worker'
                   CHECK (scope IN ('worker', 'workspace')),
  content        text NOT NULL CHECK (length(btrim(content)) > 0),
  source         text NOT NULL DEFAULT 'manual',
  importance     integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  tags           text[] NOT NULL DEFAULT '{}',
  hit_count      integer NOT NULL DEFAULT 0,
  last_used_at   timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memories_scope_target CHECK (
    (scope = 'worker' AND worker_id IS NOT NULL)
    OR (scope = 'workspace' AND workspace_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_agentos_memories_worker
  ON agentos.memories (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_memories_workspace
  ON agentos.memories (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_memories_owner
  ON agentos.memories (owner_clerk_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_agentos_memories_stamp ON agentos.memories;
CREATE TRIGGER trg_agentos_memories_stamp
  BEFORE INSERT ON agentos.memories
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- Optional vector column: only created when the `vector` type is already
-- available on the target project. When it is absent, memory retrieval falls
-- back to keyword + recency + importance ranking (documented in
-- docs/agentos/RUNTIME_CERTIFICATION.md) instead of failing the migration.
DO $$
BEGIN
  IF to_regtype('vector') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'agentos' AND table_name = 'memories'
         AND column_name = 'embedding'
     )
  THEN
    EXECUTE 'ALTER TABLE agentos.memories ADD COLUMN embedding vector(1536) NULL';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Conversations and messages (direct worker chat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.conversations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  title          text NOT NULL DEFAULT 'New conversation',
  channel        text NOT NULL DEFAULT 'ui'
                   CHECK (channel IN ('ui', 'canvas', 'api', 'schedule', 'mission')),
  message_count  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_conversations_owner
  ON agentos.conversations (owner_clerk_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_conversations_worker
  ON agentos.conversations (worker_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_agentos_conversations_stamp ON agentos.conversations;
CREATE TRIGGER trg_agentos_conversations_stamp
  BEFORE INSERT ON agentos.conversations
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

CREATE TABLE IF NOT EXISTS agentos.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES agentos.conversations (id) ON DELETE CASCADE,
  owner_clerk_id  text NOT NULL,
  role            text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         text NOT NULL DEFAULT '',
  tool_calls      jsonb NOT NULL DEFAULT '[]'::jsonb,
  run_id          uuid NULL,
  tokens          integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_messages_conversation
  ON agentos.messages (conversation_id, created_at);

DROP TRIGGER IF EXISTS trg_agentos_messages_stamp ON agentos.messages;
CREATE TRIGGER trg_agentos_messages_stamp
  BEFORE INSERT ON agentos.messages
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- Keep conversations.message_count honest from the DB, not the client.
CREATE OR REPLACE FUNCTION agentos.bump_conversation_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE agentos.conversations
    SET message_count = message_count + 1, updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentos_messages_count ON agentos.messages;
CREATE TRIGGER trg_agentos_messages_count
  AFTER INSERT ON agentos.messages
  FOR EACH ROW EXECUTE FUNCTION agentos.bump_conversation_count();

-- ---------------------------------------------------------------------------
-- Model catalog (read-only for clients)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.model_catalog (
  id             text PRIMARY KEY,
  provider       text NOT NULL,
  display_name   text NOT NULL,
  family         text NOT NULL DEFAULT '',
  context_window integer NOT NULL DEFAULT 0,
  capabilities   text[] NOT NULL DEFAULT '{}',
  credit_rate_in  numeric(18,9) NOT NULL DEFAULT 0,
  credit_rate_out numeric(18,9) NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'preview', 'deprecated')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Provider configurations (BYOK / platform keys).
-- credential_ref points at a server-side secret store; the secret itself is
-- NEVER present in this table or in any client-readable view.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.provider_configs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_id text NOT NULL,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  provider       text NOT NULL,
  label          text NOT NULL DEFAULT '',
  mode           text NOT NULL DEFAULT 'platform'
                   CHECK (mode IN ('platform', 'byok')),
  credential_ref text NULL,
  is_default     boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'untested'
                   CHECK (status IN ('untested', 'active', 'error', 'disabled')),
  model_ids      text[] NOT NULL DEFAULT '{}',
  last_test_at   timestamptz NULL,
  last_test_note text NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agentos_provider_default
  ON agentos.provider_configs (owner_clerk_id, provider) WHERE is_default;
CREATE INDEX IF NOT EXISTS idx_agentos_provider_owner
  ON agentos.provider_configs (owner_clerk_id);

DROP TRIGGER IF EXISTS trg_agentos_provider_stamp ON agentos.provider_configs;
CREATE TRIGGER trg_agentos_provider_stamp
  BEFORE INSERT ON agentos.provider_configs
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Integration directory (seeded catalog; clients read only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.integrations (
  key          text PRIMARY KEY,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  category     text NOT NULL DEFAULT 'general',
  auth_type    text NOT NULL DEFAULT 'api_key'
                 CHECK (auth_type IN ('api_key', 'oauth2', 'browser_session', 'none')),
  capabilities text[] NOT NULL DEFAULT '{}',
  support      text NOT NULL DEFAULT 'limited'
                 CHECK (support IN ('supported', 'limited', 'unsupported')),
  docs_url     text NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Connected accounts: authorization records for external surfaces.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.connected_accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  integration_key text NOT NULL REFERENCES agentos.integrations (key) ON DELETE RESTRICT,
  account_label  text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'connected'
                   CHECK (status IN ('connected', 'revoked', 'error', 'expired')),
  scopes         text[] NOT NULL DEFAULT '{}',
  credential_ref text NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  isolation      text NOT NULL DEFAULT 'tenant'
                   CHECK (isolation IN ('tenant', 'worker', 'ephemeral')),
  health_status  text NOT NULL DEFAULT 'unknown'
                   CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'failed')),
  last_checked_at timestamptz NULL,
  connected_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_agentos_connected_owner
  ON agentos.connected_accounts (owner_clerk_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agentos_connected_workspace
  ON agentos.connected_accounts (workspace_id) WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS trg_agentos_connected_stamp ON agentos.connected_accounts;
CREATE TRIGGER trg_agentos_connected_stamp
  BEFORE INSERT ON agentos.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Artifacts produced by executions (files, reports, generated media).
-- storage_path points at Supabase Storage; it is stored, not the bytes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.artifacts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid NULL REFERENCES agentos.execution_runs (id) ON DELETE SET NULL,
  task_id        uuid NULL REFERENCES agentos.tasks (id) ON DELETE SET NULL,
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  kind           text NOT NULL DEFAULT 'file'
                   CHECK (kind IN ('file', 'text', 'image', 'audio', 'video', 'report')),
  name           text NOT NULL,
  storage_path   text NULL,
  mime_type      text NULL,
  size_bytes     bigint NULL,
  preview        text NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_artifacts_owner
  ON agentos.artifacts (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_artifacts_run ON agentos.artifacts (run_id);

DROP TRIGGER IF EXISTS trg_agentos_artifacts_stamp ON agentos.artifacts;
CREATE TRIGGER trg_agentos_artifacts_stamp
  BEFORE INSERT ON agentos.artifacts
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Usage records: billing-relevant meter per execution.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.usage_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_id    text NOT NULL,
  workspace_id      uuid NULL,
  worker_id         uuid NULL,
  run_id            uuid NULL REFERENCES agentos.execution_runs (id) ON DELETE SET NULL,
  provider          text NOT NULL,
  model_id          text NOT NULL,
  prompt_tokens     integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  credits           numeric(18,6) NOT NULL DEFAULT 0,
  cost_usd          numeric(18,8) NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_usage_owner
  ON agentos.usage_records (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_usage_worker
  ON agentos.usage_records (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_usage_model
  ON agentos.usage_records (owner_clerk_id, model_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_agentos_usage_stamp ON agentos.usage_records;
CREATE TRIGGER trg_agentos_usage_stamp
  BEFORE INSERT ON agentos.usage_records
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Audit log: every mutating action, actor-attributed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.audit_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_clerk_id text NULL,
  acting_as      text NOT NULL DEFAULT 'user'
                   CHECK (acting_as IN ('user', 'worker', 'system')),
  action         text NOT NULL,
  entity_type    text NOT NULL,
  entity_id      text NULL,
  workspace_id   uuid NULL,
  summary        text NOT NULL DEFAULT '',
  before         jsonb NULL,
  after          jsonb NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_audit_actor
  ON agentos.audit_logs (actor_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_audit_entity
  ON agentos.audit_logs (entity_type, entity_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Notifications surfaced in the UI activity stream.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_id text NOT NULL,
  kind           text NOT NULL DEFAULT 'info',
  title          text NOT NULL,
  body           text NOT NULL DEFAULT '',
  entity_type    text NULL,
  entity_id      text NULL,
  read_at        timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_notifications_owner
  ON agentos.notifications (owner_clerk_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_agentos_notifications_stamp ON agentos.notifications;
CREATE TRIGGER trg_agentos_notifications_stamp
  BEFORE INSERT ON agentos.notifications
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Canvas persistence (Mission Control nodes + edges)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.canvas_nodes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  node_kind      text NOT NULL
                   CHECK (node_kind IN ('workspace', 'worker', 'task', 'model', 'runtime', 'surface')),
  ref_id         uuid NULL,
  label          text NOT NULL DEFAULT '',
  position       jsonb NOT NULL DEFAULT '{"x":0,"y":0}'::jsonb,
  data           jsonb NOT NULL DEFAULT '{}'::jsonb,
  z_index        integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_canvas_nodes_owner
  ON agentos.canvas_nodes (owner_clerk_id, workspace_id);

DROP TRIGGER IF EXISTS trg_agentos_canvas_nodes_stamp ON agentos.canvas_nodes;
CREATE TRIGGER trg_agentos_canvas_nodes_stamp
  BEFORE INSERT ON agentos.canvas_nodes
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

CREATE TABLE IF NOT EXISTS agentos.canvas_edges (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  source_node_id uuid NOT NULL REFERENCES agentos.canvas_nodes (id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES agentos.canvas_nodes (id) ON DELETE CASCADE,
  edge_kind      text NOT NULL DEFAULT 'handoff'
                   CHECK (edge_kind IN ('handoff', 'dependency', 'assignment', 'data')),
  label          text NOT NULL DEFAULT '',
  animated       boolean NOT NULL DEFAULT true,
  data           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canvas_edges_no_self CHECK (source_node_id <> target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_agentos_canvas_edges_owner
  ON agentos.canvas_edges (owner_clerk_id, workspace_id);

DROP TRIGGER IF EXISTS trg_agentos_canvas_edges_stamp ON agentos.canvas_edges;
CREATE TRIGGER trg_agentos_canvas_edges_stamp
  BEFORE INSERT ON agentos.canvas_edges
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

COMMIT;
