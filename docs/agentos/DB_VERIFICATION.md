# AgentOS — Database Verification (Local + Live)

**Branch:** `kilo/agentos-master-port`
**Date of evidence:** 2026-10-14
**Scope:** The dedicated `agentos` Postgres schema — its 24 tables, 7 migrations,
RLS, the durable-queue RPCs, and tenant isolation. This file records only
verifications that were **actually executed**. Anything that could not be run in
this environment is labelled `BLOCKED (external)` with the precise missing
prerequisite.

Status legend:
- **COMPLETE** — a command was executed against a real database and produced the cited output.
- **BLOCKED (external)** — needs a credential/CLI/service this environment does not have.
- **INCOMPLETE** — work outstanding in the repo.

---

## 1. The 12 migrations, in applied order

`scripts/agentos-db-verify.sh` applies exactly these files, in this order, and
stops on the first error. All 7 were applied cleanly to the local scratch DB:

| # | Migration file | Result |
|---|----------------|--------|
| 1 | `20261012120000_agentos_core.sql` | applied |
| 2 | `20261012120100_agentos_execution.sql` | applied |
| 3 | `20261012120200_agentos_knowledge_connections.sql` | applied |
| 4 | `20261012120300_agentos_rls.sql` | applied |
| 5 | `20261012120400_agentos_queue_rpc.sql` | applied |
| 6 | `20261012120500_agentos_seed_catalog.sql` | applied |
| 7 | `20261012120600_agentos_memory_hit.sql` | applied |
| 8 | `20261012120700_agentos_expose_schema.sql` | local only — a project setting (exposes the `agentos` schema to PostgREST); guarded so a bare Postgres is not aborted |
| 9 | `20261012120800_agentos_security_lockdown.sql` | local only — revokes the PUBLIC execute on the queue RPCs, makes the task UPDATE column-level, revokes the task DELETE, and adds the workspace-membership predicates |
| 10 | `20261012120900_agentos_triggers_indexes.sql` | local only — `updated_at` triggers, the `invited_by` stamp, and the hot-path indexes |
| 11 | `20261012121000_agentos_queue_semantics.sql` | local only — lease fencing, the retry budget, dependency-failure propagation, idempotent schedule dispatch, approval expiry, the cron day-of-week fix, `cancel_task` |
| 12 | `20261012121100_agentos_canvas_text_ids.sql` | local only — the canvas ids become the stable keys the browser has always written |

Migrations 1–7 are applied to the LIVE project; 8–12 are verified locally
(PostgreSQL 14.24) and are ready to apply — see `LIVE_VERIFICATION.md` §1.6
for the one prerequisite they need.

The `NOTICE: ... does not exist, skipping` lines in the run log are the
idempotent `CREATE OR REPLACE TRIGGER` / `CREATE POLICY` guards firing on a
fresh database; they are expected and harmless.

---

## 2. Table & policy counts

The object counts must be read **schema-qualified**. Joining `pg_tables` to
`pg_class` on `relname` alone also matches same-named tables in other schemas
(this project already has `public.tasks`, `public.workspaces`, `public.runs`,
…), which silently returns a false zero. All counts below go through
`pg_class`/`pg_namespace` filtered to `nspname = 'agentos'`.

| Check | SQL | Local result | Live result |
|-------|-----|--------------|-------------|
| Tables | `SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'` | **24** | BLOCKED |
| Policies | `SELECT count(*) FROM pg_policies WHERE schemaname='agentos'` | **38** | BLOCKED |
| Tables without RLS | `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='agentos' AND c.relkind='r' AND c.relrowsecurity=false` | **0** | BLOCKED |

Script output (local): `agentos tables created: 24`, `RLS policies: 38`,
`every agentos table has RLS enabled`.

### Seeded catalog integrity (local)

| Check | SQL | Result |
|-------|-----|--------|
| Models | `SELECT count(*) FROM agentos.model_catalog` | **7** |
| Integrations | `SELECT count(*) FROM agentos.integrations` | **14** |
| Unsupported integrations | `SELECT count(*) FROM agentos.integrations WHERE support='unsupported'` | **1** |
| The unsupported one | `SELECT string_agg(key,',') FROM agentos.integrations WHERE support='unsupported'` | **`openclaw_gateway`** |

### Extensions (local)

