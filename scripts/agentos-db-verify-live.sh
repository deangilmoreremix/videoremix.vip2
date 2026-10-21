#!/usr/bin/env bash
# scripts/agentos-db-verify-live.sh
#
# Verifies the AgentOS database layer against the LIVE project: the queue, the
# approval gate, the schedule dispatch, the writers, the tool assignments and
# the tenant boundary — through the real `authenticated` role, with the real
# service-role key, and with the real RLS policies.
#
# It creates a probe tenant, exercises the flows, and deletes everything it
# created. It never touches a row it did not create.
#
# Usage:
#   DATABASE_URL=postgresql://... scripts/agentos-db-verify-live.sh
#
# The DATABASE_URL may be a direct connection (db.<ref>.supabase.co) or a
# session pooler connection. The probes use SET ROLE and SET request.jwt.claims,
# so they must run as a role that can switch to `authenticated` (postgres).

set -uo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
export PGSSLMODE="${PGSSLMODE:-require}"

PROBE="clerk_live_probe_$$"
FAILURES=0
CHECKS=0

pass() { CHECKS=$((CHECKS + 1)); echo "  OK   $1"; }
fail() { CHECKS=$((CHECKS + 1)); FAILURES=$((FAILURES + 1)); echo "  FAIL $1"; }
check_eq() { # check_eq <label> <expected> <actual>
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected '$2', got '$3')"; fi
}

q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tA -c "$1"; }

echo "=== AgentOS LIVE database verification ==="
echo "probe tenant: ${PROBE}"

cleanup() {
  echo
  echo "--- cleaning up the probe rows"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=0 -q <<SQL >/dev/null 2>&1
DELETE FROM agentos.notifications WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.audit_logs WHERE actor_clerk_id = '${PROBE}';
DELETE FROM agentos.messages WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.conversations WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.artifacts WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.usage_records WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.execution_events WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.execution_runs WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.approvals WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.task_edges WHERE task_id IN (SELECT id FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}');
DELETE FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.schedules WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.worker_tools WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.workspaces WHERE owner_clerk_id = '${PROBE}';
DELETE FROM agentos.workspace_members WHERE owner_clerk_id = '${PROBE}';
SQL
  echo "--- done"
}
trap cleanup EXIT

# --- 1. the schema is exposed and the lockdown is in place ------------------
TABLES=$(q "SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'")
check_eq "the agentos schema is present" "24" "${TABLES}"

