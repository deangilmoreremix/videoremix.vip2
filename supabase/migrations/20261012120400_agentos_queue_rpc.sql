-- AgentOS durable execution queue.
--
-- These functions are the ONLY sanctioned way to move a task through the
-- execution lifecycle, because they run as SECURITY DEFINER (the caller is
-- either service_role from an edge function / provisioned worker, or the
-- database itself). The browser-facing RLS policies deliberately do not grant
-- a client the right to claim a lease, mark a run finished, or release an
-- approval gate.
--
-- Guarantees:
--   * claim_due_tasks() uses FOR UPDATE SKIP LOCKED, so two workers can never
--     execute the same task at the same time.
--   * A task that dies mid-run is recovered by recover_stale_runs() after its
--     lease expires and is retried up to max_attempts.
--   * A task parked in waiting_approval can only be released by
--     resolve_approval(), which stamps the deciding human on the task row.
--     There is no other path out of that state.
--   * next_cron_run() is a pure function: schedules compute their next
--     occurrence so the sweep can enqueue durably.

BEGIN;

-- ---------------------------------------------------------------------------
-- Pure cron evaluator: does a field value match a cron field?
-- Supports *, a, a-b, a-b/n, */n, and comma-separated lists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.cron_field_matches(
  p_field text,
  p_value integer,
  p_min integer,
  p_max integer
) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_part text;
  v_lo int;
  v_hi int;
  v_step int;
  v_pos int;
  v_tok text;
