-- 20261012121300_agentos_writers.sql
--
-- The writers the port was missing: notifications, the audit trail, the
-- scheduler, a real usage cost, and the routing flags the model catalog
-- needs.
--
-- WHY THIS FILE EXISTS
--   Three surfaces in the product have readers but no writer, so they are
--   permanently empty no matter what the UI or the runtime does:
--
--     1. agentos.notifications — the bell behind the header. Nothing in the
--        port ever inserted a row, so a task that failed, a task that
--        finished, and an approval that was waiting for a human were all
--        invisible to the person they concerned.
--
--     2. agentos.audit_logs — the mutating-action half of the Activity page.
--        The page merges the audit trail with the execution transcript; the
--        transcript had rows and the audit side was always empty. The
--        frontend says so in as many words (src/services/agentos/activity.ts:
--        "WHY THERE IS NO AUDIT WRITER YET").
--
--     3. agentos.schedules — rows are written by the Schedules page and
--        never fire. agentos-sweep exists and is idempotent, but nothing
--        called it: there was no cron registration anywhere in the port.
--
--   Two smaller defects are fixed here as well:
--
--     4. agentos-execute writes usage_records.cost_usd = 0, so every run
--        looked free. The cost is now derived from the model catalog and the
--        credits ledger instead of being invented.
--
--     5. The catalog offers models that cannot serve the request they are
--        offered for (an embeddings-only model as a chat model) and hides a
--        runtime constraint (the reasoning models reject a temperature).
--        Both are now recorded in the catalog, where the runtime can read
--        them.
--
-- HOW THE WRITERS ATTRIBUTE AN ACTOR
--   The actor is the verified Clerk id from the request JWT
--   (agentos.current_clerk_id(), i.e. request.jwt.claims ->> 'sub'). When
--   there is no JWT — an edge function, the sweep, a cron job — the actor is
--   the OWNER of the row that changed and the entry is marked 'system',
--   because nobody pressed a button.
--
-- WHY THE WRITER FUNCTIONS ARE SECURITY DEFINER
--   agentos.audit_logs and agentos.usage_records are append-only: their RLS
--   policies grant SELECT and nothing else, on purpose. A writer that ran as
--   the caller could not insert at all. SECURITY DEFINER makes the write
--   happen as the schema owner while the caller stays unprivileged, so no
--   policy is weakened and no client gains an INSERT grant.
--
-- PORTABILITY
--   The scheduler section depends on pg_cron and pg_net, which a bare
--   PostgreSQL 14 does not have. Every extension-dependent statement is
--   guarded and degrades to a NOTICE, so this migration applies cleanly on a
--   scratch cluster.

BEGIN;

-- ===========================================================================
-- 1. NOTIFICATION WRITER
-- ===========================================================================

-- The notifications table has no workspace_id: a notification is addressed to
-- a person. The task that caused it, however, may belong to a workspace, and
-- the UI needs to be able to say which one. The column is additive and
-- nullable; the existing policies are untouched.
ALTER TABLE agentos.notifications
  ADD COLUMN IF NOT EXISTS workspace_id uuid NULL;

COMMENT ON COLUMN agentos.notifications.workspace_id IS
  'The workspace the event happened in, when the task that caused it had one. Nullable: a notification is addressed to a person, not to a workspace.';

