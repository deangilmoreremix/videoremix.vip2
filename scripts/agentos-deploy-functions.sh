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

for fn in "${FUNCTIONS[@]}"; do
  echo
  echo "--- deploying ${fn}"
  npx --yes supabase@2 functions deploy "${fn}" --project-ref "${PROJECT_REF}"
done

echo
echo "=== All AgentOS edge functions deployed ==="
echo "Next: scripts/agentos-verify-exposure.sh, then the pg_cron runbook in"
echo "      docs/agentos/LIVE_VERIFICATION.md §4."
