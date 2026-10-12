# Database & Clerk Migration Report

**Branch:** `kilo/pr19-completion`
**Owner:** Subagent 1 — DB and Clerk migration
**Date:** 2026-10-11
**Status:** All deliverables are files only. **No migration was applied to any database.** No credentials appear in any file, script, log, or this report (project refs redacted as `<prod-ref>`).

---

## 1. Audit of `20261011120000_clerk_credit_system_alignment.sql`

### 1.1 What the original file got right (verified line-by-line)

| Requirement | Verdict | Evidence |
|---|---|---|
| Re-key `credits.credit_balances` / `credit_transactions` from `auth.users` UUID to text Clerk subs | Correct | FK dropped first, `ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`, PK `(user_id, app_id)` preserved, indexes preserved |
| Add Clerk-sub RLS policies | Correct | `user_id = (SELECT auth.jwt() ->> 'sub')` for `authenticated` SELECT; service_role keeps FOR ALL |
| Revoke PUBLIC execute on `credits.add_credits` / `credits.deduct_credits`, grant service_role only | Correct | Old UUID signatures dropped (required: `CREATE OR REPLACE` with changed types would create an overload, not a replace), then REVOKE from PUBLIC/anon/authenticated + GRANT service_role |
| Preserve historical balances | Correct by omission | No DELETE/UPDATE anywhere; legacy values survive as text |
| Transaction safety | Correct | Single `BEGIN; … COMMIT;`; any failure rolls the whole file back (DDL is transactional in PostgreSQL) |
| Re-key `ai_app_usage` + usage RPCs | Partially correct | See gaps G2/G4 |

### 1.2 Gaps found (and fixed in the revision)

- **G1 — Policy-drop list was not exhaustive → migration could abort mid-flight.** The original dropped only two known policy names per table before `ALTER COLUMN TYPE`. PostgreSQL refuses the type change if *any* policy references the column, and the deployed database carries policies created outside this repo (the project has a long history of ad-hoc policy migrations). **Fix:** added a catalog-driven `DO` block (`pg_policy` join) that drops every policy on the three re-keyed tables before the type change; the canonical set is recreated after.
- **G2 — `get_ai_app_usage` / `get_ai_app_remaining_runs` stayed PUBLIC-executable after being re-created** (default `EXECUTE` to PUBLIC applies to `CREATE OR REPLACE`). Both accept a user id and are `SECURITY DEFINER`, so any caller could read any user's usage — inconsistent with the file's own lockdown intent. `get_ai_app_remaining_runs` is genuinely called from the client (`src/pages/AIAppRunnerPage.tsx:60`). **Fix:** both functions now derive the effective id as `CASE WHEN auth.role() = 'service_role' THEN param ELSE auth.jwt() ->> 'sub' END` (caller can only ever read their own rows); `REVOKE ALL … FROM PUBLIC` then `GRANT EXECUTE … TO authenticated, service_role`. Param name `user_uuid` kept for client compatibility.
- **G3 — Client credit reads were never granted privileges.** No migration in the repo runs `GRANT USAGE ON SCHEMA credits` or grants SELECT on the credits tables, yet `src/pages/CreditsPage.tsx:78,84` and `src/components/credit/CreditBalanceDisplay.tsx:32` read `credit_balances` / `credit_transactions` directly with the Clerk-sub filter. Post-migration these reads would fail on privileges (or silently return nothing), not on RLS. **Fix:** added `GRANT USAGE ON SCHEMA credits TO anon, authenticated` + SELECT grants on `credit_products` (anon+authenticated), `credit_balances`, `credit_transactions` (authenticated).
- **G4 — `ai_app_usage`'s `ON DELETE CASCADE` from `auth.users` disappears with the FK drop** — unavoidable (Clerk subs have no `auth.users` row), now documented in the file.
- **G5 — No identity/backfill infrastructure for stranded legacy rows.** By design the file preserves legacy UUID-keyed rows as text, but nothing mapped, reported, or bounded them. **Fix:** the new identity migration (§3) + `scripts/migration-reconcile.mjs` (reports every stranded row; none are ever deleted).
- **Idempotency (re-verified after fixes):** `DROP … IF EXISTS` precedes every drop; the new DO block makes policy drops exhaustive; `ALTER COLUMN TYPE TEXT USING user_id::TEXT` is a no-op on re-run; `CREATE OR REPLACE FUNCTION` + REVOKE/GRANT are naturally idempotent. Safe to apply twice.
- **Note on immutability:** the file had never been applied anywhere (verified per the mission context), so revising it in place is safe. If it is ever found applied, further edits must go into a new timestamped migration instead.

