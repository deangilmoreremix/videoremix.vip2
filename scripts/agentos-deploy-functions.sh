#!/usr/bin/env bash
# scripts/agentos-deploy-functions.sh
#
# Deploys the seven AgentOS edge functions to a Supabase project.
#
# WHY A SCRIPT
#   The functions have to be deployed before anything in the port can run
#   end-to-end: the browser calls `agentos-tasks`, `agentos-approvals`,
#   `agentos-connections` and `agentos-provider-test`, and the scheduler calls
#   `agentos-sweep` and `agentos-execute`. Deploying them one command at a
#   time is how the list drifted out of sync with the code before.
#
# PREREQUISITES
#   * A valid management token:  export SUPABASE_ACCESS_TOKEN=sbp_...
#     (the token in .env was rejected by the Management API with
#      HTTP 401 "Invalid access token" — issue a new one at
#      https://supabase.com/dashboard/account/tokens)
#   * The supabase CLI (npx supabase@2 works; the repo pins it as a devDependency)
#   * The project ref (default: bzxohkrxcwodllketcpz)
#
# Usage:
#   scripts/agentos-deploy-functions.sh [project-ref]
#
# AFTER DEPLOYING
#   * Verify the schema is exposed:  scripts/agentos-verify-exposure.sh
#   * Schedule continuous execution: see docs/agentos/LIVE_VERIFICATION.md §4
#     (pg_cron calling agentos-sweep and agentos-execute every minute).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-bzxohkrxcwodllketcpz}}"

FUNCTIONS=(
  agentos-tasks
  agentos-execute
  agentos-sweep
  agentos-approvals
  agentos-connections
  agentos-tools
  agentos-provider-test
)

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "FAIL: SUPABASE_ACCESS_TOKEN is not set."
  echo "      Issue one at https://supabase.com/dashboard/account/tokens"
  echo "      (Dashboard -> Account -> Access Tokens -> Generate new token) and export it:"
  echo "        export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 2
fi

echo "=== Deploying AgentOS edge functions to ${PROJECT_REF} ==="
echo

npx --yes supabase@2 link --project-ref "${PROJECT_REF}"

# The functions are useless without the schema: a fresh project gets the
# functions and no tables, so every read 404s on PostgREST. The migrations go
# first, and a failure here stops the deployment.
echo
echo "--- applying the migrations"
#
# `supabase db push` cannot be used on this project: the live migration
# ledger holds thirty-five migrations whose files are not in this repository
# (they were applied to the project by other means), and the CLI refuses to
# push while the remote history contains versions it cannot find locally.
#
# The migrations are therefore applied over a direct connection, and only the
# ones the ledger does not know about: the first seven are NOT re-runnable
# (their CREATE POLICY statements would collide with the ones already there).
apply_migrations() {
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "  DATABASE_URL is not set: skipping the migrations."
    echo "  (the schema is applied by hand: psql \$DATABASE_URL -f supabase/migrations/<file>.sql)"
    return 0
  fi

  export PGSSLMODE="${PGSSLMODE:-require}"
  for migration in "${ROOT}"/supabase/migrations/20261012*.sql; do
    name="$(basename "${migration}")"
    version="${name%%_*}"
    applied=$(psql "${DATABASE_URL}" -tAc \
      "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '${version}'" 2>/dev/null || echo 0)
    if [ "${applied}" = "0" ]; then
      echo "  applying ${name}"
      if ! psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q -f "${migration}" >/tmp/agentos-migration.log 2>&1; then
        echo "  FAILED to apply ${name}"
        tail -5 /tmp/agentos-migration.log
        return 1
      fi
      # Record it, so the next run (and `supabase db push`) knows about it.
      psql "${DATABASE_URL}" -q -c \
        "INSERT INTO supabase_migrations.schema_migrations (version, name, created_by)
         VALUES ('${version}', '${name#*_}', 'psql')
         ON CONFLICT (version) DO NOTHING" >/dev/null 2>&1 || true
    else
      echo "  already applied: ${name}"
    fi
  done
}

apply_migrations || exit 1

for fn in "${FUNCTIONS[@]}"; do
  echo
  echo "--- deploying ${fn}"
  npx --yes supabase@2 functions deploy "${fn}" --project-ref "${PROJECT_REF}"
done

echo
echo "=== All AgentOS edge functions deployed ==="
echo "Next: scripts/agentos-verify-exposure.sh, then the pg_cron runbook in"
echo "      docs/agentos/LIVE_VERIFICATION.md §4."
echo
echo "The sweep and the executor are scheduled by the migration"
echo "supabase/migrations/20261012121300_agentos_writers.sql, which reads the"
echo "project URL and the service key from the vault at run time. If the vault"
echo "has no service_role_key secret yet, the cron jobs stay DISABLED:"
echo "  psql \"$DATABASE_URL\" -c \"SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');\""
echo "  psql \"$DATABASE_URL\" -c \"SELECT vault.create_secret('<service-role-key>', 'service_role_key');\""
echo "  psql \"$DATABASE_URL\" -c \"SELECT agentos.register_scheduler_jobs();\""
