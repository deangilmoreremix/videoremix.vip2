-- AgentOS: app steps run without a worker
--
-- WHY
--   A mission step or a schedule can be bound to one app
--   (tasks.input.app_step). agentos-execute runs that app directly on the
--   owner's key, with no worker and no model call of its own. The queue,
--   though, parked every task without a worker as "no worker assigned"
--   (enqueue_task) and never claimed one (claim_due_tasks), so app steps
--   could not run. Both now let an app step through; a task with neither a
--   worker nor an app step is still parked, exactly as before.
--
-- The two functions are the live definitions with only that condition
-- changed.

CREATE OR REPLACE FUNCTION agentos.claim_due_tasks(p_worker_id text, p_limit integer DEFAULT 1, p_lease_seconds integer DEFAULT 120)
 RETURNS TABLE(task_id uuid, mission_id uuid, workspace_id uuid, owner_clerk_id text, title text, description text, input jsonb, attempt integer, max_attempts integer, priority integer, worker_id uuid, worker_name text, worker_role text, worker_instructions text, worker_goals text, model_provider text, model_id text, fallback_provider text, fallback_model_id text, temperature numeric, max_output_tokens integer, worker_tools jsonb, worker_knowledge jsonb, memory_enabled boolean, requires_approval boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
      -- An unassigned task cannot run, unless it is an app step: the executor
      -- runs that app directly, with no worker.
      AND (t.assigned_worker_id IS NOT NULL OR t.input ? 'app_step')
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
  ), mission_started AS (
    -- A mission starts when its first task is claimed. The column used to
    -- stay NULL forever, so the mission list could not say when the work
    -- actually began.
    UPDATE agentos.missions m
      SET started_at = COALESCE(m.started_at, v_claim), updated_at = v_claim
    FROM claimed c
    WHERE m.id = c.mission_id AND m.started_at IS NULL
    RETURNING m.id
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
    -- The assigned tools: the rows of agentos.worker_tools, plus anything the
    -- legacy `workers.tools` column still carries that the table does not.
    (
      SELECT COALESCE(jsonb_agg(tool_ref ORDER BY tool_ref->>'tool_key'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
                 'tool_key', wt.tool_key,
                 'enabled', wt.enabled,
                 'config', COALESCE(wt.config, '{}'::jsonb)
               ) AS tool_ref
        FROM agentos.worker_tools wt
        WHERE wt.worker_id = w.id
        UNION ALL
        SELECT jsonb_build_object(
                 'tool_key', legacy->>'tool_key',
                 'enabled', COALESCE((legacy->>'enabled')::boolean, true),
                 'config', COALESCE(legacy->'config', '{}'::jsonb)
               )
        FROM jsonb_array_elements(COALESCE(w.tools, '[]'::jsonb)) legacy
        WHERE legacy->>'tool_key' IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM agentos.worker_tools wt2
            WHERE wt2.worker_id = w.id AND wt2.tool_key = legacy->>'tool_key'
          )
      ) refs
    ),
    w.knowledge,
    w.memory_enabled,
    c.requires_approval
  FROM claimed c
  LEFT JOIN agentos.workers w ON w.id = c.assigned_worker_id
  ORDER BY c.priority DESC, c.run_after ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION agentos.enqueue_task(p_task_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- letting the sweep claim it and burn an attempt. An app step needs no
  -- worker: the executor runs its app directly.
  IF v_task.assigned_worker_id IS NULL AND NOT (COALESCE(v_task.input, '{}'::jsonb) ? 'app_step') THEN
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
$function$;