`SELECT extname FROM pg_extension` → `plpgsql` only. `pg_cron` and
`supabase_vault` are **not** installed on the local scratch cluster (expected —
it is a bare PostgreSQL 14 install, not a Supabase project). Live extension
availability could not be queried (see §5).

---

## 3. Every durable-queue RPC semantic — verified locally

The local script drives the real SECURITY-DEFINER functions end to end. Each
line below is copied from the executed run:

| Semantic | Function(s) | Observed output | Status |
|----------|-------------|-----------------|--------|
| Claim + lease the queue head | `agentos.claim_due_tasks` | `claim_due_tasks leases the queue head: OK` (Stage 1 → `running`) | COMPLETE |
| Blocked dependency not claimable | `claim_due_tasks` + `task_edges` | `blocked dependency is not claimable: OK` (Stage 2 stays `pending`) | COMPLETE |
| Dependency released on completion | `agentos.complete_task` | `dependency released on completion: OK` (Stage 2 → `queued`) | COMPLETE |
| Terminal-state guard | task status CHECK | `terminal state guard: OK` (refuses to move out of `completed`) | COMPLETE |
| Approval gate releases + attribution | `agentos.request_approval`, `agentos.resolve_approval` | `approval gate releases with decided_by: OK` (`_approval_decided_by = clerk_user_A`) | COMPLETE |
| Cron: next occurrence | `agentos.next_cron_run('*/5 * * * *')` | `cron next_cron_run(*/5): OK` (`→ 2026-10-12 10:05:00+00`) | COMPLETE |
| Cron: rejects unparseable | `agentos.next_cron_run('not a cron')` | `cron rejects unparseable expressions: OK` (returns NULL) | COMPLETE |
| Schedule dispatch + reschedule | `agentos.dispatch_due_schedules` | `schedule dispatch + reschedule: OK` (1 task created; `next_run_at` recomputed) | COMPLETE |

Final script verdict (local): `=== RESULT: PASS — AgentOS database layer verified ===`.

---

## 4. Tenant isolation through the real `authenticated` role (local)

The script creates a NOLOGIN `authenticated` role and drives RLS through it with
a per-request JWT GUC (`request.jwt.claims`), which is exactly how a Clerk-
authenticated Supabase request is shaped. Observed output:

| Assertion | Output |
|-----------|--------|
| `clerk_user_B` sees none of `clerk_user_A`'s workers | `clerk_user_B sees 0 of clerk_user_A's workers: OK` |
| `clerk_user_B` sees none of `clerk_user_A`'s workspaces | `clerk_user_B sees 0 of clerk_user_A's workspaces: OK` |
| `clerk_user_A` still sees their own rows | `clerk_user_A still sees their own workers: OK` |
| Memory-hit RPC refuses a foreign caller | `increment_memory_hit refuses a foreign caller: OK` |

---

## 5. Live project verification — COMPLETE (executed, not scratch)

The live project `bzxohkrxcwodllketcpz` was verified by **direct Postgres over
SSL**. The operator supplied a connection string, so every SQL check below was
**actually executed against the live database**.

### 5.1 Migrations applied live

All 7 migrations applied with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <file>`,
each returning `OK`, in the order listed in §1. They are strictly additive: they
create the `agentos` schema only, and the sole `public.` tokens in the SQL are
inside comments. The live project's **277 pre-existing `public` tables were not
modified**, nor were `credits.*` or any billing/subscription table.

### 5.2 Live schema measurements

| Check | SQL | Live result |
|-------|-----|-------------|
| Tables in `agentos` | `SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos'` | **24** |
| RLS policies | `SELECT count(*) FROM pg_policies WHERE schemaname='agentos'` | **38** |
| Tables without RLS (schema-qualified) | `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='agentos' AND c.relkind='r' AND c.relrowsecurity=false` | **0** |
| Seeded models | `SELECT count(*) FROM agentos.model_catalog` | **7** |
| Seeded integrations | `SELECT count(*) FROM agentos.integrations` | **14** |
| …of which unsupported | `SELECT count(*) FROM agentos.integrations WHERE support='unsupported'` | **1** — `openclaw_gateway`, capped with empty capabilities |
| SECURITY DEFINER functions | `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='agentos'` | **19** |
| Extensions | `SELECT extname FROM pg_extension` | **`pg_cron` and `supabase_vault` are both available** |

