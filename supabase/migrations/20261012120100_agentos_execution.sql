-- AgentOS execution namespace: missions, tasks, dependencies, runs, events,
-- schedules and human approvals.
--
-- DURABLE EXECUTION MODEL
--   No runtime in this port is a background process that lives inside a
--   serverless request. Every unit of work is a row:
--
--     agentos.tasks            the durable queue entry (claim, retry, schedule)
--     agentos.execution_runs   one lease-holding attempt of a task
--     agentos.execution_events append-only transcript of that attempt
--
--   A worker process (Supabase Edge Function `agentos-execute`, or an
--   explicitly provisioned long-running worker) claims work with
--   agentos.claim_due_tasks(), which uses SELECT ... FOR UPDATE SKIP LOCKED so
--   two workers can never run the same task. If a worker dies, its lease
--   expires and agentos.recover_stale_runs() returns the task to the queue.
--   Netlify Functions are never used for execution (see
--   docs/agentos/RUNTIME_CERTIFICATION.md).
--
-- APPROVAL GATE
--   A task that needs a sensitive action parks itself in
--   status = 'waiting_approval' and creates an agentos.approvals row. The task
--   CANNOT resume until an authorized human approves it: the resume path is
--   the database RPC agentos.resolve_approval(), which refuses to move a task
--   forward unless the approval belongs to that task and to the same caller.

BEGIN;

