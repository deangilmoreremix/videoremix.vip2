#!/usr/bin/env bash
# scripts/agentos-verify-exposure.sh
#
# Verifies that the `agentos` schema is exposed to PostgREST.
#
# WHY THIS EXISTS
#   The AgentOS port keeps every table, function and RPC in the `agentos`
#   schema. The application pins its queries to that schema, but PostgREST
#   only serves schemas a project exposes — and this project exposes
#   `public, graphql_public`. Until `agentos` is exposed, every AgentOS read
#   fails with PGRST106 ("Invalid schema: agentos") and the dashboard shows
#   empty panels.
#
#   This script asks PostgREST the exact question the app asks and reports
#   PASS / FAIL with the fix. It needs no database connection — only the
#   project's URL and an API key.
#
# Usage:
#   scripts/agentos-verify-exposure.sh            # check only
#   scripts/agentos-verify-exposure.sh --apply    # expose the schema, then check
#
# Reads (from the environment or .env):
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY   (preferred: proves the BROWSER path works)
#   SUPABASE_SERVICE_ROLE_KEY (fallback)
#   SUPABASE_ACCESS_TOKEN    (only needed for --apply: the Management API token)

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

APPLY=0
if [ "${1:-}" = "--apply" ]; then
  APPLY=1
fi

if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

URL="${VITE_SUPABASE_URL:-}"
KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}"

if [ -z "${URL}" ] || [ -z "${KEY}" ]; then
  echo "FAIL: VITE_SUPABASE_URL and an API key (VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY) are required."
  exit 2
fi

BASE="${URL%/}/rest/v1"
PROJECT_REF="$(printf '%s' "${URL}" | sed -E 's#https?://([^.]+)\..*#\1#')"

if [ "${APPLY}" = "1" ]; then
  echo "=== Exposing the 'agentos' schema on ${PROJECT_REF} ==="
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    echo "FAIL: --apply needs SUPABASE_ACCESS_TOKEN (the Management API token)."
    echo "      Issue one at https://supabase.com/dashboard/account/tokens"
    echo "      (Dashboard -> Account -> Access Tokens -> Generate new token)."
    echo "      Without it, use the Dashboard (Settings -> API -> Exposed schemas)"
    echo "      or apply supabase/migrations/20261012120700_agentos_expose_schema.sql"
    echo "      over a direct Postgres connection."
    exit 2
  fi

  # The project currently exposes 'public, graphql_public'. Append 'agentos'
  # LAST: PostgREST resolves an unqualified table name against the first
  # matching schema, so 'public' must stay first or the AgentOS 'tasks' and
  # 'workspaces' tables would shadow the app's own same-named public tables.
  CURRENT_SCHEMAS="public, graphql_public"
  EXPOSED=$(curl -s -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/api" |
    python3 -c "import json,sys;print(json.load(sys.stdin).get('db_schemas',''))" 2>/dev/null || true)

  if [ -n "${EXPOSED}" ]; then
    case ",${EXPOSED}," in
      *,agentos,*) CURRENT_SCHEMAS="${EXPOSED}" ;;
      *) CURRENT_SCHEMAS="${EXPOSED}, agentos" ;;
    esac
  fi

  echo "exposed schemas -> ${CURRENT_SCHEMAS}"
  APPLY_RESPONSE=$(curl -s -o /tmp/agentos-exposure-apply.json -w '%{http_code}' -X PATCH \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/api" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"db_schemas\": \"${CURRENT_SCHEMAS}\"}")

  echo "PATCH /v1/projects/${PROJECT_REF}/config/api -> HTTP ${APPLY_RESPONSE}"
  cat /tmp/agentos-exposure-apply.json 2>/dev/null | head -c 400
  echo
  if [ "${APPLY_RESPONSE}" != "200" ] && [ "${APPLY_RESPONSE}" != "201" ]; then
    echo "FAIL: the Management API refused the change (HTTP ${APPLY_RESPONSE})."
    echo "      Use the Dashboard or the SQL migration instead."
    exit 1
  fi
  echo
fi

echo "=== AgentOS schema exposure check ==="
echo "project: ${URL}"
echo

# 1. The agentos schema must be reachable with the profile header the app sends.
BODY=$(curl -s -o /tmp/agentos-exposure-body.json -w '%{http_code}' \
  "${BASE}/workers?select=id&limit=1" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}" \
  -H 'Accept-Profile: agentos')

echo "GET /rest/v1/workers  (Accept-Profile: agentos) -> HTTP ${BODY}"
cat /tmp/agentos-exposure-body.json 2>/dev/null | head -c 400
echo
echo

STATUS=0

if [ "${BODY}" = "404" ] || [ "${BODY}" = "406" ]; then
  echo "FAIL: PostgREST refuses the 'agentos' schema."
  echo "      The project exposes only 'public, graphql_public'."
  echo "      Fix: Dashboard -> Settings -> API -> Exposed schemas -> add 'agentos',"
  echo "      or apply supabase/migrations/20261012120700_agentos_expose_schema.sql"
  echo "      and re-run this script."
  STATUS=1
elif [ "${BODY}" = "200" ] || [ "${BODY}" = "401" ] || [ "${BODY}" = "403" ]; then
  echo "PASS: PostgREST accepts the 'agentos' schema."
  if [ "${BODY}" = "401" ] || [ "${BODY}" = "403" ]; then
    echo "      (The key is not allowed to read the table — expected when the anon key is used"
    echo "       and RLS has no policy for it. The schema itself is reachable.)"
  fi
else
  echo "FAIL: unexpected HTTP ${BODY}."
  STATUS=1
fi

echo
echo "--- cross-check: the same table through the PUBLIC schema ---"
PUBLIC_BODY=$(curl -s -o /tmp/agentos-exposure-public.json -w '%{http_code}' \
  "${BASE}/workers?select=id&limit=1" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}")

echo "GET /rest/v1/workers  (no profile) -> HTTP ${PUBLIC_BODY}"
cat /tmp/agentos-exposure-public.json 2>/dev/null | head -c 300
echo
echo
echo "The public read above is expected to fail (PGRST205) — the AgentOS tables are"
echo "not in 'public'. The application never relies on it: every AgentOS query is"
echo "pinned to the 'agentos' schema."

exit "${STATUS}"
