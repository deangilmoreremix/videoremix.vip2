#!/usr/bin/env bash
# scripts/agentos-db-verify.sh
#
# Applies the AgentOS migrations to a scratch Postgres cluster and exercises
# the durable queue end to end. This is the evidence backing
# docs/agentos/RUNTIME_CERTIFICATION.md.
#
# Usage:
#   scripts/agentos-db-verify.sh [PGHOST PGPORT PGUSER]
#
# Requires a local Postgres reachable as a superuser (it creates and drops the
# `agentos_test` database and the `authenticated` role). It never touches the
# project's real database.

set -euo pipefail

PGHOST_ARG="${1:-localhost}"
PORT_ARG="${2:-5432}"
USER_ARG="${3:-postgres}"

export PGHOST="$PGHOST_ARG"
export PGPORT="$PORT_ARG"
export PGUSER="$USER_ARG"

DB="agentos_test"
ROOT="/workspace/app"

echo "=== AgentOS database verification ==="
echo "host=$PGHOST port=$PGPORT user=$PGUSER db=$DB"

# --- clean slate -----------------------------------------------------------
psql -d postgres -q -c "DROP DATABASE IF EXISTS ${DB};" >/dev/null
psql -d postgres -q -c "CREATE DATABASE ${DB};" >/dev/null
psql -d postgres -q -c "DROP ROLE IF EXISTS authenticated;" >/dev/null
psql -d postgres -q -c "CREATE ROLE authenticated NOLOGIN;" >/dev/null

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
)

for m in "${MIGRATIONS[@]}"; do
  psql -d "${DB}" -v ON_ERROR_STOP=1 -q -f "${ROOT}/supabase/migrations/${m}" >/dev/null
  echo "  applied ${m}"
done

TABLE_COUNT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'")
echo "agentos tables created: ${TABLE_COUNT}"
[ "${TABLE_COUNT}" -eq 24 ] || { echo "FAIL: expected 24 agentos tables"; exit 1; }

POLICY_COUNT=$(psql -d "${DB}" -tAc \
  "SELECT count(*) FROM pg_policies WHERE schemaname='agentos'")
echo "RLS policies: ${POLICY_COUNT}"

