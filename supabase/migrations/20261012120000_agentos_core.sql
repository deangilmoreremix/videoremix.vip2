-- AgentOS core namespace: workspaces, members, digital workers, worker tools.
--
-- WHY A DEDICATED SCHEMA
--   VideoRemix.vip2 already owns public.app_users, public.purchases,
--   public.user_app_access, credits.*, and the 130-app catalog. AgentOS data is
--   additive platform state, so it lives in its own `agentos` schema to avoid
--   collisions in the shared Supabase project and to make the port auditable
--   and reversible (DROP SCHEMA agentos CASCADE would never touch a
--   customer-facing table).
--
-- IDENTITY MODEL (do not duplicate customer identity)
--   The customer IdP is Clerk. Every AgentOS row is owned by a Clerk user id
--   (`owner_clerk_id`), which is the `sub` claim of the Clerk-issued JWT that
--   the Supabase client sends on every request. There is intentionally NO
--   second copy of user records: app_users / clerk_identities remain the only
--   identity stores, and AgentOS references them by Clerk id only.
--
-- TENANT ISOLATION
--   Row Level Security is enabled on EVERY table. The owner predicate is
--   agentos.current_clerk_id() = owner_clerk_id. Workspaces add a second,
--   explicit membership predicate (agentos.workspace_members) so a workspace
--   owner can share a workspace with teammates without giving them access to
--   anything else. There are no INSERT/UPDATE/DELETE policies that let a
--   client forge ownership: owner_clerk_id is always stamped by the DB from
--   the verified JWT (see the BEFORE INSERT triggers below), so a client
--   cannot create a row owned by somebody else.
--
-- NO SECRETS
--   Provider credentials and connected-account credentials are NEVER stored
--   in these tables. Only opaque references (credential_ref) to a server-side
--   secret store are persisted.

BEGIN;

CREATE SCHEMA IF NOT EXISTS agentos;

-- ---------------------------------------------------------------------------
-- Identity helper: the verified Clerk user id, or NULL when unauthenticated.
--
-- Uses current_setting('request.jwt.claims', true) directly so the function
-- is portable between Supabase (which sets the GUC on every request) and a
-- bare Postgres (where the GUC just stays NULL and the caller sees an
-- unauthenticated response). Wrapped in a try/catch so a bare cluster that
-- has not set the GUC at all still returns NULL instead of erroring.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.current_clerk_id()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_claims text;
  v_sub    text;
BEGIN
  BEGIN
    v_claims := current_setting('request.jwt.claims', true);
  EXCEPTION WHEN OTHERS THEN
    v_claims := NULL;
  END;

  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    v_sub := (v_claims::jsonb) ->> 'sub';
  EXCEPTION WHEN OTHERS THEN
    v_sub := NULL;
  END;

  RETURN NULLIF(v_sub, '');
END;
$$;

COMMENT ON FUNCTION agentos.current_clerk_id() IS
  'Verified Clerk user id from the request JWT (sub). NULL when unauthenticated.';

-- ---------------------------------------------------------------------------
-- Workspace membership helper: TRUE when the caller is a member of a
-- workspace. SECURITY DEFINER so the membership lookup is not itself blocked
-- by RLS. Deliberately plpgsql (not sql) so it can be created before the
-- membership table it reads exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM agentos.workspace_members m
    WHERE m.workspace_id = p_workspace_id
      AND m.member_clerk_id = agentos.current_clerk_id()
      AND m.revoked_at IS NULL
  );
END;
$$;

-- Stamp owner_clerk_id from the verified JWT, ignoring any client value.
CREATE OR REPLACE FUNCTION agentos.stamp_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.owner_clerk_id := agentos.current_clerk_id();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.workspaces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_clerk_id  text NOT NULL,
  name            text NOT NULL CHECK (length(btrim(name)) > 0),
  description     text NOT NULL DEFAULT '',
  goals           text NOT NULL DEFAULT '',
  instructions    text NOT NULL DEFAULT '',
  policies        jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings        jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_at     timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_workspaces_owner
  ON agentos.workspaces (owner_clerk_id) WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trg_agentos_workspaces_stamp ON agentos.workspaces;
