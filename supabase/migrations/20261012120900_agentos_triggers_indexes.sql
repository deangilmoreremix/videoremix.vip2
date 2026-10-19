-- 20261012120900_agentos_triggers_indexes.sql
--
-- Maintenance triggers and the indexes the hot paths actually need.
--
-- WHY
--   1. updated_at was only maintained ad hoc, inside the handful of queue
--      RPCs that happened to touch a row. Every browser-side update left
--      `updated_at` stale, so "recently changed" ordering was wrong on every
--      list in the product.
--   2. `workspace_members.invited_by` was client-forgeable: the policy only
--      checked that the caller OWNS the workspace, and the column itself was
--      free text.
--   3. The queue's hot paths were missing indexes:
--        * the memory read orders by (importance DESC, last_used_at DESC)
--          but the only index was (worker_id, created_at DESC) — every
--          runtime prompt assembly sorted the worker's whole memory set;
--        * the pending-approvals list is ordered by requested_at DESC, but
--          the index led with owner_clerk_id and the RLS predicate is an OR
--          with a non-indexable subquery, so the leading column could not be
--          used as an index condition;
--        * the "latest run for a task" lookup filtered (task_id, status) and
--          sorted by started_at — only (task_id) existed;
--        * the foreign-key referencing sides had no index, so every
--          ON DELETE CASCADE / SET NULL / RESTRICT did a sequential scan.
--
-- All of this is additive: no table loses a column, no behaviour changes
-- except that `updated_at` is now actually true and `invited_by` is true.

BEGIN;

-- ===========================================================================
-- 1. updated_at
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION agentos.touch_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION agentos.touch_updated_at() TO service_role;

-- The tables that carry an updated_at column.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'workspaces', 'workers', 'missions', 'tasks', 'schedules',
    'memories', 'conversations', 'provider_configs', 'canvas_nodes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS agentos_touch_updated_at ON agentos.%I', t);
    EXECUTE format(
      'CREATE TRIGGER agentos_touch_updated_at BEFORE UPDATE ON agentos.%I
         FOR EACH ROW EXECUTE FUNCTION agentos.touch_updated_at()',
      t
    );
  END LOOP;
END $$;

-- ===========================================================================
-- 2. workspace_members.invited_by is stamped, not supplied
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.stamp_inviter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor text;
BEGIN
  v_actor := agentos.current_clerk_id();
  IF v_actor IS NOT NULL THEN
    NEW.invited_by := v_actor;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION agentos.stamp_inviter() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION agentos.stamp_inviter() TO service_role;

DROP TRIGGER IF EXISTS agentos_stamp_inviter ON agentos.workspace_members;
CREATE TRIGGER agentos_stamp_inviter
  BEFORE INSERT ON agentos.workspace_members
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_inviter();

-- ===========================================================================
-- 3. Indexes for the hot paths
-- ===========================================================================

-- Runtime prompt assembly: top memories for a worker by importance, then
-- recency.
CREATE INDEX IF NOT EXISTS idx_agentos_memories_worker_rank
  ON agentos.memories (worker_id, importance DESC, last_used_at DESC NULLS LAST)
  WHERE worker_id IS NOT NULL;

-- Pending approvals, newest first (the RLS predicate is an OR, so the sort
-- key has to lead the index).
CREATE INDEX IF NOT EXISTS idx_agentos_approvals_pending_time
  ON agentos.approvals (requested_at DESC)
  WHERE status = 'pending';

-- "Latest run for this task".
CREATE INDEX IF NOT EXISTS idx_agentos_runs_task_status
  ON agentos.execution_runs (task_id, status, started_at DESC);

-- Owner-scoped reads on tables that are filtered by owner_clerk_id.
CREATE INDEX IF NOT EXISTS idx_agentos_schedules_owner
  ON agentos.schedules (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_worker_tools_owner
  ON agentos.worker_tools (owner_clerk_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_messages_owner
  ON agentos.messages (owner_clerk_id, created_at DESC);

-- Foreign-key referencing sides (ON DELETE CASCADE / SET NULL / RESTRICT
-- otherwise sequential-scans the child table).
CREATE INDEX IF NOT EXISTS idx_agentos_connected_accounts_integration
  ON agentos.connected_accounts (integration_key);
CREATE INDEX IF NOT EXISTS idx_agentos_schedules_mission
  ON agentos.schedules (mission_id);
CREATE INDEX IF NOT EXISTS idx_agentos_schedules_workspace
  ON agentos.schedules (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_schedules_worker
  ON agentos.schedules (worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_missions_workspace
  ON agentos.missions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_approvals_run
  ON agentos.approvals (run_id);
CREATE INDEX IF NOT EXISTS idx_agentos_approvals_worker
  ON agentos.approvals (worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_approvals_workspace
  ON agentos.approvals (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_runs_worker
  ON agentos.execution_runs (worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_events_worker
  ON agentos.execution_events (worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_artifacts_task
  ON agentos.artifacts (task_id);
CREATE INDEX IF NOT EXISTS idx_agentos_artifacts_worker
  ON agentos.artifacts (worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_artifacts_workspace
  ON agentos.artifacts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_conversations_workspace
  ON agentos.conversations (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_provider_configs_workspace
  ON agentos.provider_configs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_workspace
  ON agentos.tasks (workspace_id)
  WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_handoff
  ON agentos.tasks (handoff_to_task_id)
  WHERE handoff_to_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agentos_execution_events_run
  ON agentos.execution_events (run_id, seq);

COMMIT;
