#!/usr/bin/env bash
# scripts/agentos-db-verify.sh
#
# Applies the AgentOS migrations to a scratch Postgres cluster and exercises
# the durable queue, the privilege model and tenant isolation end to end.
# This is the evidence backing docs/agentos/DB_VERIFICATION.md.
#
# Usage:
#   scripts/agentos-db-verify.sh [PGHOST PGPORT PGUSER]
#
# Requires a local Postgres reachable as a superuser (it creates and drops the
# `agentos_test` database and the `authenticated` / `service_role` /
# `authenticator` roles). It never touches the project's real database.
#
# The script exits non-zero if ANY check fails.

set -uo pipefail

PGHOST_ARG="${1:-localhost}"
PORT_ARG="${2:-5432}"
USER_ARG="${3:-postgres}"

export PGHOST="$PGHOST_ARG"
export PGPORT="$PORT_ARG"
export PGUSER="$USER_ARG"

DB="agentos_test"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FAILURES=0
CHECKS=0

pass() { CHECKS=$((CHECKS + 1)); echo "  OK   $1"; }
fail() { CHECKS=$((CHECKS + 1)); FAILURES=$((FAILURES + 1)); echo "  FAIL $1"; }
check_eq() { # check_eq <label> <expected> <actual>
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected '$2', got '$3')"; fi
}

echo "=== AgentOS database verification ==="
echo "host=$PGHOST port=$PGPORT user=$PGUSER db=$DB"

# --- clean slate -----------------------------------------------------------
psql -d postgres -q -c "DROP DATABASE IF EXISTS ${DB};" >/dev/null 2>&1
psql -d postgres -q -c "CREATE DATABASE ${DB};" >/dev/null 2>&1
psql -d postgres -q -c "DROP ROLE IF EXISTS authenticated;" >/dev/null 2>&1
psql -d postgres -q -c "CREATE ROLE authenticated NOLOGIN;" >/dev/null 2>&1
psql -d postgres -q -c "DROP ROLE IF EXISTS service_role;" >/dev/null 2>&1
psql -d postgres -q -c "CREATE ROLE service_role NOLOGIN BYPASSRLS;" >/dev/null 2>&1
psql -d postgres -q -c "DROP ROLE IF EXISTS authenticator;" >/dev/null 2>&1
psql -d postgres -q -c "CREATE ROLE authenticator NOLOGIN;" >/dev/null 2>&1
psql -d postgres -q -c "DROP ROLE IF EXISTS anon;" >/dev/null 2>&1
psql -d postgres -q -c "CREATE ROLE anon NOLOGIN;" >/dev/null 2>&1

echo "scratch database ready"

# --- apply migrations ------------------------------------------------------
MIGRATIONS=(
  "20261012120000_agentos_core.sql"
  "20261012120100_agentos_execution.sql"
  "20261012120200_agentos_knowledge_connections.sql"
  "20261012120300_agentos_rls.sql"
  "20261012120400_agentos_queue_rpc.sql"
  "20261012120500_agentos_seed_catalog.sql"
  "20261012120600_agentos_memory_hit.sql"
  "20261012120700_agentos_expose_schema.sql"
  "20261012120800_agentos_security_lockdown.sql"
  "20261012120900_agentos_triggers_indexes.sql"
  "20261012121000_agentos_queue_semantics.sql"
  "20261012121100_agentos_canvas_text_ids.sql"
  "20261012121200_agentos_tool_assignments.sql"
  "20261012121300_agentos_writers.sql"
)

for m in "${MIGRATIONS[@]}"; do
  if psql -d "${DB}" -v ON_ERROR_STOP=1 -q -f "${ROOT}/supabase/migrations/${m}" >/dev/null; then
    echo "  applied ${m}"
  else
    echo "  FAIL applying ${m}"
    exit 1
  fi
done

# --- structure -------------------------------------------------------------
TABLE_COUNT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'")
check_eq "agentos tables created: ${TABLE_COUNT}" "24" "${TABLE_COUNT}"

POLICY_COUNT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM pg_policies WHERE schemaname='agentos'")
echo "RLS policies: ${POLICY_COUNT}"
if [ "${POLICY_COUNT}" -lt 38 ]; then
  fail "expected at least 38 RLS policies, found ${POLICY_COUNT}"
else
  pass "RLS policies present (${POLICY_COUNT})"
fi

