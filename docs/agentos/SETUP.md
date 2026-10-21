# AgentOS — Setup Runbook

**Branch:** `kilo/agentos-port-completion`  ·  **Project:** `bzxohkrxcwodllketcpz`

The port is complete in the repository. This is the ordered list that brings
it up in an environment, so it never has to be worked out again.

Every step is idempotent and every step verifies itself.

---

## Where the port stands (2026-10-21)

**LIVE and verified on `bzxohkrxcwodllketcpz`:**

| | |
|---|---|
| The 14 migrations | applied, and recorded in `supabase_migrations.schema_migrations` |
| The schema exposure | `GET /rest/v1/workers` with `Accept-Profile: agentos` → **HTTP 200** |
| The security lockdown | no SECURITY DEFINER function is executable by PUBLIC; the task UPDATE is column-level; the DELETE is revoked |
| The browser's data path | `authenticated` has USAGE on the schema and the table grants; `anon` has none |
| The scheduler | `pg_net` installed, the vault seeded, `agentos-sweep` and `agentos-execute` registered with pg_cron and **active** (plus a `agentos-net-cleanup` job that trims the pg_net response table) |
| The live behaviour | `npm run agentos:db-verify-live` → **24 checks, 0 failures** |
| The functions' types | `npm run agentos:check-functions` → all 7 type-check under Deno |
| The app | boots in a browser on every route; the Clerk key is the one the deployed site ships with |

**DEPLOYED AND RUNNING (2026-10-21):**

| | Evidence |
|---|---|
| The 7 edge functions | deployed; the scheduler calls both every minute and gets `200` with real payloads |
| The scheduler | `agentos-sweep` and `agentos-execute` in `cron.job`, **active**; a live task was claimed, run, and its events written |
| The service credential | verified by the platform (the new secret key and the legacy service-role JWT both work) — a substring test had been rejecting the scheduler's own calls |
| The model key | read from the environment **or** the vault (`openai_api_key`); the Management API refuses to write function secrets with some tokens, so the vault is the reliable place |

**Still to do — each needs one credential:**

| | Needs | Then |
|---|---|---|
| Run the model | a **working** `OPENAI_API_KEY` (the current one answers `401 invalid_api_key`) | put it in the vault: `SELECT vault.create_secret('sk-…', 'openai_api_key', 'the model key')`, or set the function secret |
| Sign in locally | `http://localhost:8080` added to the Clerk instance's allowed origins | the Clerk dashboard → Allowed origins |
| Publish to videoremix.vip | the port branch on the branch Netlify builds | the Netlify UI triggers the build, which runs the release gate |

The `sb_secret_…` key does **not** work with the Management API (it answers
`401 JWT could not be decoded`), so the deployment needs a personal access
token, not the project's secret key.

---

## 0. What you need

| What | Where it comes from | Used for |
|------|--------------------|----------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase → Project → API | the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project → API | the edge functions, the scheduler |
| `SUPABASE_ACCESS_TOKEN` (management token, `sbp_…`) | https://supabase.com/dashboard/account/tokens | deploying the functions, exposing the schema |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys | signing a user in (the app will not boot without it) |
| `OPENAI_API_KEY` | OpenAI | the model provider |

Copy `.env.example` to `.env` and fill them in. `.env` is **not** tracked.

## 1. The database — 14 migrations

```bash
npm run supabase:link        # writes the project id into supabase/config.toml
npm run supabase:db-push     # applies every migration in supabase/migrations
```

Or verify the whole database layer on a scratch cluster first (it creates its
own database and never touches the project):

```bash
npm run agentos:db-verify    # 92 checks: structure, privileges, queue, isolation
```

The migrations are additive. They create the `agentos` schema and touch
nothing the app already had.

## 2. Expose the schema to PostgREST

The AgentOS objects live in the `agentos` schema; PostgREST only serves the
schemas a project exposes, and this project exposes `public, graphql_public`.

```bash
npm run agentos:verify-exposure   # check only — exits non-zero until it passes
npm run agentos:expose-schema     # apply it with the management token
```

Equivalent, without a token: Dashboard → Project → Settings → API → Exposed
schemas → add `agentos`. Or apply
`supabase/migrations/20261012120700_agentos_expose_schema.sql` over a direct
Postgres connection.

## 3. The edge functions

```bash
npm run agentos:secrets          # OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run agentos:deploy-functions # links, applies the migrations, deploys all 7
```

The seven functions: `agentos-tasks`, `agentos-execute`, `agentos-sweep`,
`agentos-approvals`, `agentos-connections`, `agentos-tools`,
`agentos-provider-test`.

## 4. The scheduler

The sweep and the executor are scheduled by
`supabase/migrations/20261012121300_agentos_writers.sql`. It reads the project
URL and the service key from the vault at run time, so the two secrets have
to be there:

```bash
psql "$DATABASE_URL" -c "SELECT vault.create_secret('https://bzxohkrxcwodllketcpz.supabase.co', 'project_url');"
psql "$DATABASE_URL" -c "SELECT vault.create_secret('$SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');"
psql "$DATABASE_URL" -c "SELECT agentos.register_scheduler_jobs();"
```

Without the vault the cron jobs are created **disabled** — the migration says
so with a NOTICE rather than failing.

Verify with `SELECT jobname, active FROM cron.job WHERE jobname LIKE 'agentos%';`

## 5. The browser

```bash
npm run dev        # http://localhost:8080
```

The AgentOS section is at `/agentos` (the mission-control canvas) and is
linked from the app header.

## 6. The tests

```bash
npm run agentos:e2e   # Playwright, needs a signed-in session
npm run test          # the whole suite
npm run release:gate  # lint, tests, catalog, security, types, build
```

The Playwright suite skips (rather than fails) when the app cannot boot —
which is what happens without a real `VITE_CLERK_PUBLISHABLE_KEY`.

---

## What the port does

| Surface | What it is |
|---------|-----------|
| `/agentos` | the mission-control canvas: workers, missions, models and the live runtime, as a graph |
| `/agentos/workforce` | the workers: identity, model, tools, permissions, knowledge, heartbeat |
| `/agentos/workspaces` | workspaces and their members |
| `/agentos/missions` | missions and their tasks; a mission can belong to a workspace |
| `/agentos/schedules` | cron schedules that create real tasks |
| `/agentos/approvals` | the human gate: approve releases the task, reject cancels it |
| `/agentos/operations` | the queue, the runs, the usage and the credits |
| `/agentos/models` | the model catalog and the provider configuration |
| `/agentos/connections` | the integration directory and the connected accounts |
| `/agentos/memory` | what the workers remember |
| `/agentos/artifacts` | what the workers produced |
| `/agentos/activity` | the audit trail and the execution event stream |
| the worker page | the worker's conversations: ask it something, it answers through the queue |

## The invariants the port holds

- **Tenant isolation.** Every row is owned by a Clerk user, stamped by a
  trigger, and every read and write goes through an RLS policy. The database
  verification proves a second tenant sees nothing.
- **The queue owns the lifecycle.** A browser may not set a task's status,
  lease or attempt: `agentos.tasks` grants the browser an UPDATE on five
  metadata columns and nothing else. The queue RPCs are the only path, and
  they are not executable by a browser.
- **No privileged secret in the browser.** A BYOK credential is stored as a
  reference, never as a secret; the platform key lives in the edge functions.
- **Every error is honest.** The pages say what failed and what to do; the
  service layer keeps the server's error codes so the UI can tell "you may
  not do this" from "try again".
