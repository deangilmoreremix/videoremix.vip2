-- 20261012121200_agentos_tool_assignments.sql
--
-- Make the worker's tool assignments reach the runtime.
--
-- WHY
--   The UI writes a worker's tools to `agentos.worker_tools` (one row per
--   tool, with its enabled flag and per-tool config) — that is the table the
--   tool picker edits and the table the acceptance test asserts.
--
--   But `claim_due_tasks` returned the worker's tools as `workers.tools`, a
--   legacy jsonb column that NO code path ever writes: `createWorker` omits
--   it, `updateWorker` has no such field, and `cloneWorker` copies an empty
--   array. The runtime therefore received `[]` for every claim, offered the
--   model no tools at all, and the whole tool-call feature was inert — the
--   assignments the user made had no effect and no error was raised.
--
--   The table is the store, so the queue returns the table's rows.
--
--   `workers.tools` is left in place (it is still a valid place to pin a
--   default set), and the two are combined: a tool assigned in the table
--   wins, and a tool that only exists in the legacy column is still offered.

BEGIN;

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
$$;

REVOKE ALL ON FUNCTION agentos.claim_due_tasks(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION agentos.claim_due_tasks(text, integer, integer) TO service_role;

COMMENT ON FUNCTION agentos.claim_due_tasks(text, integer, integer) IS
  'Leases due tasks. The returned worker_tools column carries the worker''s tool assignments from agentos.worker_tools (merged with the legacy workers.tools jsonb).';

COMMIT;