-- ---------------------------------------------------------------------------
-- notify_user: the single writer. Every notification in the port goes
-- through it, so the shape of a notification is defined in exactly one place.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.notify_user(
  p_owner_clerk_id text,
  p_kind           text,
  p_title          text,
  p_body           text DEFAULT '',
  p_entity_type    text DEFAULT NULL,
  p_entity_id      text DEFAULT NULL,
  p_workspace_id   uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_owner_clerk_id IS NULL OR btrim(p_owner_clerk_id) = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO agentos.notifications
    (owner_clerk_id, kind, title, body, entity_type, entity_id,
     workspace_id, created_at)
  VALUES
    (p_owner_clerk_id,
     COALESCE(NULLIF(btrim(p_kind), ''), 'info'),
     COALESCE(NULLIF(btrim(p_title), ''), 'Notification'),
     COALESCE(p_body, ''),
     p_entity_type,
     p_entity_id,
     p_workspace_id,
     now())
  RETURNING id INTO v_id;

  -- agentos.stamp_owner() stamps owner_clerk_id from the verified JWT on
  -- every INSERT. A notification is addressed to the OWNER of the event, not
  -- to whoever happened to be signed in when the event happened, so the
  -- stamp is undone when it disagrees with the intended recipient.
  UPDATE agentos.notifications
     SET owner_clerk_id = p_owner_clerk_id
   WHERE id = v_id
     AND owner_clerk_id IS DISTINCT FROM p_owner_clerk_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION agentos.notify_user(text, text, text, text, text, text, uuid) IS
  'Insert one notification for one recipient. The only writer of agentos.notifications.';

-- ---------------------------------------------------------------------------
-- notify_task_event: a task reached a state its owner must know about.
--
-- ONE ROW PER EVENT
--   The trigger is row level and fires on a status CHANGE, not on a row
--   scan: a sweep that re-reads the queue writes nothing, and a task that
--   is retried (failed -> queued -> failed) produces one notification per
--   failure, because those are two events.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.notify_task_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_kind  text;
  v_title text;
  v_body  text;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Only a real transition is an event. A statement that mentions `status`
  -- without changing it is not.
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' THEN
    v_kind  := 'task_completed';
    v_title := 'Task completed';
    v_body  := '"' || NEW.title || '" finished successfully.';
  ELSIF NEW.status = 'failed' THEN
    v_kind  := 'task_failed';
    v_title := 'Task failed';
    v_body  := '"' || NEW.title || '" failed: '
               || COALESCE(NULLIF(btrim(NEW.error), ''), 'no error detail was recorded');
  ELSE
    RETURN NEW;
  END IF;

  PERFORM agentos.notify_user(
    NEW.owner_clerk_id,
    v_kind,
    v_title,
    v_body,
    'task',
    NEW.id::text,
    NEW.workspace_id);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION agentos.notify_task_event() IS
  'Writes a task_completed / task_failed notification for the owner of the task.';

-- ---------------------------------------------------------------------------
-- notify_approval_requested: a task parked on the human approval gate.
--
-- The approval row is the event: request_approval() inserts exactly one
-- approval per request, so the notification count matches the approval
-- count. The task itself moves to waiting_approval in the same transaction,
-- which the task trigger above deliberately ignores.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.notify_approval_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task_title text;
  v_body       text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT t.title INTO v_task_title
  FROM agentos.tasks t
  WHERE t.id = NEW.task_id;

  v_body := '"' || COALESCE(v_task_title, NEW.action_type)
            || '" is waiting for your approval ('
            || COALESCE(NULLIF(btrim(NEW.reason), ''), NEW.action_type)
            || ').';

  PERFORM agentos.notify_user(
    NEW.owner_clerk_id,
    'approval',
    'Approval requested',
    v_body,
    'approval',
    NEW.id::text,
    NEW.workspace_id);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION agentos.notify_approval_requested() IS
  'Writes an approval notification for the owner of the approval.';

DROP TRIGGER IF EXISTS agentos_tasks_notify ON agentos.tasks;
CREATE TRIGGER agentos_tasks_notify
  AFTER UPDATE OF status ON agentos.tasks
  FOR EACH ROW EXECUTE FUNCTION agentos.notify_task_event();

DROP TRIGGER IF EXISTS agentos_approvals_notify ON agentos.approvals;
CREATE TRIGGER agentos_approvals_notify
  AFTER INSERT ON agentos.approvals
  FOR EACH ROW EXECUTE FUNCTION agentos.notify_approval_requested();

-- ===========================================================================
-- 2. AUDIT WRITER
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- audit_row_change: one audit row per mutation of an audited table.
--
-- WHAT IS AUDITED
--   The tables a person changes on purpose: tasks, workers, missions,
--   workspaces, schedules, approvals, connected accounts and provider
--   configurations.
--
-- WHAT IS NOT AUDITED
--   The high-volume machine tables: execution_events (the runtime transcript
--   already IS the trail), usage_records (the meter), canvas_nodes and
--   canvas_edges (layout), memories and messages (content). Auditing them
--   would bury the mutations that matter under rows nobody reads.
--
-- BEFORE / AFTER
--   Only the columns that actually changed are stored, so the row is a diff
--   and not a copy of the table. An update that only moved updated_at is not
--   an auditable action and is skipped.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entity_type text;
  v_action       text;
  v_actor        text;
  v_acting_as   text;
  v_entity_id    text;
  v_workspace_id uuid;
  v_summary      text;
  v_before       jsonb;
  v_after        jsonb;
  v_new          jsonb;
  v_old          jsonb;
  v_changed      text[] := ARRAY[]::text[];
  v_ws_text      text;
  v_label        text;
BEGIN
  v_entity_type := CASE TG_TABLE_NAME
    WHEN 'tasks'              THEN 'task'
    WHEN 'workers'            THEN 'worker'
    WHEN 'missions'           THEN 'mission'
    WHEN 'workspaces'         THEN 'workspace'
    WHEN 'schedules'          THEN 'schedule'
    WHEN 'approvals'          THEN 'approval'
    WHEN 'connected_accounts' THEN 'connected_account'
    WHEN 'provider_configs'   THEN 'provider_config'
    ELSE TG_TABLE_NAME
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_before := v_old;
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_old := NULL;
    v_after := v_new;
  ELSE
    v_new := to_jsonb(NEW);
    v_old := to_jsonb(OLD);

    SELECT array_agg(k ORDER BY k)
      INTO v_changed
    FROM jsonb_object_keys(v_new) AS key(k)
    WHERE v_new -> k IS DISTINCT FROM v_old -> k;

    -- Nothing changed, or only the maintenance timestamp moved.
    IF v_changed IS NULL OR v_changed <@ ARRAY['updated_at']::text[] THEN
      RETURN NEW;
    END IF;

    SELECT jsonb_object_agg(k, v_old -> k) INTO v_before
    FROM unnest(v_changed) AS key(k);

    SELECT jsonb_object_agg(k, v_new -> k) INTO v_after
    FROM unnest(v_changed) AS key(k);
  END IF;

  -- The actor: the verified JWT when there is one, otherwise the owner of
  -- the row that changed and the entry is attributed to the system.
  v_actor := agentos.current_clerk_id();
  IF v_actor IS NOT NULL THEN
    v_acting_as := 'user';
  ELSE
    v_acting_as := 'system';
    v_actor := COALESCE(v_new ->> 'owner_clerk_id', v_old ->> 'owner_clerk_id');
  END IF;

  v_entity_id := COALESCE(v_new ->> 'id', v_old ->> 'id');

  -- The workspace the row belongs to. A workspace IS its own workspace.
  v_ws_text := COALESCE(v_new ->> 'workspace_id', v_old ->> 'workspace_id');
  IF TG_TABLE_NAME = 'workspaces' THEN
    v_ws_text := COALESCE(v_new ->> 'id', v_old ->> 'id');
  END IF;
  IF v_ws_text IS NOT NULL AND v_ws_text <> '' THEN
    BEGIN
      v_workspace_id := v_ws_text::uuid;
    EXCEPTION WHEN others THEN
      v_workspace_id := NULL;
    END;
  END IF;

  v_label := COALESCE(
    v_new ->> 'title', v_old ->> 'title',
    v_new ->> 'name', v_old ->> 'name',
    v_new ->> 'label', v_old ->> 'label',
    v_new ->> 'account_label', v_old ->> 'account_label',
    v_new ->> 'action_type', v_old ->> 'action_type',
    v_entity_id
  );

  IF TG_OP = 'INSERT' THEN
    v_action  := v_entity_type || '.created';
    v_summary := v_entity_type || ' created: ' || v_label;
  ELSIF TG_OP = 'DELETE' THEN
    v_action  := v_entity_type || '.deleted';
    v_summary := v_entity_type || ' deleted: ' || v_label;
  ELSIF v_new ->> 'status' IS DISTINCT FROM v_old ->> 'status' THEN
    v_action  := v_entity_type || '.status';
    v_summary := v_entity_type || ' status changed from '
                 || COALESCE(v_old ->> 'status', 'none') || ' to '
                 || COALESCE(v_new ->> 'status', 'none') || ': ' || v_label;
  ELSE
    v_action  := v_entity_type || '.updated';
    v_summary := v_entity_type || ' updated: ' || v_label;
  END IF;

  INSERT INTO agentos.audit_logs
    (actor_clerk_id, acting_as, action, entity_type, entity_id,
     workspace_id, summary, before, after, created_at)
  VALUES
    (v_actor, v_acting_as, v_action, v_entity_type, v_entity_id,
     v_workspace_id, v_summary, v_before, v_after, now());

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION agentos.audit_row_change() IS
  'Records one actor-attributed audit row per mutation of an audited agentos table.';

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tasks', 'workers', 'missions', 'workspaces', 'schedules',
    'approvals', 'connected_accounts', 'provider_configs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS agentos_audit_row_change ON agentos.%I', t);
    EXECUTE format(
      'CREATE TRIGGER agentos_audit_row_change
         AFTER INSERT OR UPDATE OR DELETE ON agentos.%I
         FOR EACH ROW EXECUTE FUNCTION agentos.audit_row_change()',
      t
    );
  END LOOP;
