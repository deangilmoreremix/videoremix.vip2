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
#   TWO ROUTES
#     1. The platform's function secrets (the normal way).
#     2. The vault, which the runtime can also read.
#
#     The Management API's secrets endpoint answers "Invalid access token" for
#     some personal access tokens, while the function DEPLOYMENT endpoint with
#     the same token works — so the script falls back to the vault rather than
#     leaving the runtime without a key. The vault route needs DATABASE_URL.
#
# Usage:
#   export OPENAI_API_KEY=sk-...
#   export DATABASE_URL=postgresql://...    # for the vault fallback
#   scripts/agentos-set-secrets.sh [project-ref]

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [ -f "${ROOT}/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ROOT}/.env"
  set +a
fi

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-bzxohkrxcwodllketcpz}}"

# The secret name in the vault and the name of the platform secret are the
# same, so the runtime reads one place regardless of the route.
declare -A VAULT_NAMES=(
  ["OPENAI_API_KEY"]="openai_api_key"
  ["SUPABASE_SERVICE_ROLE_KEY"]="service_role_key"
)

SECURED=()

set_vault_secret() {
  # set_vault_secret <platform name> <value>
  local name="$1" value="$2" vault_name="${VAULT_NAMES[$1]}"

  if [ -z "${DATABASE_URL:-}" ]; then
    echo "  SKIP ${name}: DATABASE_URL is not set, so the vault cannot be written."
    return 1
  fi

  export PGSSLMODE="${PGSSLMODE:-require}"
  # The secret is written through psql, so the value never appears in a
  # command line that a process list could show.
  # A secret name is unique in the vault, so an existing one is replaced
  # rather than refused.
  if ! PGPASSWORD="${PGPASSWORD:-}" psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q \
      -v secret_name="${vault_name}" -v secret_value="${value}" <<'SQL' >/dev/null 2>&1
DELETE FROM vault.decrypted_secrets WHERE name = :'secret_name';
SELECT vault.create_secret(:'secret_value', :'secret_name', 'AgentOS: set by scripts/agentos-set-secrets.sh');
SQL
  then
    echo "  FAILED ${name}: the vault write was refused."
    return 1
  fi
  return 0
}

echo "=== Setting the AgentOS function secrets on ${PROJECT_REF} ==="

for name in OPENAI_API_KEY SUPABASE_SERVICE_ROLE_KEY; do
  value="${!name:-}"
  if [ -z "${value}" ]; then
    echo "  SKIP ${name}: not set in the environment."
    continue
  fi

  # Print the NAME only: a secret value must never reach a log.
  echo "  --- ${name} (platform secret)"
  if npx --yes supabase@2 secrets set --project-ref "${PROJECT_REF}" "${name}=${value}" >/dev/null 2>&1; then
    SECURED+=("${name}: platform secret")
    continue
  fi

  echo "      the Management API refused it; using the vault instead"
  if set_vault_secret "${name}" "${value}"; then
    SECURED+=("${name}: vault (${VAULT_NAMES[$name]})")
  fi
done

echo
if [ "${#SECURED[@]}" -eq 0 ]; then
  echo "FAIL: nothing was set. Export at least one of:"
  echo "        OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY"
  echo "      and DATABASE_URL for the vault fallback."
  exit 2
fi

echo "=== Set: ${SECURED[*]} ==="
echo "Next: scripts/agentos-deploy-functions.sh"
