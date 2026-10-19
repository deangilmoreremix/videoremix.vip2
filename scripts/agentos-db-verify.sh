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

# --- updated_at is maintained ---------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
UPDATE agentos.workspaces SET name = 'Renamed' WHERE name = 'A Space';
SQL
UPDATED=$(psql -d "${DB}" -tAc \
  "SELECT updated_at > created_at FROM agentos.workspaces WHERE name='Renamed'")
check_eq "updated_at is maintained by the trigger" "t" "${UPDATED}"

# --- summary ---------------------------------------------------------------
echo ""
echo "checks: ${CHECKS}, failures: ${FAILURES}"
if [ "${FAILURES}" -eq 0 ]; then
  echo "=== RESULT: PASS — AgentOS database layer verified ==="
  exit 0
fi
echo "=== RESULT: FAIL — ${FAILURES} check(s) failed ==="
exit 1