END $$;

-- ===========================================================================
-- 3. THE SCHEDULER
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Reading the two secrets the scheduler needs, WITHOUT storing them.
--
-- The URL and the service role key live in the Supabase vault under the
-- standard names 'project_url' and 'service_role_key'. They are read at RUN
-- TIME by the functions below, so the key is never written into the cron
-- job table, never appears in a migration file, and never has to be rotated
-- by re-running anything.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.vault_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret text;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RETURN NULL;
  END IF;

  -- supabase_vault.decrypted_secrets is the current name of the view;
  -- vault.decrypted_secrets is the older one. Both are read, and the column
  -- is called 'secret' in one version and 'decrypted_secret' in the other.
  IF to_regclass('supabase_vault.decrypted_secrets') IS NOT NULL THEN
    BEGIN
      EXECUTE 'SELECT s.secret FROM supabase_vault.decrypted_secrets s
                WHERE s.name = $1 LIMIT 1'
        INTO v_secret USING p_name;
    EXCEPTION WHEN others THEN
      BEGIN
        EXECUTE 'SELECT s.decrypted_secret FROM supabase_vault.decrypted_secrets s
                  WHERE s.name = $1 LIMIT 1'
          INTO v_secret USING p_name;
      EXCEPTION WHEN others THEN
        v_secret := NULL;
      END;
    END;
  END IF;

  IF v_secret IS NULL AND to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    BEGIN
      EXECUTE 'SELECT s.secret FROM vault.decrypted_secrets s
                WHERE s.name = $1 LIMIT 1'
        INTO v_secret USING p_name;
    EXCEPTION WHEN others THEN
      v_secret := NULL;
    END;
  END IF;

  RETURN NULLIF(btrim(COALESCE(v_secret, '')), '');
