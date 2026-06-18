-- =============================================================================
-- Migration: App Runtime Foundation (Phase 1)
-- =============================================================================

-- =============================================================================
-- App Runs: telemetry + tenant isolation proof
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  app_id TEXT NOT NULL,
  app_spec_version TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'failed', 'partial')),

  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,

  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  model TEXT,

  latency_ms INTEGER,
  error_code TEXT,
  error_message TEXT,
  error_retryable BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_app_runs_tenant
  ON app_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_runs_user
  ON app_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_runs_app
  ON app_runs(app_id, created_at DESC);

ALTER TABLE app_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation - app_runs" ON app_runs;
CREATE POLICY "Tenant isolation - app_runs"
  ON app_runs FOR ALL
  USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Service role bypass - app_runs" ON app_runs;
CREATE POLICY "Service role bypass - app_runs"
  ON app_runs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- App Access: whether a user may invoke a given app_id in a tenant
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE (tenant_id, user_id, app_id, granted_at)
);

CREATE INDEX IF NOT EXISTS idx_app_access_tenant_user
  ON app_access(tenant_id, user_id, revoked_at);

ALTER TABLE app_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation - app_access" ON app_access;
CREATE POLICY "Tenant isolation - app_access"
  ON app_access FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

DROP POLICY IF EXISTS "Service role bypass - app_access" ON app_access;
CREATE POLICY "Service role bypass - app_access"
  ON app_access FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Helpers
-- =============================================================================

CREATE OR REPLACE FUNCTION app_runtime.has_app_access(
  p_user_id uuid,
  p_app_id text
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_access a
    JOIN profiles p ON p.tenant_id = a.tenant_id
    WHERE a.user_id = p_user_id
      AND a.app_id = p_app_id
      AND a.revoked_at IS NULL
      AND p.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION app_runtime.record_app_run(
  p_tenant_id uuid,
  p_user_id uuid,
  p_app_id text,
  p_app_spec_version text,
  p_status text,
  p_input jsonb,
  p_output jsonb,
  p_prompt_tokens integer DEFAULT NULL,
  p_completion_tokens integer DEFAULT NULL,
  p_total_tokens integer DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_latency_ms integer DEFAULT NULL,
  p_error_code text DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_error_retryable boolean DEFAULT false
)
RETURNS app_runs
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_row app_runs;
BEGIN
  INSERT INTO app_runs (
    tenant_id,
    user_id,
    app_id,
    app_spec_version,
    status,
    input,
    output,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    model,
    latency_ms,
    error_code,
    error_message,
    error_retryable
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_app_id,
    p_app_spec_version,
    p_status,
    p_input,
    p_output,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_model,
    p_latency_ms,
    p_error_code,
    p_error_message,
    p_error_retryable
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION app_runtime.grant_app_access(
  p_tenant_id uuid,
  p_user_id uuid,
  p_app_id text,
  p_granted_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO app_access (tenant_id, user_id, app_id, granted_by)
  VALUES (p_tenant_id, p_user_id, p_app_id, p_granted_by)
  ON CONFLICT DO NOTHING;
END;
$$;