-- ---------------------------------------------------------------------------
-- Missions: the user-facing unit of intent that groups tasks.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.missions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  title          text NOT NULL CHECK (length(btrim(title)) > 0),
  description    text NOT NULL DEFAULT '',
  goal           text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'planned', 'active', 'blocked',
                                     'completed', 'failed', 'cancelled')),
  priority       integer NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  created_by     text NOT NULL DEFAULT 'user'
                   CHECK (created_by IN ('user', 'worker', 'schedule', 'api')),
  started_at     timestamptz NULL,
  completed_at   timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_missions_owner
  ON agentos.missions (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_missions_status
  ON agentos.missions (owner_clerk_id, status);

DROP TRIGGER IF EXISTS trg_agentos_missions_stamp ON agentos.missions;
CREATE TRIGGER trg_agentos_missions_stamp
  BEFORE INSERT ON agentos.missions
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Tasks: the durable work queue.
--   status transitions are enforced by a trigger (see bottom of file) so a
--   stuck or impossible state cannot be written by a buggy worker.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id        uuid NULL REFERENCES agentos.missions (id) ON DELETE CASCADE,
  workspace_id      uuid NULL REFERENCES agentos.workspaces (id) ON DELETE SET NULL,
  owner_clerk_id    text NOT NULL,
  title             text NOT NULL CHECK (length(btrim(title)) > 0),
  description       text NOT NULL DEFAULT '',
  assigned_worker_id uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'blocked', 'queued', 'running',
                                        'waiting_approval', 'completed', 'failed',
                                        'cancelled')),
  priority          integer NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  input             jsonb NOT NULL DEFAULT '{}'::jsonb,
  output            jsonb NULL,
  error             text NULL,
  attempt           integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts      integer NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
  trigger           text NOT NULL DEFAULT 'manual'
                      CHECK (trigger IN ('manual', 'mission', 'schedule', 'handoff', 'api')),
  -- Scheduling: a task is only claimable when run_after <= now().
  run_after         timestamptz NOT NULL DEFAULT now(),
  -- Leases: claim = set lease_owner + lease_expires_at. Expiry = recovery.
  lease_owner       text NULL,
  lease_expires_at  timestamptz NULL,
  -- Handoff target: when this task completes, enqueue the referenced task.
  handoff_to_task_id uuid NULL,
  requires_approval boolean NOT NULL DEFAULT false,
  approval_id       uuid NULL,
  started_at        timestamptz NULL,
  completed_at      timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_tasks_queue
  ON agentos.tasks (priority DESC, run_after)
  WHERE status IN ('queued', 'pending');
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_owner
  ON agentos.tasks (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_mission ON agentos.tasks (mission_id);
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_worker
  ON agentos.tasks (assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_agentos_tasks_lease
  ON agentos.tasks (lease_expires_at) WHERE status = 'running';

DROP TRIGGER IF EXISTS trg_agentos_tasks_stamp ON agentos.tasks;
CREATE TRIGGER trg_agentos_tasks_stamp
  BEFORE INSERT ON agentos.tasks
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Task dependencies: an explicit DAG. `waits_for` tasks must be completed
-- before `task_id` becomes claimable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.task_edges (
  task_id     uuid NOT NULL REFERENCES agentos.tasks (id) ON DELETE CASCADE,
  waits_for   uuid NOT NULL REFERENCES agentos.tasks (id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'depends_on'
                CHECK (kind IN ('depends_on', 'handoff')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, waits_for),
  CONSTRAINT task_edges_no_self CHECK (task_id <> waits_for)
);

CREATE INDEX IF NOT EXISTS idx_agentos_task_edges_waits ON agentos.task_edges (waits_for);

-- ---------------------------------------------------------------------------
-- Execution runs: one lease-holding attempt.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.execution_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           uuid NOT NULL REFERENCES agentos.tasks (id) ON DELETE CASCADE,
  worker_id         uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  conversation_id   uuid NULL,
  owner_clerk_id    text NOT NULL,
  status            text NOT NULL DEFAULT 'running'
                      CHECK (status IN ('running', 'succeeded', 'failed',
                                        'cancelled', 'timeout')),
  trigger           text NOT NULL DEFAULT 'manual',
  model_provider    text NULL,
  model_id          text NULL,
  prompt_tokens     integer NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens integer NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  credits           numeric(18,6) NOT NULL DEFAULT 0 CHECK (credits >= 0),
  attempt           integer NOT NULL DEFAULT 1,
  lease_owner       text NULL,
  lease_expires_at  timestamptz NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz NULL,
  error             text NULL
);

CREATE INDEX IF NOT EXISTS idx_agentos_runs_task ON agentos.execution_runs (task_id);
CREATE INDEX IF NOT EXISTS idx_agentos_runs_owner
  ON agentos.execution_runs (owner_clerk_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_runs_active
  ON agentos.execution_runs (lease_expires_at) WHERE status = 'running';

DROP TRIGGER IF EXISTS trg_agentos_runs_stamp ON agentos.execution_runs;
CREATE TRIGGER trg_agentos_runs_stamp
  BEFORE INSERT ON agentos.execution_runs
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Execution events: append-only transcript. No UPDATE/DELETE policy exists
-- for clients, so an audit trail cannot be rewritten from the browser.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.execution_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid NULL REFERENCES agentos.execution_runs (id) ON DELETE CASCADE,
  task_id        uuid NULL REFERENCES agentos.tasks (id) ON DELETE CASCADE,
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  owner_clerk_id text NOT NULL,
  seq            bigint NOT NULL DEFAULT 0,
  kind           text NOT NULL,
  level          text NOT NULL DEFAULT 'info'
                   CHECK (level IN ('debug', 'info', 'warn', 'error', 'success')),
  message        text NOT NULL DEFAULT '',
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_events_run
  ON agentos.execution_events (run_id, seq);
CREATE INDEX IF NOT EXISTS idx_agentos_events_owner
  ON agentos.execution_events (owner_clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agentos_events_task ON agentos.execution_events (task_id, seq);
CREATE INDEX IF NOT EXISTS idx_agentos_events_kind
  ON agentos.execution_events (owner_clerk_id, kind, created_at DESC);

DROP TRIGGER IF EXISTS trg_agentos_events_stamp ON agentos.execution_events;
CREATE TRIGGER trg_agentos_events_stamp
  BEFORE INSERT ON agentos.execution_events
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- Monotonic per-run sequence numbers so a stream can be ordered and resume.
CREATE OR REPLACE FUNCTION agentos.assign_event_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seq IS NULL OR NEW.seq = 0 THEN
    SELECT COALESCE(MAX(seq), 0) + 1 INTO NEW.seq
    FROM agentos.execution_events WHERE run_id = NEW.run_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentos_events_seq ON agentos.execution_events;
CREATE TRIGGER trg_agentos_events_seq
  BEFORE INSERT ON agentos.execution_events
  FOR EACH ROW EXECUTE FUNCTION agentos.assign_event_seq();

-- ---------------------------------------------------------------------------
-- Schedules: recurring automation. next_run_at is durable; a scheduler sweep
-- (agentos-sweep) claims due rows and enqueues tasks.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.schedules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id     uuid NULL REFERENCES agentos.missions (id) ON DELETE CASCADE,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  owner_clerk_id text NOT NULL,
  title          text NOT NULL CHECK (length(btrim(title)) > 0),
  prompt         text NOT NULL DEFAULT '',
  cron           text NOT NULL,
  timezone       text NOT NULL DEFAULT 'UTC',
  enabled        boolean NOT NULL DEFAULT true,
  input          jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_run_at    timestamptz NULL,
  last_run_at    timestamptz NULL,
  last_status    text NULL,
  last_error     text NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agentos_schedules_due
  ON agentos.schedules (next_run_at) WHERE enabled;

DROP TRIGGER IF EXISTS trg_agentos_schedules_stamp ON agentos.schedules;
CREATE TRIGGER trg_agentos_schedules_stamp
  BEFORE INSERT ON agentos.schedules
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- ---------------------------------------------------------------------------
-- Approvals: the human-in-the-loop gate.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentos.approvals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid NULL REFERENCES agentos.tasks (id) ON DELETE CASCADE,
  run_id         uuid NULL REFERENCES agentos.execution_runs (id) ON DELETE SET NULL,
  worker_id      uuid NULL REFERENCES agentos.workers (id) ON DELETE SET NULL,
  workspace_id   uuid NULL REFERENCES agentos.workspaces (id) ON DELETE CASCADE,
  owner_clerk_id text NOT NULL,
  action_type    text NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason         text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected',
                                     'expired', 'cancelled')),
  requested_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NULL,
  decided_at     timestamptz NULL,
  decided_by     text NULL,
  decision_note  text NULL
);

CREATE INDEX IF NOT EXISTS idx_agentos_approvals_pending
  ON agentos.approvals (owner_clerk_id, requested_at DESC)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agentos_approvals_task ON agentos.approvals (task_id);

DROP TRIGGER IF EXISTS trg_agentos_approvals_stamp ON agentos.approvals;
CREATE TRIGGER trg_agentos_approvals_stamp
  BEFORE INSERT ON agentos.approvals
  FOR EACH ROW EXECUTE FUNCTION agentos.stamp_owner();

-- Link a task to its approval id once the approval exists.
CREATE OR REPLACE FUNCTION agentos.link_task_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    UPDATE agentos.tasks
      SET approval_id = NEW.id, updated_at = now()
      WHERE id = NEW.task_id AND approval_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentos_approvals_link ON agentos.approvals;
CREATE TRIGGER trg_agentos_approvals_link
  AFTER INSERT ON agentos.approvals
  FOR EACH ROW EXECUTE FUNCTION agentos.link_task_approval();

-- ---------------------------------------------------------------------------
-- Task state machine guard: reject impossible transitions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.validate_task_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status AND NEW.attempt = OLD.attempt THEN
    RETURN NEW;
  END IF;

  -- Terminal states are sticky.
  IF OLD.status IN ('completed', 'cancelled')
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'agentos.tasks: cannot move task % out of terminal state %', OLD.id, OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- A task that needs approval may only leave the waiting state through the
  -- approval RPC, which records the deciding human on the task row.
  IF OLD.status = 'waiting_approval'
     AND NEW.status IN ('running', 'queued', 'completed')
     AND NEW.requires_approval IS TRUE
     AND COALESCE(NEW.output ->> '_approval_decided_by', '') = ''
  THEN
    RAISE EXCEPTION 'agentos.tasks: task % is waiting on human approval', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agentos_tasks_status ON agentos.tasks;
CREATE TRIGGER trg_agentos_tasks_status
  BEFORE UPDATE OF status ON agentos.tasks
  FOR EACH ROW EXECUTE FUNCTION agentos.validate_task_status();

COMMIT;