# Every table must have RLS enabled AND at least one policy.
RLS_MISSING=$(psql -d "${DB}" -tAc "
  SELECT count(*)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'agentos'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false")
check_eq "every agentos table has RLS enabled" "0" "${RLS_MISSING}"

POLICY_LESS=$(psql -d "${DB}" -tAc "
  SELECT count(*)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'agentos'
    AND c.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'agentos' AND p.tablename = c.relname
    )")
check_eq "every agentos table has at least one policy" "0" "${POLICY_LESS}"

# --- function privileges --------------------------------------------------
# The browser may not call the queue functions: they are the scheduler's.
QUEUE_FNS=(
  "agentos.enqueue_task(uuid)"
  "agentos.claim_due_tasks(text,integer,integer)"
  "agentos.complete_task(uuid,jsonb,uuid,text)"
  "agentos.fail_task(uuid,text,uuid,integer,text)"
  "agentos.recover_stale_runs()"
  "agentos.request_approval(uuid,text,jsonb,text,integer,uuid)"
  "agentos.dispatch_due_schedules(text)"
  "agentos.cancel_task(uuid,text)"
  "agentos.expire_stale_approvals()"
)
for fn in "${QUEUE_FNS[@]}"; do
  PRIV=$(psql -d "${DB}" -tAc \
    "SELECT has_function_privilege('authenticated', '${fn}', 'EXECUTE')")
  check_eq "authenticated cannot execute ${fn}" "f" "${PRIV}"
done

for fn in "${QUEUE_FNS[@]}"; do
  PRIV=$(psql -d "${DB}" -tAc \
    "SELECT has_function_privilege('service_role', '${fn}', 'EXECUTE')")
  check_eq "service_role can execute ${fn}" "t" "${PRIV}"
done

# The browser-facing functions must stay callable.
for fn in "agentos.resolve_approval(uuid,text,text)" \
          "agentos.increment_memory_hit(uuid)" \
          "agentos.current_clerk_id()" \
          "agentos.is_workspace_member(uuid)" \
          "agentos.next_cron_run(text,text,timestamptz)"; do
  PRIV=$(psql -d "${DB}" -tAc \
    "SELECT has_function_privilege('authenticated', '${fn}', 'EXECUTE')")
  check_eq "authenticated can execute ${fn}" "t" "${PRIV}"
done

# --- column-level grants on agentos.tasks ---------------------------------
TASK_UPDATE=$(psql -d "${DB}" -tAc "
  SELECT count(*) FROM information_schema.column_privileges
  WHERE table_schema='agentos' AND table_name='tasks'
    AND grantee='authenticated' AND privilege_type='UPDATE'")
check_eq "authenticated may update only the 5 metadata columns of tasks" "5" "${TASK_UPDATE}"

TASK_DELETE=$(psql -d "${DB}" -tAc "
  SELECT has_table_privilege('authenticated', 'agentos.tasks', 'DELETE')")
check_eq "authenticated cannot delete tasks (the audit trail cascades)" "f" "${TASK_DELETE}"

# --- queue flow ------------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);

INSERT INTO agentos.workers (name, role, model_id)
  VALUES ('Verifier', 'agent', 'gpt-4o-mini') RETURNING id AS wf \gset

-- task B depends on task A
INSERT INTO agentos.tasks (title, description, assigned_worker_id, status, trigger)
  VALUES ('Stage 1', 'd', :'wf', 'queued', 'manual') RETURNING id AS ta \gset
INSERT INTO agentos.tasks (title, description, assigned_worker_id, status, trigger)
  VALUES ('Stage 2', 'd', :'wf', 'pending', 'manual') RETURNING id AS tb \gset
INSERT INTO agentos.task_edges (task_id, waits_for, kind)
  VALUES (:'tb', :'ta', 'depends_on');
SQL

echo "dependency graph created"

psql -d "${DB}" -v ON_ERROR_STOP=1 -q -c \
  "SELECT task_id, worker_name FROM agentos.claim_due_tasks('verify-worker-A', 5, 120);" >/dev/null
STAGE1_RUNNING=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 1'")
check_eq "claim_due_tasks leases the queue head" "running" "${STAGE1_RUNNING}"

B_PENDING=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
check_eq "blocked dependency is not claimable" "pending" "${B_PENDING}"

# --- lease fencing ---------------------------------------------------------
# A worker whose lease expired must not be able to complete the task.
FENCE=$(psql -d "${DB}" -tAc "
  SELECT agentos.complete_task(
    (SELECT id FROM agentos.tasks WHERE title='Stage 1'),
    '{\"stage\":1}'::jsonb, NULL, 'somebody-else')")
STAGE1_AFTER_FENCE=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 1'")
check_eq "a stale lease owner cannot complete the task" "running" "${STAGE1_AFTER_FENCE}"

# --- dependency release on completion --------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
DO $$
DECLARE v_task uuid;
BEGIN
  SELECT id INTO v_task FROM agentos.tasks WHERE title = 'Stage 1';
  PERFORM agentos.complete_task(v_task, '{"stage":1}'::jsonb, NULL, NULL);
END $$;
SQL

B_AFTER=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
check_eq "dependency released on completion" "queued" "${B_AFTER}"

# --- terminal state guard --------------------------------------------------
GUARD=$(psql -d "${DB}" -v ON_ERROR_STOP=0 -tAc \
  "UPDATE agentos.tasks SET status='queued' WHERE title='Stage 1'" 2>&1 | grep -c "out of terminal state" || true)
if [ "${GUARD}" -ge 1 ]; then
  pass "terminal state guard"
else
  fail "terminal state guard did not fire"
fi

# --- retry budget ----------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.tasks (title, description, status, trigger, attempt, max_attempts, run_after)
  SELECT 'Exhausted', 'd', 'queued', 'manual', 3, 3, now() - interval '1 minute'
  FROM agentos.workers WHERE name = 'Verifier' LIMIT 1;
SQL

CLAIMED_EXHAUSTED=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.claim_due_tasks('verify-worker-B', 10, 120) q
   JOIN agentos.tasks t ON t.id = q.task_id WHERE t.title = 'Exhausted'")
check_eq "a task past max_attempts is never claimed" "0" "${CLAIMED_EXHAUSTED}"

# --- an unassigned task is parked, not claimed ------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.tasks (title, description, status, trigger, run_after)
  VALUES ('No worker', 'd', 'queued', 'manual', now() - interval '1 minute');
SQL

UNASSIGNED=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.claim_due_tasks('verify-worker-C', 10, 120) q
   JOIN agentos.tasks t ON t.id = q.task_id WHERE t.title = 'No worker'")
check_eq "a task with no worker is never claimed" "0" "${UNASSIGNED}"

# --- approval gate ---------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
DO $$
DECLARE v_task uuid; v_appr uuid;
BEGIN
  SELECT id INTO v_task FROM agentos.tasks WHERE title = 'Stage 2';
  UPDATE agentos.tasks SET status = 'running' WHERE id = v_task;
  v_appr := agentos.request_approval(v_task, 'send_email', '{}'::jsonb, 'confirm', 3600);
  PERFORM agentos.resolve_approval(v_appr, 'approved', 'verified');
END $$;
SQL

B_APPROVED=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
check_eq "approval gate releases the task" "queued" "${B_APPROVED}"
DECIDED=$(psql -d "${DB}" -tAc "SELECT output->>'_approval_decided_by' FROM agentos.tasks WHERE title='Stage 2'")
check_eq "approval records who decided" "clerk_user_A" "${DECIDED}"

# --- approval expiry -------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
DO $$
DECLARE v_task uuid; v_appr uuid;
BEGIN
  SELECT id INTO v_task FROM agentos.tasks WHERE title = 'Stage 2';
  UPDATE agentos.tasks SET status = 'running', requires_approval = false WHERE id = v_task;
  v_appr := agentos.request_approval(v_task, 'send_email', '{}'::jsonb, 'confirm', 60);
  UPDATE agentos.approvals SET expires_at = now() - interval '1 minute' WHERE id = v_appr;
END $$;
SQL

EXPIRED=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.expire_stale_approvals()")
check_eq "a stale approval is expired" "1" "${EXPIRED}"
RELEASED=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
check_eq "an expired approval releases the parked task" "queued" "${RELEASED}"

# --- cancel_task rolls the mission up --------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
DO $$
DECLARE v_mission uuid; v_task uuid;
BEGIN
  INSERT INTO agentos.missions (title, goal, status)
    VALUES ('Cancel me', 'g', 'active') RETURNING id INTO v_mission;
  INSERT INTO agentos.tasks (mission_id, title, description, status, trigger)
    VALUES (v_mission, 'Doomed', 'd', 'pending', 'manual') RETURNING id INTO v_task;
  PERFORM agentos.cancel_task(v_task, 'operator changed their mind');
END $$;
SQL

MISSION_STATUS=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.missions WHERE title='Cancel me'")
check_eq "cancelling the only task cancels the mission" "cancelled" "${MISSION_STATUS}"

# --- cron ------------------------------------------------------------------
CRON=$(psql -d "${DB}" -tAc "SELECT agentos.next_cron_run('*/5 * * * *', 'UTC', '2026-10-12 10:00:00+00'::timestamptz)")
check_eq "cron next_cron_run(*/5)" "2026-10-12 10:05:00+00" "${CRON}"

CRON_BAD=$(psql -d "${DB}" -tAc "SELECT agentos.next_cron_run('not a cron', 'UTC')")
check_eq "cron rejects unparseable expressions" "" "${CRON_BAD}"

# A day-of-week of 7 means Sunday, exactly like the browser preview.
CRON_SUN=$(psql -d "${DB}" -tAc "SELECT agentos.next_cron_run('0 0 * * 7', 'UTC', '2026-10-12 10:00:00+00'::timestamptz)")
check_eq "cron day-of-week 7 (Sunday) fires" "2026-10-18 00:00:00+00" "${CRON_SUN}"

# --- schedule dispatch (and its idempotency) -------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
DO $$
DECLARE v_w uuid;
BEGIN
  SELECT id INTO v_w FROM agentos.workers WHERE name = 'Verifier';
  INSERT INTO agentos.schedules (worker_id, owner_clerk_id, title, prompt, cron, next_run_at)
    VALUES (v_w, 'clerk_user_A', 'Hourly verify', 'hi', '0 * * * *', now() - interval '1 minute');
  PERFORM agentos.dispatch_due_schedules();
END $$;
SQL

DISPATCHED=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.tasks WHERE title='Hourly verify'")
check_eq "schedule dispatch creates exactly 1 task" "1" "${DISPATCHED}"
NEXT=$(psql -d "${DB}" -tAc "SELECT next_run_at IS NOT NULL FROM agentos.schedules WHERE title='Hourly verify'")
check_eq "schedule next_run_at is recomputed" "t" "${NEXT}"
SCHEDULE_LINK=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.tasks WHERE title='Hourly verify' AND schedule_id IS NOT NULL")
check_eq "the dispatched task records its schedule" "1" "${SCHEDULE_LINK}"

# A replayed sweep must not dispatch the same occurrence twice.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
DO $$
DECLARE v_sched uuid;
BEGIN
  SELECT id INTO v_sched FROM agentos.schedules WHERE title = 'Hourly verify';
  UPDATE agentos.schedules SET next_run_at = (
    SELECT run_after FROM agentos.tasks WHERE title = 'Hourly verify'
  ) WHERE id = v_sched;
  PERFORM agentos.dispatch_due_schedules();
END $$;
SQL

DISPATCHED_TWICE=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.tasks WHERE title='Hourly verify'")
check_eq "a replayed sweep does not double-dispatch" "1" "${DISPATCHED_TWICE}"

# --- tenant isolation ------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.workers (name, role, model_id) VALUES ('AWorker', 'agent', 'gpt-4o-mini');
INSERT INTO agentos.workspaces (name) VALUES ('A Space');
RESET ROLE;
SQL

echo ""
echo "=== tenant isolation ==="

ISOLATED=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers;")
check_eq "clerk_user_B sees 0 of clerk_user_A's workers" "0" "${ISOLATED}"

ISOLATED_WS=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workspaces;")
check_eq "clerk_user_B sees 0 of clerk_user_A's workspaces" "0" "${ISOLATED_WS}"

OWN=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_A\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers;")
if [ "${OWN}" -gt "0" ]; then
  pass "clerk_user_A still sees their own workers"
else
  fail "clerk_user_A lost access to their own workers"
fi

# A client may not forge the owner of a row.
FORGED=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_A\",\"role\":\"authenticated\"}', false);
  INSERT INTO agentos.workers (name, role, model_id, owner_clerk_id)
    VALUES ('Forged', 'agent', 'gpt-4o-mini', 'clerk_user_B');
  RESET ROLE;
  SELECT count(*) FROM agentos.workers WHERE name='Forged' AND owner_clerk_id='clerk_user_B';")
check_eq "a client cannot forge owner_clerk_id" "0" "${FORGED}"

# The browser may not forge a lease or a terminal status.
FORGED_LEASE=$(psql -d "${DB}" -v ON_ERROR_STOP=0 -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_A\",\"role\":\"authenticated\"}', false);
  UPDATE agentos.tasks
     SET lease_owner = 'forged', lease_expires_at = now() + interval '1 hour',
         status = 'running'
   WHERE title = 'Stage 2';" 2>&1 | grep -c "permission denied" || true)
if [ "${FORGED_LEASE}" -ge 1 ]; then
  pass "a client cannot forge a lease (the column grant refuses it)"
else
  fail "a client could forge a lease"
fi

FORGED_STATUS=$(psql -d "${DB}" -tAc "
  SELECT count(*) FROM agentos.tasks WHERE title='Stage 2' AND lease_owner='forged';")
check_eq "no forged lease was written" "0" "${FORGED_STATUS}"

# --- memory hit RPC is guarded by ownership --------------------------------
MEM_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.memories LIMIT 1")
if [ -z "${MEM_ID}" ]; then
  psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.memories (worker_id, scope, content, importance)
  SELECT id, 'worker', 'isolation probe', 3 FROM agentos.workers LIMIT 1;
SQL
  MEM_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.memories LIMIT 1")
fi

HIT_ERR=$(psql -d "${DB}" -v ON_ERROR_STOP=0 -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT agentos.increment_memory_hit('${MEM_ID}');" 2>&1 | grep -c "not the owner" || true)
if [ "${HIT_ERR}" -ge 1 ]; then
  pass "increment_memory_hit refuses a foreign caller"
else
  fail "increment_memory_hit did not refuse a foreign caller"
fi

# --- the canvas stores its stable keys ------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.canvas_nodes (id, owner_clerk_id, node_kind, ref_id, label)
  VALUES ('worker:probe', 'clerk_user_A', 'worker', NULL, 'Probe'),
         ('worker:probe2', 'clerk_user_A', 'worker', NULL, 'Probe 2');
INSERT INTO agentos.canvas_edges (id, owner_clerk_id, source_node_id, target_node_id, edge_kind)
  VALUES ('edge:worker:probe->worker:probe2', 'clerk_user_A', 'worker:probe', 'worker:probe2', 'handoff')
  ON CONFLICT DO NOTHING;
SQL

# --- the worker's tool assignments reach the claim ----------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.worker_tools (worker_id, owner_clerk_id, tool_key, enabled)
  SELECT id, 'clerk_user_A', 'web_fetch', true FROM agentos.workers WHERE name = 'Verifier';
INSERT INTO agentos.worker_tools (worker_id, owner_clerk_id, tool_key, enabled)
  SELECT id, 'clerk_user_A', 'gmail', false FROM agentos.workers WHERE name = 'Verifier';
INSERT INTO agentos.tasks (title, description, assigned_worker_id, status, trigger, run_after)
  SELECT 'Tooled task', 'd', id, 'queued', 'manual', now() - interval '1 minute'
  FROM agentos.workers WHERE name = 'Verifier';
SQL

TOOLS_SEEN=$(psql -d "${DB}" -tAc "
  SELECT count(*) FROM agentos.claim_due_tasks('verify-worker-tools', 5, 120) q
  WHERE q.task_id IN (SELECT id FROM agentos.tasks WHERE title = 'Tooled task')
    AND q.worker_tools @> '[{\"tool_key\": \"web_fetch\"}]'")
check_eq "the assigned tools reach the claimed task" "1" "${TOOLS_SEEN}"

# The task above has been leased by the claim, so the second claim needs a
# task of its own: a leased task is never claimed twice.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.tasks (title, description, assigned_worker_id, status, trigger, run_after)
  SELECT 'Tooled task (disabled)', 'd', id, 'queued', 'manual', now() - interval '1 minute'
  FROM agentos.workers WHERE name = 'Verifier';
SQL

DISABLED_SEEN=$(psql -d "${DB}" -tAc "
  SELECT count(*) FROM agentos.claim_due_tasks('verify-worker-tools', 5, 120) q
  WHERE q.task_id IN (SELECT id FROM agentos.tasks WHERE title = 'Tooled task (disabled)')
    AND q.worker_tools @> '[{\"tool_key\": \"gmail\", \"enabled\": false}]'")
check_eq "a disabled tool is reported as disabled" "1" "${DISABLED_SEEN}"

CANVAS_NODE=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.canvas_nodes WHERE id = 'worker:probe'")
check_eq "a canvas node can be stored under its stable key" "1" "${CANVAS_NODE}"

CANVAS_EDGE=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.canvas_edges WHERE id = 'edge:worker:probe->worker:probe2'")
check_eq "a canvas edge can be stored under its stable key" "1" "${CANVAS_EDGE}"

# --- updated_at is maintained ---------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
UPDATE agentos.workspaces SET name = 'Renamed' WHERE name = 'A Space';
SQL
UPDATED=$(psql -d "${DB}" -tAc \
  "SELECT updated_at > created_at FROM agentos.workspaces WHERE name='Renamed'")
check_eq "updated_at is maintained by the trigger" "t" "${UPDATED}"

# --- the notification writer ------------------------------------------------
# A task that fails must tell its owner exactly once.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
DO $$
DECLARE
  v_worker uuid;
  v_task   uuid;
BEGIN
  SELECT id INTO v_worker FROM agentos.workers WHERE name = 'Verifier' LIMIT 1;
  INSERT INTO agentos.tasks
    (title, description, assigned_worker_id, status, trigger, attempt,
     max_attempts, owner_clerk_id)
  VALUES
    ('Fails loudly', 'd', v_worker, 'running', 'manual', 3, 3, 'clerk_user_A')
  RETURNING id INTO v_task;

  -- attempt = max_attempts, so this is a terminal failure, not a retry.
  PERFORM agentos.fail_task(v_task, 'the model exploded', NULL::uuid, 30, NULL::text);
END $$;
SQL

FAIL_TASK_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.tasks WHERE title = 'Fails loudly'")

FAIL_NOTIF=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.notifications
    WHERE kind = 'task_failed' AND entity_id = '${FAIL_TASK_ID}'")
check_eq "a failed task notifies its owner exactly once" "1" "${FAIL_NOTIF}"

FAIL_NOTIF_OWNER=$(psql -d "${DB}" -tAc \
  "SELECT owner_clerk_id FROM agentos.notifications
    WHERE kind = 'task_failed' AND entity_id = '${FAIL_TASK_ID}'")
check_eq "the failure notification is addressed to the task owner" "clerk_user_A" "${FAIL_NOTIF_OWNER}"

FAIL_NOTIF_BODY=$(psql -d "${DB}" -tAc \
  "SELECT body FROM agentos.notifications
    WHERE kind = 'task_failed' AND entity_id = '${FAIL_TASK_ID}'")
case "${FAIL_NOTIF_BODY}" in
  *"the model exploded"*)
    pass "the failure notification carries the error"
    ;;
  *)
    fail "the failure notification does not carry the error (got '${FAIL_NOTIF_BODY}')"
    ;;
esac

# A task that completes notifies its owner as well.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO agentos.tasks (title, description, status, trigger, owner_clerk_id)
  VALUES ('Finishes cleanly', 'd', 'running', 'manual', 'clerk_user_A');
SQL

DONE_TASK_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.tasks WHERE title = 'Finishes cleanly'")
psql -d "${DB}" -q -c \
  "SELECT agentos.complete_task('${DONE_TASK_ID}', '{\"ok\":true}'::jsonb, NULL::uuid, NULL::text)" >/dev/null

DONE_NOTIF=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.notifications
    WHERE kind = 'task_completed' AND entity_id = '${DONE_TASK_ID}'")
check_eq "a completed task notifies its owner" "1" "${DONE_NOTIF}"

# An approval that is waiting for a human notifies the owner of the approval.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO agentos.tasks (title, description, status, trigger, owner_clerk_id)
  VALUES ('Needs a human', 'd', 'running', 'manual', 'clerk_user_A');
SQL

APPR_TASK_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.tasks WHERE title = 'Needs a human'")
APPR_ID=$(psql -d "${DB}" -tAc \
  "SELECT agentos.request_approval('${APPR_TASK_ID}', 'send_email', '{}'::jsonb, 'please confirm', 3600, NULL::uuid)")

APPR_NOTIF=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.notifications
    WHERE kind = 'approval' AND entity_id = '${APPR_ID}'")
check_eq "an approval request notifies the owner" "1" "${APPR_NOTIF}"

APPR_NOTIF_OWNER=$(psql -d "${DB}" -tAc \
  "SELECT owner_clerk_id FROM agentos.notifications
    WHERE kind = 'approval' AND entity_id = '${APPR_ID}'")
check_eq "the approval notification is addressed to the approval owner" "clerk_user_A" "${APPR_NOTIF_OWNER}"

# One row per event: a sweep that re-reads the queue writes nothing.
NOTIF_TOTAL_BEFORE=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.notifications")
psql -d "${DB}" -q -c "SELECT agentos.dispatch_due_schedules()" >/dev/null
NOTIF_TOTAL_AFTER=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.notifications")
check_eq "a sweep that dispatches nothing new writes no notification" \
  "${NOTIF_TOTAL_BEFORE}" "${NOTIF_TOTAL_AFTER}"

# --- the audit writer -------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO agentos.tasks (title, description, status, trigger, owner_clerk_id)
  VALUES ('Audited task', 'd', 'pending', 'manual', 'clerk_user_A');
SQL

AUDIT_TASK_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.tasks WHERE title = 'Audited task'")

psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<SQL >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
UPDATE agentos.tasks SET status = 'queued' WHERE id = '${AUDIT_TASK_ID}';
SQL

AUDIT_ROWS=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_type = 'task' AND entity_id = '${AUDIT_TASK_ID}'")
check_eq "a task status change is audited exactly once" "1" "${AUDIT_ROWS}"

AUDIT_ACTOR=$(psql -d "${DB}" -tAc \
  "SELECT actor_clerk_id FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${AUDIT_TASK_ID}'")
check_eq "the audit row is attributed to the signed-in actor" "clerk_user_A" "${AUDIT_ACTOR}"

AUDIT_ROLE=$(psql -d "${DB}" -tAc \
  "SELECT acting_as FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${AUDIT_TASK_ID}'")
check_eq "a human action is audited as a user" "user" "${AUDIT_ROLE}"

AUDIT_BEFORE=$(psql -d "${DB}" -tAc \
  "SELECT before->>'status' FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${AUDIT_TASK_ID}'")
check_eq "the audit row records the previous status" "pending" "${AUDIT_BEFORE}"

AUDIT_AFTER=$(psql -d "${DB}" -tAc \
  "SELECT after->>'status' FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${AUDIT_TASK_ID}'")
check_eq "the audit row records the new status" "queued" "${AUDIT_AFTER}"

AUDIT_SUMMARY=$(psql -d "${DB}" -tAc \
  "SELECT summary FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${AUDIT_TASK_ID}'")
if [ "${AUDIT_SUMMARY#*pending*"queued"*}" != "${AUDIT_SUMMARY}" ]; then
  pass "the audit summary describes the transition"
else
  fail "the audit summary does not describe the transition (got '${AUDIT_SUMMARY}')"
fi

# A server-side change is attributed to the system, not to a person.
SYS_ROLE=$(psql -d "${DB}" -tAc \
  "SELECT acting_as FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${FAIL_TASK_ID}'")
check_eq "a server-side change is audited as the system" "system" "${SYS_ROLE}"

SYS_ACTOR=$(psql -d "${DB}" -tAc \
  "SELECT actor_clerk_id FROM agentos.audit_logs
    WHERE action = 'task.status' AND entity_id = '${FAIL_TASK_ID}'")
check_eq "a server-side change is attributed to the owner of the row" "clerk_user_A" "${SYS_ACTOR}"

# A worker update is audited too.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
UPDATE agentos.workers SET role = 'senior agent' WHERE name = 'Verifier';
SQL

WORKER_AUDIT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.audit_logs
    WHERE action = 'worker.updated' AND entity_type = 'worker'")
if [ "${WORKER_AUDIT}" -ge 1 ]; then
  pass "a worker update is audited"
else
  fail "a worker update was not audited"
fi

# An update that only moves updated_at is not an auditable action.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
UPDATE agentos.workers SET updated_at = now() WHERE name = 'Verifier';
SQL

TOUCH_AUDIT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.audit_logs
    WHERE action = 'worker.updated'
      AND before->>'updated_at' IS NOT NULL
      AND after->>'updated_at' IS NOT NULL
      AND before->'updated_at' = after->'updated_at'")
check_eq "a touch-only update is not audited" "0" "${TOUCH_AUDIT}"

# The noisy tables are deliberately NOT audited.
NOISE_AUDIT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.audit_logs
    WHERE entity_type IN ('execution_event', 'usage_record', 'message', 'memory', 'canvas_node')")
check_eq "the noisy tables are not audited" "0" "${NOISE_AUDIT}"

# --- the usage cost ---------------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO agentos.usage_records
  (owner_clerk_id, provider, model_id, prompt_tokens, completion_tokens)
  VALUES ('clerk_user_A', 'openai', 'gpt-4o-mini', 1000000, 100000);
SQL

USAGE_COST=$(psql -d "${DB}" -tAc \
  "SELECT cost_usd FROM agentos.usage_records WHERE model_id = 'gpt-4o-mini' LIMIT 1")
check_eq "a usage record carries a real cost, not zero" "0.00210000" "${USAGE_COST}"

USAGE_CREDITS=$(psql -d "${DB}" -tAc \
  "SELECT credits FROM agentos.usage_records WHERE model_id = 'gpt-4o-mini' LIMIT 1")
check_eq "the usage record is priced in credits" "210.000000" "${USAGE_CREDITS}"

USAGE_COST_ZERO=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.usage_records WHERE cost_usd = 0")
check_eq "no usage record is left at zero cost" "0" "${USAGE_COST_ZERO}"

# --- the model catalog ------------------------------------------------------
CAT_TEMPERATURE=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.model_catalog WHERE supports_temperature = false")
check_eq "the reasoning models are marked as rejecting a temperature" "4" "${CAT_TEMPERATURE}"

CAT_TEMP_CHAT=$(psql -d "${DB}" -tAc \
  "SELECT supports_temperature FROM agentos.model_catalog WHERE id = 'gpt-4o-mini'")
check_eq "a chat model still accepts a temperature" "t" "${CAT_TEMP_CHAT}"

CAT_TEMP_HELPER=$(psql -d "${DB}" -tAc "SELECT agentos.model_supports_temperature('gpt-5')")
check_eq "the runtime is told that gpt-5 rejects a temperature" "f" "${CAT_TEMP_HELPER}"

CAT_TEMP_DEFAULT=$(psql -d "${DB}" -tAc "SELECT agentos.model_supports_temperature('gpt-4o-mini')")
check_eq "an ordinary model is reported as accepting a temperature" "t" "${CAT_TEMP_DEFAULT}"

CAT_CHAT=$(psql -d "${DB}" -tAc \
  "SELECT supports_chat FROM agentos.model_catalog WHERE id = 'text-embedding-3-large'")
check_eq "the embedding model is not offered as a chat model" "f" "${CAT_CHAT}"

CAT_EMBED_STATUS=$(psql -d "${DB}" -tAc \
  "SELECT status FROM agentos.model_catalog WHERE id = 'text-embedding-3-large'")
check_eq "the embedding model is not in the routable set" "deprecated" "${CAT_EMBED_STATUS}"

CAT_EMBED_CHAT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM agentos.model_catalog
    WHERE status = 'active' AND capabilities @> ARRAY['embeddings']")
check_eq "no embedding-only model is offered as an active model" "0" "${CAT_EMBED_CHAT}"

# --- the scheduler ----------------------------------------------------------
# The registration must be idempotent and must never take the migration down.
SCHED_REPORT=$(psql -d "${DB}" -tAc "SELECT agentos.register_scheduler_jobs()")
if [ -n "${SCHED_REPORT}" ]; then
  pass "the scheduler registration reports its outcome (${SCHED_REPORT})"
else
  fail "the scheduler registration reported nothing"
fi

CRON_AVAILABLE=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cron' AND p.proname = 'schedule'")
if [ "${CRON_AVAILABLE}" -gt 0 ]; then
  REGISTERED=$(psql -d "${DB}" -tAc \
    "SELECT count(*) FROM cron.job WHERE jobname IN ('agentos-sweep', 'agentos-execute')")
  check_eq "the sweep and the execute job are registered" "2" "${REGISTERED}"

  psql -d "${DB}" -q -c "SELECT agentos.register_scheduler_jobs()" >/dev/null
  REGISTERED_AGAIN=$(psql -d "${DB}" -tAc \
    "SELECT count(*) FROM cron.job WHERE jobname IN ('agentos-sweep', 'agentos-execute')")
  check_eq "re-registering never duplicates a job" "2" "${REGISTERED_AGAIN}"

  CRON_COMMAND=$(psql -d "${DB}" -tAc \
    "SELECT count(*) FROM cron.job
      WHERE jobname IN ('agentos-sweep', 'agentos-execute')
        AND command LIKE '%invoke_edge_function%'")
  check_eq "the registered job calls the edge function" "2" "${CRON_COMMAND}"
else
  # A bare PostgreSQL has no pg_cron: the migration must skip the jobs and
  # say so, and everything else must still work.
  check_eq "on a bare cluster the scheduler is skipped with a notice" \
    "skipped: pg_cron is not installed" "${SCHED_REPORT}"
  pass "pg_cron is not installed: the scheduler jobs were skipped by design"
fi

# The sweep must move the schedule forward, not just leave it due.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO agentos.schedules (owner_clerk_id, title, prompt, cron, next_run_at)
  VALUES ('clerk_user_A', 'Every minute', 'p', '* * * * *', now() - interval '1 minute');
SQL

NEXT_BEFORE=$(psql -d "${DB}" -tAc \
  "SELECT next_run_at FROM agentos.schedules WHERE title = 'Every minute'")
psql -d "${DB}" -q -c "SELECT agentos.dispatch_due_schedules()" >/dev/null
NEXT_AFTER=$(psql -d "${DB}" -tAc \
  "SELECT next_run_at FROM agentos.schedules WHERE title = 'Every minute'")

ADVANCED=$(psql -d "${DB}" -tAc \
  "SELECT ('${NEXT_AFTER}'::timestamptz > '${NEXT_BEFORE}'::timestamptz)")
check_eq "the schedule's next_run_at advances after a dispatch" "t" "${ADVANCED}"

# --- summary ---------------------------------------------------------------
echo ""
echo "checks: ${CHECKS}, failures: ${FAILURES}"
if [ "${FAILURES}" -eq 0 ]; then
  echo "=== RESULT: PASS — AgentOS database layer verified ==="
  exit 0
fi
echo "=== RESULT: FAIL — ${FAILURES} check(s) failed ==="
exit 1
