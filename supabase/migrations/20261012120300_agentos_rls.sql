-- AgentOS Row Level Security.
--
-- RULES APPLIED TO EVERY TABLE
--   * RLS is enabled; there is always a SELECT policy.
--   * Owner predicate: agentos.current_clerk_id() = owner_clerk_id.
--   * Workspace-scoped rows additionally allow any CURRENT member of the
--     referenced workspace (agentos.is_workspace_member).
--   * Appends-only tables (execution_events, audit_logs, usage_records) have
--     SELECT only — a client can never rewrite an audit trail.
--   * Seeded catalogs (model_catalog, integrations) are readable to
--     authenticated users and writable only by service_role.
--   * There is no policy anywhere that grants anonymous access.
--
-- The service_role key bypasses RLS entirely and is used ONLY by server-side
-- code (Supabase Edge Functions), which is why the durable-queue functions in
-- 20261012120400_agentos_queue_rpc.sql are SECURITY DEFINER.

BEGIN;

-- ---------------------------------------------------------------------------
-- Schema privileges (the standard Supabase pattern: GRANT USAGE on the schema
-- and default table privileges to the application roles, then let RLS do the
-- row filtering). Guarded for the bare-postgres test environment, where
-- service_role does not exist but authenticated must.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA agentos TO authenticated;
DO $$
BEGIN
  IF to_regrole('service_role') IS NOT NULL THEN
    GRANT USAGE ON SCHEMA agentos TO service_role;
  END IF;
END $$;

-- Default privileges for tables created later in this migration.
ALTER DEFAULT PRIVILEGES IN SCHEMA agentos
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA agentos
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ===========================================================================
-- Workspaces / members
-- ===========================================================================
ALTER TABLE agentos.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspaces_select ON agentos.workspaces;
CREATE POLICY workspaces_select ON agentos.workspaces
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR agentos.is_workspace_member(id)
  );

DROP POLICY IF EXISTS workspaces_insert ON agentos.workspaces;
CREATE POLICY workspaces_insert ON agentos.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

DROP POLICY IF EXISTS workspaces_update ON agentos.workspaces;
CREATE POLICY workspaces_update ON agentos.workspaces
  FOR UPDATE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

DROP POLICY IF EXISTS workspaces_delete ON agentos.workspaces;
CREATE POLICY workspaces_delete ON agentos.workspaces
  FOR DELETE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ws_members_select ON agentos.workspace_members;
CREATE POLICY ws_members_select ON agentos.workspace_members
  FOR SELECT TO authenticated
  USING (
    member_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
    OR agentos.is_workspace_member(workspace_id)
  );

-- Only the workspace owner manages membership.
DROP POLICY IF EXISTS ws_members_insert ON agentos.workspace_members;
CREATE POLICY ws_members_insert ON agentos.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  );

DROP POLICY IF EXISTS ws_members_update ON agentos.workspace_members;
CREATE POLICY ws_members_update ON agentos.workspace_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  );

DROP POLICY IF EXISTS ws_members_delete ON agentos.workspace_members;
CREATE POLICY ws_members_delete ON agentos.workspace_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  );

-- ===========================================================================
-- Workers / worker tools
-- ===========================================================================
ALTER TABLE agentos.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workers_select ON agentos.workers;
CREATE POLICY workers_select ON agentos.workers
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS workers_insert ON agentos.workers;
CREATE POLICY workers_insert ON agentos.workers
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS workers_update ON agentos.workers;
CREATE POLICY workers_update ON agentos.workers
  FOR UPDATE TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS workers_delete ON agentos.workers;
CREATE POLICY workers_delete ON agentos.workers
  FOR DELETE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.worker_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS worker_tools_select ON agentos.worker_tools;
CREATE POLICY worker_tools_select ON agentos.worker_tools
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.workers w
      WHERE w.id = worker_id
        AND (w.owner_clerk_id = agentos.current_clerk_id()
             OR (w.workspace_id IS NOT NULL AND agentos.is_workspace_member(w.workspace_id)))
    )
  );

DROP POLICY IF EXISTS worker_tools_write ON agentos.worker_tools;
CREATE POLICY worker_tools_write ON agentos.worker_tools
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agentos.workers w
      WHERE w.id = worker_id
        AND (w.owner_clerk_id = agentos.current_clerk_id()
             OR (w.workspace_id IS NOT NULL AND agentos.is_workspace_member(w.workspace_id)))
    )
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND EXISTS (
      SELECT 1 FROM agentos.workers w
      WHERE w.id = worker_id
        AND (w.owner_clerk_id = agentos.current_clerk_id()
             OR (w.workspace_id IS NOT NULL AND agentos.is_workspace_member(w.workspace_id)))
    )
  );

-- ===========================================================================
-- Missions / tasks / dependencies
-- ===========================================================================
ALTER TABLE agentos.missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS missions_all ON agentos.missions;
CREATE POLICY missions_all ON agentos.missions
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select ON agentos.tasks;
CREATE POLICY tasks_select ON agentos.tasks
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS tasks_insert ON agentos.tasks;
CREATE POLICY tasks_insert ON agentos.tasks
  FOR INSERT TO authenticated
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

-- Task lifecycle transitions (claim / lease / complete / fail / approve) are
-- performed by the SECURITY DEFINER queue functions, never directly by the
-- browser, so a client cannot forge a lease, mark a task complete, or unblock
-- an approval gate. The UPDATE policy below exists only for user-owned
-- metadata edits (title, description, priority, run_after) and the same
-- BEFORE INSERT trigger stamps owner_clerk_id so ownership cannot change.
DROP POLICY IF EXISTS tasks_update ON agentos.tasks;
CREATE POLICY tasks_update ON agentos.tasks
  FOR UPDATE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

