# SapienX AgentOS Port — Status

**Repository:** `/workspace/app`  **Branch:** `kilo/agentos-port-completion` (from `kilo/agentos-master-port`)
**Evidence date:** 2026-10-19  **Verifier:** schema-routing completion pass

## Headline

The AgentOS port is **code-complete and locally verified**. Everything that
remains open is `BLOCKED (external)` — it needs a live credential or a project
setting this environment does not provide (a valid Supabase management token, a
direct Postgres connection string, a real `VITE_CLERK_PUBLISHABLE_KEY`, or one
Dashboard toggle).

**Two real in-repo defects were found on 2026-10-19 and are now fixed:**

1. **The application never reached the `agentos` schema.** Every AgentOS query
   was unqualified, so it resolved against `public` and could never reach the
   AgentOS data (and `public.tasks` / `public.workspaces` exist, so it could
   have read the *wrong* table silently). The previous status document reported
   "0 INCOMPLETE" because the verification was database-only and the test
   harness was schema-blind. Details: `docs/agentos/SCHEMA_EXPOSURE.md`.
2. **`agentos-tools` selected a column that does not exist.** It read
   `allowed_app_slugs` as a column of `agentos.workers`, but the allow-list is
   a key *inside* the `permissions` jsonb. PostgREST rejects the whole query
   (PGRST100), so every worker-scoped tool dispatch failed to load the
   worker's policy — the allow-list and the `allow_web_access` /
   `allow_artifacts` switches were never enforced. The query also swallowed
   its own error, so the failure looked like "Worker not found".

- **`npx vitest run`** → `Test Files 54 passed (54) · Tests 945 passed (945)`
- **`npx vitest run tests/agentos/`** → `Test Files 13 passed (13) · Tests 311 passed (311)`
- **`npm run lint`** → `0 errors` (warnings within the 821 budget)
- **`npx tsc --noEmit -p tsconfig.app.json`** → `1619` total `error TS` (baseline 1621), of which **`0`** are in `src/{pages,components,services,types}/agentos`
- **`npm run release:gate`** → `GATE RESULT: PASS`
- **`npx vite build`** → `✓ built` (through the release gate)
- **Schema exposure (live)** → `npm run agentos:verify-exposure` → **FAIL: PGRST106 "Only the following schemas are exposed: public, graphql_public"** — the one project-level step left

Status legend: **COMPLETE** (implemented AND verified by a command actually run) ·
**BLOCKED (external)** (needs a credential/CLI/service/project setting this environment lacks) ·
**INCOMPLETE** (work outstanding in the repo).

---

## Database  (evidence: local PostgreSQL 14.24 scratch cluster + migrations + the live project)

| Area item | Status | Command + observed output |
|-----------|--------|---------------------------|
| `agentos` schema (24 tables) | COMPLETE | `agentos-db-verify.sh` → `agentos tables created: 24`; seed query → `agentos_tables = 24` |
| All 7 migrations (in order) | COMPLETE | Script → `applied 20261012120000…20261012120600` for all 7 files |
| RLS (38 policies, every table) | COMPLETE | `RLS policies: 38`; `every agentos table has RLS enabled`; `tables_without_rls = 0` |
| Durable queue RPCs (claim → lease → dependency release → re-claim) | COMPLETE | `claim_due_tasks leases the queue head: OK`, `blocked dependency is not claimable: OK`, `dependency released on completion: OK`, `terminal state guard: OK` |
| Cron parser | COMPLETE | `cron next_cron_run(*/5): OK` (`→2026-10-12 10:05:00+00`), `cron rejects unparseable expressions: OK` |
| Schedule dispatch + reschedule | COMPLETE | `schedule dispatch + reschedule: OK` (`dispatch_due_schedules` created 1 task, recomputed `next_run_at`) |
| Approval gate | COMPLETE | `approval gate releases with decided_by: OK` (`resolve_approval` sets `_approval_decided_by`) |
| Seeded catalog integrity (7 models / 14 integrations / OpenClaw unsupported) | COMPLETE | `psql -tA -f seed_check.sql` → `model_catalog = 7`, `integrations = 14`, `integrations_unsupported = 1`, `unsupported_key = openclaw_gateway` |
| Schema exposure to PostgREST | **BLOCKED (external)** | Live PostgREST exposes `public, graphql_public` only (`PGRST106`). The migration `20261012120700_agentos_expose_schema.sql` and `npm run agentos:expose-schema` are ready; applying them needs a management token or a direct Postgres connection |

## Runtime  (evidence: the AgentOS service suite — real service code vs the in-memory Supabase harness)

