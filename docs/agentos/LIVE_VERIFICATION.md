# AgentOS — Live Verification & Operator Runbook

**Branch:** `kilo/agentos-master-port`
**Live project:** `bzxohkrxcwodllketcpz` (`https://bzxohkrxcwodllketcpz.supabase.co`)
**Date of evidence:** 2026-10-14

This file records exactly what live work was done, its real outcome, what is
still blocked and why, and the exact operator steps to finish the live path.
**No secret values appear anywhere in this document** — credentials are reported
as present/absent booleans only.

---

## 1. What was actually done live (and the real outcome)

The live project was contacted by **direct Postgres over SSL**, using the
connection string the operator supplied. All seven AgentOS migrations were
applied to the live project and every durable-queue behaviour was then exercised
**on the live database**, not a scratch cluster.

### 1.1 Migrations applied to the live project

All 7, in order, each with `-v ON_ERROR_STOP=1`:

| Migration | Result |
|-----------|--------|
| `20261012120000_agentos_core.sql` | OK |
| `20261012120100_agentos_execution.sql` | OK |
| `20261012120200_agentos_knowledge_connections.sql` | OK |
| `20261012120300_agentos_rls.sql` | OK |
| `20261012120400_agentos_queue_rpc.sql` | OK |
| `20261012120500_agentos_seed_catalog.sql` | OK |
| `20261012120600_agentos_memory_hit.sql` | OK |

The migrations are strictly additive — they create the separate `agentos` schema
and never touch `public.*` (the 277 pre-existing app tables) or `credits.*`. The
only `public.` tokens in the SQL are inside comments. No customer-facing table
was modified.

**Live schema state after applying:**

| Check | SQL | Live result |
|-------|-----|-------------|
| Tables in `agentos` | `SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'` | **24** |
| RLS policies | `SELECT count(*) FROM pg_policies WHERE schemaname='agentos'` | **38** |
| Tables WITHOUT RLS (schema-qualified) | `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='agentos' AND c.relkind='r' AND c.relrowsecurity=false` | **0** |
| Seeded models | `SELECT count(*) FROM agentos.model_catalog` | **7** |
| Seeded integrations | `SELECT count(*) FROM agentos.integrations` | **14** |
| …of which `support='unsupported'` | `SELECT count(*) FROM agentos.integrations WHERE support='unsupported'` | **1** (`openclaw_gateway`) |
| SECURITY DEFINER functions | `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='agentos'` | **19** |
| Available extensions | `SELECT extname FROM pg_extension` | **`pg_cron`, `supabase_vault`** present — both the scheduler and a secret store are available on this project |

### 1.2 Live durable-queue flow

Run on the live DB with the JWT claims GUC set exactly as the Supabase gateway
sets it for a signed-in Clerk caller:

```sql
SELECT set_config('request.jwt.claims', '{"sub":"<clerk id>","role":"authenticated"}', false);
INSERT INTO agentos.workspaces (name) VALUES ('…');
INSERT INTO agentos.workers   (name, role, model_id, instructions) VALUES ('…');
INSERT INTO agentos.tasks (… status 'queued' …)   -- Stage A
INSERT INTO agentos.tasks (… status 'pending' …)  -- Stage B
INSERT INTO agentos.task_edges (task_id, waits_for, kind) VALUES (B, A, 'depends_on');
```

| Phase | Call | Live result |
|-------|------|-------------|
| 1 | Stage B with an unmet dependency | `pending` |
| 2 | `agentos.claim_due_tasks('live-exec', 5, 120)` | returns **Stage A only** — B is excluded by its dependency |
| 3 | Stage A after the claim | `status=running`, **leased** = true, `attempt=1` |
| 4 | `agentos.complete_task(A, '{"stage":"A"}', NULL)` | Stage B → **`queued`** (dependency released) |
| 5 | `agentos.claim_due_tasks('live-exec', 5, 120)` | returns **Stage B** — now claimable |

### 1.3 Live human-approval gate

| Step | Live result |
|------|-------------|
| `agentos.request_approval(task, 'send_email', '{"to":"probe@example.com"}', 'reason', 3600)` | task → `waiting_approval`, `requires_approval=true` |
| `agentos.resolve_approval(<id>, 'rejected', 'live probe rejection')` | task → **`cancelled`**, `error` = the rejection note |