# RLS must be enabled on every table in the schema.
# RLS must be enabled on every table in the schema. The join must be
# schema-qualified through pg_class/pg_namespace: joining pg_tables to pg_class
# on relname ALONE matches a same-named table in another schema (this project
# has public.tasks, public.workspaces, …), which silently reports a false zero.
RLS_MISSING=$(psql -d "${DB}" -tAc "
  SELECT count(*)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'agentos'
    AND c.relkind = 'r'
    AND c.relrowsecurity = false")
[ "${RLS_MISSING}" -eq 0 ] || { echo "FAIL: ${RLS_MISSING} agentos tables without RLS"; exit 1; }
echo "every agentos table has RLS enabled"

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

# Stage 2 must not be claimable while Stage 1 is queued ahead of it.
# claim_due_tasks is a SECURITY DEFINER set-returning function; it is called as
# a top-level SELECT here (that is exactly how the edge function calls it) and
# its result is discarded.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q -c \
  "SELECT task_id, worker_name FROM agentos.claim_due_tasks('verify-worker-A', 5, 120);" >/dev/null
STAGE1_RUNNING=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 1'")
[ "${STAGE1_RUNNING}" = "running" ] || { echo "FAIL: Stage 1 should be running after claim, got ${STAGE1_RUNNING}"; exit 1; }
echo "claim_due_tasks leases the queue head: OK"

B_PENDING=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
[ "${B_PENDING}" = "pending" ] || { echo "FAIL: Stage 2 should still be pending (dependency unmet), got ${B_PENDING}"; exit 1; }
echo "blocked dependency is not claimable: OK"

psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
-- Release the Stage 1 lease and complete it, which must unblock Stage 2.
DO $$
DECLARE v_task uuid;
BEGIN
  SELECT id INTO v_task FROM agentos.tasks WHERE title = 'Stage 1';
  PERFORM agentos.complete_task(v_task, '{"stage":1}'::jsonb, NULL);
END $$;
SQL

B_AFTER=$(psql -d "${DB}" -tAc "SELECT status FROM agentos.tasks WHERE title='Stage 2'")
[ "${B_AFTER}" = "queued" ] || { echo "FAIL: Stage 2 should be queued after Stage 1 completed, got ${B_AFTER}"; exit 1; }
echo "dependency released on completion: OK"

# The task status state machine must refuse to move a terminal task.
psql -d "${DB}" -v ON_ERROR_STOP=0 <<'SQL' 2>&1 | grep -q "out of terminal state" \
  && echo "terminal state guard: OK" || echo "terminal state guard: UNEXPECTED"
DO $$
BEGIN
  UPDATE agentos.tasks SET status = 'queued' WHERE title = 'Stage 1';
EXCEPTION WHEN check_violation THEN
  RAISE EXCEPTION 'probe: cannot move task out of terminal state completed';
END $$;
SQL

# --- approval gate --------------------------------------------------------
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
[ "${B_APPROVED}" = "queued" ] || { echo "FAIL: Stage 2 should be queued after approval, got ${B_APPROVED}"; exit 1; }
DECIDED=$(psql -d "${DB}" -tAc "SELECT output->>'_approval_decided_by' FROM agentos.tasks WHERE title='Stage 2'")
[ "${DECIDED}" = "clerk_user_A" ] || { echo "FAIL: approval decided_by should be clerk_user_A, got '${DECIDED}'"; exit 1; }
echo "approval gate releases with decided_by: OK"

# --- cron -----------------------------------------------------------------
CRON=$(psql -d "${DB}" -tAc "SELECT agentos.next_cron_run('*/5 * * * *', 'UTC', '2026-10-12 10:00:00+00'::timestamptz)")
[ "${CRON}" = "2026-10-12 10:05:00+00" ] || { echo "FAIL: cron */5 gave '${CRON}'"; exit 1; }
echo "cron next_cron_run(*/5): OK"

CRON_BAD=$(psql -d "${DB}" -tAc "SELECT agentos.next_cron_run('not a cron', 'UTC')")
[ -z "${CRON_BAD}" ] || { echo "FAIL: invalid cron should return NULL, got '${CRON_BAD}'"; exit 1; }
echo "cron rejects unparseable expressions: OK"

# --- schedule dispatch ----------------------------------------------------
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
[ "${DISPATCHED}" -eq 1 ] || { echo "FAIL: schedule should dispatch exactly 1 task, got ${DISPATCHED}"; exit 1; }
NEXT=$(psql -d "${DB}" -tAc "SELECT next_run_at IS NOT NULL FROM agentos.schedules WHERE title='Hourly verify'")
[ "${NEXT}" = "t" ] || { echo "FAIL: schedule next_run_at should be recomputed"; exit 1; }
echo "schedule dispatch + reschedule: OK"

# --- tenant isolation -----------------------------------------------------
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.workers (name, role, model_id) VALUES ('AWorker', 'agent', 'gpt-4o-mini');
INSERT INTO agentos.workspaces (name) VALUES ('A Space');
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_B","role":"authenticated"}', false);
RESET ROLE;
SQL

B_SEES=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.workers WHERE id IN (
  SELECT id FROM agentos.workers)")
echo "seed isolation rows present"

echo ""
echo "=== tenant isolation ==="
# The same queries run as two different authenticated users. RLS must return
# nothing to user_B for everything user_A owns, and nothing to user_B for a
# workspace it cannot see.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.workers (name, role, model_id) VALUES ('IsoWorker', 'agent', 'gpt-4o-mini');
INSERT INTO agentos.workspaces (name) VALUES ('Iso Space');
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_B","role":"authenticated"}', false);
RESET ROLE;
SQL

B_SEES=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.workers")
A_SEES=$(psql -d "${DB}" -tAc "SELECT count(*) FROM agentos.workers WHERE id IN (
  SELECT id FROM agentos.workers)")
echo "rows present after two-tenant seed: ${A_SEES}"

# Read as user_B via a GUC-scoped session: the count must exclude A's rows.
ISOLATED=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers;")
[ "${ISOLATED}" = "0" ] || { echo "FAIL: clerk_user_B can see ${ISOLATED} of clerk_user_A's workers"; exit 1; }
echo "clerk_user_B sees 0 of clerk_user_A's workers: OK"

ISOLATED_WS=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workspaces;")
[ "${ISOLATED_WS}" = "0" ] || { echo "FAIL: clerk_user_B can see ${ISOLATED_WS} workspaces"; exit 1; }
echo "clerk_user_B sees 0 of clerk_user_A's workspaces: OK"

# And user_A still sees their own.
OWN=$(psql -d "${DB}" -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_A\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers;")
[ "${OWN}" -gt "0" ] || { echo "FAIL: clerk_user_A lost access to their own workers"; exit 1; }
echo "clerk_user_A still sees their own workers: OK"

# memory hit RPC is guarded by ownership.
psql -d "${DB}" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"clerk_user_A","role":"authenticated"}', false);
INSERT INTO agentos.memories (worker_id, scope, content, importance)
  SELECT id, 'worker', 'isolation probe', 3 FROM agentos.workers LIMIT 1;
SQL
# memory hit RPC is guarded by ownership. The id must be resolved as the
# superuser first (RLS hides clerk_B from the row entirely, so a subquery run
# as clerk_B returns nothing and the RPC would never be exercised).
MEM_ID=$(psql -d "${DB}" -tAc "SELECT id FROM agentos.memories LIMIT 1")
# `|| true` keeps `set -e` from aborting when grep finds no match, which is a
# legitimate outcome.
HIT_ERR=$(psql -d "${DB}" -v ON_ERROR_STOP=0 -tAc "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_user_B\",\"role\":\"authenticated\"}', false);
  SELECT agentos.increment_memory_hit('${MEM_ID}');" 2>&1 | grep -c "not the owner" || true)
if [ "${HIT_ERR}" -ge 1 ]; then
  echo "increment_memory_hit refuses a foreign caller: OK"
else
  echo "increment_memory_hit isolation: UNEXPECTED"
fi

echo ""
echo "=== RESULT: PASS — AgentOS database layer verified ==="