DROP POLICY IF EXISTS tasks_delete ON agentos.tasks;
CREATE POLICY tasks_delete ON agentos.tasks
  FOR DELETE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.task_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_edges_all ON agentos.task_edges;
CREATE POLICY task_edges_all ON agentos.task_edges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id
        AND (t.owner_clerk_id = agentos.current_clerk_id()
             OR (t.workspace_id IS NOT NULL AND agentos.is_workspace_member(t.workspace_id)))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id AND t.owner_clerk_id = agentos.current_clerk_id()
    )
    AND EXISTS (
      SELECT 1 FROM agentos.tasks w
      WHERE w.id = waits_for AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  );

-- ===========================================================================
-- Runs / events
-- ===========================================================================
ALTER TABLE agentos.execution_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS runs_select ON agentos.execution_runs;
CREATE POLICY runs_select ON agentos.execution_runs
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id
        AND (t.owner_clerk_id = agentos.current_clerk_id()
             OR (t.workspace_id IS NOT NULL AND agentos.is_workspace_member(t.workspace_id)))
    )
  );

-- Runs are created and closed by the server-side execution layer only.
-- (No client INSERT/UPDATE policy.)

ALTER TABLE agentos.execution_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select ON agentos.execution_events;
CREATE POLICY events_select ON agentos.execution_events
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id
        AND (t.owner_clerk_id = agentos.current_clerk_id()
             OR (t.workspace_id IS NOT NULL AND agentos.is_workspace_member(t.workspace_id)))
    )
  );

-- Append-only for clients: no INSERT/UPDATE/DELETE policy is defined, so the
-- transcript can only be extended by service_role (the runtime).

-- ===========================================================================
-- Schedules / approvals
-- ===========================================================================
ALTER TABLE agentos.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schedules_all ON agentos.schedules;
CREATE POLICY schedules_all ON agentos.schedules
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approvals_select ON agentos.approvals;
CREATE POLICY approvals_select ON agentos.approvals
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  );

-- Approval decisions are made exclusively through the SECURITY DEFINER
-- agentos.resolve_approval() RPC (reached via the agentos-approvals edge
-- function), so no client UPDATE policy is defined here. A browser cannot
-- approve on someone else's behalf, nor bypass the ownership check that RPC
-- performs.

-- ===========================================================================
-- Memory / conversations
-- ===========================================================================
ALTER TABLE agentos.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memories_all ON agentos.memories;
CREATE POLICY memories_all ON agentos.memories
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_all ON agentos.conversations;
CREATE POLICY conversations_all ON agentos.conversations
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_select ON agentos.messages;
CREATE POLICY messages_select ON agentos.messages
  FOR SELECT TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.conversations c
      WHERE c.id = conversation_id
        AND (c.owner_clerk_id = agentos.current_clerk_id()
             OR (c.workspace_id IS NOT NULL AND agentos.is_workspace_member(c.workspace_id)))
    )
  );

DROP POLICY IF EXISTS messages_insert ON agentos.messages;
CREATE POLICY messages_insert ON agentos.messages
  FOR INSERT TO authenticated
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

-- ===========================================================================
-- Models / providers / integrations / connected accounts
-- ===========================================================================
ALTER TABLE agentos.model_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS model_catalog_select ON agentos.model_catalog;
CREATE POLICY model_catalog_select ON agentos.model_catalog
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE agentos.provider_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_configs_all ON agentos.provider_configs;
CREATE POLICY provider_configs_all ON agentos.provider_configs
  FOR ALL TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integrations_select ON agentos.integrations;
CREATE POLICY integrations_select ON agentos.integrations
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE agentos.connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS connected_accounts_all ON agentos.connected_accounts;
CREATE POLICY connected_accounts_all ON agentos.connected_accounts
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

-- ===========================================================================
-- Artifacts / usage / audit / notifications / canvas
-- ===========================================================================
ALTER TABLE agentos.artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artifacts_all ON agentos.artifacts;
CREATE POLICY artifacts_all ON agentos.artifacts
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_records_select ON agentos.usage_records;
CREATE POLICY usage_records_select ON agentos.usage_records
  FOR SELECT TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());

-- Append-only for clients (metering must not be editable from the browser).

ALTER TABLE agentos.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select ON agentos.audit_logs;
CREATE POLICY audit_logs_select ON agentos.audit_logs
  FOR SELECT TO authenticated
  USING (
    actor_clerk_id = agentos.current_clerk_id()
    OR EXISTS (
      SELECT 1 FROM agentos.workspaces w
      WHERE w.id = audit_logs.workspace_id
        AND w.owner_clerk_id = agentos.current_clerk_id()
    )
  );

-- Append-only for clients.

ALTER TABLE agentos.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_all ON agentos.notifications;
CREATE POLICY notifications_all ON agentos.notifications
  FOR ALL TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.canvas_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canvas_nodes_all ON agentos.canvas_nodes;
CREATE POLICY canvas_nodes_all ON agentos.canvas_nodes
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

ALTER TABLE agentos.canvas_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS canvas_edges_all ON agentos.canvas_edges;
CREATE POLICY canvas_edges_all ON agentos.canvas_edges
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

-- ---------------------------------------------------------------------------
-- Privileges on tables created in the previous AgentOS migration files. RLS
-- above still gates the rows; the GRANTs here just give the application role
-- permission to exercise those policies.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA agentos TO authenticated;
GRANT USAGE,  SELECT                  ON ALL SEQUENCES IN SCHEMA agentos TO authenticated;

DO $$
BEGIN
  IF to_regrole('service_role') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA agentos TO service_role';
    EXECUTE 'GRANT USAGE,  SELECT                  ON ALL SEQUENCES IN SCHEMA agentos TO service_role';
  END IF;
END $$;

COMMIT;