The gate is enforced by the database, and rejecting cancels the task outright —
there is no path back to the queue without an approval.

### 1.4 Live scheduled dispatch

| Step | Live result |
|------|-------------|
| Insert a `agentos.schedules` row with `next_run_at` 1 minute in the past | inserted |
| `SELECT count(*) FROM agentos.dispatch_due_schedules()` | **1** dispatched |
| `SELECT count(*) FROM agentos.tasks WHERE title='Live cron probe'` | **1** task created |

The sweep is idempotent and recomputes `next_run_at` from the cron expression.

### 1.5 Live tenant isolation (through the real `authenticated` role)

Two distinct Clerk identities, using `SET ROLE authenticated` so the real RLS
policies apply rather than superuser bypass:

| Query run as `probe_B` against `probe_A`'s data | Live result |
|-------------------------------------------------|-------------|
| `SELECT count(*) FROM agentos.workers` | **0** |
| `SELECT count(*) FROM agentos.workspaces` | **0** |
| `SELECT count(*) FROM agentos.tasks` | **0** |
| `SELECT count(*) FROM agentos.conversations` | **0** |
| `SELECT count(*) FROM agentos.workers` as `probe_A` (control) | **1** |

`probe_B` sees none of `probe_A`'s rows; the owner retains their own. Tenant
isolation is enforced by the database, live.

**All probe rows were deleted afterwards and the tables were confirmed back to
0 rows — the live database was left clean.**

### 1.6 Still blocked, with the precise prerequisite