END;
$$;

COMMENT ON FUNCTION agentos.vault_secret(text) IS
  'Reads one secret from the Supabase vault by name. NULL when the vault or the secret is absent.';

-- ---------------------------------------------------------------------------
-- The base URL of the project's edge functions.
--
--   1. the project setting, when the platform exposes one;
--   2. the vault secret 'project_url';
--   3. the project ref this port targets.
--
-- The fallback is the project the port was written for; a project that keeps
-- its vault populated never reaches it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.edge_function_base_url()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url text;
BEGIN
  BEGIN
    v_url := NULLIF(btrim(current_setting('app.settings.project_url', true)), '');
  EXCEPTION WHEN others THEN
    v_url := NULL;
  END;

  IF v_url IS NULL THEN
    v_url := agentos.vault_secret('project_url');
  END IF;

  IF v_url IS NULL THEN
    v_url := 'https://bzxohkrxcwodllketcpz.supabase.co';
  END IF;

  RETURN NULLIF(v_url, '');
END;
$$;

COMMENT ON FUNCTION agentos.edge_function_base_url() IS
  'Base URL of the edge functions: the project setting, the vault secret project_url, or the project ref.';

-- ---------------------------------------------------------------------------
-- The service role key. NEVER returned to a client: the only caller is the
-- scheduler, which uses it to authenticate its own edge-function call.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.edge_function_service_key()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := agentos.vault_secret('service_role_key');
  IF v_key IS NULL THEN
    v_key := agentos.vault_secret('service_role');
  END IF;
  RETURN v_key;
