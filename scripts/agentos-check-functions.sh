#!/usr/bin/env bash
# scripts/agentos-check-functions.sh
#
# Type-checks the AgentOS edge functions with Deno.
#
# WHY
#   The functions are NOT part of the app's TypeScript project: they run on
#   Deno, they import from npm: specifiers, and nothing in the release gate
#   compiles them. A type error in a function is therefore invisible until
#   the function is deployed — and a deployment is the worst place to find
#   one.
#
#   This check found a real error: the timeout helper declared its timer as
#   `number`, which is Deno's type for the handle but not Node's, and the npm
#   dependencies pull Node's typings in.
#
# Usage:
#   scripts/agentos-check-functions.sh
#
# Needs Deno (https://deno.land). It exits non-zero when a function does not
# type-check.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

DENO_BIN="${DENO_BIN:-deno}"
if ! command -v "${DENO_BIN}" >/dev/null 2>&1; then
  if [ -x /usr/local/bin/deno ]; then
    DENO_BIN=/usr/local/bin/deno
  else
    echo "SKIP: Deno is not installed (https://deno.land). The edge functions were not type-checked."
    exit 0
  fi
fi

echo "=== AgentOS edge function type check (${DENO_BIN}) ==="

FAILED=0
for fn in supabase/functions/agentos-*/index.ts; do
  name="$(basename "$(dirname "${fn}")")"
  printf "  %-26s " "${name}"
  if "${DENO_BIN}" check --quiet --no-lock --node-modules-dir=none "${fn}" >/tmp/agentos-deno-check.log 2>&1; then
    echo "OK"
  else
    echo "FAILED"
    grep -E "TS[0-9]+|^error" /tmp/agentos-deno-check.log | head -5 | sed 's/^/      /'
    FAILED=$((FAILED + 1))
  fi
done

echo
if [ "${FAILED}" -eq 0 ]; then
  echo "=== RESULT: PASS — every AgentOS function type-checks ==="
  exit 0
fi
echo "=== RESULT: FAIL — ${FAILED} function(s) did not type-check ==="
exit 1
