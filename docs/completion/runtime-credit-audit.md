# Runtime & Credit-Enforcement Audit — `run-ai-app` + `proxy-openai`

Owner: Subagent 3 (AI runtime + credit enforcement). Branch `kilo/pr19-completion`, worktree `/workspace/app`.
Last verified: 2026-10-11 (after the credit-core refactor and harness verification).

Scope audited: `supabase/functions/run-ai-app/**` (except `app-configs.ts`, owned by Subagent 4),
`supabase/functions/proxy-openai/**`, `supabase/functions/_shared/creditRates.ts`, and the new pure core
`supabase/functions/run-ai-app/credit-core.ts`.

## How it was verified

* **Committed suite (runs under the repo's vitest):** `tests/run-ai-app-credit-core.test.ts` (49 tests) +
  `tests/credit-concurrency.test.ts` (11 tests) + regression `tests/proxy-openai.test.ts` (33 tests) =
  **93 tests, 3 files, all passing.**
* The edge-function entrypoints cannot be imported by vitest (Deno-only imports:
  `https://deno.land/std/...`, `npm:@supabase/server`, `Deno.env`). Every money-critical decision was
  therefore extracted into a pure module — `supabase/functions/run-ai-app/credit-core.ts` — with injected
  side effects (an `rpc` callable, a `charge` callback, a logger), and the entrypoints were then driven
  end-to-end through an alias-stubbed harness (Deno imports → local stubs, mocked `fetch`, mocked
  service-role Supabase client, mocked `Deno.upgradeWebSocket`). The harness is a temporary local
  artifact (not committed) and covers 14 run-ai-app handler tests + 9 proxy-openai handler tests,
  including "zero balance ⇒ provider `fetch` never called".
* Command used in this environment (the repo `node_modules` is stripped, so an offline vitest cache is
  used; per instruction, `npx vitest` fell back to the cached runner — equivalent to
  `node node_modules/vitest/vitest.mjs run` once deps are restored):
  `npx --offline vitest@5 run --config /tmp/kilo/vitest.node.config.mjs` (93 green), plus the two
  harness configs (14 + 9 green). No network, no paid API calls, no real Supabase project.

## New file: `supabase/functions/run-ai-app/credit-core.ts`

Pure, dependency-injected core shared by both functions (proxy-openai imports it):

| Export | Line | Purpose |
|---|---|---|
| `deriveUserIdFromVerifiedContext` | credit-core.ts:62 | billed identity from **verified claims only** |
| `classifyIncomingRequest` / `extractUpgradeToken` | credit-core.ts:98, 80 | HTTP vs WS-upgrade classification, token extraction |
| `insufficientCreditsBody` / `creditGateHeaders` | credit-core.ts:124, 141 | machine-readable 402 body + headers |
| `evaluateCreditGate` | credit-core.ts:169 | the preflight decision (fail-closed, unpriced-model refusal, 402) |
| `extractUsageFromEvent` / `isTerminalErrorEvent` / `SseUsageParser` | credit-core.ts:257, 295, 308 | usage mapping (input/output/cached) + SSE scanning |
| `decideStreamCharge` | credit-core.ts:426 | billing decision for finished/aborted streams |
| `createBillingTee` | credit-core.ts:503 | byte-for-byte tee with once-only finalize (`settled` flag) |
| `deductUsageCredits` | credit-core.ts:595 | exactly one atomic `deduct_credits` RPC call per billable run |
| `computeRealtimeCreditsFromWindow` | credit-core.ts:653 | per-connected-minute realtime billing |

## Findings per audit area

### 1. Verified Clerk identity — PASS (after fix)

* POST path verifies the JWT through `createSupabaseContext(req, { auth: "user" })` and derives the id
  from verified claims only: `deriveUserIdFromVerifiedContext` (run-ai-app/index.ts:285). `auth: "user"`
  accepts a **user JWT only** — anon/publishable keys (`auth: 'publishable'`) and secret keys
  (`auth: 'secret'`) do not match that mode, so they can never bill against a user balance
  (per `@supabase/server` docs, "Choose an auth mode": each mode names the credential it accepts).
* WS upgrade verifies identity **exactly once, in the upgrade handler**, using the token extracted from
  the query string: `classifyIncomingRequest` (index.ts:315) → `extractUpgradeToken` (index.ts:335) →
  `authenticateRequest(req, token)` → `handleRealtimeSession(req, auth.userId)`. The verified id is
  passed down; the session handler never re-derives or trusts anything else (comment at index.ts:766).
* No client-supplied identity is trusted anywhere: `RunAIAppRequest` has no `user_id` field, and the
  adapter that legacy agent pages now use (`src/pages/agents/runViaRunner.ts:97`) strips `userId`
  before sending. Proven by test: "never trusts unverified fields such as a request body or user_id
  echo" (tests/run-ai-app-credit-core.test.ts).
* proxy-openai verifies the bearer token via the anon client and takes `user.id` only from the verified
  user (proxy-openai/index.ts:45-68); the billed identity is the token `sub` (proxy-openai/index.ts:49,
  320-321).

### 2. Authorization / ownership — PASS

* `user_id` for every balance read and every deduction is the verified JWT sub (index.ts:285, 451-455,
  590-600; proxy-openai/index.ts:320-321). Balances are read and written with
  `.eq('user_id', userId).eq('app_id', CREDITS_APP_ID)` on the service-role credits client
  (index.ts:66-74, run-ai-app getCreditBalance; proxy-openai/index.ts:94-107), so no cross-user row can
  be touched. The Clerk re-keyed credit tables carry Clerk subs as TEXT
  (migrations `20261011120000_clerk_credit_system_alignment.sql:43-93`).
* Security-definer RPCs are revoked from `anon`/`authenticated` and granted to `service_role` only
  (migration 20261011120000:209-212), so a signed-in user cannot mint/burn credits directly.

### 3. Credit preflight — PASS (after hardening)

* Balance is checked **before** any provider call: `evaluateCreditGate` (index.ts:451) runs before the
  `fetch("https://api.openai.com/v1/responses", …)` at index.ts:487. Proven by harness tests:
  "402 preflight: zero balance blocks the provider call entirely" asserts `fetchMock` was **never
  called** and `credits.rpc` was never called.
* Insufficient credits → **402 with a machine-readable body**: `{ error: "INSUFFICIENT_CREDITS",
  message, required, balance, model }` (credit-core.ts:124-139) plus `X-Credits-Balance` /
  `X-Credits-Required` headers (credit-core.ts:141). The previous proxy body (`error: 'Insufficient
  credits'`, human string) was replaced with the same machine-readable code (proxy-openai/index.ts:109,
  264).
* Unpriced models are refused before spend: gate returns **500 `MODEL_NOT_PRICED`** for run-ai-app
  (credit-core.ts:184-196) and **400 `MODEL_NOT_PRICED`** for proxy-openai's client-supplied model
  (proxy-openai/index.ts:123-134, 243). This also closes the "estimate is 0 for an unpriced model ⇒
  `balance < 0` is false ⇒ call proceeds uncharged" hole that a price-table gap would otherwise open.
* Balance-read failures fail **closed** (500 `CREDIT_BALANCE_UNAVAILABLE`, credit-core.ts:172-178) —
  never a guessed balance.
* Realtime sessions are gated by a one-minute-minimum balance check before the ephemeral token is
  minted (index.ts:822-828).

### 4. Atomic deductions & concurrency — **CRITICAL DB-SIDE GAP REPORTED; edge side proven**

* **Edge side (proven):** `deductUsageCredits` issues **exactly one** `credits.deduct_credits` RPC call
  per billable run and performs **no read-modify-write of its own** (credit-core.ts:595-650). Atomicity
  is delegated to the DB-side RPC, which is the only mutation point. Tests prove: exactly-once
  delegation (tests/credit-concurrency.test.ts, "issues exactly one RPC call per billable run"), and,
  against a mock that emulates an **atomic** RPC (per-row serialization + conditional balance check +
  non-negative backstop): 5 parallel runs vs an exact balance → all 5 bill, final balance 0, total
  deducted == billed usage, no negative-balance attempt; 50 parallel deductions of 1 credit vs a
  balance of 25 → exactly 25 succeed and 25 are refused; balance covering 2 of 5 runs → exactly 2
  succeed; concurrent users never touch each other's balances; concurrent flush+cancel on the same
  stream cannot double-bill.
* **DB-side gap (cannot be fixed from my file ownership — no migration edits allowed):** the current
  `credits.add_credits` / `credits.deduct_credits` bodies are a read-then-write with **no row lock and
  no guarded UPDATE**:
  `SELECT balance_credits INTO v_current_balance … ; UPDATE credit_balances SET balance_credits =
  v_new_balance WHERE user_id = … AND app_id = …`
  (migrations `20260924000002_credit_system_functions.sql:29-56` and the newer
  `20261011120000_clerk_credit_system_alignment.sql:121-148`). Under concurrency, two deductions can
  read the same balance and both write the same new value → **lost updates (double-spend)**: 200
  credits of provider spend recorded in `credit_transactions` while the balance drops by only 100. The
  `CHECK (balance_credits >= 0)` constraint (migration `20260924000000_create_credit_system.sql:28`)
  prevents negative balances but does **not** prevent lost updates. A deterministic tripwire test for
  this gap is committed: "DETECTOR: the current SQL RPC body (read-then-write, no row lock) can lose
  deductions" (tests/credit-concurrency.test.ts) — it must be flipped to assert atomicity once the SQL
  is fixed.
* **Required SQL fix (for the migration owner):** lock the balance row inside the function, e.g.
  `SELECT balance_credits INTO v_current_balance FROM credits.credit_balances WHERE user_id = p_user_id
  AND app_id = p_app_id FOR UPDATE;` (plus upsert-with-`ON CONFLICT` before the lock for the missing-row
  case), or an atomic guarded update:
  `UPDATE credits.credit_balances SET balance_credits = balance_credits - ABS(p_amount) WHERE user_id =
  p_user_id AND app_id = p_app_id AND balance_credits >= ABS(p_amount) RETURNING balance_credits;`
  and `RAISE EXCEPTION` when no row is returned. Keep the function `SECURITY DEFINER` and
  service-role-only EXECUTE.
* Related edge-side hardening: when a deduction fails because the balance could not cover the bill
  (concurrency drained it, or the pre-flight estimate was optimistic), the code logs a loud
  `CREDIT_SHORTFALL` line with user/app/model/credits for reconciliation
  (credit-core.ts:622-629; test "logs a CREDIT_SHORTFALL when the balance could not cover the bill").

### 5. Token accounting — PASS (parity verified; cached tokens now captured)

* Usage mapping from provider responses: Responses shape (`response.usage.input_tokens` /
  `output_tokens`) and Chat-Completions shape (`usage.prompt_tokens` / `completion_tokens`), extracted
  by `extractUsageFromEvent` (credit-core.ts:257-293) and the incremental `SseUsageParser`
  (credit-core.ts:308).
* **Cached tokens:** OpenAI's `input_tokens` already *includes* cached tokens
  (`input_tokens_details.cached_tokens` / `prompt_tokens_details.cached_tokens`). They are now captured
  and written to the ledger metadata as `cached_input_tokens` (credit-core.ts:637-641), and are **never
  added on top of `input_tokens`** — a committed test asserts the billed amount equals
  `creditsForTokens(1000, …) + creditsForTokens(200, …)` for a response reporting 800 cached tokens,
  i.e. no double counting. Billing remains at the full input rate (conservative); a discounted cached
  rate is a pricing decision that must land in **both** `creditRates.ts` and `src/lib/credit-math.ts`
  (see residual risks).
* **Rate-table parity:** `MODEL_CREDIT_RATES`, `CREDITS_PER_DOLLAR`, `DALLE_CREDITS_PER_IMAGE`,
  `WHISPER_CREDITS_PER_MINUTE` and the per-token math are **identical** between
  `supabase/functions/_shared/creditRates.ts` and `src/lib/credit-math.ts` — locked by a committed test
  that iterates every model × token count and compares both directions (no discrepancy found, so no
  change was needed in `creditRates.ts`).
* Non-streaming runs bill exact usage with a 1-credit floor (index.ts:547-558; proxy-openai
  calculateActualCost proxy-openai/index.ts:141-159 + extractUsage index.ts:178).

### 6. Streaming disconnect handling — PASS (this was the main behavioral fix)

* **Fixed: streams are no longer billed when the provider produced nothing or errored.** Previously
  both functions billed the conservative estimate for *any* stream that ended without a usage event —
  including a connection that failed before a single byte arrived, and a stream that ended with a
  terminal error event. `decideStreamCharge` (credit-core.ts:426-483) now returns:
  * `exact_usage` — terminal usage seen → exact credits (floor 1);
  * `partial_estimate` — bytes consumed but no usage (client abort mid-stream) → the conservative
    pre-flight estimate, so partial provider spend is never free;
  * `no_bytes_no_charge` — zero bytes from the provider → **no charge** (connection failure);
  * `error_event_no_charge` — terminal `error` / `response.failed` / Chat-Completions `{error: …}`
    frame → **no charge**.
* **Billed exactly once:** `createBillingTee` (credit-core.ts:503-560) forwards every chunk to the
  client *first* (billing never delays output) and settles through a synchronous `settled` flag shared
  by `flush` and `cancel`, so a flush/cancel race cannot double-bill (test: "bills exactly once when
  flush and cancel race"; also "concurrent flush+cancel on the same stream cannot double-bill" and
  "a client abort mid-stream is billed once with the estimate" — 1 charge of the estimate).

### 7. Failed-request handling — PASS

* Non-OK OpenAI responses return before any spend (index.ts:489-497 → 502/400; proxy passes the
  upstream status through, proxy-openai/index.ts:432-438); proven by harness test "provider error
  response: no charge at all" (no RPC, balance untouched).
* Network failure to the provider → 503 (proxy) / caught → 500 (run-ai-app) with **no deduction**.
* SSE error events are well-formed because the provider's bytes are forwarded unchanged; terminal
  error events additionally suppress billing (area 6). Malformed SSE frames are ignored by the parser
  (test "ignores malformed JSON frames without throwing").
* Fixed: malformed JSON request bodies now return **400** instead of a 500 with a raw parse message
  (index.ts:340-346).

### 8. No WebSocket billing bypass — PASS

* Non-realtime WS upgrades → **426 Upgrade Required** before any auth/provider work
  (`classifyIncomingRequest` index.ts:315-322; harness test asserts 426 with `fetch` untouched).
* Only `?mode=realtime` upgrades proceed, and only after identity verification in the upgrade handler
  (index.ts:324-337); a missing/invalid token → 401 (harness test).
* Realtime billing: per-connected-minute rate, billed once on socket close through the same atomic RPC
  with `source: 'realtime_session'` (index.ts:884-899, `computeRealtimeCreditsFromWindow`
  credit-core.ts:653). Degenerate windows (never-opened socket, clock skew) bill 0
  (credit-core.ts:654-662; committed tests). Realtime is refused for apps without a `realtime` config
  (index.ts:797-801; harness test). Known trade-off (accepted, documented in code): a 30-second
  session bills a full minute (rate is per-minute, rounded up) — conservative for the platform.

### 9. No unauthorized provider usage — PASS

* `OPENAI_API_KEY` is read from server env only (index.ts:401; proxy-openai/index.ts:270); proxy returns
  500 without it (harness test asserts no `fetch`, no RPC).
* Demo-mode fallback (no config or no key) returns `success: true` with `metadata.demo = true` and
  **no deduction and no provider call** (index.ts:409-421; harness test "demo mode … labeled, not
  billed, no provider call"). The client surfaces an amber "Demo mode" banner from that flag.
* No fallback anywhere spends without credits: every paid path passes through the preflight gate
  (area 3), and the only un-paid path is the explicitly labeled demo response.

## Also hardened this round (cross-agent items)

* **`vector_store_ids` input safety (Subagent 4's client now sends them):** the server-side reader
  (index.ts:228-248) previously forwarded whatever array the client sent straight to OpenAI. It now
  keeps only non-empty string ids, caps each id at 200 characters, and caps the list at 20 ids
  (`MAX_VECTOR_STORE_IDS` / `MAX_VECTOR_STORE_ID_LENGTH`, index.ts:59-60). Billing is unaffected
  (token-based, still gated by the preflight). Verified by harness test: a 500+ element flood with
  objects/numbers/oversized strings arrives at OpenAI as exactly 20 clean string ids.
* **`proxy-openai` 402/400 bodies** are now machine-readable (`INSUFFICIENT_CREDITS` /
  `MODEL_NOT_PRICED`) and share the core's headers — no src consumer reads these strings (verified by
  grep over `src/**`), so no client breakage.

## Test results

| Suite | File | Result |
|---|---|---|
| Credit core unit proofs | `tests/run-ai-app-credit-core.test.ts` | **49 passed** |
| Concurrency + failure modes | `tests/credit-concurrency.test.ts` | **11 passed** |
| Regression (untouched, existing mock pattern) | `tests/proxy-openai.test.ts` | **33 passed** |
| **Committed total** | 3 files | **93 passed** |
| Real-handler harness (local, not committed) | run-ai-app `serve()` handler | **14 passed** |
| Real-handler harness (local, not committed) | proxy-openai `serve()` handler | **9 passed** |

Coverage in the committed suites: identity derivation (claims-only, null cases, body-tampering),
upgrade classification (426 / realtime / http, case-insensitive), 402 preflight + machine-readable
body, unpriced-model refusal, fail-closed balance errors, usage extraction for both provider shapes,
cached-token no-double-count, SSE parsing across arbitrary chunk boundaries + CRLF + malformed
frames, all four billing decisions, byte-for-byte tee forwarding, once-only billing under
flush/cancel races, abort/zero-byte/error-event billing, the RPC contract (args shape, 0-on-error,
CREDIT_SHORTFALL logging, never-throws), realtime window billing, rate-table parity with the client,
5-parallel/exact-balance and 50-parallel/drain concurrency against a serialized mock RPC, per-user
isolation, gate-blocks-provider proof, ledger-outage handling, and the racy-SQL tripwire.

## Residual risks

1. **DB-side atomicity (HIGH, blocks "no double-spend" guarantee):** the `deduct_credits` RPC is still
   a read-then-write without a row lock (see area 4). Until the migration owner applies `FOR UPDATE`
   (or a guarded `UPDATE … WHERE balance_credits >= p_amount RETURNING`), concurrent deductions can
   lose updates; the committed tripwire test documents the exact behavior. The edge layer is already
   correct-by-construction (single RPC call, no local read-modify-write).
2. **Pre-flight estimate granularity (MEDIUM):** the estimate uses ~4 chars/token and
   `config.maxTokens ?? 1000` output tokens. Non-Latin/code-dense inputs can make the *actual* cost
   exceed the estimate; the post-call deduction then fails with `CREDIT_SHORTFALL` (spend already
   happened, platform eats it — logged for reconciliation). Optional future hardening: atomic
   "reserve-then-adjust" (deduct the estimate before the call, refund/adjust after). Caveat for that
   design: the current `add_credits` bumps `total_purchased_credits` on refunds, so refund bookkeeping
   must be fixed in the same migration.
3. **Realtime token in the query string (LOW):** necessary because browser WebSockets cannot set
   headers; it is verified server-side before the socket is accepted, but it lands in proxy access
   logs (pre-existing, documented in the prior runtime-status report).
4. **Best-effort billing on cancel (LOW):** if the runtime tears the isolate down before the
   `cancel()` deduction promise settles, a mid-stream charge can be lost. The `settled` guard still
   prevents double-billing; Deno keeps the response alive until `flush` for the normal path.
5. **Cached-token discount (LOW/business):** cached input tokens are billed at the full input rate in
   both tables. Any discounted rate must be added to `creditRates.ts` **and** `src/lib/credit-math.ts`
   together (the parity test will otherwise fail).
6. **43 legacy agent slugs hit demo mode:** see cross-agent notes.

## Cross-agent notes

1. **`purchaseProcessor.ts` BigInt advisory lock (Subagent 1 — needs fix, still present):**
   `supabase/functions/_shared/purchaseProcessor.ts:135-146` computes an FNV-1a hash as a JS **BigInt**
   and passes it to `supabase.rpc('pg_advisory_lock', { key: lockKey })`. The supabase-js client
   JSON-stringifies the RPC body and `JSON.stringify` throws `TypeError: Do not know how to serialize a
   BigInt`, so every purchase webhook that reaches this path fails. Fix: pass `lockKey.toString()`
   (and the same for `pg_advisory_unlock` at line 163). I did not edit the file (Subagent 1's
   ownership).
2. **Identity architecture compatibility (Subagent 1):** `supabase/functions/_shared/identity.ts` +
   migration `20261011160000_clerk_identity_table.sql` resolve *buyer* emails to a verified
   `clerk_user_id`. My billing functions derive the billed id from the verified JWT sub only, which is
   the same Clerk sub (`clerk_identities.clerk_user_id`) that the credit tables are keyed by — the
   architectures are compatible; no change needed on my side, and I did not touch the identity files.
3. **Slug remap check (Subagent 4):** of the 117 distinct slugs now sent by
   `src/pages/agents/**` via `runViaRunner`, 62 have a specialized `APP_CONFIGS` entry and 12 use the
   generic fallback config. **43 resolve to neither → labeled demo-mode responses (200, `demo: true`,
   not billed — no credit-safety impact, but no product behavior).** One is a plain misremap:
   `AiBlogToPodcastAgentPage.tsx:47` calls `runViaRunner("ai-dashboard-designer-ai", …)` while the
   specialized config exists under `"dashboard-designer-ai"` (app-configs.ts:577, also used correctly
   by `BlogToPodcastAgentPage.tsx:47`). Recommend renaming that call site. `sprint-planner-ai` is
   correctly remapped and present in `APP_CONFIGS`.
4. **`vector_store_ids` (Subagent 4):** the client sends `inputs.vector_store_ids` via
   `withVectorStoreIds` (src/config/vectorStores.ts). Server side is now sanitized (strings only, ≤20
   ids, ≤200 chars each — index.ts:228-248) and the tool is still gated behind the preflight credit
   gate, so there is no unbounded-payload or uncharged-spend path. Note the pre-existing limitation
   (not a credit issue): there is still no UI to *create* vector stores, so ids must be configured via
   localStorage/env.