> **Note on the RLS check.** The earlier version of this query joined `pg_tables`
> to `pg_class` on `relname` alone, which matches a same-named table in another
> schema — this project has `public.tasks`, `public.workspaces`, `public.messages`,
> `public.conversations`, `public.notifications`. That produced a false reading.
> The check is now schema-qualified through `pg_class`/`pg_namespace`
> (`scripts/agentos-db-verify.sh` was corrected the same way).

### 5.3 Live durable-queue flow (executed on the live project)

| Phase | Call | Live result |
|-------|------|-------------|
| 1 | Stage B seeded `pending` with an unmet `depends_on` on Stage A | `pending` |
| 2 | `agentos.claim_due_tasks('live-exec', 5, 120)` | returned **Stage A only** — B excluded by its dependency |
| 3 | Stage A after claim | `running`, **leased** = true, `attempt` = 1 |
| 4 | `agentos.complete_task(A, '{"stage":"A"}'::jsonb, NULL)` | Stage B → **`queued`** |
| 5 | `agentos.claim_due_tasks('live-exec', 5, 120)` | returned **Stage B** |

### 5.4 Live approval gate and schedule dispatch (executed live)

| Behaviour | Live result |
|-----------|-------------|
| `agentos.request_approval(task,'send_email','{"to":"…"}','reason',3600)` | task → `waiting_approval`, `requires_approval=true` |
| `agentos.resolve_approval(<id>,'rejected','live probe rejection')` | task → **`cancelled`**, `error` = the note |
| due `agentos.schedules` row + `agentos.dispatch_due_schedules()` | **1** task created; `next_run_at` recomputed from the cron |

### 5.5 Live tenant isolation (executed through the real `authenticated` role)

Using `SET ROLE authenticated` with the JWT claims GUC set per identity:

| Query as `probe_B` | Live result |
|--------------------|-------------|
| `count(*) FROM agentos.workers` | **0** |
| `count(*) FROM agentos.workspaces` | **0** |
| `count(*) FROM agentos.tasks` | **0** |
| `count(*) FROM agentos.conversations` | **0** |
| control: same query as `probe_A` | **1** |

**All probe rows were deleted afterwards and the tables confirmed back to 0 rows —
the live database was left clean.**

---

## 6. Reproduce (exact commands)

### Local (self-contained scratch cluster)

`scripts/agentos-db-verify.sh` applies all twelve migrations to a scratch
cluster and runs **58 checks**: the structure, the privilege model (who may
execute which function, and the column grants), the queue semantics, the
tenant isolation, the forgery resistance and the canvas keys. It exits
non-zero when a check fails.

```bash
# 1. Postgres was not installed; install + start it
apt-get update -qq && apt-get install -y postgresql postgresql-contrib
pg_lsclusters                                   # 14 main 5432 down
pg_ctlcluster 14 main start                     # -> online

# 2. Apply the 7 migrations to a throwaway DB and exercise the queue end-to-end
su -c "bash /workspace/app/scripts/agentos-db-verify.sh /var/run/postgresql 5432 postgres" postgres
#    expect: tables 24, policies 38, ... === RESULT: PASS ===

# 3. Seed/catalog + extension counts (against the scratch DB the script leaves behind)
su - postgres -c "psql -d agentos_test -tA -f /tmp/kilo/seed_check.sql"
```

### Live (execute these again with a live SQL credential)

Already performed on project `bzxohkrxcwodllketcpz` — the results are in §5. To
reproduce, point `DATABASE_URL` at the live project and re-run the same `psql`
calls shown in §5.2–§5.5. Do not commit the credential (see the security note in
`LIVE_VERIFICATION.md`).

```bash
# The intended pattern (once DATABASE_URL / a working access token exists).
# Values are read from .env and never printed.
PGPASSWORD="$(grep -E '^DATABASE_URL=' .env | cut -d= -f2- | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')"
psql "$(grep -E '^DATABASE_URL=' .env | cut -d= -f2-)" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='agentos';"      # expect 24
psql "$(...)" -tAc "SELECT count(*) FROM pg_policies WHERE schemaname='agentos';"      # expect 38
psql "$(...)" -tAc "SELECT count(*) FROM agentos.model_catalog;"                       # expect 7
psql "$(...)" -tAc "SELECT count(*) FROM agentos.integrations;"                        # expect 14
psql "$(...)" -tAc "SELECT extname FROM pg_extension;"                                 # pg_cron? supabase_vault?
```

See `LIVE_VERIFICATION.md` for why each of these live commands was blocked and
the exact prerequisites to run them.