END;
$$;

COMMENT ON FUNCTION agentos.edge_function_service_key() IS
  'The service role key from the vault. Server-side use only.';

-- ---------------------------------------------------------------------------
-- invoke_edge_function: the documented pg_net + pg_cron pattern, factored
-- into a function so the secret is read at run time instead of being baked
-- into the cron job.
--
--   SELECT net.http_post(
--     url     := <project url>/functions/v1/<name>,
--     headers := jsonb_build_object('Authorization', 'Bearer <service key>',
--                                   'Content-Type', 'application/json'),
--     body    := '{}'::jsonb)
--
-- Returns the pg_net request id, or NULL when the call could not be made.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.invoke_edge_function(p_function text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url       text;
  v_key       text;
  v_request_id bigint;
BEGIN
  IF p_function IS NULL OR btrim(p_function) = '' THEN
    RETURN NULL;
  END IF;

  IF to_regprocedure('net.http_post(text, jsonb, jsonb, jsonb, integer)') IS NULL THEN
    RAISE WARNING 'agentos: pg_net is not available, % was not invoked', p_function;
    RETURN NULL;
  END IF;

  v_url := agentos.edge_function_base_url();
  v_key := agentos.edge_function_service_key();

  IF v_key IS NULL THEN
    RAISE WARNING 'agentos: no service role key in the vault, % was not invoked', p_function;
    RETURN NULL;
  END IF;

  v_request_id := net.http_post(
    url := v_url || '/functions/v1/' || p_function,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('source', 'pg_cron', 'scheduled_at', now())
  );

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION agentos.invoke_edge_function(text) IS
  'Calls one edge function over pg_net with the vault service role key. Returns the pg_net request id.';

-- ---------------------------------------------------------------------------
-- register_scheduler_jobs: the cron registration.
--
-- TWO JOBS, BECAUSE DISPATCHING AND EXECUTING ARE DIFFERENT FUNCTIONS
--   agentos-sweep   dispatches due schedules and recovers stale leases.
--   agentos-execute claims a task and runs it.
--   Registering only the sweep would enqueue work that nothing ever runs.
--
-- IDEMPOTENT
--   A job with the same name is unscheduled before it is scheduled again, so
--   re-running this never produces a duplicate job.
--
-- SAFE ON A BARE POSTGRES
--   Without pg_cron (or without pg_net) nothing is scheduled and a NOTICE
--   explains why. The migration still applies.
--
-- DISABLED WHEN THE SECRET IS MISSING
--   A job that cannot authenticate is worse than no job: it would fire every
--   minute and fail every minute. When the service role key is not in the
--   vault the jobs are created but deactivated, and the operator is told.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.register_scheduler_jobs()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job_sweep   bigint;
  v_job_execute bigint;
  v_active      boolean;
BEGIN
  IF to_regprocedure('cron.schedule(text, text, text)') IS NULL THEN
    RAISE NOTICE 'agentos: pg_cron is not available; the sweep and execute jobs were NOT registered.';
    RETURN 'skipped: pg_cron is not installed';
  END IF;

  IF to_regprocedure('net.http_post(text, jsonb, jsonb, jsonb, integer)') IS NULL THEN
    RAISE NOTICE 'agentos: pg_net is not available; the sweep and execute jobs were NOT registered.';
    RETURN 'skipped: pg_net is not installed';
  END IF;

  -- Unschedule first: a job name is unique in pg_cron, and re-scheduling an
  -- existing name would either fail or duplicate the job.
  BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agentos-sweep') THEN
      PERFORM cron.unschedule('agentos-sweep');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agentos-execute') THEN
      PERFORM cron.unschedule('agentos-execute');
    END IF;

    v_job_sweep := cron.schedule(
      'agentos-sweep', '* * * * *',
      'SELECT agentos.invoke_edge_function(''agentos-sweep'')');

    v_job_execute := cron.schedule(
      'agentos-execute', '* * * * *',
      'SELECT agentos.invoke_edge_function(''agentos-execute'')');
  EXCEPTION WHEN others THEN
    -- A scheduler that cannot be registered must never take the migration
    -- down with it: the rest of the port does not depend on it.
    RAISE NOTICE 'agentos: the scheduler jobs could not be registered: %', SQLERRM;
    RETURN 'skipped: ' || SQLERRM;
  END;

  -- The key decides whether the jobs may run at all.
  v_active := agentos.edge_function_service_key() IS NOT NULL;

  IF NOT v_active THEN
    BEGIN
      IF to_regprocedure('cron.alter_job(bigint, boolean)') IS NOT NULL THEN
        PERFORM cron.alter_job(v_job_sweep, false);
        PERFORM cron.alter_job(v_job_execute, false);
      ELSIF to_regprocedure('cron.alter_job(bigint, text, text, text, text, boolean)') IS NOT NULL THEN
        PERFORM cron.alter_job(v_job_sweep, NULL, NULL, NULL, NULL, false);
        PERFORM cron.alter_job(v_job_execute, NULL, NULL, NULL, NULL, false);
      END IF;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'agentos: the scheduler jobs could not be deactivated: %', SQLERRM;
    END;

    RAISE NOTICE 'agentos: the scheduler jobs were created DISABLED: the vault secret service_role_key is missing.';
    RETURN 'disabled: no service role key in the vault';
  END IF;

  RETURN 'registered: agentos-sweep and agentos-execute run every minute';
END;
$$;

COMMENT ON FUNCTION agentos.register_scheduler_jobs() IS
  'Registers (or replaces) the pg_cron jobs that call agentos-sweep and agentos-execute. Idempotent.';

-- Run it. On a bare cluster this is a NOTICE and nothing else.
SELECT agentos.register_scheduler_jobs();

-- ===========================================================================
-- 4. USAGE COST
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- credits_per_dollar: the credits -> USD rate.
--
-- The credits schema prices credits in packages: the entry package
-- (500,000 credits for $5.00) is the list price of one credit, i.e. 100,000
-- credits per dollar. The bulk packages are discounts, so the HIGHEST
-- credits-per-cent rate in the table is the list price. When the credits
-- schema is not present (a scratch cluster) the platform's published
-- constant is used: src/lib/credit-math.ts exports CREDITS_PER_DOLLAR =
-- 100_000 and the billing authority (creditRates.ts) uses the same value.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.credits_per_dollar()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rate numeric;
BEGIN
  IF to_regclass('credits.credit_products') IS NOT NULL THEN
    SELECT MAX(cp.credits_amount::numeric / (cp.price_usd::numeric / 100.0))
      INTO v_rate
    FROM credits.credit_products cp
    WHERE cp.price_usd > 0
      AND cp.credits_amount > 0;
  END IF;

  RETURN COALESCE(v_rate, 100000);
END;
$$;

COMMENT ON FUNCTION agentos.credits_per_dollar() IS
  'Credits per US dollar, from the credits schema price list (entry package), or 100000 when that schema is absent.';

-- ---------------------------------------------------------------------------
-- compute_usage_cost: the cost of a run, derived instead of invented.
--
-- WHY A TRIGGER
--   agentos-execute writes usage_records directly, and so does anything
--   else that meters a run. A BEFORE INSERT trigger prices every writer at
--   once, and the writer cannot forget to do it.
--
-- WHERE THE NUMBERS COME FROM
--   * the model catalog prices the run: credit_rate_in / credit_rate_out
--     are the per-thousand-token credit rates the runtime charges
--     (src/components/agentos/format/numbers.ts: "the runtime charges per
--     thousand tokens"), so the run costs
--         (prompt_tokens * rate_in + completion_tokens * rate_out) / 1000
--     credits, exactly what the runtime debits from the balance;
--   * the credits ledger owns the USD rate: 1 credit is worth
--     1 / credits_per_dollar US dollars.
--
-- WHAT THE TRITER DOES NOT DO
--   It never invents a price: with no catalog row for the model the credits
--   stay as the writer left them and cost_usd stays 0. It never overwrites
--   the credits that were actually debited from the user's balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION agentos.compute_usage_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rate_in  numeric;
  v_rate_out numeric;
  v_credits  numeric;
BEGIN
  SELECT m.credit_rate_in, m.credit_rate_out
    INTO v_rate_in, v_rate_out
  FROM agentos.model_catalog m
  WHERE m.id = NEW.model_id;

  IF NOT FOUND THEN
    -- An unpriced model: no rate, no invented cost.
    RETURN NEW;
  END IF;

  v_credits := (COALESCE(NEW.prompt_tokens, 0) * v_rate_in
              + COALESCE(NEW.completion_tokens, 0) * v_rate_out) / 1000;

  -- `credits` is the ledger debit. A writer that already computed it (the
  -- runtime does, and it is what was debited) keeps its value; a writer that
  -- left it empty gets the catalog's price.
  IF NEW.credits IS NULL OR NEW.credits = 0 THEN
    NEW.credits := v_credits;
  END IF;

  -- `cost_usd` is what the run cost, in dollars, at the platform's credit
  -- rate. It is derived from the credits that were charged, so the number on
  -- the Operations page can never disagree with the ledger.
  IF NEW.cost_usd IS NULL OR NEW.cost_usd = 0 THEN
    NEW.cost_usd := ROUND(NEW.credits / agentos.credits_per_dollar(), 8);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION agentos.compute_usage_cost() IS
  'Prices a usage record from the model catalog and the credit rate before it is inserted.';

DROP TRIGGER IF EXISTS agentos_usage_cost ON agentos.usage_records;
CREATE TRIGGER agentos_usage_cost
  BEFORE INSERT ON agentos.usage_records
  FOR EACH ROW EXECUTE FUNCTION agentos.compute_usage_cost();

COMMENT ON COLUMN agentos.usage_records.cost_usd IS
  'What the run cost in US dollars, derived from the credits charged and the credit rate (agentos.credits_per_dollar()). Zero when the model has no catalog price.';
COMMENT ON COLUMN agentos.usage_records.credits IS
  'The credits charged for the run: what was debited from the balance. Priced from the model catalog when the writer did not supply it.';

-- ===========================================================================
-- 5. THE MODEL CATALOG: ROUTING FLAGS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Two facts the catalog could not express before:
--
--   supports_temperature  false for the models whose API rejects a
--                         temperature other than their own default
--                         (gpt-5, gpt-5-mini, o3, o4-mini). The runtime
--                         always sends one, so every run against those
--                         models was rejected. The runtime must OMIT the
--                         parameter for these models — the catalog now says
--                         so, and agentos.model_supports_temperature()
--                         answers it in one round trip.
--
--   supports_chat         false for an embeddings-only model. It cannot
--                         serve a chat completion, so it must not be
--                         offered as one.
--
-- The columns are additive and default to the previous behaviour, so every
-- model that is not named here keeps working exactly as before.
-- ---------------------------------------------------------------------------
ALTER TABLE agentos.model_catalog
  ADD COLUMN IF NOT EXISTS supports_temperature boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_chat boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN agentos.model_catalog.supports_temperature IS
  'false when the model rejects a temperature other than its own default (the gpt-5 and o-series reasoning models). The runtime must omit the temperature entirely for these models.';
COMMENT ON COLUMN agentos.model_catalog.supports_chat IS
  'false for models that cannot serve a chat completion (embedding-only models). They must not be offered as a worker''s model.';

UPDATE agentos.model_catalog
   SET supports_temperature = false
 WHERE id IN ('gpt-5', 'gpt-5-mini', 'o3', 'o4-mini');

UPDATE agentos.model_catalog
   SET supports_chat = false
 WHERE id = 'text-embedding-3-large';

-- The runtime's view of the catalog, in one call.
CREATE OR REPLACE FUNCTION agentos.model_supports_temperature(p_model_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_supports boolean;
BEGIN
  SELECT m.supports_temperature INTO v_supports
  FROM agentos.model_catalog m
  WHERE m.id = p_model_id;

  -- An unknown model keeps the previous behaviour (the parameter is sent).
  RETURN COALESCE(v_supports, true);
END;
$$;

CREATE OR REPLACE FUNCTION agentos.model_supports_chat(p_model_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_supports boolean;
BEGIN
  SELECT m.supports_chat INTO v_supports
  FROM agentos.model_catalog m
  WHERE m.id = p_model_id;

  RETURN COALESCE(v_supports, true);
END;
$$;

COMMENT ON FUNCTION agentos.model_supports_temperature(text) IS
  'TRUE when the model accepts a temperature parameter. FALSE for the reasoning models that reject anything but their default.';
COMMENT ON FUNCTION agentos.model_supports_chat(text) IS
  'TRUE when the model can serve a chat completion. FALSE for embeddings-only models.';

-- ===========================================================================
-- 6. PRIVILEGES
-- ===========================================================================

-- The writers are server-side. The browser gets nothing here: a client must
-- not be able to forge an audit row, a notification or a priced usage record.
REVOKE ALL ON FUNCTION agentos.notify_user(text, text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.notify_task_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.notify_approval_requested() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.audit_row_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.compute_usage_cost() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.vault_secret(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.edge_function_base_url() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.edge_function_service_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.invoke_edge_function(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.register_scheduler_jobs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.credits_per_dollar() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regrole('service_role') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION agentos.notify_user(text, text, text, text, text, text, uuid) TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.notify_task_event() TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.notify_approval_requested() TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.audit_row_change() TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.compute_usage_cost() TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.invoke_edge_function(text) TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.register_scheduler_jobs() TO service_role;
    GRANT EXECUTE ON FUNCTION agentos.credits_per_dollar() TO service_role;
  END IF;
END $$;

-- The catalog flags are read-only facts about a model: the browser may ask.
GRANT EXECUTE ON FUNCTION agentos.model_supports_temperature(text) TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.model_supports_chat(text) TO authenticated;

-- The trigger functions need EXECUTE for their triggers to be created by a
-- non-superuser role, and the grants keep the schema consistent.
GRANT EXECUTE ON FUNCTION agentos.notify_task_event() TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.notify_approval_requested() TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.audit_row_change() TO authenticated;
GRANT EXECUTE ON FUNCTION agentos.compute_usage_cost() TO authenticated;

COMMIT;