### 1.3 What happens to existing UUID rows that cannot be mapped

They are preserved verbatim as text (`'<uuid>'`), keep their balances, and are simply unreachable by Clerk users until an *audited* mapping exists. They are never deleted and never re-keyed by guesswork. The reconciliation script classifies every `user_id` as `clerk_sub` / `legacy_uuid` / `null` / `other`, sums balances per class, and lists the affected purchases for human review.

---

## 2. Code-verified schema evidence

Sources: `supabase/migrations/20260924000000…20261011160000`, `supabase_schema.sql` (pg_dump of `public`), edge-function code, `src/` consumers.

| Object | Code-verified shape / behavior |
|---|---|
| `credits.credit_balances` | `user_id UUID NOT NULL REFERENCES auth.users(id)`, `app_id TEXT NOT NULL`, `balance_credits` / `total_purchased_credits` / `total_spent_credits` (all `CHECK >= 0`), PK `(user_id, app_id)` (migration `20260924000000`) |
| `credits.credit_transactions` | `id UUID PK`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `app_id`, `amount_credits` (neg = debit), `balance_after_credits CHECK >= 0`, `type CHECK IN ('purchase','api_usage','refund','bonus','adjustment')`, `source`, `source_id`, `metadata JSONB`, `created_at` |
| credits RLS (pre-migration) | own-row SELECT via `user_id = auth.uid()` (dead under Clerk); service_role ALL; **no schema/table grants exist anywhere in the repo** |
| credit RPCs (pre-migration) | `credits.add_credits(p_user_id UUID, …)` / `credits.deduct_credits(…)`, `SECURITY DEFINER`, default PUBLIC execute (the F5 credit-forgery finding) |
| `public.ai_app_usage` | `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `app_slug`, `tokens_used`, `run_timestamp`; **RLS never enabled**; `record_ai_app_run(UUID,…)`, `get_ai_app_usage(UUID)`, `get_ai_app_remaining_runs(UUID,INT)` all SECURITY DEFINER, PUBLIC-executable |
| `public.app_users` | The real Clerk mapping table: `id`, `clerk_user_id`, `email`, `first_name`, `last_name`, `image_url` (+ `updated_at`). **No migration in the repo creates it** — it was created out-of-band; `20260709050000` adds `idx_app_users_clerk_user_id` unique index + RLS (`id = auth.jwt() ->> 'sub'` for SELECT/UPDATE, super-admin ALL). Written by (a) `clerk-webhook/index.ts` on svix-verified events (service_role; sets `id = clerk_user_id = <clerk sub>`) and (b) `src/context/AuthContext.tsx` client upsert — **whose RLS lets a user UPDATE their own row, including `email`** |
| `public.purchases` | `user_id UUID NULL`, `email NOT NULL`, `platform CHECK IN ('paykickstart','stripe','zaxxa')`, `platform_transaction_id`, `product_id`, `product_name`, `product_sku`, `amount`, `currency`, **`status CHECK IN ('completed','pending','refunded','failed')`**, `is_subscription`, `purchase_date`, `webhook_data`, `processed`, `processed_at`; **UNIQUE (platform, platform_transaction_id)** |
| `public.user_app_access` | `user_id UUID NOT NULL`, `app_slug`, `purchase_id`, `access_type CHECK IN ('subscription','lifetime','trial')`, `granted_at`, `expires_at`, `is_active` |
| `public.subscription_status` | `user_id`, `purchase_id`, `platform CHECK`, `platform_subscription_id`, `status CHECK IN ('active','cancelled','expired','payment_failed')`, period columns |
| Clerk re-keying already in repo | Phase 1 (`20260709020000`) re-keyed `public.user_roles` to TEXT and rewrote `is_super_admin()` to the Clerk `sub`. Phase 2 (`20260709030000`, 1898 lines) drops all `user_id` FKs in `public`, ALTERs `purchases` / `user_app_access` / `subscription_status` / `admin_profiles` / `stripe_entitlements` / … `user_id` to TEXT, then `UPDATE`s rows through a **~1,800-row hardcoded `_uuid_clerk_map` TEMP table** |
| Identity in edge functions | `run-ai-app` derives identity only from the verified Clerk JWT (`ctx.jwtClaims.sub`); `proxy-openai` from the verified bearer token; `create-credit-checkout` passes the client's Clerk id into Stripe `metadata.userId`; `webhook-stripe` credits `credit_balances` from `metadata.userId` — i.e. **the deployed functions already bill with Clerk text subs**, which is why the alignment migration is a hard prerequisite |
| Client identity | `src/utils/supabase.ts` sends the Clerk session token as the Supabase bearer token (native Clerk↔Supabase), so `auth.jwt() ->> 'sub'` **is** the Clerk user id; `src/services/purchaseService.ts` queries `user_app_access` / `purchases` with `user.id` (Clerk sub) |

**Critical warning about phase 2's `_uuid_clerk_map`:** the UUID→Clerk associations are hardcoded in a migration file with no verifiable provenance inside the repo (no source data, no verification log). Per the mission rules these associations are **not** trusted. My backfill path only maps identities through the Clerk Backend API (`scripts/migration-verify-identities.mjs`); phase 2 remains a separate, human-approved apply decision for the coordinator.

---

## 3. Approved identity architecture

**Decision:** Clerk is the customer IdP; Supabase is the system of record; every money/entitlement row is keyed by the **Clerk sub (text)**; identity resolution goes through a **verified, server-side identity table**. No temporary Supabase-auth customers are ever created.

```
Clerk (IdP) ──svix verified event──▶ clerk-webhook ──▶ public.clerk_identities (identity_verified = TRUE)
     │                                     (service_role only; RLS blocks authenticated writes)
     │
     └── Backend API reconciliation ─────▶ scripts/migration-verify-identities.mjs ──▶ clerk_identities (verified = TRUE)

