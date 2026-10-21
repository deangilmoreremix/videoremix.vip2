-- 20261012121000_agentos_queue_semantics.sql
--
-- Correct the durable-queue semantics that the first cut got wrong.
--
-- The defects, and what changes:
--
--   1. A FAILED dependency left its dependents 'blocked' forever. The
--      dependency filter treated every non-'completed' dependency as unmet,
--      so a dependent of a failed task could never be claimed, and nothing
--      ever moved it out of 'blocked'. Now a failure marks the dependents
--      blocked WITH A REASON, and completing a dependency releases them.
--
--   2. A task could be claimed past its retry budget. `claim_due_tasks`
--      filtered on status and run_after only, so `attempt < max_attempts`
--      was never enforced. Enforced now.
--
--   3. A task with no worker was claimed and then failed by the executor,
--      burning one attempt per sweep. Such a task is now parked as 'blocked'
--      with a reason, and is never claimed.
--
--   4. No LEASE FENCING. `complete_task` / `fail_task` matched on the task
--      id alone, so a worker whose lease had expired (and whose task had
--      been re-claimed) could still complete it and overwrite the new
--      worker's result. Both now take the lease owner and refuse a task
--      that is no longer leased to the caller.
--
--   5. `dispatch_due_schedules` claimed to be idempotent but was not: a
--      replayed sweep created a second task for the same occurrence. Tasks
--      now carry the schedule they came from and the occurrence they were
--      scheduled for, with a unique index on the pair, so a dispatch is
--      idempotent at the data level.
--
--   6. `request_approval` had no way to record the run that asked for
--      approval, so `approvals.run_id` was always NULL. Added.
--
--   7. Approvals never expired: `expires_at` was set and the status enum
--      had 'expired', but nothing ever expired a pending approval, so a
--      parked task waited forever. `expire_stale_approvals()` now does, and
--      it releases the parked task.
--
--   8. `next_cron_run` could never fire on a day-of-week of 7 (Sunday),
--      because EXTRACT(DOW) yields 0-6 — while the browser preview
--      (src/services/agentos/cron.ts) happily showed Sundays. The two now
--      agree.
--
--   9. `assign_event_seq` computed MAX(seq)+1 without a lock, so two
--      concurrent events for one run could take the same sequence number.
--      Now serialized with an advisory lock.
--
--  10. Cancelling a task bypassed the rollups (the edge function wrote the
--      status directly), so a mission could stay 'active' forever. There is
--      now a `cancel_task` RPC that cancels the task, its dependents and
--      rolls the mission up.
--
-- All changes are additive. No column is dropped; `schedule_id` and
-- `blocked_reason` are new and nullable.

BEGIN;

-- ===========================================================================
-- 1. New columns
-- ===========================================================================