| Item | Status (external) | Missing prerequisite |
|------|-------------------|----------------------|
| Expose the `agentos` schema to PostgREST | BLOCKED | The live project exposes `public, graphql_public` only, so an AgentOS read comes back `406 PGRST106` ("Invalid schema: agentos"). Needs the Dashboard toggle (Settings -> API -> Exposed schemas), the Management API (`npm run agentos:expose-schema`), or the SQL migration over a direct connection. Full detail in `docs/agentos/SCHEMA_EXPOSURE.md` |
| Deploy the 7 edge functions | BLOCKED | `SUPABASE_ACCESS_TOKEN` is rejected by the Management API (HTTP 401 `Invalid access token`). Needs a valid token (issue one at https://supabase.com/dashboard/account/tokens); `npm run agentos:deploy-functions` then does the rest. The `supabase` CLI itself is available through `npx supabase@2` (2.109.0) |
| Continuous scheduled execution (pg_cron jobs actually calling the functions) | BLOCKED | Functions must be deployed first. `pg_cron` **is** available on this project, so the jobs can be scheduled the moment the functions exist - §4 has the exact SQL |
| Live execution against a model provider | BLOCKED | Functions deployed AND a valid provider key. `OPENAI_API_KEY` currently returns HTTP 401 `invalid_api_key` |
| Live browser verification with a signed-in user | BLOCKED | A real `VITE_CLERK_PUBLISHABLE_KEY`. The variable is absent from `.env`, and `src/providers/ClerkProvider.tsx` throws at module load without a real one, so no page renders and the E2E suite skips (62 tests) rather than failing |

### 1.7 The schema was never reachable from the application (found 2026-10-19)

The verification above proves the **SQL** is correct. It could not prove that
the **application** points at it - and it did not.

Measured live on 2026-10-19:

| Probe | Result |
|-------|--------|
| `GET /rest/v1/workers` (unqualified) | `404 PGRST205` - "Could not find the table 'public.workers'" |
| `GET /rest/v1/workers` with `Accept-Profile: agentos` | `406 PGRST106` - "Only the following schemas are exposed: public, graphql_public" |
| `GET /rest/v1/` (live PostgREST schema cache) | 352 paths / 280 definitions, **0** from `agentos` |
| `GET /rest/v1/public.workspaces` | `200` - a legacy public table with the same name as an AgentOS table |
| `GET /rest/v1/agentos.workers` (dotted path) | `404 PGRST205` - PostgREST does not resolve dotted table names |
| `POST /rest/v1/rpc/public.current_clerk_user_id` | `404 PGRST202` - PostgREST prefixes the exposed schema itself |

Every AgentOS query was unqualified, so it resolved against `public` and could
never reach `agentos`. The code is now fixed - every browser service, page,
canvas component and all seven edge functions pin the `agentos` schema - and
the test harness now models the public/agentos split so the regression cannot
come back. What remains is the project-level exposure listed in §1.6. Full
account: `docs/agentos/SCHEMA_EXPOSURE.md`.

> **Security remediation (pre-existing).** `.env` is listed in `.gitignore` yet was
> **tracked in git** and contains live keys. **Step 1 is done in this pass:**
> `git rm --cached .env` (committed on `kilo/agentos-port-completion`, 2026-10-19),
> so the file is no longer tracked and the local working copy is untouched.
> Steps 3-5 below — purging it from history and rotating every key — are
> operator actions and remain open. No values are reproduced here.

---

## 2. Environment facts observed (booleans only)

Credential presence in `.env` (no values printed):

| Variable | Present |
|----------|---------|
| `VITE_SUPABASE_URL` | true |
| `VITE_SUPABASE_ANON_KEY` | true |
| `SUPABASE_SERVICE_ROLE_KEY` | true (authenticates to PostgREST) |
| `SUPABASE_ACCESS_TOKEN` | true (but rejected by Management API) |
| `OPENAI_API_KEY` | true |
| `VITE_CLERK_PUBLISHABLE_KEY` | **false** (blocks live browser verification) |
| `DATABASE_URL` (or any Postgres connection string) | **false** (blocks direct `psql`) |

Re-measured on 2026-10-19 (the port-completion pass): the same booleans hold.
`SUPABASE_ACCESS_TOKEN` is still rejected by the Management API (HTTP 401
`Invalid access token`), `VITE_CLERK_PUBLISHABLE_KEY` and `DATABASE_URL` are
still absent, and `OPENAI_API_KEY` still returns HTTP 401 `invalid_api_key`.

CLIs: the `supabase` CLI **is** reachable through `npx supabase@2` (2.109.0,
pinned as a devDependency), so function deployment needs only a valid token -
`npm run agentos:deploy-functions` performs the whole deployment.
`deno` is not installed (edge functions cannot be served locally);
`psql` and a Postgres server are not present in this container.

---

## 3. Operator runbook — deploy the 7 edge functions

`npm run agentos:deploy-functions` does all of this in one command; it needs a
valid management token (`SUPABASE_ACCESS_TOKEN`, currently rejected) and the
project ref. The equivalent manual steps are:

```bash
supabase login                       # authenticate (needs a valid SUPABASE_ACCESS_TOKEN)
supabase link --project-ref bzxohkrxcwodllketcpz

# Deploy all 7 AgentOS edge functions
supabase functions deploy agentos-tasks
supabase functions deploy agentos-execute
supabase functions deploy agentos-sweep
supabase functions deploy agentos-approvals
supabase functions deploy agentos-connections
supabase functions deploy agentos-tools
supabase functions deploy agentos-provider-test
```

Function → responsibility:
- `agentos-tasks` — task insert/enqueue authority (applies `depends_on`, calls `enqueue_task`).
- `agentos-execute` — bounded worker: claims due tasks and runs them (each call is a batch, **not** a long-running worker).
- `agentos-sweep` — `dispatch_due_schedules()` + `recover_stale_runs()`; service-role only.
- `agentos-approvals` — approval gate decision RPC front-end.
- `agentos-connections` — integration account connect (`agentos-connections`).
- `agentos-tools` — tool invocation surface.
- `agentos-provider-test` — BYOK credential readiness probe (returns only a `credential_ref`).

---

## 4. Operator runbook — continuous scheduled execution (pg_cron)

`pg_cron` and `pg_net` are the recommended in-project drivers (no extra
infrastructure). Supabase provisions these extensions under Database → Extensions
(live presence could not be confirmed by query in this session — see §1). Once the
`agentos-sweep` and `agentos-execute` functions are deployed, run this SQL against
the live project to drive continuous execution every minute:

```sql
-- prerequisites (enable once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- sweep: dispatch due schedules + recover stale leases, every minute
SELECT cron.schedule(
  'agentos-sweep',
  '* * * * *',
  $$ SELECT net.http_post(
       url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/agentos-sweep',
       headers := jsonb_build_object(
                    'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
                    'Content-Type',  'application/json'),
       body    := '{}'::jsonb)$$
);

-- execute: claim and run a bounded batch of due tasks, every minute
SELECT cron.schedule(
  'agentos-execute',
  '* * * * *',
  $$ SELECT net.http_post(
       url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/agentos-execute',
       headers := jsonb_build_object(
                    'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
                    'Content-Type',  'application/json'),
       body    := jsonb_build_object('limit', 5))$$
);
```

This exact pattern is documented in the source at
`supabase/functions/agentos-sweep/index.ts:20-29` and
`supabase/functions/agentos-execute/index.ts:18-27`. Both endpoints are
service-role-only (they verify the `service_role` JWT; there is no browser
caller). **`<PROJECT_REF>` = `bzxohkrxcwodllketcpz`; `<SERVICE_ROLE_KEY>` is your
service-role secret — do not commit it.**

To verify / remove:
```sql
SELECT * FROM cron.job;
SELECT cron.unschedule('agentos-sweep');
SELECT cron.unschedule('agentos-execute');
```

### Netlify Functions are never used for execution

Execution runs on Supabase Edge Functions driven by pg_cron (or an explicitly
provisioned worker). Netlify only hosts the **front-end** and runs the
**release gate** (lint/test/tsc/build) before a deploy. No AgentOS task is ever
executed by a Netlify Function — stated explicitly in
`supabase/functions/agentos-execute/index.ts:6-9`.

---

## 5. Live browser verification

The Playwright suite `tests/e2e-agentos.spec.ts` (via
`playwright.agentos.config.ts`) collects **62 tests** (`npx playwright test
--config=playwright.agentos.config.ts --list` → `Total: 62 tests in 1 file`),
covering route rendering across desktop/tablet/mobile viewports, one-`<h1>`
accessibility checks, and the auth guard. It was **not executed** here: the app
cannot boot without a real `VITE_CLERK_PUBLISHABLE_KEY`, so the browser run would
skip/abort. To run it:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... npx playwright test --config=playwright.agentos.config.ts
```

---

## 6. Security remediation required (FINDING)

**Finding:** `.env` is listed in `.gitignore` (line 2) **yet is tracked in git**
(`git ls-files --error-unmatch .env` → tracked) and contains live keys
(`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `STRIPE_WEBHOOK_SECRET`,
`SUPABASE_ACCESS_TOKEN`, and others). Because the file is committed, every key in
it must be treated as compromised — gitignore does not untrack an already-tracked
file, and the values are present in the repository history. Values are deliberately
not reproduced here.