purchaseProcessor (edge) ──resolveVerifiedIdentity(email)──▶ clerk sub ──▶ purchases / user_app_access / subscription_status
                                   │
                                   └── unverified ──▶ purchase recorded status='pending', user_id=NULL, NO grant (fail closed)
```

**Why a new table instead of reusing `app_users`:** `app_users` is written by a client-side upsert whose RLS permits a user to update their own row *including the email* — trusting its email for money decisions would let a signed-in user retarget purchases by editing their profile. `clerk_identities` rows can only come from service-role paths with verified provenance.

### 3.1 New migration: `supabase/migrations/20261011160000_clerk_identity_table.sql`

Creates `public.clerk_identities`:

- `clerk_user_id TEXT PRIMARY KEY` — Clerk sub, non-empty (CHECK)
- `app_user_id TEXT NULL` — linkage to `app_users.id`; **FK added only when `app_users` exists and actually has a unique index on `id`** (guarded `DO` block with `to_regclass`, because `app_users` is created outside this repo's migrations and its constraints are not certain from code), `ON DELETE SET NULL` so losing the app_users row never loses the verified identity
- `email TEXT NOT NULL`, CHECK `email = lower(email)`; index on `lower(email)` for case-insensitive resolution
- `email_verified BOOLEAN`, `identity_verified BOOLEAN` — TRUE only via verified provenance
- `verification_source TEXT` CHECK IN (`clerk_webhook`, `clerk_api_reconciliation`, `app_users_backfill`, `manual_admin_review`), `verified_at`, `created_at`, `updated_at`
- RLS: `authenticated` may SELECT only their own row (`clerk_user_id = auth.jwt() ->> 'sub'`); service_role FOR ALL; **no authenticated INSERT/UPDATE/DELETE policies**
- Backfill seeds **UNVERIFIED placeholders** from `app_users` (`identity_verified = FALSE`, source `app_users_backfill`) — safe because unverified rows grant nothing; guarded by `to_regclass` so the migration runs on databases without `app_users`

### 3.2 Backfill strategy (safe for unmapped legacy rows)

1. Migration seeds placeholders (`identity_verified = FALSE`) — grants nothing.
2. `scripts/migration-verify-identities.mjs` (env-only, dry-run default) lists all Clerk users, and flips an identity to verified **only** when the Clerk Backend API confirms a user with that email and that email is `verified` in Clerk. Ambiguous (same email on multiple Clerk users) and unverified-email cases are skipped and reported.
3. Verified-but-no-longer-in-Clerk rows are reported, never auto-disabled (a human investigates).
4. Legacy UUID-keyed credit/purchase rows are **never** re-keyed by this work; `scripts/migration-reconcile.mjs` enumerates them with emails for a human-approved mapping decision.

---

## 4. `purchaseProcessor.ts` — temporary Supabase-auth customers removed

Rewritten (`supabase/functions/_shared/purchaseProcessor.ts`), new dependency `supabase/functions/_shared/identity.ts` (server-side identity helpers, both service-role/no-secrets by design):

- **Deleted** the `supabase.auth.admin.createUser` branch, `generateSecurePassword()`, and `sendWelcomeEmail()`. A UUID identity can never match a Clerk user, so grants keyed by one were unreachable — the anti-pattern this task removes.
- Purchases now resolve via `resolveVerifiedIdentity(supabase, email)` against `clerk_identities` (`identity_verified = TRUE`). DB errors are treated as unverified (fail closed), and an ambiguous match (two verified Clerk accounts on one email) refuses to pick — a guess there is a purchase-theft vector.
- **Fail-closed behavior:** when identity cannot be verified, the purchase is still recorded for reconciliation with `user_id = NULL` and `status = 'pending'` (the only value the `purchases_status_check` constraint allows besides completed/refunded/failed), `processed = false` — and **no** app access, **no** subscription row. Return value `{ success: false, error: 'identity_unverified' }` (same shape the four webhooks already consume).
- **Re-delivery recovery:** a webhook retry of a previously pending purchase re-resolves identity; if the buyer has since signed up via Clerk, the row is attached (`user_id` set, status → completed), grants applied, purchase marked processed.
- Preservation: exact-match-only `matchProduct` untouched (SKU → exact platform name → exact catalog name/slug, wildcards escaped); advisory lock kept; purchase-level idempotency kept; `grantAppAccess` upsert semantics unchanged but now **surfaces errors** instead of swallowing them (a grant failure returns `success: false` and leaves the purchase unprocessed for retry); `createSubscriptionStatus` gained a duplicate guard (`subscription_status` has no unique constraint on `platform_subscription_id`).
- Note: if the DB columns are still UUID (phase 2 not yet applied), the Clerk-sub insert/upsert fails → recorded as grant failure → fail closed, no silent entitlement.

---

## 5. Procedures & scripts (files only — never run against any database here)

All scripts: Node 22 ESM, **no dependencies**, connection details from environment variables only (never read `.env`), redact nothing because they print no keys. `DRY_RUN` defaults to *on* for anything that writes.

| Script | Purpose | Key env |
|---|---|---|
| `scripts/migration-backup.mjs` | Snapshots affected tables to JSONL + `manifest.json` (row counts + sha256 per file). Missing tables recorded, not fatal. Default set: `clerk_identities`, `app_users`, `purchases`, `user_app_access`, `subscription_status`, `credits.credit_products/credit_balances/credit_transactions`; `INCLUDE_WEBHOOK_LOGS=1` opt-in | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKUP_DIR` |
| `scripts/migration-restore.mjs` | Checksum-verified, FK-ordered (children-delete-first, parents-insert-first) snapshot-exact restore of the credits + identity tables; "money" tables (`purchases`, `user_app_access`, `subscription_status`) require `RESTORE_MONEY_TABLES=1`; verifies final row counts against the manifest | `BACKUP_DIR`, `CONFIRM_RESTORE=1`, `DRY_RUN=0` |
| `scripts/migration-reconcile.mjs` | Read-only report: row counts; `user_id` shape classification (`clerk_sub` / `legacy_uuid` / `null` / `other`); balance sums per shape; ledger drift (`balance_credits` vs `SUM(amount_credits)`); clerk-sub balances without identity rows; purchases needing attention; verified vs placeholder identities; optional Clerk cross-check of unresolved emails; per-customer spot checks (`SPOT_CHECK_EMAILS`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `CLERK_SECRET_KEY` |
| `scripts/migration-verify-identities.mjs` | The only sanctioned non-webhook path to `identity_verified = TRUE`: Clerk Backend API email verification; ambiguous/unverified emails skipped and reported; writes only with `CONFIRM_VERIFY=1 DRY_RUN=0` | `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/migration-rollback.mjs` | Verifies backup integrity + staleness (aborts if live credits counts ≠ backup), classifies current `user_id` values, and emits `rollback-plan.json` + `rollback.sql`. **Data-only rollback** when any Clerk-sub value exists (TEXT→UUID is impossible — the TEXT schema is fully UUID-compatible); **schema-and-data rollback** when all values are UUID-shaped | `BACKUP_DIR` |

**Rollback procedure (operator):**
1. Freeze writes (maintenance window; edge functions to maintenance/zero-scale).
2. `BACKUP_DIR=<pre-migration backup> node scripts/migration-rollback.mjs` → review `rollback.sql`.
3. Apply `rollback.sql` with `psql "$SUPABASE_DB_URL" -f rollback.sql` (schema rollback only when the plan says `schema_and_data`).
4. `node scripts/migration-restore.mjs` (same `BACKUP_DIR`) for data restore; add `RESTORE_MONEY_TABLES=1` only if revenue tables were affected.
5. `node scripts/migration-reconcile.mjs` to verify counts/sums; redeploy previous function versions.

**Backup procedure (operator):** run `scripts/migration-backup.mjs` **before** every migration step and keep the manifest with the JSONL files. Backups contain customer PII — store locally, never commit (see §7 for the `.gitignore` action), delete when the window closes.

---

## 6. Staging test plan (to run once staging credentials exist)

Prerequisites (environment only): staging `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, staging `SUPABASE_DB_URL` (psql connection string), staging `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, plus the existing `ZAXXA_WEBHOOK_SECRET`/`PAYKICKSTART_WEBHOOK_SECRET` edge secrets.

1. **Baseline:** `node scripts/migration-backup.mjs` → `BACKUP_DIR` for the whole drill.
2. **Apply in dependency order** (each with `psql "$SUPABASE_DB_URL" -f`, never `db push` against prod): `20260709020000` → `20260709030000` → `20260709050000` → `20260924000000` → `20260924000001` → `20260924000002` → `20261011120000` (revised) → `20261011160000` (new) → `20261011170000` (new, independent — any time).
3. **Idempotency drill:** apply `20261011120000` and `20261011160000` a second time; expect no errors.
4. **Schema assertions** (SQL): `credits.credit_balances.user_id` is `text` and has no FK to `auth.users`; exactly the two canonical policies exist per table; `\df credits.add_credits` shows the TEXT signature; `has_function_privilege('authenticated','credits.add_credits(text,text,integer,text,text,text,jsonb)','execute')` is **false**; `has_function_privilege('service_role', …)` is **true**; `clerk_identities` RLS on with the two policies.
5. **Identity provisioning:** send a staging svix-signed `user.created` to `clerk-webhook` → expect a `clerk_identities` row with `identity_verified = TRUE`, plus the `app_users` row. Run `migration-verify-identities.mjs` (dry run, then live) → placeholder rows for pre-existing `app_users` flip only when Clerk confirms verified emails.
6. **Billing path:** call `run-ai-app` with a staging Clerk JWT → balance read works; 0-balance user gets 402 and no OpenAI call; a funded user gets a `credit_transactions` row and a decremented balance (assert `record_ai_app_run` analytics row uses the Clerk sub).
7. **Credit purchase path:** `create-credit-checkout` (test mode) → `webhook-stripe` → balance credited with the Clerk sub.
8. **Webhook entitlement path:** verified email purchase (zaxxa/paypal/paykickstart test payload, signature valid) → purchase `completed` + `user_app_access` rows on the Clerk sub. **Negative:** purchase for an email with no verified identity → row stays `pending`, `user_id` NULL, **no** access rows (fail-closed test).
9. **Reconciliation:** `migration-reconcile.mjs` with `SPOT_CHECK_EMAILS` → zero unexpected shapes; legacy UUID rows listed (expected in staging if seeded).
10. **Rollback drill:** `migration-rollback.mjs` → expect `data_only` if step 6 ran (Clerk subs exist); then `migration-restore.mjs` and reconcile back to baseline.
11. **Idempotent re-delivery:** replay the same webhook event twice → one purchase row, no duplicate grants/subscription rows.

---

## 7. Remaining approvals / credentials needed (specific)

1. **Staging credentials (environment only, never committed):** staging `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.
2. **Production change window + approval** to apply, in order: phase-2 (`20260709030000`, with a human decision on its hardcoded `_uuid_clerk_map`), then `20261011120000` (revised), then `20261011160000`, **before** deploying `run-ai-app` / `proxy-openai` and the updated webhooks.
3. **Production `app_users` confirmation:** the identity FK and the `app_users` `id` uniqueness assumption are code-inferred (the table is not created by any repo migration). `scripts/migration-reconcile.mjs` output on the first staging run is the acceptance evidence; no code change needed if the guarded FK path activates.
4. **Legacy balance decision:** if production has credit balances under Supabase UUIDs, the reconciliation report enumerates them with emails; the mapping must be confirmed via the Clerk Backend API and approved by a human before `migration-verify-identities.mjs` is pointed at production.
5. **Edge secrets still outstanding** (from the auth/security report): `ZAXXA_WEBHOOK_SECRET`, `PAYKICKSTART_WEBHOOK_SECRET` — webhooks fail closed (500) until set.
6. **Coordinator action:** ~~add `scripts/backups/` to `.gitignore`~~ **DONE** in the follow-up (§10) — backups contain customer PII and are now excluded from commits.
7. **Security referral (not mine to fix):** `.env.example` contains what look like real production-grade Supabase keys for `<prod-ref>` (service-role JWT) — recommend rotation + scrubbing by the security owner.

---

## 8. Cross-agent blockers / needs

1. ~~**`clerk-webhook/index.ts` must call the identity helpers.**~~ **RESOLVED in the follow-up (§10):** `clerk-webhook` is now wired (`handler.ts` + thin `index.ts` bootstrap + 10 passing tests). New Clerk users get a verified identity row from the svix-signed event.
2. **`run-ai-app` / `proxy-openai` / `webhook-stripe` expectations are satisfied by the revised credit migration**: text-signature `deduct_credits` / `add_credits`, `credit_balances.user_id` text, service-role-only execute. No function changes needed; the deploy-order constraint (migration before function deploy) stands and is documented in the migration header.
3. **Frontend (`src/`) needs phase 2 applied in production** — `purchaseService`/`useUserAccess` filter `user_app_access`/`purchases` by the Clerk sub, and `CreditsPage`/`CreditBalanceDisplay` rely on the schema/table grants added in §1.2-G3. No `src/` change required.
4. ~~**`webhook-paypal/_shared/purchaseProcessor.ts` still creates temp users.**~~ **RESOLVED in the follow-up (§10):** replaced by a re-export shim of the fixed shared processor (the paypal function already imported the shared module). Remaining paypal schema gaps documented in §10.4 with the exact SQL for approval.
5. **`tests/`**: no test in the repo imported `purchaseProcessor` (verified by grep), so the rewrite breaks no suites. If a test is added, the fail-closed contract (`identity_unverified` → no grant) and the `pending` purchase state are the expected behaviors.

---

## 9. File inventory

| File | Status |
|---|---|
| `supabase/migrations/20261011120000_clerk_credit_system_alignment.sql` | **revised** — exhaustive policy-drop DO block, grants gap fixed, usage RPCs caller-scoped + locked, audit notes |
| `supabase/migrations/20261011160000_clerk_identity_table.sql` | **new** — `public.clerk_identities` (PK `clerk_user_id`, soft `app_user_id` link with guarded FK, verified flag, RLS service-role-only writes, safe placeholder backfill) |
| `supabase/functions/_shared/identity.ts` | **new** — `resolveVerifiedIdentity` (fail-closed, ambiguity-safe), `upsertIdentityFromClerkEvent`, `deleteIdentityForClerkUser` |
| `supabase/functions/_shared/purchaseProcessor.ts` | **rewritten** — temp Supabase-auth customers removed; Clerk-verified identity required; fail-closed pending purchases; grant errors surfaced; duplicate-subscription guard |
| `scripts/migration-backup.mjs` | **new** — checksummed JSONL snapshots, env-only |
| `scripts/migration-restore.mjs` | **new** — FK-ordered snapshot-exact restore, verification, money-table opt-in |
| `scripts/migration-reconcile.mjs` | **new** — read-only counts/shapes/sums/drift/attention report, Clerk cross-check, spot checks |
| `scripts/migration-verify-identities.mjs` | **new** — Clerk-API-verified identity promotion, dry-run default |
| `scripts/migration-rollback.mjs` | **new** — rollback planner: data-only vs schema-and-data, stale-backup guard |
| `supabase/functions/clerk-webhook/handler.ts` | **new (follow-up)** — svix-verified Clerk event handler, Deno-free; wires `app_users` sync → `clerk_identities` provisioning; fail-closed |
| `supabase/functions/clerk-webhook/index.ts` | **rewritten (follow-up)** — thin Deno bootstrap owning the `npm:svix@1` verifier + client injection (same pattern as webhook-zaxxa) |
| `supabase/migrations/20261011170000_webhook_logs_event_key.sql` | **new (follow-up)** — `event_id` column + backfill + dedupe + unique index `webhook_logs_provider_event_key` (adapted to the real `platform`/`event_id` columns) |
| `supabase/functions/webhook-paypal/_shared/purchaseProcessor.ts` | **replaced (follow-up)** — re-export shim of the fixed shared processor; temp Supabase-auth user code deleted |
| `supabase/functions/webhook-paypal/index.ts` | **fixed (follow-up)** — removed the orphaned top-level block that crashed the function on cold start + the dead `verifyUser`/`getUserApiKey` Supabase-auth helpers |
| `tests/clerk-webhook-identity.test.ts` | **new (follow-up)** — 10 tests covering the wiring's security contract |
| `.gitignore` | **updated (follow-up)** — `scripts/backups/` excluded (local backup PII) |
| `docs/completion/db-clerk-migration.md` | this report |

**Verification performed (local only):** TypeScript strict typecheck of `identity.ts` + `purchaseProcessor.ts` clean via the repo's TypeScript 5.9 (the original file had 6 pre-existing type errors; the rewrite has none); `node --check` on all five scripts; end-to-end smoke tests of backup / restore (dry-run + live + verify) / reconcile / verify-identities (dry-run + live) / rollback (both shapes) against **local mock REST servers** — no database, staging or production, was contacted.

---

## 10. Follow-up (cross-cutting items, same session series)

Three items reported by other subagents were completed under this agent's ownership. No database was contacted; no secrets appear in any file.

### 10.1 `clerk-webhook` wired to the identity table (the previously reported blocker)

- **New `supabase/functions/clerk-webhook/handler.ts`** — Deno-free and svix-free so it is unit-testable (same architecture as `webhook-zaxxa/handler.ts`). Flow:
  1. No configured signing secret → **500** (misconfigured server must never accept traffic) — verified before anything else.
  2. Non-POST → 405; missing svix headers → **400**, verifier never invoked.
  3. Signature verification over the raw body **before** the payload is parsed or used — an invalid signature produces **400 with zero database calls** (asserted in tests).
  4. `user.created` / `user.updated`: `app_users` upsert (existing behaviour preserved, incl. its console-only failure handling), then `upsertIdentityFromClerkEvent()` which writes `clerk_identities` with `identity_verified = TRUE`, `verification_source = 'clerk_webhook'`, email lower-cased, and `app_user_id` linked. Ordering matters (the identity row links into `app_users`) and is asserted in tests. A Clerk user with no email is a logged **no-op (200)** — purchases for such an account still fail closed because no verified identity exists. Any other identity write failure → **500** so the platform retries (both writes are idempotent upserts).
  5. `user.deleted`: `app_users` delete (existing behaviour) + `deleteIdentityForClerkUser()` (best-effort, logged; a stale identity row is a reconciliation item, not a grant failure).
  6. Unrelated event types → 200 ignored, no writes. No secret is ever logged (test greps every log line).
- **Rewritten `supabase/functions/clerk-webhook/index.ts`** — thin `serve()` bootstrap that owns the only Deno-specific dependency (`npm:svix@1`) and injects it plus the real Supabase client into the handler.
- **New `tests/clerk-webhook-identity.test.ts`** — 10 tests: verified provisioning (identity fields + ordering), refresh-not-duplicate on `user.updated`, deletion, **500 on identity write failure**, **zero writes on invalid signature / missing svix headers / unconfigured secret**, no-email no-op, unrelated events ignored, and no-secret-in-logs.

### 10.2 `webhook_logs` unique index for atomic webhook idempotency

- **New `supabase/migrations/20261011170000_webhook_logs_event_key.sql`.** Subagent 2 requested `webhook_logs_provider_event_key ON webhook_logs (provider, event_id)`; the actual DDL (verified in `20251003151741_create_purchase_management_system.sql` and `supabase_schema.sql`) has **no `provider` column** — the provider column is `platform` (CHECK `('paykickstart','stripe','zaxxa')`) — and **no `event_id` column**. The migration therefore: adds `event_id text`; backfills it from the event identifiers already inside `webhook_payload` (the same fields `webhookGuard.ts` extracts: `event_id`/`eventId`/`transaction_id`/`order_id`/`id`, incl. nested `data.*`; empty strings become NULL); de-duplicates (earliest row per `(platform, event_id)` keeps the key, later processing artifacts get NULL and stay inert — NULLs are distinct in a Postgres unique index); then creates the unique index under the **requested name** on `(platform, event_id)`. Idempotent and safe to re-run. The file comments that grants are additionally protected by `purchases UNIQUE (platform, platform_transaction_id)`, matching `webhookGuard.claimWebhookEvent`'s insert-or-detect contract.
- **Note for Subagent 2:** atomic claiming only works once handlers populate `event_id` on their `webhook_logs` inserts (the insert lives in `_shared/webhookGuard.ts`, outside this agent's ownership).

### 10.3 `webhook-paypal` no longer provisions temporary Supabase-auth customers

- The function already imported the **shared** processor (`../_shared/purchaseProcessor.ts`), i.e. the fixed version; its local `_shared/purchaseProcessor.ts` copy was dead code that still contained the `supabase.auth.admin.createUser` anti-pattern. It is now a **re-export shim** of the shared module, so purchases resolve a verified Clerk identity and fail closed (`pending` purchase, `user_id` NULL, no grant) when identity cannot be verified — identical semantics to the other webhooks.
- **Bonus cold-start bug fixed:** `webhook-paypal/index.ts` contained an orphaned top-level block (a half-removed auth preamble referencing undefined `req`/`supabase`/`jsonResponse`) that executed at module load — the function would `ReferenceError` on cold start before serving a single request. The block and its now-unreferenced `verifyUser`/`getUserApiKey` Supabase-auth helpers (which also used the retired `supabase.auth.getUser` path) were removed; all webhook handling behaviour is unchanged.

### 10.4 Remaining `webhook-paypal` schema gaps (needs approval — exact SQL)

Verified against `supabase_schema.sql`; **not** applied (outside this follow-up's migration scope, and a platform-enum decision the coordinator should approve). Until these land, the PayPal function fails closed at the `webhook_logs`/`purchases` inserts (500s / "Failed to record purchase"):

- `platform` CHECK constraints on `public.purchases`, `public.subscription_status`, `public.webhook_logs` allow only `('paykickstart','stripe','zaxxa')` — PayPal deliveries store `'paypal'`.
- `webhook_logs.paypal_event_id` does not exist (the handler reads/writes it for idempotency); the equivalent value now belongs in the new `event_id` column (§10.2).
- `webhook_logs.processing_status` CHECK allows `('pending','processed','failed','retry')` — the handler writes `'completed'`.
- Proposed migration sketch: `ALTER TABLE public.purchases DROP CONSTRAINT purchases_platform_check, ADD CONSTRAINT purchases_platform_check CHECK (platform IN ('paykickstart','stripe','zaxxa','paypal'));` (same for `subscription_status`, `webhook_logs`), add `'completed'` to `webhook_logs_processing_status_check`, and repoint the handler's `paypal_event_id` at `event_id`.

### 10.5 `.gitignore`

`scripts/backups/` added under `# Local migration backup output, never commit`; verified active with `git check-ignore` (backup JSONL contains customer PII and must never be committed).

### 10.6 Verification results (this follow-up)

- `npx vitest run tests/clerk-webhook-identity.test.ts` → **10/10 pass**.
- `npx tsc` (strict, repo TypeScript 5.9) over `clerk-webhook/handler.ts` + `_shared/identity.ts` + `_shared/purchaseProcessor.ts` + the new test → **clean** (the original `purchaseProcessor.ts` had 6 pre-existing type errors; all shipped files are clean).
- Parse check on all four edited Deno function files → OK.
- `npx vitest run tests/webhook-zaxxa.test.ts` (regression guard on the shared processor + guard contract) → **28/28 pass**.
- No git commands (read-only `git check-ignore` aside), no npm install, no database connection of any kind.
