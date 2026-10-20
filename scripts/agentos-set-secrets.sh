#!/usr/bin/env bash
# scripts/agentos-set-secrets.sh
#
# Sets the edge-function secrets the AgentOS runtime needs.
#
# WHY
#   The runtime reads its model provider key and its service-role key from the
#   function environment. `supabase functions deploy` does NOT carry them: a
#   deployed function without its secrets starts and then fails at the first
#   call, which looks like a broken function rather than a missing secret.
#
#   The values come from the environment (or .env), never from this script.
#
# Usage:
#   export OPENAI_API_KEY=sk-...
#   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   scripts/agentos-set-secrets.sh [project-ref]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [ -f "${ROOT}/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ROOT}/.env"
  set +a
fi

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-bzxohkrxcwodllketcpz}}"

SECRETS=()
[ -n "${OPENAI_API_KEY:-}" ] && SECRETS+=("OPENAI_API_KEY=${OPENAI_API_KEY}")
[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && SECRETS+=("SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}")
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] && SECRETS+=("SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN}")

if [ "${#SECRETS[@]}" -eq 0 ]; then
  echo "FAIL: nothing to set. Export at least one of:"
  echo "        OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN"
  exit 2
fi

echo "=== Setting ${#SECRETS[@]} secret(s) on ${PROJECT_REF} ==="
for secret in "${SECRETS[@]}"; do
  # Print the NAME only: a secret value must never reach a log.
  echo "--- setting ${secret%%=*}"
  npx --yes supabase@2 secrets set --project-ref "${PROJECT_REF}" "${secret}"
done

echo
echo "=== Secrets set ==="
echo "Next: scripts/agentos-deploy-functions.sh"
