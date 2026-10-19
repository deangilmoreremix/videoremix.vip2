-- 20261012120800_agentos_security_lockdown.sql
--
-- Close the cross-tenant and privilege-escalation holes in the `agentos`
-- schema. Every change here is a LOCKDOWN of an existing surface; nothing is
-- removed, and no existing table loses a column.
--
-- WHY
--   The port's own RLS header claims:
--     "the browser-facing RLS policies deliberately do not grant a client the
--      right to claim a lease, mark a run finished, or release an approval
--      gate"
--   That was true of the POLICIES but not of the FUNCTIONS. Every function
--   below is SECURITY DEFINER, and PostgreSQL grants EXECUTE on a new
--   function to PUBLIC by default. No migration ever revoked that, so once
--   the schema is exposed to PostgREST, ANY signed-in tenant could call:
--
--     * claim_due_tasks()  -> returned other tenants' task rows
--                               (title, description, input, owner_clerk_id)
--     * complete_task()    -> marked another tenant's task completed
--     * fail_task()        -> failed another tenant's task
--     * enqueue_task()     -> enqueued another tenant's task
--     * request_approval() -> parked another tenant's task
--     * dispatch_due_schedules() -> fired another tenant's schedules
--     * recover_stale_runs()     -> released another tenant's leases
--
--   RLS does not apply to SECURITY DEFINER functions: they run as their
--   owner, so the row policies are bypassed entirely. Seven of the eight
--   queue functions also re-derive no actor at all, so they had no tenant
--   predicate of their own.
--
--   Two more holes are closed here:
--     * agentos.tasks had a table-wide UPDATE grant, so an owner could
--       forge a lease (lease_owner / lease_expires_at), reset the retry
--       budget (attempt), or write a terminal status — exactly what the
--       RLS comment says a client must not be able to do. RLS cannot
--       restrict columns, so the grant itself has to be column-level.
--     * agentos.messages only checked the OWNER of the new message row, not
--       the conversation it points at, so a tenant could append messages to
--       another tenant's conversation and bump its message_count.
--
-- WHAT THIS MIGRATION DOES
--   1. REVOKE EXECUTE on every agentos function from PUBLIC and anon.
--   2. GRANT EXECUTE to service_role (the scheduler / edge-function role).
--   3. GRANT EXECUTE to authenticated ONLY for the functions a browser may
--      legitimately call, each of which re-derives the actor from the JWT and
--      checks ownership:
--        current_clerk_id, is_workspace_member  (policy helpers)
--        resolve_approval, increment_memory_hit (owner-checked)
--        cron_field_matches, next_cron_run       (pure functions)
--   4. Column-level UPDATE on agentos.tasks; DELETE revoked entirely.
--   5. Task/edge/memory/artifact/canvas/conversation writes must name a
--      workspace the caller actually belongs to.
--   6. messages must belong to a conversation the caller owns or is a member
--      of.
--
-- ROLLBACK
--   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA agentos TO PUBLIC;
--   GRANT UPDATE, DELETE ON agentos.tasks TO authenticated;
--   (and restore the previous policies — they are re-created by the
--   migrations that follow, so replaying them is enough.)

BEGIN;

-- ===========================================================================
-- 1. Function privileges
-- ===========================================================================