ALTER TABLE agentos.tasks
  ADD COLUMN IF NOT EXISTS schedule_id uuid
    REFERENCES agentos.schedules (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

COMMENT ON COLUMN agentos.tasks.schedule_id IS
  'The schedule that produced this task (null for manual/mission tasks).';
COMMENT ON COLUMN agentos.tasks.blocked_reason IS
  'Why the task is blocked: unmet dependency, failed dependency, or no worker assigned.';

-- One task per schedule occurrence: a replayed sweep cannot double-dispatch.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agentos_tasks_schedule_occurrence
  ON agentos.tasks (schedule_id, run_after)
  WHERE schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agentos_tasks_schedule
  ON agentos.tasks (schedule_id)
  WHERE schedule_id IS NOT NULL;

-- ===========================================================================
-- 2. enqueue_task: record WHY a task is blocked
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.enqueue_task(
  p_task_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_unmet int;
  v_failed_dep uuid;
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'missing';
  END IF;

  IF v_task.status IN ('completed', 'failed', 'cancelled', 'running') THEN
    RETURN v_task.status::text;
  END IF;

  SELECT count(*), min(dep.id)
    INTO v_unmet, v_failed_dep
  FROM agentos.task_edges e
  JOIN agentos.tasks dep ON dep.id = e.waits_for
  WHERE e.task_id = p_task_id
    AND e.kind = 'depends_on'
    AND dep.status <> 'completed';

  IF v_unmet > 0 THEN
    UPDATE agentos.tasks
      SET status = 'blocked',
          blocked_reason = CASE
            WHEN EXISTS (
              SELECT 1 FROM agentos.task_edges e2
              JOIN agentos.tasks dep2 ON dep2.id = e2.waits_for
              WHERE e2.task_id = p_task_id
                AND e2.kind = 'depends_on'
                AND dep2.status IN ('failed', 'cancelled')
            ) THEN 'a dependency failed or was cancelled'
            ELSE 'waiting on an earlier task'
          END,
          updated_at = now()
      WHERE id = p_task_id AND status <> 'blocked';
    RETURN 'blocked';
  END IF;

  -- A task with no worker cannot run: park it with a reason instead of
  -- letting the sweep claim it and burn an attempt.
  IF v_task.assigned_worker_id IS NULL THEN
    UPDATE agentos.tasks
      SET status = 'blocked',
          blocked_reason = 'no worker assigned',
          updated_at = now()
      WHERE id = p_task_id AND status NOT IN ('blocked', 'running', 'queued');
    RETURN 'blocked';
  END IF;

  UPDATE agentos.tasks
    SET status = 'queued',
        blocked_reason = NULL,
        updated_at = now()
    WHERE id = p_task_id AND status NOT IN ('queued', 'running');

  RETURN 'queued';
END;
$$;

-- ===========================================================================
-- 3. claim_due_tasks: respect the retry budget and require a worker
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.claim_due_tasks(
  p_worker_id  text,
  p_limit      integer DEFAULT 1,
  p_lease_seconds integer DEFAULT 120
) RETURNS TABLE (
  task_id             uuid,
  mission_id          uuid,
  workspace_id        uuid,
  owner_clerk_id      text,
  title               text,
  description         text,
  input               jsonb,
  attempt             integer,
  max_attempts        integer,
  priority            integer,
  worker_id           uuid,
  worker_name         text,
  worker_role         text,
  worker_instructions text,
  worker_goals        text,
  model_provider      text,
  model_id            text,
  fallback_provider   text,
  fallback_model_id   text,
  temperature         numeric,
  max_output_tokens   integer,
  worker_tools        jsonb,
  worker_knowledge    jsonb,
  memory_enabled      boolean,
  requires_approval   boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claim timestamptz := now();
  v_expiry timestamptz := now() + make_interval(secs => greatest(p_lease_seconds, 30));
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT t.id
    FROM agentos.tasks t
    WHERE t.status = 'queued'
      AND t.run_after <= v_claim
      AND t.attempt < t.max_attempts          -- never claim past the budget
      AND t.assigned_worker_id IS NOT NULL    -- an unassigned task cannot run
      AND (t.lease_expires_at IS NULL OR t.lease_expires_at < v_claim)
      AND NOT EXISTS (
        SELECT 1 FROM agentos.task_edges e
        JOIN agentos.tasks dep ON dep.id = e.waits_for
        WHERE e.task_id = t.id
          AND e.kind = 'depends_on'
          AND dep.status <> 'completed'
      )
    ORDER BY t.priority DESC, t.run_after ASC
    LIMIT greatest(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE agentos.tasks t
      SET status = 'running',
          attempt = t.attempt + 1,
          started_at = COALESCE(t.started_at, v_claim),
          lease_owner = p_worker_id,
          lease_expires_at = v_expiry,
          blocked_reason = NULL,
          updated_at = v_claim
    FROM candidates c
    WHERE t.id = c.id
    RETURNING t.*
  ), run_rows AS (
    INSERT INTO agentos.execution_runs
      (task_id, worker_id, owner_clerk_id, status, trigger, attempt,
       model_provider, model_id, lease_owner, lease_expires_at)
    SELECT cr.id, cr.assigned_worker_id, cr.owner_clerk_id, 'running',
           cr.trigger, cr.attempt,
           w.model_provider, w.model_id,
           p_worker_id, v_expiry
    FROM claimed cr
    LEFT JOIN agentos.workers w ON w.id = cr.assigned_worker_id
    RETURNING agentos.execution_runs.id AS run_id,
              agentos.execution_runs.task_id AS run_task_id
  )
  SELECT
    c.id,
    c.mission_id,
    c.workspace_id,
    c.owner_clerk_id,
    c.title,
    c.description,
    c.input,
    c.attempt,
    c.max_attempts,
    c.priority,
    w.id,
    w.name,
    w.role,
    w.instructions,
    w.goals,
    w.model_provider,
    w.model_id,
    w.fallback_provider,
    w.fallback_model_id,
    w.temperature,
    w.max_output_tokens,
    w.tools,
    w.knowledge,
    w.memory_enabled,
    c.requires_approval
  FROM claimed c
  LEFT JOIN agentos.workers w ON w.id = c.assigned_worker_id
  ORDER BY c.priority DESC, c.run_after ASC;
END;
$$;

-- ===========================================================================
-- 4. complete_task: lease fencing + release dependents with a clean reason
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.complete_task(
  p_task_id uuid,
  p_output  jsonb DEFAULT '{}'::jsonb,
  p_run_id  uuid DEFAULT NULL,
  p_lease_owner text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_unblocked uuid;
BEGIN
  UPDATE agentos.tasks
    SET status = 'completed',
        output = COALESCE(p_output, '{}'::jsonb),
        error = NULL,
        completed_at = now(),
        lease_owner = NULL,
        lease_expires_at = NULL,
        blocked_reason = NULL,
        updated_at = now()
    WHERE id = p_task_id
      -- Lease fencing: a caller that no longer holds the lease cannot
      -- complete the task (it may have been re-claimed after an expiry).
      AND (p_lease_owner IS NULL OR lease_owner = p_lease_owner)
    RETURNING * INTO v_task;

  IF NOT FOUND THEN RETURN; END IF;

  IF p_run_id IS NOT NULL THEN
    UPDATE agentos.execution_runs
      SET status = 'succeeded', ended_at = now(), lease_expires_at = NULL
      WHERE id = p_run_id AND status = 'running';
  END IF;

  -- Release every dependent whose remaining blockers are all completed.
  FOR v_unblocked IN
    SELECT e.task_id
    FROM agentos.task_edges e
    WHERE e.waits_for = p_task_id
      AND e.kind = 'depends_on'
      AND NOT EXISTS (
        SELECT 1 FROM agentos.task_edges e2
        JOIN agentos.tasks dep ON dep.id = e2.waits_for
        WHERE e2.task_id = e.task_id
          AND e2.kind = 'depends_on'
          AND dep.status <> 'completed'
      )
  LOOP
    UPDATE agentos.tasks
      SET status = 'queued', run_after = now(), blocked_reason = NULL, updated_at = now()
      WHERE id = v_unblocked AND status IN ('blocked', 'pending');
  END LOOP;

  -- Fire an explicit handoff edge.
  FOR v_unblocked IN
    SELECT e.task_id
    FROM agentos.task_edges e
    WHERE e.waits_for = p_task_id AND e.kind = 'handoff'
  LOOP
    PERFORM agentos.enqueue_task(v_unblocked);
  END LOOP;

  IF v_task.handoff_to_task_id IS NOT NULL THEN
    PERFORM agentos.enqueue_task(v_task.handoff_to_task_id);
  END IF;

  -- Mission rollup: complete only when every task in the mission is done.
  IF v_task.mission_id IS NOT NULL THEN
    UPDATE agentos.missions m
      SET status = CASE
            WHEN EXISTS (SELECT 1 FROM agentos.tasks t
                         WHERE t.mission_id = m.id
                           AND t.status NOT IN ('completed', 'cancelled'))
              THEN m.status
            ELSE 'completed' END,
          completed_at = CASE
            WHEN EXISTS (SELECT 1 FROM agentos.tasks t
                         WHERE t.mission_id = m.id
                           AND t.status NOT IN ('completed', 'cancelled'))
              THEN m.completed_at
            ELSE now() END,
          updated_at = now()
      WHERE m.id = v_task.mission_id;
  END IF;
END;
$$;

-- The three-argument version from the original queue migration is dropped:
-- with the four-argument version present, a call that names p_task_id,
-- p_output and p_run_id matches BOTH (the fourth parameter has a default),
-- and the call is ambiguous — in SQL and in PostgREST, which resolves an RPC
-- by its parameter names.
DROP FUNCTION IF EXISTS agentos.complete_task(uuid, jsonb, uuid);

-- ===========================================================================
-- 5. fail_task: lease fencing + propagate the failure to dependents
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.fail_task(
  p_task_id uuid,
  p_error   text,
  p_run_id  uuid DEFAULT NULL,
  p_retry_delay_seconds integer DEFAULT 30,
  p_lease_owner text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_decision text;
  v_dependent uuid;
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;

  -- Lease fencing: refuse to touch a task that is no longer leased to the
  -- caller.
  IF p_lease_owner IS NOT NULL AND v_task.lease_owner IS DISTINCT FROM p_lease_owner THEN
    RETURN 'not_leased';
  END IF;

  IF p_run_id IS NOT NULL THEN
    UPDATE agentos.execution_runs
      SET status = 'failed', ended_at = now(), error = p_error, lease_expires_at = NULL
      WHERE id = p_run_id AND status = 'running';
  END IF;

  IF v_task.attempt < v_task.max_attempts THEN
    UPDATE agentos.tasks
      SET status = 'queued',
          error = p_error,
          run_after = now() + make_interval(secs => greatest(p_retry_delay_seconds, 1)),
          lease_owner = NULL,
          lease_expires_at = NULL,
          blocked_reason = NULL,
          updated_at = now()
      WHERE id = p_task_id;
    v_decision := 'retry';
  ELSE
    UPDATE agentos.tasks
      SET status = 'failed',
          error = p_error,
          completed_at = now(),
          lease_owner = NULL,
          lease_expires_at = NULL,
          blocked_reason = NULL,
          updated_at = now()
      WHERE id = p_task_id;
    v_decision := 'failed';

    -- A failed task can never satisfy its dependents: park them with a
    -- reason instead of leaving them silently blocked forever.
    FOR v_dependent IN
      SELECT e.task_id
      FROM agentos.task_edges e
      WHERE e.waits_for = p_task_id AND e.kind = 'depends_on'
    LOOP
      UPDATE agentos.tasks
        SET status = 'blocked',
            blocked_reason = 'a dependency failed or was cancelled',
            updated_at = now()
        WHERE id = v_dependent
          AND status NOT IN ('completed', 'failed', 'cancelled', 'running');
    END LOOP;

    IF v_task.mission_id IS NOT NULL THEN
      UPDATE agentos.missions
        SET status = 'failed', updated_at = now()
        WHERE id = v_task.mission_id
          AND status NOT IN ('completed', 'cancelled');
    END IF;
  END IF;

  RETURN v_decision;
END;
$$;

-- The same ambiguity as complete_task: the four-argument version from the
-- original queue migration is dropped.
DROP FUNCTION IF EXISTS agentos.fail_task(uuid, text, uuid, integer);

-- ===========================================================================
-- 6. cancel_task: cancel a task, its dependents, and roll the mission up
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.cancel_task(
  p_task_id uuid,
  p_reason text DEFAULT ''
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_dependent uuid;
  v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'cancelled by the operator');
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;

  IF v_task.status IN ('completed', 'cancelled') THEN
    RETURN v_task.status::text;
  END IF;

  UPDATE agentos.tasks
    SET status = 'cancelled',
        error = v_reason,
        completed_at = now(),
        lease_owner = NULL,
        lease_expires_at = NULL,
        blocked_reason = NULL,
        updated_at = now()
    WHERE id = p_task_id;

  -- Dependents of a cancelled task can never run either.
  FOR v_dependent IN
    SELECT e.task_id
    FROM agentos.task_edges e
    WHERE e.waits_for = p_task_id AND e.kind = 'depends_on'
  LOOP
    UPDATE agentos.tasks
      SET status = 'cancelled',
          error = 'a dependency was cancelled',
          completed_at = now(),
          updated_at = now()
      WHERE id = v_dependent
        AND status NOT IN ('completed', 'failed', 'cancelled', 'running');
  END LOOP;

  -- A pending approval for this task is void.
  UPDATE agentos.approvals
    SET status = 'cancelled', decided_at = now(), decided_by = agentos.current_clerk_id()
    WHERE task_id = p_task_id AND status = 'pending';

  IF v_task.mission_id IS NOT NULL THEN
    UPDATE agentos.missions m
      SET status = CASE
            WHEN EXISTS (SELECT 1 FROM agentos.tasks t
                         WHERE t.mission_id = m.id
                           AND t.status NOT IN ('completed', 'cancelled'))
              THEN m.status
            ELSE 'cancelled' END,
          completed_at = CASE
            WHEN EXISTS (SELECT 1 FROM agentos.tasks t
                         WHERE t.mission_id = m.id
                           AND t.status NOT IN ('completed', 'cancelled'))
              THEN m.completed_at
            ELSE now() END,
          updated_at = now()
      WHERE m.id = v_task.mission_id;
  END IF;

  RETURN 'cancelled';
END;
$$;

-- ===========================================================================
-- 7. request_approval: record the run that asked for approval
-- ===========================================================================

-- The previous 5-argument version is dropped: with a DEFAULT on the new
-- parameter, PostgreSQL could not choose between the two overloads.
DROP FUNCTION IF EXISTS agentos.request_approval(uuid, text, jsonb, text, integer);

CREATE OR REPLACE FUNCTION agentos.request_approval(
  p_task_id     uuid,
  p_action_type text,
  p_action_payload jsonb DEFAULT '{}'::jsonb,
  p_reason      text DEFAULT '',
  p_expires_in_seconds integer DEFAULT 86400,
  p_run_id      uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_approval_id uuid;
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'agentos.request_approval: task % not found', p_task_id;
  END IF;

  INSERT INTO agentos.approvals
    (task_id, run_id, worker_id, workspace_id, owner_clerk_id, action_type,
     action_payload, reason, status, expires_at)
  VALUES
    (v_task.id, p_run_id, v_task.assigned_worker_id, v_task.workspace_id, v_task.owner_clerk_id,
     p_action_type, COALESCE(p_action_payload, '{}'::jsonb), COALESCE(p_reason, ''),
     'pending', now() + make_interval(secs => greatest(p_expires_in_seconds, 60)))
  RETURNING id INTO v_approval_id;

  UPDATE agentos.tasks
    SET status = 'waiting_approval',
        requires_approval = true,
        approval_id = v_approval_id,
        lease_owner = NULL,
        lease_expires_at = NULL,
        updated_at = now()
    WHERE id = p_task_id;

  RETURN v_approval_id;
END;
$$;

-- ===========================================================================
-- 8. expire_stale_approvals: a parked task must not wait forever
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.expire_stale_approvals()
RETURNS TABLE (expired_approval_id uuid, task_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    UPDATE agentos.approvals a
      SET status = 'expired', decided_at = now()
      WHERE a.status = 'pending'
        AND a.expires_at IS NOT NULL
        AND a.expires_at < now()
    RETURNING a.id, a.task_id
  ), released AS (
    UPDATE agentos.tasks t
      SET status = 'queued',
          requires_approval = false,
          approval_id = NULL,
          blocked_reason = NULL,
          run_after = now(),
          updated_at = now()
      FROM expired e
      WHERE t.id = e.task_id
        AND t.status = 'waiting_approval'
    RETURNING t.id
  )
  SELECT e.id, e.task_id FROM expired e;
END;
$$;

-- ===========================================================================
-- 9. dispatch_due_schedules: idempotent at the data level
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.dispatch_due_schedules(
  p_worker_id text DEFAULT 'sweep'
) RETURNS TABLE (schedule_id uuid, task_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sched agentos.schedules;
  v_new_task uuid;
  v_next timestamptz;
  v_occurrence timestamptz;
BEGIN
  FOR v_sched IN
    SELECT * FROM agentos.schedules
    WHERE enabled
      AND next_run_at IS NOT NULL
      AND next_run_at <= now()
    ORDER BY next_run_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    -- The occurrence the schedule was due for. Using it as the task's
    -- run_after makes the (schedule_id, run_after) pair a stable key, so a
    -- replayed sweep cannot dispatch the same occurrence twice.
    v_occurrence := v_sched.next_run_at;

    -- Already dispatched for this occurrence? The schedule row is locked
    -- (FOR UPDATE SKIP LOCKED), so no other sweep can be inside this block.
    PERFORM 1 FROM agentos.tasks AS existing
      WHERE existing.schedule_id = v_sched.id AND existing.run_after = v_occurrence
      FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO agentos.tasks
        (mission_id, workspace_id, owner_clerk_id, title, description,
         assigned_worker_id, status, trigger, input, requires_approval,
         run_after, schedule_id)
      VALUES
        (v_sched.mission_id, v_sched.workspace_id, v_sched.owner_clerk_id,
         v_sched.title, v_sched.prompt, v_sched.worker_id, 'queued', 'schedule',
         COALESCE(v_sched.input, '{}'::jsonb), false, v_occurrence, v_sched.id)
      RETURNING id INTO v_new_task;
    END IF;

    v_next := agentos.next_cron_run(v_sched.cron, v_sched.timezone, now());
    UPDATE agentos.schedules
      SET last_run_at = now(),
          next_run_at = v_next,
          last_status = CASE WHEN v_new_task IS NULL THEN 'already dispatched' ELSE 'dispatched' END,
          last_error = CASE WHEN v_next IS NULL THEN 'cron expression produced no next run' ELSE NULL END,
          enabled = CASE WHEN v_next IS NULL THEN false ELSE enabled END,
          updated_at = now()
      WHERE id = v_sched.id;

    IF v_new_task IS NOT NULL THEN
      schedule_id := v_sched.id;
      task_id := v_new_task;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- ===========================================================================
-- 10. recover_stale_runs: return a DECISION, not a status
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.recover_stale_runs()
RETURNS TABLE (recovered_task_id uuid, decision text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH stale AS (
    UPDATE agentos.execution_runs r
      SET status = 'timeout', ended_at = now()
      WHERE r.status = 'running'
        AND r.lease_expires_at IS NOT NULL
        AND r.lease_expires_at < now()
      RETURNING r.id, r.task_id
  ), touched AS (
    UPDATE agentos.tasks t
      SET status = CASE
            WHEN t.attempt >= t.max_attempts THEN 'failed'
            ELSE 'queued' END,
          error = COALESCE(t.error, 'execution lease expired'),
          lease_owner = NULL,
          lease_expires_at = NULL,
          blocked_reason = NULL,
          run_after = CASE WHEN t.attempt >= t.max_attempts THEN t.run_after ELSE now() END,
          completed_at = CASE WHEN t.attempt >= t.max_attempts THEN now() END,
          updated_at = now()
      FROM stale s
      WHERE t.id = s.task_id AND t.status = 'running'
    RETURNING t.id,
              CASE WHEN t.attempt >= t.max_attempts THEN 'failed' ELSE 'retry' END::text AS decision
  )
  SELECT touched.id, touched.decision FROM touched;
END;
$$;

-- ===========================================================================
-- 11. next_cron_run: a day-of-week of 7 (Sunday) must fire
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.next_cron_run(
  p_cron text,
  p_timezone text DEFAULT 'UTC',
  p_from timestamptz DEFAULT now()
) RETURNS timestamptz
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_parts text[];
  v_local timestamp;
  v_cursor timestamp;
  v_tz text := COALESCE(NULLIF(btrim(p_timezone), ''), 'UTC');
  v_dom_restricted boolean;
  v_dow_restricted boolean;
  v_dow int;
  v_iter int := 0;
BEGIN
  v_parts := string_to_array(btrim(p_cron), ' ');
  IF array_length(v_parts, 1) IS DISTINCT FROM 5 THEN
    RETURN NULL;
  END IF;

  v_dom_restricted := btrim(v_parts[3]) <> '*';
  v_dow_restricted := btrim(v_parts[5]) <> '*';

  BEGIN
    v_local := (p_from AT TIME ZONE v_tz);
  EXCEPTION WHEN others THEN
    v_local := (p_from AT TIME ZONE 'UTC');
  END;

  v_cursor := date_trunc('minute', v_local) + interval '1 minute';

  WHILE v_iter < 200000 LOOP
    v_iter := v_iter + 1;

    IF NOT agentos.cron_field_matches(v_parts[4], EXTRACT(MONTH FROM v_cursor)::int, 1, 12) THEN
      v_cursor := date_trunc('month', v_cursor) + interval '1 month';
      CONTINUE;
    END IF;

    -- EXTRACT(DOW) yields 0-6 (Sunday = 0). A cron field of 7 also means
    -- Sunday, so both 0 and 7 are tested against the field.
    v_dow := EXTRACT(DOW FROM v_cursor)::int;

    IF NOT (
      (v_dom_restricted
       AND agentos.cron_field_matches(v_parts[3], EXTRACT(DAY FROM v_cursor)::int, 1, 31))
      OR (v_dow_restricted
          AND (
            agentos.cron_field_matches(v_parts[5], v_dow, 0, 7)
            OR agentos.cron_field_matches(v_parts[5], v_dow + 7, 0, 7)
          ))
      OR (NOT v_dom_restricted AND NOT v_dow_restricted)
    ) THEN
      v_cursor := date_trunc('day', v_cursor) + interval '1 day';
      CONTINUE;
    END IF;

    IF NOT agentos.cron_field_matches(v_parts[2], EXTRACT(HOUR FROM v_cursor)::int, 0, 23) THEN
      v_cursor := date_trunc('hour', v_cursor) + interval '1 hour';
      CONTINUE;
    END IF;

    IF NOT agentos.cron_field_matches(v_parts[1], EXTRACT(MINUTE FROM v_cursor)::int, 0, 59) THEN
      v_cursor := date_trunc('minute', v_cursor) + interval '1 minute';
      CONTINUE;
    END IF;

    RETURN (v_cursor AT TIME ZONE v_tz);
  END LOOP;

  RETURN NULL;
END;
$$;

-- ===========================================================================
-- 12. assign_event_seq: no duplicate sequence numbers for one run
-- ===========================================================================

CREATE OR REPLACE FUNCTION agentos.assign_event_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seq IS NULL OR NEW.seq = 0 THEN
    -- Serialize per run so two concurrent events cannot take the same number.
    PERFORM pg_advisory_xact_lock(hashtext(COALESCE(NEW.run_id::text, 'none')));
    SELECT COALESCE(MAX(seq), 0) + 1 INTO NEW.seq
    FROM agentos.execution_events WHERE run_id = NEW.run_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 13. Privileges for the new functions
-- ===========================================================================

REVOKE ALL ON FUNCTION agentos.cancel_task(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.expire_stale_approvals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION agentos.cancel_task(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.expire_stale_approvals() TO service_role;

-- The queue functions keep their service_role-only grant; the signatures
-- changed, so the old (now dropped) grants are re-issued by name.
REVOKE ALL ON FUNCTION agentos.complete_task(uuid, jsonb, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.fail_task(uuid, text, uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION agentos.request_approval(uuid, text, jsonb, text, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION agentos.complete_task(uuid, jsonb, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.fail_task(uuid, text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.request_approval(uuid, text, jsonb, text, integer, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.enqueue_task(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.claim_due_tasks(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.recover_stale_runs() TO service_role;
GRANT EXECUTE ON FUNCTION agentos.dispatch_due_schedules(text) TO service_role;

COMMIT;