| Area item | Status | Command + observed output |
|-----------|--------|---------------------------|
| The service suite (`src/services/agentos/*`) | COMPLETE | `npx vitest run tests/agentos/` → `311 passed (311)` across `13` files |
| The 10 acceptance scenarios | COMPLETE | `tests/agentos/acceptance.test.ts` (scenarios 1–10) within the 311 passing tests |
| Worker + workspace + mission + task lifecycle | COMPLETE | Acceptance scenarios 1–3 pass (persist/reload; queue decision surfaced; handoff edges recorded) |
| Memory (worker-scoped write + scoped retrieval) | COMPLETE | Acceptance scenario 5 passes; local `increment_memory_hit refuses a foreign caller: OK` |
| Models + BYOK (only a `credential_ref` persisted) | COMPLETE | Acceptance scenario 7 passes — secret sent to probe once, `credential_ref` stored, secret in no row |
| Connections (supported exposed, OpenClaw refused) | COMPLETE | Acceptance scenario 8 passes — unsupported `getIntegration`/`connectAccount` return `unsupported` |
| Schedules (create / preview / enable-disable) | COMPLETE | Acceptance scenario 4 passes — `next_run_at` stored, 3-occurrence preview, enable recompute |
| Approvals (gate approve → release; reject → cancelled) | COMPLETE | Acceptance scenario 6 passes — approved→`queued`, rejected→`cancelled`, invalid decision never calls server |
| Operations / monitoring (events, usage, credits) | COMPLETE | Acceptance scenario 9 passes — transcript seq order, error stream visible, credit totals recorded |
| **Schema routing (browser + edge functions)** | COMPLETE | `src/services/agentos/client.ts` pins every query to `agentos`; `tests/agentos/schema-routing.test.ts` (6 tests) proves the public client cannot see the AgentOS tables and the `agentos` client can; `tests/agentos/edge-contract.test.ts` fails if any AgentOS source queries unqualified |
| **Column contract (application vs migrations)** | COMPLETE | `tests/agentos/schema-contract.test.ts` parses the migrations and fails if the application references a table or column that does not exist — the guard that catches the `allowed_app_slugs` defect |
| **Tool policy enforcement** | COMPLETE | `agentos-tools` now reads the allow-list from the `permissions` jsonb and fails loudly on a lookup error instead of reporting "Worker not found" |

## Application  (evidence: production build + type/lint gate + suites)

| Area item | Status | Command + observed output |
|-----------|--------|---------------------------|
| Mission Control canvas | COMPLETE | `npx vite build` → `MissionControlPage-*.js` chunk (183,267 B, gzip 57,406 B); layout built from live rows in acceptance scenario 1 |
| All 15 AgentOS pages | COMPLETE | `npx vite build` → **15/15** distinct page chunks (Approvals/Connections/Memory/MissionControl/MissionDetail/MissionNew/Missions/Models/Operations/Schedules/WorkerDetail/WorkerNew/Workforce/WorkspaceDetail/Workspaces) + shared `agentos-*` chunk |
| Production build | COMPLETE | `npm run release:gate` → build step PASS |
| Lint | COMPLETE | `npm run lint` → `0 errors`, warnings within the 821 budget; gate step 2/7 PASS |
| tsc (AgentOS scope) | COMPLETE | `tsc --noEmit -p tsconfig.app.json` → `1619` total, **`0`** in `agentos` paths; baseline 1621 |
| Release gate | COMPLETE | `npm run release:gate` → **PASS**, 7/7 steps |
| Catalog integrity (app registry 117+13=130) | COMPLETE | Gate step 4/7 `test-catalog` PASS — `src/config/appRegistry.test.ts` passes |
| Security tests (webhook provider verification) | COMPLETE | Gate step 5/7 `test-security` PASS — `tests/webhook-{paykickstart,verify,zaxxa}.test.ts` |
| The E2E suite (collection) | COMPLETE | `npx playwright test --config=playwright.agentos.config.ts --list` → `Total: 62 tests in 1 file` |
| The E2E suite (execution) | **BLOCKED (external)** | `VITE_CLERK_PUBLISHABLE_KEY` is absent from `.env`, so `src/providers/ClerkProvider.tsx` throws at module load and no route renders. The suite detects this with `appBooted()` and **skips all 62 with that reason** rather than failing |

## Live & Deployment  (evidence: see `LIVE_VERIFICATION.md` and `SCHEMA_EXPOSURE.md`)

