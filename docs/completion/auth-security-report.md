# Auth / Entitlements / Credits Security Report

**Branch:** `kilo/pr19-completion` (PR #19 head + merge)
**Scope:** Supabase edge functions (auth, credits, webhooks), Clerk migration alignment, purchase entitlements, credit billing correctness, associated tests.
**Date:** 2026-10-11

---

## 1. Findings (most severe first)

### F1 — CRITICAL: Unauthenticated webhooks granted paid entitlements (anyone could self-grant any app)

`supabase/functions/webhook-zaxxa/index.ts` and `supabase/functions/webhook-paykickstart/index.ts` verified **nothing** about the caller. Both are deployed on public `https://<project>.supabase.co/functions/v1/webhook-*` URLs (platforms need them reachable). An attacker could POST a forged `sale.completed` / `order_success` payload with an arbitrary `product_name`, and `processPurchase` would insert a `purchases` row and call `grantAppAccess`, handing the attacker every app in the matched product — for free, no signature required. (Rebuilt file: both webhooks now verify first; evidence of the fix at `supabase/functions/webhook-zaxxa/index.ts:22` and `supabase/functions/webhook-paykickstart/index.ts:22`.)

**Severity driver:** total bypass of the purchase system; one HTTP request permanently grants a product bundle.

### F2 — HIGH: OpenAI spend with no billing (402 credit gate absent; spend unmetered)

`supabase/functions/run-ai-app/index.ts` (PR #19 version) accepted a request, authenticated the user, and immediately called `https://api.openai.com/v1/responses`. There was **no balance check before the call** and **no deduction after** it (the only post-call action was an analytics `record_ai_app_run`). Any authenticated user could burn unlimited OpenAI spend. The Realtime voice path (`handleRealtimeSession`) minted `gpt-realtime-mini` sessions with no billing at all. `supabase/functions/proxy-openai/index.ts` did charge, but read balances and deducted with a **user-scoped client** (`createClient(url, ANON_KEY, { headers: { Authorization: Bearer <user token> } })`), so balance mutation depended on client-side permissions rather than service-role authority.

**Severity driver:** unbounded, unrecoverable cloud spend on a public endpoint.

### F3 — HIGH: Generic WebSocket on `run-ai-app` was an OpenAI-spend bypass

`run-ai-app` accepted *any* WebSocket upgrade on its public URL (`if (req.headers.get("upgrade") === "websocket") return handleWebSocket(...)`). `handleWebSocket` proxied the socket to `wss://api.openai.com/v1/realtime` and took the billed `userId` **from the client's WebSocket payload** (`data.userId`) — identity fully attacker-controlled, no auth, no credits. Because a realtime proxy consumes OpenAI tokens per minute, this was both an auth bypass and a free-spend primitive.

**Severity driver:** unauthenticated access to the most expensive model path.

### F4 — HIGH: Realtime session re-validated identity with the anon key and failed **open**

The PR #19 realtime path validated the socket's token twice. The second check (inside `handleRealtimeSession`) used the **anon** Supabase client and, on any verification error, logged and **continued anyway** (`// Continue anyway for development visibility`). A forged or expired token could therefore complete the handshake and mint a realtime session.

### F5 — HIGH: `credits.add_credits` / `credits.deduct_credits` executable by PUBLIC

Postgres grants `EXECUTE` to `PUBLIC` on new functions by default. `supabase/migrations/20260924000002_credit_system_functions.sql` created `credits.add_credits` and `credits.deduct_credits` without revoking that default. Any `anon` or `authenticated` caller with the publishable key could `rpc('add_credits', {...})` to mint arbitrary credits or `deduct_credits` against another user (the functions are `SECURITY DEFINER` and take the user id as a parameter). Combined with `credit_transactions`' non-negative constraint, minting was the practical exploit.

**Severity driver:** direct balance forgery from the browser.

### F6 — MEDIUM: Fuzzy product matching granted entitlements on near-miss names

`supabase/functions/_shared/purchaseProcessor.ts` `matchProduct` matched catalog products by `ilike('%name%')` on `platform_product_mappings.platform_product_name` and by bidirectional `includes()` on normalized names. Because webhook product names are attacker-influenced input, a forged payload claiming `VideoRemix VIP - Ultimate Bundle Deluxe` could match the `VideoRemix VIP` product (and any product whose normalized name is a substring of the claimed one), granting an unrelated product's full app list. No "no match" outcome existed — only "match something."

### F7 — MEDIUM: Temporary-account password written to logs

`purchaseProcessor.ts` `sendWelcomeEmail` logged `TODO: Send welcome email to ${email} with password: ${password}` — the generated temp password for every webhook-created account, in plaintext, to edge-function logs (readable by anyone with log access, retained indefinitely). Also noted: the advisory lock key was derived with `((hash << 5) - hash) + byte`, which can be **negative**, making `BigInt('0x-<negative hex>')` throw and fail the entire webhook with a 500.

### F8 — MEDIUM: Idempotency relied on a single insert path (webhook retries double-processed)

Zaxxa/PayKickstart webhooks wrote a `webhook_logs` row and immediately processed. On a platform retry of the same event, `processPurchase`'s purchase-level idempotency was the *only* guard; the webhook layer had no "already processed this event id" check, so retries during a partially-failed processing window re-ran `grantAppAccess` (benign but noisy) and could double-insert purchase rows in races.

### F9 — MEDIUM: Wrong credit rates = revenue leak / wrong prices shown

Both the edge functions and `src/lib/credit-math.ts` carried stale model rates (`gpt-5.5` input/output, `o3`, `o3-mini`, `gpt-4o`, `o1-mini`). Example: `o1-mini` was billed at 300K/1.2M credits per 1M tokens against actual OpenAI pricing of $1.10/$4.40 (=110K/440K credits at `CREDITS_PER_DOLLAR = 100_000`). The proxy also silently fell back to `gpt-5.5-mini` rates for unknown models instead of rejecting them, so any new model name was billed at the cheapest price — a guaranteed loss as models are added.

### F10 — LOW: `credits`/`ai_app_usage` tables still keyed to Supabase-auth UUIDs

After the Clerk migration, `credits.credit_balances.user_id` / `credit_transactions.user_id` were `UUID REFERENCES auth.users(id)` and RLS used `auth.uid()`. Clerk users (`user_2abc…`) exist only in Clerk, so user-scoped RLS policies matched nobody and the edge functions' Clerk-sub writes could not satisfy the FK/type. `ai_app_usage` had the same UUID shape plus `record_ai_app_run(user_uuid UUID, …)`.

---

## 2. Fixes applied

### Webhook guard (`supabase/functions/_shared/webhookGuard.ts`, new)

- `verifyWebhookSecret(req, secret)` — **fail-closed**: missing configured secret → reject (`secret_not_configured`); missing presented secret → reject; otherwise **constant-time** comparison (`constantTimeEqual`, length-independent loop at `webhookGuard.ts:42`).
- Secret accepted from `x-webhook-secret`, `x-zaxxa-signature`, `x-paykickstart-signature`, `x-hub-signature-256` (with `sha256=` prefix), `Authorization: Bearer`, or `?secret=`/`?token=` query (some platforms only support query secrets).
- `checkWebhookProcessed(supabase, platform, payload)` — idempotency against `webhook_logs` using the payload's stable event id (`event_id`/`eventId`/`transaction_id`/`order_id`/`id`, incl. nested `data.*`).
- `escapeLikePattern`-style care is not needed here, but the idempotency query is scoped by `platform` + `processing_status IN ('processed','pending')`.

### Webhook rewiring

- `webhook-zaxxa/index.ts:22` / `webhook-paykickstart/index.ts:22` — guard runs **before** any parsing or DB work. `secret_not_configured` → 500 (fail closed, do not accept traffic with a misconfigured server); `missing_secret`/`invalid_secret` → 401.
- Idempotency short-circuit added after secret verification (duplicate → 200 `{ success: true, message: 'Event already processed' }`).
- Deleted both files' dead `getUserApiKey`/`verifyUser` helpers, which referenced an undefined `supabase` global and the removed `supabase.auth.getUser` path (a latent `ReferenceError` / auth-bypass shape).

### `run-ai-app` (`supabase/functions/run-ai-app/index.ts`)

- **Credit gate (402) before every OpenAI call** (`index.ts:498-518`): model price resolved from the shared rate table; `estimateRequestCredits()` estimates input tokens from the assembled prompt (~4 chars/token) and output from `config.maxTokens`; balance read with the **service-role** client on schema `credits`; insufficient balance → `402 INSUFFICIENT_CREDITS` with `X-Credits-Balance` / `X-Credits-Required` headers and the OpenAI request is never sent. Balance-read failure → 500 (fail closed).
- **Unpriced models refuse to run** (`index.ts:474-488`): if the configured model is not in the rate table the request 500s — OpenAI is never called for spend we cannot bill.
- **Post-call deduction, non-streaming** (`index.ts:568-598`): exact cost from `usage.input_tokens`/`output_tokens` via `calculateUsageCredits`, then `credits.deduct_credits` (service role), echoed in `metadata.creditsCharged` and `X-Credits-Deducted`.
- **Post-call deduction, SSE teeing** (`createBillingTee`, `index.ts:182-286`; wired at `index.ts:539`): the upstream SSE body is piped through a `TransformStream` that enqueues every chunk to the client **first**, then parses `response.completed` usage frames; on `flush` (stream end) *or* `cancel` (client disconnect) it bills actual usage, falling back to the conservative pre-flight estimate if no usage event was seen. Spend is never free and never delayed to the client.
- **Realtime billing** (`handleRealtimeSession`, `index.ts:805`): a minimum-balance pre-check before minting the OpenAI session (`index.ts:840-855`), and per-connected-minute billing (`calculateRealtimeCredits`) when the client socket closes (`index.ts:915-929`), service-role, exactly once.
- **Identity verified exactly once** (`index.ts:378-383`): the upgrade handler authenticates the `access_token` and passes the verified id into `handleRealtimeSession(req, verifiedUserId)`. The old anon-key re-validation that continued on failure is **deleted**.
- **426 for non-realtime upgrades** (`index.ts:388-392`); the dead `handleWebSocket` function (which trusted `data.userId` from the client payload) is **removed entirely**.
- **`user_id` only from the verified JWT** (`index.ts:359-405`): `RunAIAppRequest` no longer accepts a client `userId`; all billing keys off `auth.userId`. Service-role clients are created via `createServiceClients()` (default schema for analytics, `credits` schema for money).

### `proxy-openai` (`supabase/functions/proxy-openai/index.ts`)

- **Corrected rates** via the shared `_shared/creditRates.ts` table (see F9): `gpt-5.5` 500K/3M, `gpt-5.5-mini` 15K/60K, `o3` 200K/800K, `o3-mini`/`o1-mini` 110K/440K, `gpt-4o` 250K/1M, `gpt-4o-mini` 15K/60K, `o1` 1.5M/6M per 1M tokens; dall-e and whisper priced per image/minute.
- **400 for unknown models** (`index.ts:193-206`): unsupported `model` is rejected with the supported list instead of silently billing at a default rate.
- **Service-role client for balance read and deduction** (`createCreditsClient`, `index.ts:59-66`; deductions at `index.ts:271-285`): the anon client is now used *only* for token verification; money operations run with `SUPABASE_SERVICE_ROLE_KEY` on the `credits` schema.
- **Token-derived identity** (`index.ts:44-52`): `user_id` comes only from the verified bearer token — never from the body.
- Streaming responses are now tee'd (`index.ts:300-347`): the SSE stream passes through byte-for-byte, usage is billed at stream end, and failed/incomplete upstream calls (non-2xx) bill nothing.

### `purchaseProcessor` (`supabase/functions/_shared/purchaseProcessor.ts`)

- **Strict exact-match entitlement matching** (`index.ts:180-267`): exact SKU → exact `platform_product_name` (ilike with `%`/`_`/`\` escaped so wildcards cannot widen the match) → exact catalog `name`/`slug` (case-insensitive, trimmed). Any non-exact input logs a warning and grants **nothing**.
- **Password log removed** (`index.ts:340`): `sendWelcomeEmail` no longer logs the generated password (email-only log).
- **Advisory lock robustness** (`index.ts:66-77`): FNV-1a 64-bit hash masked to unsigned, so `pg_advisory_lock` can no longer throw on negative hashes and 500 the webhook.

### Clerk credit alignment migration (file created, **not applied**)

`supabase/migrations/20261011120000_clerk_credit_system_alignment.sql`:

1. **RPC lockdown**: `DROP` the old UUID-signature `credits.add_credits` / `credits.deduct_credits`, recreate them with `p_user_id TEXT` (Clerk sub), then `REVOKE ALL ... FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE ... TO service_role` only (ordered so the REVOKE never targets a not-yet-created signature, which would abort the transaction).
2. **Re-key credits tables** (lines 52, 80): drop the `auth.users` FKs, `ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`, and recreate RLS policies keyed on `auth.jwt() ->> 'sub'` (Clerk-sub ownership) with service_role policies intact.
3. **Re-key usage table** (lines 226-263): `ai_app_usage.user_id` → text, RLS enabled with Clerk-sub policy, `record_ai_app_run` / `get_ai_app_usage` / `get_ai_app_remaining_runs` recreated with text user ids; `record_ai_app_run` execution restricted to service_role.
4. Idempotent (`IF EXISTS` / `IF NOT EXISTS` guards everywhere); no data is deleted — pre-existing UUID-keyed rows are preserved as legacy text and require a separate audited re-map (deliberately **not** included).

### Client test suites repaired

All 12 owned test files were re-fixed for the post-PR19 Clerk implementation (see §4).

---

## 3. Deploy-order blocker (CRITICAL)

**Apply `20261011120000_clerk_credit_system_alignment.sql` BEFORE deploying `run-ai-app` and `proxy-openai`.**

- The new functions bill with **text Clerk subs** and call `credits.deduct_credits(TEXT, ...)`. Against the current schema those RPC calls fail on the uuid/text signature mismatch.
- The functions **fail closed** (gate error → 500 / no OpenAI call), so the failure mode is a broken AI product, not a security hole — but it is still an outage if the order is reversed.
- Deploy order: `supabase db push` (migration) → `supabase functions deploy run-ai-app` / `proxy-openai` (webhooks can deploy in any order; they carry no schema dependency beyond `webhook_logs`).
- **Secrets that must exist before deploy:** `ZAXXA_WEBHOOK_SECRET`, `PAYKICKSTART_WEBHOOK_SECRET` (edge function secrets). With them missing the webhooks answer **500 and accept nothing** (fail closed) — platforms will see retries until the secrets are set.
- The migration was **created only and never applied** to any database, per the workstream rules.

---

## 4. Test results

All commands run as `npx vitest run <file>` (individual files), then the owned set together, then the whole suite:

| Test file | Result |
|---|---|
| `tests/credit-math.test.ts` | pass (58 tests) |
| `tests/proxy-openai.test.ts` | pass (33 tests) |
| `tests/AuthContext.test.tsx` | pass (20 tests) |
| `tests/ProtectedRoute.test.tsx` | pass (8 tests) |
| `tests/SignInPage.test.tsx` | pass (9 tests) |
| `tests/SignUpPage.test.tsx` | pass (8 tests) |
| `tests/supabase-config.test.ts` | pass (17 tests) |
| `tests/AdminUsersManagement.test.tsx` | pass (10 tests) |
| `tests/AdminUsersManagement.bundle.test.tsx` | pass (37 tests) |
| `tests/AdminAppsManagement.test.tsx` | pass (4 tests) |
| **Owned set together** | **10 files / 202 tests pass** |
| **Whole repo suite** | **29 files / 403 tests pass** |
| `tests/credit-e2e.test.ts` | pass as vitest spec (18 tests, verified via temp copy) — **blocked by config, see §5** |

Key assertion coverage added/restored:

- `credit-math.test.ts` / `proxy-openai.test.ts`: corrected rate tables for `gpt-4o`, `o1-mini`, plus new `gpt-5.5`, `gpt-5.5-mini`, `o3`, `o3-mini` blocks asserting both credit values and USD conversions, and the "unknown model = 0 credits (proxy 400s)" contract.
- `AuthContext.test.tsx`: Clerk-user → `AppUser` mapping (id/email/`user_metadata`), `authState` machine (loading → authenticated/unauthenticated/error), `app_users` upsert keyed on `clerk_user_id`, `setClerkTokenGetter` wiring (null without session, JWT with), sign-in/sign-up strategy + error normalization ("multi-factor authentication", "session could not be confirmed"), sign-out, reset-password, profile, `clearError`.
- `ProtectedRoute.test.tsx`: unauthenticated → redirect (no protected content rendered), authenticated → content, loading/idle → "Verifying session...", error state → "Authentication Error" + escape hatch, proactive `refreshSession` on expiring session.
- `SignInPage/SignUpPage.test.tsx`: Clerk prebuilt component rendered with `routing: 'path'`, correct `path`/`redirectUrl`, benefits copy, Helmet title, **and negative assertions** that no custom email/password form exists (the CAPTCHA-bypass shape F-class).
- `AdminUsersManagement*.test.tsx`: Clerk bearer token on every admin call; PUT/DELETE/POST bodies to `admin-users` and `admin-users/:id/app-access`; role filter; search; create-user validation (no POST on invalid email); bundle toggles; bulk operations incl. batching (`Bulk operation complete: 3 succeeded, 0 failed`); app-slot counts computed live from `bundleData` (101, no hardcoded 95); missing Clerk session → hard error and zero API calls.
- `AdminAppsManagement.test.tsx`: list render, empty state, network error path, Clerk bearer token on fetch.

---

## 5. Blockers / out-of-ownership issues

1. **`tests/credit-e2e.test.ts` is excluded by `vite.config.ts`** (`"**/tests/credit-e2e.test.ts"` in the vitest `exclude` list — added when it was an un-runnable Playwright spec). I converted it to a pure vitest spec (all 18 assertions preserved, verified passing via a temporary copy) but **cannot remove the exclusion myself**: `vite.config.ts` is outside my ownership and is being edited concurrently. Needed one-liner: drop `**/tests/credit-e2e.test.ts` from `vitest.exclude`. `tests/purchase-flow/purchase-flow.test.ts` remains a Playwright spec (requires a live app) and stays excluded — documented here per the workstream rules.
2. **`tests/setup.ts` / `tsconfig.app.json`** are being edited by the coordinator; I did not touch them. My tests are robust to the current setup (they mock Clerk at the module boundary rather than relying on `VITE_CLERK_PUBLISHABLE_KEY` being present in the test env).
3. **`purchaseProcessor` still provisions Supabase-auth temp users** (`supabase.auth.admin.createUser`) for unknown purchaser emails, producing UUID user ids on a now Clerk-keyed platform (`purchases.user_id` / `user_app_access.user_id`). Clerk users can never match those rows, so webhook purchases for brand-new emails create accounts the purchaser cannot log into and grants land on an unreachable identity. This predates the Clerk migration and needs an owner decision (e.g. provision via Clerk back-end API, or key purchases by email + invite flow). Out of my file scope; flagged for follow-up.
4. **Legacy balance re-map**: the new migration intentionally leaves pre-existing UUID-keyed `credits.credit_balances` / `credit_transactions` rows as legacy text. If any production balances exist under Supabase UUIDs they must be re-keyed to Clerk subs in a separate, audited data migration before cutover.
5. **Webhook secrets must be provisioned** (`ZAXXA_WEBHOOK_SECRET`, `PAYKICKSTART_WEBHOOK_SECRET`) on the deployed functions *before* the platform is pointed at them; until then the endpoints fail closed with 500 (by design).
6. **Catalog app count drift**: `AdminUsersManagement.bundle.test.tsx` now derives the total app slots from `bundleData` (101 unique slugs across 12 bundles) rather than hardcoding 95; if the catalog changes again the tests self-adjust, but any snapshot tests elsewhere that hardcode 95/116 should be re-audited by their owners.

---

## 6. File inventory

| File | Status |
|---|---|
| `supabase/functions/_shared/webhookGuard.ts` | **new** — fail-closed secret check, constant-time compare, webhook_logs idempotency |
| `supabase/functions/_shared/creditRates.ts` | **new** — shared, corrected credit rate table + estimators (mirrors `src/lib/credit-math.ts`) |
| `supabase/functions/run-ai-app/index.ts` | rewritten — 402 gate, SSE-tee billing, realtime billing, single identity check, 426, service-role, JWT-only identity; dead WS handler removed |
| `supabase/functions/proxy-openai/index.ts` | rewritten — corrected rates, 400 unknown model, service-role balance/deduction, token-only identity, SSE tee |
| `supabase/functions/webhook-zaxxa/index.ts` | rewritten — guard + idempotency; dead `supabase.auth` helpers removed |
| `supabase/functions/webhook-paykickstart/index.ts` | rewritten — guard + idempotency; dead `supabase.auth` helpers removed |
| `supabase/functions/_shared/purchaseProcessor.ts` | exact-match entitlements only; password log removed; advisory-lock hash fixed |
| `supabase/migrations/20261011120000_clerk_credit_system_alignment.sql` | **new, created only — never applied** |
| `tests/credit-math.test.ts`, `tests/proxy-openai.test.ts`, `tests/credit-e2e.test.ts` | corrected rates; Playwright→vitest conversion (assertions preserved) |
| `tests/AuthContext.test.tsx`, `tests/ProtectedRoute.test.tsx`, `tests/SignInPage.test.tsx`, `tests/SignUpPage.test.tsx` | rewritten for the Clerk prebuilt implementation |
| `tests/AdminUsersManagement.test.tsx`, `tests/AdminUsersManagement.bundle.test.tsx`, `tests/AdminAppsManagement.test.tsx`, `tests/supabase-config.test.ts` | aligned to the Clerk-token admin implementation |
| `docs/completion/auth-security-report.md` | this report |
