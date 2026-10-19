# AgentOS — Schema Exposure & Routing

**Branch:** `kilo/agentos-port-completion` (from `kilo/agentos-master-port`)
**Date of evidence:** 2026-10-19
**Scope:** How the `agentos` schema is reached from the browser and from the
edge functions, the defect that broke it, the fix, and the single remaining
project-level step.

---

## 1. The defect (found and fixed on 2026-10-19)

The port creates every AgentOS object in a dedicated `agentos` schema
(`supabase/migrations/20261012120000…1206000`), and the previous status
document recorded the database layer as fully verified. It was — but only the
**SQL** was verified. Nothing ever checked that the *application* could reach
that schema.

Measured on the live project `bzxohkrxcwodllketcpz`:

| Probe | Result |
|-------|--------|
| `GET /rest/v1/workers` (unqualified) | `404 PGRST205` — "Could not find the table 'public.workers'" |
| `GET /rest/v1/workers` with `Accept-Profile: agentos` | `406 PGRST106` — "Invalid schema: agentos. **Only the following schemas are exposed: public, graphql_public**" |
| `GET /rest/v1/` (the live PostgREST schema cache) | 352 paths / 280 definitions, **0** of them from `agentos` |
| `GET /rest/v1/public.workspaces` | `200` — a legacy `public` table exists, and it is NOT the AgentOS one |
| `GET /rest/v1/agentos/workers` (dotted path) | `404 PGRST205` — PostgREST does not resolve dotted table names |
| `POST /rest/v1/rpc/public.current_clerk_user_id` | `404 PGRST202` — PostgREST prefixes the exposed schema itself |

Every AgentOS query in the port — in the browser services, in the Mission
Control canvas, in the runtime panels and in all seven edge functions — was
written as an **unqualified** `supabase.from("workers")` / `.rpc("enqueue_task")`.
PostgREST resolves those against the exposed schemas, so they could never
reach `agentos.*`.

Two things made this invisible:

1. **The test harness was schema-blind.** `tests/agentos/harness.ts` keyed its
   in-memory tables by table name only, so `supabase.from("workers")` and
   `supabase.schema("agentos").from("workers")` were the same call. 298 tests
   passed against a data path that cannot work on a real project.
2. **The previous verification was database-only.** `scripts/agentos-db-verify.sh`
   proves the SQL is correct. It cannot prove the application points at it.

The failure mode in production is worse than an error: once `agentos` is
exposed, an unqualified read of `tasks` or `workspaces` resolves to the
**public** table of the same name (both exist on this project), so the
dashboard would have shown the wrong rows rather than an error.

## 2. The fix

### 2.1 The application pins the schema

Every AgentOS query now goes through a schema-scoped client.

| Layer | File | What it does |
|-------|------|--------------|
| Browser services | `src/services/agentos/client.ts` | `agentosDb.from(...)` / `agentosDb.rpc(...)` resolve the client with `supabase.schema("agentos")` |
| Browser pages & components | `src/pages/agentos/*`, `src/components/agentos/*` | use `agentosDb` instead of the shared client |
| Edge functions | `supabase/functions/_shared/agentos-client.ts` | `getServiceClient()` and the new `getCallerClient(req)` are created with `db: { schema: 'agentos' }` |

supabase-js sends the schema as the `Accept-Profile` (reads) and
`Content-Profile` (writes/RPC) header, so the resolution is unambiguous no
matter which other schemas the project exposes.

### 2.2 The harness models the real project

`tests/agentos/harness.ts` now has two schema views:

* the **public** client exposes no AgentOS table — a read through it fails
  with `PGRST205`, exactly as the live project does;
* `schema("agentos")` returns the AgentOS client, and any other schema name
  is refused with `PGRST106`, exactly as PostgREST refuses an unexposed schema.

A service that regresses to the shared client now fails its tests.

### 2.3 Contract guards

`tests/agentos/edge-contract.test.ts` gained a "agentos schema routing" block
that fails if:

* an AgentOS source file queries through the unqualified client;
* an AgentOS table is read without the scoped client;
* an edge function builds its own Supabase client instead of taking the
  schema-pinned one from `_shared/agentos-client.ts`.

`tests/agentos/schema-routing.test.ts` (new, 6 tests) pins the behaviour:
the public schema cannot see the AgentOS tables, the `agentos` schema can,
tenant isolation still holds, and an unexposed schema produces an actionable
operator message rather than a bare PostgREST code.

`tests/agentos/schema-contract.test.ts` (new) cross-checks every column the
application references against the migrations — the guard for the second
defect found on 2026-10-19 (`agentos-tools` selected `allowed_app_slugs` as if
it were a column of `agentos.workers`; it is a key inside the `permissions`
jsonb, and the bad select made PostgREST reject the whole query).

### 2.4 The operator sees the cause, not a code

`agentosErrorMessage()` (in `src/services/agentos/client.ts`) turns
`PGRST106` into:

> The "agentos" schema is not exposed to PostgREST, so AgentOS data cannot be
> read. Add it to the project's exposed schemas (Settings → API → Exposed
> schemas, or run `supabase/migrations/20261012120700_agentos_expose_schema.sql`)
> and verify with `scripts/agentos-verify-exposure.sh`.

## 3. The remaining step: expose the schema (project level)

This is the one thing the repository cannot do by itself — it is a **project
setting**, not code. Two equivalent routes:

### Route A — the Dashboard (authoritative)

Settings → API → Exposed schemas → add `agentos` → Save.

### Route B — the Management API / migration (automation)

```bash
# With a management token (Dashboard -> Account -> Access Tokens):
npm run agentos:expose-schema      # scripts/agentos-verify-exposure.sh --apply

# Or over a direct Postgres connection:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20261012120700_agentos_expose_schema.sql
```

The migration appends `agentos` to the `authenticator` role's `pgrst.db_schemas`
(keeping the project's current list, and keeping `public` first so the AgentOS
`tasks`/`workspaces` tables cannot shadow the app's own same-named public
tables) and then issues `NOTIFY pgrst, 'reload config'`.

Rollback:

```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public';
NOTIFY pgrst, 'reload config';
```

### Verify

```bash
npm run agentos:verify-exposure
```

Current result on the live project (before the step is applied):

```
GET /rest/v1/workers  (Accept-Profile: agentos) -> HTTP 406
{"code":"PGRST106","message":"Invalid schema: agentos"}
FAIL: PostgREST refuses the 'agentos' schema.
```

The script exits non-zero until the schema is exposed, and exits 0 once
PostgREST accepts it.

## 4. Order of operations for going live

1. `npm run agentos:verify-exposure` → currently FAIL (this document).
2. Expose the schema (Route A or B) → the script passes.
3. `npm run agentos:deploy-functions` → deploys the seven edge functions
   (needs a **valid** `SUPABASE_ACCESS_TOKEN`; the token in `.env` is rejected
   with HTTP 401 `Invalid access token`).
4. Schedule continuous execution — the `pg_cron` SQL in
   `docs/agentos/LIVE_VERIFICATION.md` §4 (the live project already has
   `pg_cron` and `supabase_vault`).
5. Live browser verification — needs a real `VITE_CLERK_PUBLISHABLE_KEY`; the
   current value is absent, so `ClerkProvider` throws at module load and the
   Playwright suite skips instead of running.

Steps 3–5 are the same external blockers recorded in the previous status
document. Step 2 is the one this pass added, and it is the reason the port
could not work at all in production.