| Area item | Status | Why blocked / what changed |
|-----------|--------|----------------------------|
| Migrations applied to the LIVE project | COMPLETE | all 7 applied over direct Postgres SSL with `-v ON_ERROR_STOP=1`, each `OK`; live schema then measured: 24 tables, 38 policies, 0 tables without RLS, 7 models, 14 integrations (1 unsupported), 19 SECURITY DEFINER functions. Additive only: no `public.*` or `credits.*` table touched |
| Live queue verification | COMPLETE | `claim_due_tasks` leases the head task, excludes the blocked dependent, releases it on completion, then claims it |
| Live approval gate | COMPLETE | `request_approval` parks the task `waiting_approval`; `resolve_approval(…, 'rejected', note)` leaves it `cancelled` with the note as the error |
| Live scheduled dispatch | COMPLETE | a due `agentos.schedules` row + `dispatch_due_schedules()` → **1** task created, `next_run_at` recomputed |
| Live tenant isolation | COMPLETE | through the real `authenticated` role with two Clerk identities: the second sees 0 of the first's workers / workspaces / tasks / conversations, the owner sees 1. All probe rows deleted afterwards |
| Scheduling infrastructure availability | COMPLETE | `pg_cron` and `supabase_vault` are both present on the live project |
| **Schema exposed to PostgREST (live)** | **BLOCKED (external)** | live PostgREST exposes `public, graphql_public` only → `PGRST106`. Needs the Dashboard toggle, the Management API (`npm run agentos:expose-schema`) or the SQL migration over a direct connection. The application code is already correct and guarded by tests |
| Edge function deployment (7 functions) | **BLOCKED (external)** | `SUPABASE_ACCESS_TOKEN` in `.env` is rejected by the Management API (HTTP 401 `Invalid access token`). `npm run agentos:deploy-functions` performs the whole deployment once a valid token exists |
| Continuous scheduled execution (pg_cron) | **BLOCKED (external)** | The jobs can only call functions that exist, so this follows the deployment step. `pg_cron` **is** available on the project; the exact SQL is in `LIVE_VERIFICATION.md` §4 |
| Live execution against a model provider | **BLOCKED (external)** | `OPENAI_API_KEY` currently returns HTTP 401 `invalid_api_key` |
| Live browser verification | **BLOCKED (external)** | Needs a real `VITE_CLERK_PUBLISHABLE_KEY`; without it `ClerkProvider` throws at module load and the E2E suite skips |
| Committed-secret remediation | **BLOCKED (external)** | `.env` is now **untracked** (`git rm --cached .env`, committed in this pass). Purging it from history and rotating every key inside it are operator actions in the provider dashboards — see `LIVE_VERIFICATION.md` §6 |

---

## Totals

| Status | Count | Items |
|--------|-------|-------|
| COMPLETE | **39** | 8 Database + 12 Runtime + 9 Application + 6 Live/deployment + 4 Architecture constraints |
| BLOCKED (external) | **8** | schema exposure to PostgREST; edge-function deployment; continuous pg_cron scheduling; live model execution; live browser verification / E2E execution; committed-secret rotation and history purge (one row, two operator actions) |
| INCOMPLETE | **0** | none — the two real in-repo defects found on 2026-10-19 (schema routing, non-existent column) are fixed and guarded by tests |

---

## Architecture constraints (all satisfied — COMPLETE)

| Constraint | Status | Evidence |
|------------|--------|----------|
| No OpenClaw | COMPLETE | `openclaw_gateway` is the only `unsupported` integration (`integrations_unsupported = 1`); the connections service refuses it client-side (acceptance scenario 8) and it is not in the assignable directory |
| Netlify Functions never used for execution | COMPLETE | `supabase/functions/agentos-execute/index.ts` states it explicitly; execution runs on Supabase Edge Functions driven by pg_cron / a provisioned worker. Netlify runs only the release gate and hosts the front-end |
| No privileged credential in browser code | COMPLETE | BYOK stores only a `credential_ref` (acceptance scenario 7 asserts the raw secret persists nowhere); `service_role` is used only server-side in edge functions; sweep/execute reject callers without a `service_role` JWT |
| Existing app tables untouched (port targets the separate `agentos` schema) | COMPLETE | All AgentOS objects live in the `agentos` schema (schema-qualified RLS count returns 38 and does not collide with the pre-existing `public.tasks`/`public.workspaces`/`public.runs`); existing-table tenant isolation is the separate `supabase/migrations/add_tenant_id_migration.sql` convention, unmodified by this port |

---

## Companion files

- `docs/agentos/SCHEMA_EXPOSURE.md` — the schema-routing defect found on 2026-10-19, the fix, the tests that guard it, and the project-level step that is left.
- `docs/agentos/DB_VERIFICATION.md` — local + live DB evidence, all 7 migrations, every RPC semantic, tenant isolation, reproduce commands.
- `docs/agentos/LIVE_VERIFICATION.md` — what live work was attempted, real outcomes, blocked prerequisites, deploy + pg_cron runbook, and the `.env`-tracked-in-git security remediation.
- `scripts/agentos-verify-exposure.sh` (`npm run agentos:verify-exposure`) — one-command check (and `--apply` with a management token) for the PostgREST exposure.
- `scripts/agentos-deploy-functions.sh` (`npm run agentos:deploy-functions`) — one-command deployment of the seven AgentOS edge functions.