Remediation steps:

```bash
# 1. Stop tracking .env while keeping the local working copy
git rm --cached .env

# 2. Confirm it is now ignored and untracked
git status --short       # .env should no longer appear as tracked
git check-ignore .env    # prints .env (matches .gitignore line 2)

# 3. Purge it from history (rewrites history — coordinate with the team)
git filter-repo --path .env --invert-paths
#   or, without filter-repo:
git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env' -- --all

# 4. ROTATE every credential that was in .env (assume compromise):
#    - SUPABASE_SERVICE_ROLE_KEY   (Supabase dashboard → API → rotate service_role key)
#    - SUPABASE_ACCESS_TOKEN       (Supabase account → access tokens → revoke + reissue)
#    - OPENAI_API_KEY             (OpenAI dashboard → API keys → revoke + reissue)
#    - STRIPE_WEBHOOK_SECRET       (Stripe Dashboard → Developers → Webhooks → roll secret)
#    - ZEP_API_KEY / GEMINI_API_KEY / PAYPAL_WEBHOOK_ID (rotate if real)

# 5. Commit the untracking (and force-push if you rewrote history)
git commit -m "chore: stop tracking .env (remove committed secrets)"
```

Until step 1 is done and history is purged, keep the live `SUPABASE_ACCESS_TOKEN`
out of `.env`; supply it at runtime when deploying functions so no Supabase
management credential is committed.