PUBLIC_EXEC=$(q "
  SELECT count(*) FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'agentos' AND p.prosecdef
    AND has_function_privilege('public', p.oid, 'EXECUTE')")
check_eq "no SECURITY DEFINER function is executable by PUBLIC" "0" "${PUBLIC_EXEC}"

AUTH_EXEC=$(q "
  SELECT has_function_privilege('authenticated', 'agentos.claim_due_tasks(text,integer,integer)', 'EXECUTE')")
check_eq "authenticated cannot execute claim_due_tasks" "f" "${AUTH_EXEC}"

SVC_EXEC=$(q "
  SELECT has_function_privilege('service_role', 'agentos.claim_due_tasks(text,integer,integer)', 'EXECUTE')")
check_eq "service_role can execute claim_due_tasks" "t" "${SVC_EXEC}"

COLUMN_GRANTS=$(q "
  SELECT count(*) FROM information_schema.column_privileges
  WHERE table_schema='agentos' AND table_name='tasks' AND grantee='authenticated' AND privilege_type='UPDATE'")
check_eq "authenticated may update only the metadata columns of tasks" "5" "${COLUMN_GRANTS}"

# --- 2. the queue ----------------------------------------------------------
q "SELECT set_config('request.jwt.claims', '{\"sub\":\"${PROBE}\",\"role\":\"authenticated\"}', false)" >/dev/null

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"${PROBE}","role":"authenticated"}', false);
INSERT INTO agentos.workers (name, role, model_id, owner_clerk_id)
  VALUES ('Live probe worker', 'agent', 'gpt-4o-mini', '${PROBE}');
INSERT INTO agentos.worker_tools (worker_id, owner_clerk_id, tool_key, enabled)
  SELECT id, '${PROBE}', 'web_fetch', true FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';
INSERT INTO agentos.tasks (title, description, assigned_worker_id, status, trigger, owner_clerk_id)
  SELECT 'Live probe task', 'd', id, 'queued', 'manual', '${PROBE}'
  FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';
SQL

CLAIMED=$(q "
  SELECT count(*) FROM agentos.claim_due_tasks('live-probe', 5, 120) c
  JOIN agentos.tasks t ON t.id = c.task_id
  WHERE t.title = 'Live probe task'")
check_eq "the queue claims a due task" "1" "${CLAIMED}"

# The check above leased the task, so it is re-queued before it is claimed
# again: the point is what the claim RETURNS, not that a task is free.
q "UPDATE agentos.tasks SET status = 'queued', lease_owner = NULL, lease_expires_at = NULL
   WHERE owner_clerk_id = '${PROBE}' AND title = 'Live probe task'" >/dev/null

TOOLS_SEEN=$(q "
  SELECT count(*) FROM agentos.claim_due_tasks('live-probe', 5, 120) c
  JOIN agentos.tasks t ON t.id = c.task_id
  WHERE t.title = 'Live probe task' AND c.worker_tools @> '[{\"tool_key\": \"web_fetch\"}]'")
check_eq "the assigned tools reach the claimed task" "1" "${TOOLS_SEEN}"

# --- 3. the approval gate --------------------------------------------------
APPROVAL_ID=$(q "
  SELECT agentos.request_approval(
    (SELECT id FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}' AND title = 'Live probe task'),
    'send_email', '{}'::jsonb, 'live probe', 3600)")
PARKED=$(q "SELECT count(*) FROM agentos.tasks
  WHERE owner_clerk_id = '${PROBE}' AND status = 'waiting_approval'
    AND approval_id = '${APPROVAL_ID}'")
check_eq "an approval parks the task" "1" "${PARKED}"

PENDING=$(q "SELECT count(*) FROM agentos.approvals
  WHERE id = '${APPROVAL_ID}' AND status = 'pending'")
check_eq "the approval is pending" "1" "${PENDING}"

# The decision is made as the owning tenant, through the real role.
q "SET ROLE authenticated;
   SELECT set_config('request.jwt.claims', '{\"sub\":\"${PROBE}\",\"role\":\"authenticated\"}', false);
   SELECT agentos.resolve_approval('${APPROVAL_ID}', 'approved', 'live probe');
   RESET ROLE;" >/dev/null

RESOLVED=$(q "SELECT count(*) FROM agentos.approvals
  WHERE id = '${APPROVAL_ID}' AND status = 'approved'")
check_eq "the approval is decided" "1" "${RESOLVED}"

RELEASED=$(q "SELECT count(*) FROM agentos.tasks
  WHERE owner_clerk_id = '${PROBE}' AND status = 'queued'")
check_eq "the approved task is released" "1" "${RELEASED}"

# --- 4. the writers --------------------------------------------------------
APPROVAL_NOTIFY=$(q "SELECT count(*) FROM agentos.notifications
  WHERE owner_clerk_id = '${PROBE}' AND kind = 'approval'")
check_eq "the approval request produced a notification" "1" "${APPROVAL_NOTIFY}"

# Completing the task is what produces the completion notification.
q "SELECT agentos.complete_task(
    (SELECT id FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}' AND title = 'Live probe task'),
    '{\"probe\": true}'::jsonb)" >/dev/null

COMPLETE_NOTIFY=$(q "SELECT count(*) FROM agentos.notifications
  WHERE owner_clerk_id = '${PROBE}' AND kind = 'task_completed'")
check_eq "the completed task produced a notification" "1" "${COMPLETE_NOTIFY}"

AUDIT=$(q "SELECT count(*) FROM agentos.audit_logs WHERE actor_clerk_id = '${PROBE}'")
if [ "${AUDIT}" -ge 1 ]; then
  pass "the audit trail recorded the mutations (${AUDIT} rows)"
else
  fail "the audit trail recorded nothing"
fi

# --- 5. the schedule -------------------------------------------------------
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL >/dev/null
SELECT set_config('request.jwt.claims', '{"sub":"${PROBE}","role":"authenticated"}', false);
INSERT INTO agentos.schedules (worker_id, owner_clerk_id, title, prompt, cron, next_run_at)
  SELECT id, '${PROBE}', 'Live probe schedule', 'hi', '0 * * * *', now() - interval '1 minute'
  FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';
SQL

DISPATCHED=$(q "SELECT count(*) FROM agentos.dispatch_due_schedules('live-probe')")
check_eq "the sweep dispatches the due schedule" "1" "${DISPATCHED}"

SCHEDULED_TASK=$(q "SELECT count(*) FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}' AND schedule_id IS NOT NULL")
check_eq "the dispatched task records its schedule" "1" "${SCHEDULED_TASK}"

RESCHEDULED=$(q "SELECT count(*) FROM agentos.schedules WHERE owner_clerk_id = '${PROBE}' AND next_run_at > now()")
check_eq "the schedule's next run is recomputed" "1" "${RESCHEDULED}"

# A replayed sweep must not dispatch the same occurrence twice.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL >/dev/null
UPDATE agentos.schedules s
   SET next_run_at = (SELECT run_after FROM agentos.tasks WHERE schedule_id = s.id)
 WHERE s.owner_clerk_id = '${PROBE}';
SQL
REPLAY=$(q "SELECT count(*) FROM agentos.dispatch_due_schedules('live-probe')")
check_eq "a replayed sweep dispatches nothing new" "0" "${REPLAY}"

# --- 6. the tenant boundary, through the real `authenticated` role ---------
ISOLATED=$(q "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_someone_else\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';")
check_eq "another tenant sees none of the probe's workers" "0" "${ISOLATED}"

ISOLATED_TASKS=$(q "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"clerk_someone_else\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.tasks WHERE owner_clerk_id = '${PROBE}';")
check_eq "another tenant sees none of the probe's tasks" "0" "${ISOLATED_TASKS}"

OWN=$(q "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"${PROBE}\",\"role\":\"authenticated\"}', false);
  SELECT count(*) FROM agentos.workers WHERE owner_clerk_id = '${PROBE}';")
check_eq "the owner still sees their own workers" "1" "${OWN}"

# A client may not forge the owner of a row.
FORGED=$(q "
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claims', '{\"sub\":\"${PROBE}\",\"role\":\"authenticated\"}', false);
  INSERT INTO agentos.workers (name, role, model_id, owner_clerk_id)
    VALUES ('Forged', 'agent', 'gpt-4o-mini', 'clerk_someone_else');
  RESET ROLE;
  SELECT count(*) FROM agentos.workers WHERE name = 'Forged' AND owner_clerk_id = 'clerk_someone_else';")
check_eq "a client cannot forge owner_clerk_id" "0" "${FORGED}"

# --- 7. the scheduler ------------------------------------------------------
JOBS=$(q "SELECT count(*) FROM cron.job WHERE jobname IN ('agentos-sweep', 'agentos-execute') AND active")
check_eq "the sweep and the executor are scheduled and active" "2" "${JOBS}"

VAULT=$(q "SELECT count(*) FROM vault.decrypted_secrets WHERE name IN ('project_url', 'service_role_key')")
check_eq "the scheduler's secrets are in the vault" "2" "${VAULT}"

# --- summary ---------------------------------------------------------------
echo
echo "checks: ${CHECKS}, failures: ${FAILURES}"
if [ "${FAILURES}" -eq 0 ]; then
  echo "=== RESULT: PASS — the AgentOS database layer works on the live project ==="
  exit 0
fi
echo "=== RESULT: FAIL — ${FAILURES} check(s) failed ==="
exit 1