-- Nothing in the agentos schema is executable by default any more.
REVOKE ALL ON FUNCTION agentos.current_clerk_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.is_workspace_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.stamp_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.add_owner_membership() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.assign_event_seq() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.link_task_approval() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.validate_task_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.bump_conversation_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.cron_field_matches(text, integer, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.next_cron_run(text, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.enqueue_task(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.claim_due_tasks(text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.complete_task(uuid, jsonb, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.fail_task(uuid, text, uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.recover_stale_runs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.resolve_approval(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.request_approval(uuid, text, jsonb, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.dispatch_due_schedules(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.increment_memory_hit(uuid) FROM PUBLIC, anon;

-- The scheduler identity: the edge functions and the pg_cron sweep.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA agentos TO service_role;

-- The browser identity: only the functions that are safe to expose.
-- current_clerk_id / is_workspace_member are evaluated inside RLS policies,
-- so the querying role needs EXECUTE on them; both are read-only helpers.
GRANT EXECUTE ON FUNCTION agentos.current_clerk_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION agentos.is_workspace_member(uuid) TO authenticated, anon;

-- Pure functions: no data, no side effects.
GRANT EXECUTE ON FUNCTION agentos.cron_field_matches(text, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.next_cron_run(text, text, timestamptz) TO authenticated;

-- Owner-checked, actor-derived: the browser may call these.
--   resolve_approval   -> re-derives the actor from the JWT and refuses
--                          unless the caller owns the approval
--   increment_memory_hit -> same, and refuses a foreign memory
GRANT EXECUTE ON FUNCTION agentos.resolve_approval(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.increment_memory_hit(uuid) TO authenticated;

-- Trigger functions: EXECUTE is checked when the trigger is created, but the
-- grants keep the schema consistent and let a migration recreate a trigger
-- as a non-superuser role.
GRANT EXECUTE ON FUNCTION agentos.stamp_owner() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agentos.add_owner_membership() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION agentos.assign_event_seq() TO service_role;
GRANT EXECUTE ON FUNCTION agentos.link_task_approval() TO service_role;
GRANT EXECUTE ON FUNCTION agentos.validate_task_status() TO service_role;
GRANT EXECUTE ON FUNCTION agentos.bump_conversation_count() TO service_role;

-- ===========================================================================
-- 2. agentos.tasks: the browser may edit metadata and nothing else
-- ===========================================================================
--
-- The lifecycle columns (status, attempt, lease_owner, lease_expires_at,
-- output, error, approval_id, started_at, completed_at) belong to the queue
-- RPCs. A table-wide UPDATE grant let an owner forge any of them.
REVOKE UPDATE, DELETE ON agentos.tasks FROM authenticated, anon;

GRANT UPDATE (title, description, priority, run_after, mission_id)
  ON agentos.tasks TO authenticated;

-- Deleting a task cascades into agentos.execution_events and
-- agentos.execution_runs, i.e. it silently rewrites the audit trail. Tasks
-- are cancelled, never deleted.
DROP POLICY IF EXISTS tasks_delete ON agentos.tasks;

-- The UPDATE policy stays (it is the row filter); the COLUMN grant above is
-- what actually limits which columns a client can touch.
DROP POLICY IF EXISTS tasks_update ON agentos.tasks;
CREATE POLICY tasks_update ON agentos.tasks
  FOR UPDATE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

-- ===========================================================================
-- 3. Writes that name a workspace must name one the caller belongs to
-- ===========================================================================
--
-- The `..._all` policies below checked only owner_clerk_id, so a tenant
-- could attach a row to ANOTHER tenant's workspace_id and thereby surface it
-- in that workspace's member views. The insert path for workers already did
-- this correctly; these are the ones that did not.

DROP POLICY IF EXISTS missions_all ON agentos.missions;
CREATE POLICY missions_all ON agentos.missions
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS tasks_insert ON agentos.tasks;
CREATE POLICY tasks_insert ON agentos.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS task_edges_all ON agentos.task_edges;
CREATE POLICY task_edges_all ON agentos.task_edges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id
        AND (
          t.owner_clerk_id = agentos.current_clerk_id()
          OR (t.workspace_id IS NOT NULL AND agentos.is_workspace_member(t.workspace_id))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agentos.tasks t
      WHERE t.id = task_id
        AND (
          t.owner_clerk_id = agentos.current_clerk_id()
          OR (t.workspace_id IS NOT NULL AND agentos.is_workspace_member(t.workspace_id))
        )
    )
  );

DROP POLICY IF EXISTS schedules_all ON agentos.schedules;
CREATE POLICY schedules_all ON agentos.schedules
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS memories_all ON agentos.memories;
CREATE POLICY memories_all ON agentos.memories
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS conversations_all ON agentos.conversations;
CREATE POLICY conversations_all ON agentos.conversations
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS messages_insert ON agentos.messages;
CREATE POLICY messages_insert ON agentos.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND EXISTS (
      SELECT 1 FROM agentos.conversations c
      WHERE c.id = conversation_id
        AND (
          c.owner_clerk_id = agentos.current_clerk_id()
          OR (c.workspace_id IS NOT NULL AND agentos.is_workspace_member(c.workspace_id))
        )
    )
  );

DROP POLICY IF EXISTS provider_configs_all ON agentos.provider_configs;
CREATE POLICY provider_configs_all ON agentos.provider_configs
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS connected_accounts_all ON agentos.connected_accounts;
CREATE POLICY connected_accounts_all ON agentos.connected_accounts
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS artifacts_all ON agentos.artifacts;
CREATE POLICY artifacts_all ON agentos.artifacts
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS canvas_nodes_all ON agentos.canvas_nodes;
CREATE POLICY canvas_nodes_all ON agentos.canvas_nodes
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS canvas_edges_all ON agentos.canvas_edges;
CREATE POLICY canvas_edges_all ON agentos.canvas_edges
  FOR ALL TO authenticated
  USING (
    owner_clerk_id = agentos.current_clerk_id()
    OR (workspace_id IS NOT NULL AND agentos.is_workspace_member(workspace_id))
  )
  WITH CHECK (
    owner_clerk_id = agentos.current_clerk_id()
    AND (workspace_id IS NULL OR agentos.is_workspace_member(workspace_id))
  );

-- ===========================================================================
-- 4. notifications: a client may mark its own notifications read, but it
--    may not manufacture them.
-- ===========================================================================
DROP POLICY IF EXISTS notifications_all ON agentos.notifications;
CREATE POLICY notifications_select ON agentos.notifications
  FOR SELECT TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());
CREATE POLICY notifications_update ON agentos.notifications
  FOR UPDATE TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id())
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());
CREATE POLICY notifications_insert ON agentos.notifications
  FOR INSERT TO authenticated
  WITH CHECK (owner_clerk_id = agentos.current_clerk_id());

COMMIT;