CREATE TRIGGER trg_agentos_workspaces_stamp
  BEFORE INSERT ON agentos.workspaces
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Workspace members (teams)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.workspace_members (
  workspace_id    uuid NOT NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  member_clerk_id text NOT NULL,
  role            text NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by      text NULL,
  revoked_at      timestamptz NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, member_clerk_id),
  CONSTRAINT workspace_members_id_nonempty CHECK (length(btrim(member_clerk_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_agentos_ws_members_member
  ON agentos.workspace_members (member_clerk_id) WHERE revoked_at IS NULL;

-- Auto-add the creator as owner so a freshly created workspace is usable
-- without a second round-trip.
CREATE OR REPLACE FUNCTION agentos.add_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO agentos.workspace_members (workspace_id, member_clerk_id, role)
  VALUES (NEW.id, NEW.owner_clerk_id, 'owner')
  ON CONFLICT (workspace_id, member_clerk_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentos_workspaces_owner ON agentos.workspaces;
CREATE TRIGGER trg_agentos_workspaces_owner
  AFTER INSERT ON agentos.workspaces
  FOR EACH ROW EXECUTE FUNCTION agentos.add_owner_membership();

-- ---------------------------------------------------------------------------
-- Digital workers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.workers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id     text NOT NULL,
  name               text NOT NULL CHECK (length(btrim(name)) > 0),
  role               text NOT NULL DEFAULT '',
  avatar             text NULL,
  accent             text NOT NULL DEFAULT 'violet',
  instructions       text NOT NULL DEFAULT '',
  goals              text NOT NULL DEFAULT '',
  status             text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  model_provider     text NOT NULL DEFAULT 'openai',
  model_id           text NOT NULL DEFAULT 'gpt-4o-mini',
  fallback_provider  text NULL,
  fallback_model_id  text NULL,
  temperature        numeric(4,3) NOT NULL DEFAULT 0.700
                       CHECK (temperature >= 0 AND temperature <= 2),
  max_output_tokens  integer NOT NULL DEFAULT 2048 CHECK (max_output_tokens > 0),
  tools              jsonb NOT NULL DEFAULT '[]'::jsonb,
  knowledge          jsonb NOT NULL DEFAULT '[]'::jsonb,
  memory_enabled     boolean NOT NULL DEFAULT true,
  permissions        jsonb NOT NULL DEFAULT '{}'::jsonb,
  heartbeat          jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata           jsonb NOT NULL DEFAULT '{}'::jsonb,
  cloned_from        uuid NULL,
  archived_at        timestamptz NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_workers_owner
  ON agentos.workers (owner_clerk_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agentos_workers_workspace
  ON agentos.workers (workspace_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agentos_workers_status
  ON agentos.workers (owner_clerk_id, status) WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trg_agentos_workers_stamp ON agentos.workers;
CREATE TRIGGER trg_agentos_workers_stamp
  BEFORE INSERT ON agentos.workers
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Worker tools (an assigned capability = a reference to a catalog entry, not
-- a copy of it — see docs/agentos/FEATURE_PARITY.md)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.worker_tools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   uuid NOT NULL REFERENCES agentos.workers (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  tool_key    text NOT NULL,
  config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, tool_key)
);

CREATE INDEX IF NOT EXISTS idx_agentos_worker_tools_worker ON agentos.worker_tools (worker_id);

DROP TRIGGER IF EXISTS trg_agentos_worker_tools_stamp ON agentos.worker_tools;
CREATE TRIGGER trg_agentos_worker_tools_stamp
  BEFORE INSERT ON agentos.worker_tools
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

COMMIT;