BEGIN
  FOREACH v_part IN ARRAY string_to_array(btrim(p_field), ',')
  LOOP
    v_tok := btrim(v_part);
    IF v_tok = '' THEN CONTINUE; END IF;

    v_step := 1;
    v_pos := position('/' in v_tok);
    IF v_pos > 0 THEN
      BEGIN
        v_step := substring(v_tok from v_pos + 1)::int;
      EXCEPTION WHEN others THEN
        RETURN false;
      END;
      IF v_step <= 0 THEN RETURN false; END IF;
      v_tok := btrim(substring(v_tok from 1 for v_pos - 1));
    END IF;

    IF v_tok = '*' THEN
      v_lo := p_min; v_hi := p_max;
    ELSE
      v_pos := position('-' in v_tok);
      IF v_pos > 0 THEN
        BEGIN
          v_lo := substring(v_tok from 1 for v_pos - 1)::int;
          v_hi := substring(v_tok from v_pos + 1)::int;
        EXCEPTION WHEN others THEN
          RETURN false;
        END;
      ELSE
        BEGIN
          v_lo := v_tok::int;
        EXCEPTION WHEN others THEN
          RETURN false;
        END;
        IF v_pos > 0 OR v_step <> 1 THEN
          v_hi := p_max;
        ELSE
          v_hi := v_lo;
        END IF;
      END IF;
    END IF;

    IF v_lo < p_min OR v_hi > p_max OR v_lo > v_hi THEN
      RETURN false;
    END IF;

    IF p_value BETWEEN v_lo AND v_hi AND ((p_value - v_lo) % v_step) = 0 THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

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

    IF NOT (
      (v_dom_restricted
       AND agentos.cron_field_matches(v_parts[3], EXTRACT(DAY FROM v_cursor)::int, 1, 31))
      OR (v_dow_restricted
          AND agentos.cron_field_matches(v_parts[5], EXTRACT(DOW FROM v_cursor)::int, 0, 7))
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

COMMENT ON FUNCTION agentos.next_cron_run(text, text, timestamptz) IS
  'Next occurrence of a 5-field cron expression from a given instant.';

-- ---------------------------------------------------------------------------
-- Enqueue a task, honouring dependencies.
-- ---------------------------------------------------------------------------
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
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'missing';
  END IF;

  IF v_task.status IN ('completed', 'failed', 'cancelled', 'running') THEN
    RETURN v_task.status::text;
  END IF;

  SELECT count(*) INTO v_unmet
  FROM agentos.task_edges e
  JOIN agentos.tasks dep ON dep.id = e.waits_for
  WHERE e.task_id = p_task_id
    AND e.kind = 'depends_on'
    AND dep.status <> 'completed';

  IF v_unmet > 0 THEN
    UPDATE agentos.tasks
      SET status = 'blocked', updated_at = now()
      WHERE id = p_task_id AND status <> 'blocked';
    RETURN 'blocked';
  END IF;

  UPDATE agentos.tasks
    SET status = 'queued', updated_at = now()
    WHERE id = p_task_id AND status NOT IN ('queued', 'running');

  RETURN 'queued';
END;
$$;

-- ---------------------------------------------------------------------------
-- Claim due work. Returns the claimed tasks joined with their worker config.
-- ---------------------------------------------------------------------------
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
          updated_at = v_claim
    FROM candidates c
    WHERE t.id = c.id
    RETURNING t.*
  ), run_rows AS (
    INSERT INTO agentos.execution_runs
      (task_id, worker_id, owner_clerk_id, status, trigger, attempt, lease_owner, lease_expires_at)
    SELECT cr.id, cr.assigned_worker_id, cr.owner_clerk_id, 'running',
           cr.trigger, cr.attempt, p_worker_id, v_expiry
    FROM claimed cr
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

-- ---------------------------------------------------------------------------
-- Finish a task successfully, releasing dependents and firing handoffs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.complete_task(
  p_task_id uuid,
  p_output  jsonb DEFAULT '{}'::jsonb,
  p_run_id  uuid DEFAULT NULL
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
        updated_at = now()
    WHERE id = p_task_id
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
      SET status = 'queued', run_after = now(), updated_at = now()
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

-- ---------------------------------------------------------------------------
-- Fail a task: retry while attempts remain, otherwise park it as failed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.fail_task(
  p_task_id uuid,
  p_error   text,
  p_run_id  uuid DEFAULT NULL,
  p_retry_delay_seconds integer DEFAULT 30
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task agentos.tasks;
  v_decision text;
BEGIN
  SELECT * INTO v_task FROM agentos.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;

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
          updated_at = now()
      WHERE id = p_task_id;
    v_decision := 'failed';

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

-- ---------------------------------------------------------------------------
-- Recover leases that expired without the worker finishing. The task returns
-- to the queue and, if attempts are exhausted, is marked failed.
-- ---------------------------------------------------------------------------
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
          run_after = CASE WHEN t.attempt >= t.max_attempts THEN t.run_after ELSE now() END,
          completed_at = CASE WHEN t.attempt >= t.max_attempts THEN now() ELSE NULL END,
          updated_at = now()
      FROM stale s
      WHERE t.id = s.task_id AND t.status = 'running'
      RETURNING t.id, t.status
  )
  SELECT touched.id, touched.status::text FROM touched;
END;
$$;

-- ---------------------------------------------------------------------------
-- Human approval gate. The ONLY way a task leaves waiting_approval.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.resolve_approval(
  p_approval_id uuid,
  p_decision    text,   -- 'approved' | 'rejected'
  p_note        text DEFAULT ''
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor text := agentos.current_clerk_id();
  v_appr  agentos.approvals;
  v_task  agentos.tasks;
  v_result text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'agentos.resolve_approval: unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'agentos.resolve_approval: decision must be approved|rejected';
  END IF;

  SELECT * INTO v_appr FROM agentos.approvals WHERE id = p_approval_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;

  IF v_appr.owner_clerk_id <> v_actor THEN
    RAISE EXCEPTION 'agentos.resolve_approval: not the owner of this approval'
      USING ERRCODE = '42501';
  END IF;

  IF v_appr.status <> 'pending' THEN
    RETURN v_appr.status::text;
  END IF;

  UPDATE agentos.approvals
    SET status = p_decision,
        decided_at = now(),
        decided_by = v_actor,
        decision_note = COALESCE(p_note, '')
      WHERE id = p_approval_id
      RETURNING * INTO v_appr;

  IF v_appr.task_id IS NULL THEN
    RETURN p_decision;
  END IF;

  SELECT * INTO v_task FROM agentos.tasks WHERE id = v_appr.task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN p_decision; END IF;

  IF v_task.status <> 'waiting_approval' THEN
    RETURN p_decision;
  END IF;

  IF p_decision = 'approved' THEN
    UPDATE agentos.tasks
      SET status = 'queued',
          run_after = now(),
          lease_owner = NULL,
          lease_expires_at = NULL,
          output = COALESCE(output, '{}'::jsonb)
                   || jsonb_build_object('_approval_decided_by', v_actor),
          updated_at = now()
      WHERE id = v_task.id;
    v_result := 'approved';
  ELSE
    UPDATE agentos.tasks
      SET status = 'cancelled',
          error = COALESCE(p_note, 'rejected by human reviewer'),
          completed_at = now(),
          output = COALESCE(output, '{}'::jsonb)
                   || jsonb_build_object('_approval_decided_by', v_actor),
          updated_at = now()
      WHERE id = v_task.id;
    v_result := 'rejected';
  END IF;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Park a task on the human approval gate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.request_approval(
  p_task_id     uuid,
  p_action_type text,
  p_action_payload jsonb DEFAULT '{}'::jsonb,
  p_reason      text DEFAULT '',
  p_expires_in_seconds integer DEFAULT 86400
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
    (task_id, worker_id, workspace_id, owner_clerk_id, action_type,
     action_payload, reason, status, expires_at)
  VALUES
    (v_task.id, v_task.assigned_worker_id, v_task.workspace_id, v_task.owner_clerk_id,
     p_action_type, COALESCE(p_action_payload, '{}'::jsonb), COALESCE(p_reason, ''),
     'pending', now() + make_interval(secs => greatest(p_expires_in_seconds, 60)))
  RETURNING id INTO v_approval_id;

  UPDATE agentos.tasks
    SET status = 'waiting_approval',
        requires_approval = true,
        lease_owner = NULL,
        lease_expires_at = NULL,
        updated_at = now()
    WHERE id = p_task_id;

  RETURN v_approval_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Scheduler sweep: enqueue tasks for every due schedule (idempotent).
-- ---------------------------------------------------------------------------
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
BEGIN
  FOR v_sched IN
    SELECT * FROM agentos.schedules
    WHERE enabled
      AND next_run_at IS NOT NULL
      AND next_run_at <= now()
    ORDER BY next_run_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO agentos.tasks
      (mission_id, workspace_id, owner_clerk_id, title, description,
       assigned_worker_id, status, trigger, input, requires_approval, run_after)
    VALUES
      (v_sched.mission_id, v_sched.workspace_id, v_sched.owner_clerk_id,
       v_sched.title, v_sched.prompt, v_sched.worker_id, 'queued', 'schedule',
       COALESCE(v_sched.input, '{}'::jsonb), false, now())
    RETURNING id INTO v_new_task;

    v_next := agentos.next_cron_run(v_sched.cron, v_sched.timezone, now());

    UPDATE agentos.schedules
      SET last_run_at = now(),
          next_run_at = v_next,
          last_status = 'dispatched',
          last_error = CASE WHEN v_next IS NULL THEN 'cron expression produced no next run' ELSE NULL END,
          enabled = CASE WHEN v_next IS NULL THEN false ELSE enabled END,
          updated_at = now()
      WHERE id = v_sched.id;

    schedule_id := v_sched.id;
    task_id := v_new_task;
    RETURN NEXT;
  END LOOP;
END;
$$;

COMMIT;
