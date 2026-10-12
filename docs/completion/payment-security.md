# Payment Security — Zaxxa ZPN & PayKickstart IPN webhooks

**Mission:** VideoRemix production readiness (PR19 completion)
**Scope:** `supabase/functions/webhook-zaxxa/**`, `supabase/functions/webhook-paykickstart/**`,
`supabase/functions/_shared/webhookGuard.ts`, `tests/webhook-*.test.ts`
**Date:** 2026-10-11
**Branch:** `kilo/pr19-completion`

---

## 1. Executive summary

The previous implementation verified **both** providers with the same generic
mechanism: read a shared secret out of a request header (`x-webhook-secret`,
`Authorization: Bearer`, `x-api-key`, …) or out of a `?secret=` / `?token=`
query parameter, and compare it to the configured secret.

Research of the actual provider specifications shows that mechanism is wrong in
**both** directions:

| | Old behaviour | Actual provider behaviour |
|---|---|---|
| Zaxxa ZPN | expected a secret in a header/query param | posts a form body carrying `hash_key` = `UPPER(MD5(seller_id + api_signature + trans_receipt + trans_amount))` |
| PayKickstart IPN | expected a secret in a header/query param | posts a form body carrying `hash` = HMAC-SHA1 over the sorted, filtered, pipe-joined form values, keyed with the **per-campaign** secret |

So the old code would have **rejected 100% of legitimate deliveries** (no
automated grants at all — a silent revenue outage), while still being trivially
bypassable by anyone who learned the URL and appended `?secret=<configured>`.
Additionally, both handlers watched for event names that the providers never
send (`order_success`, `sale_success`, `subscription_created`,
`subscription_cancelled`), so even a happy-path sale would have fallen through
to a no-op.

Both are now rewritten to the real specifications. All verification fails
closed, and 110 automated tests cover the forged / altered / duplicate /
missing-secret / stale-timestamp paths.

---

## 2. Provider specifications — confirmed, with sources

### 2.1 Zaxxa (Zaxaa) — ZPN (Zaxxa Payment Notification)

**Note on naming:** the vendor spells it both ways. `zaxaa.com` (XooGuu LLC)
uses "Zaxaa" internally and "Zaxxa" in partner integrations — e.g. LicenseEngine's
integration guide says *"Visit your account in **Zaxxa** and copy your **Zaxxa**
signature"* while the platform's own docs use "Zaxaa". They are the same product,
and the platform is the ZPN/IPN endpoint the repo calls `webhook-zaxxa`.

**Sources**

1. *Zaxaa Payment Notification (ZPN) Guide* — <http://www.zaxaa.com/p/zpn>
   - Confirms delivery is an **HTTP FORM POST** to the "Notification Handler URL"
     configured on the product.
   - Confirms verification is the seller's own secret:
     *"Another important data that will be needed by your ZPN listener script is
     your unique **API Signature**. Your script must use your own API signature to
     verify the validity of the notifications."*
   - Obtained at **Settings → Account Settings → "Show API Signature"**.
2. *ZPN and PDT Variables* — <http://www.zaxaa.com/p/zpn-pdt-vars>
   - Documents every POST field, including `hash_key` (*"Unique key to verify the
     validity of the ZPN"*), `trans_type`, `trans_receipt`, `trans_amount`,
     `seller_id`, `seller_email`, `cust_email`, `item_count` and the nested
     `products[x][…]` structure.
3. Archived official sample listeners (the "PHP Code Sample" / "Java Code Sample"
   links on the ZPN guide are dead; these are the Wayback captures of the exact
   URLs those links pointed at, and both implementations are byte-identical):
   - <http://web.archive.org/web/20200204012951/http://e526d29e057611599413-03e793fd560b09763197df610f0fba8f.r87.cf2.rackcdn.com/samples/zpn-php.txt>
   - <http://web.archive.org/web/20200204012951/http://e526d29e057611599413-03e793fd560b09763197df610f0fba8f.r87.cf2.rackcdn.com/samples/zpn-java.txt>

**Confirmed mechanism**

```php
// Zaxaa official PHP sample listener
$myHashKey = strtoupper(md5($sellerID . $signature . $transReceipt . $transAmount));
if ( $myHashKey == $hashKey ) { /* ZPN is valid */ }
```

```java
// Zaxaa official JSP sample listener — identical construction
String myHashKey = getMD5Hash(sellerID + apiSignature + transReceipt + transAmount)
                       .toUpperCase().trim();
if (myHashKey.equals(hashKey)) { /* ZPN is valid */ }
```

| Property | Value |
|---|---|
| Transport | `POST`, `application/x-www-form-urlencoded` |
| Signature field | `hash_key` (in the body, **not** a header) |
| Algorithm | **MD5** (not HMAC) of `seller_id + api_signature + trans_receipt + trans_amount` |
| Encoding | uppercase hex |
| Secret | Zaxxa **API Signature**, account-wide (Settings → Account Settings) |
| Transaction types | `SALE`, `FIRST_BILL`, `REBILL`, `CANCELED`, `REFUND` |
| Timestamp | `trans_date` exists (e.g. `2013-05-09 20:00:11 UTC`) but is **not part of the signed material** |
| IP allow-list | **Not documented anywhere in the vendor's docs** |
| Header signature | **None** |

**Consequences of the spec**

- `trans_amount` must be used as the **raw posted string** (e.g. `"47.00"`).
  Re-parsing it as a number changes the digest and rejects every genuine delivery.
- There is **no signed timestamp**, so a replay window cannot be enforced
  cryptographically. Replay defence is entirely *idempotency*: the
  `trans_type` + `trans_receipt` composite key.
- The signed material covers only `seller_id`, `trans_amount` and `trans_receipt`
  — **not** the purchased product. The product → entitlement binding is therefore
  enforced by the shared processor's exact-match catalog lookup (and pinned by the
  idempotency claim), not by the digest. This is documented as a residual risk.

### 2.2 PayKickstart — IPN (Instant Payment Notification)

**Sources**

1. *API Reference → Instant Payment Notification → IPN POST* —
   <https://docs.paykickstart.com/>
   - Confirms the delivery format, the full event list, every payload field, and
     the `hash` field: *"This is a hashed security key that can be used to
     validate that the IPN POST received is in fact valid / verified"*.
   - Publishes the **IPN Validation Function** in PHP, JavaScript and Python.
2. *Using the Product IPN URL Field* —
   <https://support.paykickstart.com/articles/5892063-using-the-product-ipn-url-field>
   - *"If you have multiple Paykickstart campaigns, you need to implement this
     (campaign id lookup) into your script. **a single, static secret key in your
     code will only work for one campaign.** If an IPN from a different campaign is
     sent to your endpoint, the verification will fail. The Solution here is to use
     Dynamic Key Verification."*

**Confirmed mechanism** (from the published PHP reference)

```php
// PayKickstart "IPN Validation Function"
$ipnHash = $data['hash'];
unset($data['hash'], $data['verification_code']);

foreach ($data as $key => $item) {
    $data[$key] = iconv("UTF-8", "ISO-8859-1//IGNORE", trim($item));
}

ksort($data, SORT_STRING);          // sort by KEY

$hash = hash_hmac('sha1', implode("|", $data), $secretKey);
if ($ipnHash !== $hash) { /* invalid */ }
```

| Property | Value |
|---|---|
| Transport | `POST`, `application/x-www-form-urlencoded` |
| Signature field | `hash` (falls back to `verification_code`); in the body, **not** a header |
| Algorithm | **HMAC-SHA1** over the canonical string |
| Canonical string | drop `hash` + `verification_code`; trim each value; drop values that are empty afterwards; **sort remaining keys**; join values with `\|` |
| Secret | **per campaign** — located in campaign settings *"find the Product IPN URL field, and below you'll find the Secret Key"* |
| Events | `sales`, `refund`, `subscription-payment`, `subscription-created`, `subscription-cancelled`, `subscription-completed`, `subscription-trial-start`/`-end`, `subscription-payment-failed`, `subscription-pending-cancelation`, `subscription-pending-cancellation-revoked`, `subscription-updated`, `subscription-changed`, `subscription-pause`, `subscription-unpaused`, `cart-abandoned`, `trial-expiring`, `transaction-pending`, `subscription-reminder`, `lead-*`, `in_progress`, `fulfilling`, `shipped`, `delivered`, `returned`, `refunded`, `on_hold` |
| Timestamp | `transaction_time` (unix seconds) **is part of the signed material** |
| IP allow-list | **Not documented** |
| Header signature | **None** |

**Consequences of the spec**

- The secret is **per campaign**, so a static `PAYKICKSTART_WEBHOOK_SECRET` can
  only verify one campaign. An event from any other campaign must be rejected,
  never verified against another campaign's key.
- Because `transaction_time` is signed, the replay window enforced here is
  **cryptographically bound** — an attacker cannot push a stale delivery back
  inside the window, unlike with Zaxxa.
- `transaction_id` is *"Unique per charge (PK-T…) — changes on every rebill"*, and
  several IPNs fire for the same charge (`sales` + `subscription-created`). The
  idempotency key is therefore `event:transaction_id`, not `transaction_id`.

### 2.3 What neither provider supports

- **No signature header.** There is no documented HMAC header for either platform,
  so no header-based check can be implemented (this is why the generic
  header-secret API was removed rather than kept).
- **No documented IP allow-list**, so no source-IP restriction is enforced.
- **Zaxxa has no signed timestamp**, so no authenticated replay window exists for
  it; the defence is exactly-once claiming instead.

---

## 3. Implementation

### 3.1 `supabase/functions/_shared/webhookGuard.ts` (rewritten)

Provider-agnostic primitives only. It no longer knows or guesses how any provider
signs; it provides what must be identical everywhere:

| Helper | Purpose |
|---|---|
| `constantTimeEqual(a, b)` | Timing-safe, length-independent comparison |
| `md5Hex(input)` | Self-contained RFC 1321 MD5 over UTF-8 bytes (Zaxxa spec). No remote module import, so it is unit-testable. |
| `hmacBytesHex(alg, secret, bytes)` | HMAC via WebCrypto `crypto.subtle` (identical in Deno edge runtime and Node test runner) |
| `buildPaykickstartCanonical(fields, mode)` | Byte-string canonical form the PayKickstart reference hashes |
| `encodeFieldValue(v, mode)` | `'php'` mode reproduces `iconv("UTF-8","ISO-8859-1//IGNORE", …)`; `'ascii'` reproduces the Python sample's `cleanString()` |
| `parseUrlencodedBody(raw)` / `readWebhookBody(req)` | Form parsing with bracket-notation expansion (`products[0][prod_number]`) and `name[]` append semantics |
| `checkReplayWindow(eventSeconds, nowSeconds, maxAgeMinutes)` | Replay window; `0` disables |
| `parseUnixSeconds(value)` | Strict unix-seconds parse (junk → `null`) |
| `claimWebhookEvent(supabase, ref)` | Insert-or-detect exactly-once claim |
| `finalizeWebhookEvent(supabase, logId, status, error)` | Terminal audit state, never throws |

**Removed (no provider uses it):** `verifyWebhookSecret`, `extractWebhookSecret`,
`WEBHOOK_SECRET_HEADERS`, `extractEventId`, `hmacHex`, `redactSecret`.

### 3.2 `supabase/functions/webhook-zaxxa/`

| File | Role |
|---|---|
| `verify.ts` | Zaxxa spec: `computeZaxxaHashKey`, `verifyZaxxaZpn`, `extractZaxxaProducts`, `zaxxaEventId`, `toProcessedPurchase` — with the source citations inline |
| `handler.ts` | Full request path (no Deno imports, so vitest can drive it) |
| `index.ts` | Thin `serve()` bootstrap reading `ZAXXA_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Flow: reject non-POST → parse body → **verify `hash_key`** (fail closed, 500 if
the signature is unconfigured) → derive the idempotency key
`trans_type:trans_receipt` → claim the delivery → dispatch:

- `SALE` / `FIRST_BILL` / `REBILL` → `processPurchase` through the shared processor.
  `REBILL` is granted on purpose: it is a distinct charge with its own receipt,
  and `grantAppAccess` upserts on `(user_id, app_slug)`, so a renewal refreshes
  `expires_at` rather than stacking entitlements.
- `CANCELED` → deactivate the subscription and its subscription-scoped access.
- `REFUND` → mark the purchase refunded and deactivate its access rows.

### 3.3 `supabase/functions/webhook-paykickstart/`

| File | Role |
|---|---|
| `verify.ts` | PayKickstart spec: canonical builder, `computePaykickstartHashes`, `verifyPaykickstartIpn`, `buildPaykickstartSecretMap`, event vocabulary, `paykickstartEventId`, `toProcessedPurchase` |
| `handler.ts` | Full request path (no Deno imports) |
| `index.ts` | Thin `serve()` bootstrap building the per-campaign secret map |

Flow: reject non-POST → parse body → **verify `hash` against the campaign's
secret** (500 if no secret configured, 401 for unknown campaign / missing /
invalid hash) → **enforce the replay window on the signed `transaction_time`**
(default 7 days, `PAYKICKSTART_REPLAY_WINDOW_MINUTES` to override, `0` to
disable) → claim `event:transaction_id` → dispatch:

- Grants: `sales`, `subscription-created`, `subscription-payment`,
  `subscription-trial-start`, `subscription-updated`,
  `subscription-pending-cancellation-revoked`, `subscription-unpaused`
- Cancels: `subscription-cancelled`, `subscription-pending-cancelation`,
  `subscription-pause`
- Refunds: `refund`, `refunded`
- Everything else (`cart-abandoned`, `lead-added`, `transaction-pending`,
  `shipped`, `on_hold`, …) is logged and acknowledged with no grant.

**Per-campaign secrets.** `PAYKICKSTART_WEBHOOK_SECRETS` is a JSON object of
`{ "<campaign_id>": "<secret>" }`. An incoming `campaign_id` with no entry is a
**rejection** — there is deliberately no wildcard fallback, because the vendor's
own guidance is that one static secret maps to one campaign. A bare
`PAYKICKSTART_WEBHOOK_SECRET` is accepted for single-campaign accounts and
applies to no campaign id by default (`FALLBACK_CAMPAIGN_IDS = []`), so it
cannot silently verify an unrelated campaign.

**Non-ASCII.** The two published reference implementations disagree on Latin-1
supplement characters: the PHP reference transliterates them to their byte value,
the Python sample drops every code point ≥ U+0080. The verifier computes both and
accepts either match. Both still require the campaign secret, so accepting both
does not widen what an attacker can do.

### 3.4 Fail-closed behaviour

| Condition | Status | Grant |
|---|---|---|
| Secret not configured | 500 | none, no DB access at all |
| No signature field / unsigned body | 401 | none |
| Digest mismatch (wrong secret, altered body) | 401 | none |
| Unknown transaction type / event / unknown campaign | 401 | none |
| `transaction_time` missing, future, or outside the window | 401 | none |
| Non-POST | 405 | none |
| Verified but buyer has no verified Clerk identity | 500 (retryable) | none — purchase recorded `pending` for reconciliation |
| Processing failure (DB, grant) | 500 (retryable) | none |
| Verified but product not in catalog | 200 | purchase recorded, **0** app rows |
| Duplicate delivery | 200 `Event already processed` | none — processed exactly once |

---

## 4. Test matrix

`npx vitest run tests/webhook-*.test.ts` — **110 tests, 110 pass, 0 fail**.
Also verified under the repo's own `vitest.config.ts` (jsdom + `tests/setup.ts`),
which reports the same 110 passing.

| # | Scenario | Zaxxa | PayKickstart | Assertion |
|---|---|---|---|---|
| 1 | Verified sale grants entitlements | ✅ | ✅ | 1 purchase, exactly the product's `apps_granted`, no unrelated app row |
| 2 | Grant scoped to the purchased product | ✅ | ✅ | `app-secret-internal` from an unrelated catalog product is never granted |
| 3 | Unmatched product grants nothing | ✅ | ✅ | 0 `user_app_access` rows |
| 4 | Look-alike / wildcard product name | ✅ | ✅ | no fuzzy match, 0 access rows |
| 5 | Forged request, no signature | ✅ | ✅ | 401, 0 purchases, 0 access rows, no user created |
| 6 | Empty body | ✅ | — | 401, nothing granted |
| 7 | Signed with the wrong secret | ✅ | ✅ | 401, nothing granted |
| 8 | Altered payload, valid digest otherwise | ✅ | ✅ | 401, nothing granted |
| 9 | Amount tampered after signing | ✅ | — | 401, nothing granted |
| 10 | Product swapped after signing | — | ✅ | 401, nothing granted |
| 11 | Bare forged digest value | — | ✅ | 401 |
| 12 | Missing secret env | ✅ | ✅ | 500, `from()` never called, nothing granted |
| 13 | Signature is whitespace only | ✅ | — | 500, no DB access |
| 14 | Unknown campaign | — | ✅ | 401, nothing granted (no fallback to another campaign's secret) |
| 15 | Second configured campaign accepted | — | ✅ | 200, correct grants |
| 16 | Unknown transaction type / event | ✅ | ✅ | 401, nothing granted |
| 17 | No buyer email | ✅ | ✅ | 500, nothing granted |
| 18 | Timestamp outside replay window | n/a (not signed) | ✅ | 401, nothing granted, `from()` never called |
| 19 | Future-dated timestamp | n/a | ✅ | 401 |
| 20 | Missing timestamp | n/a | ✅ | 401 |
| 21 | Tighter configured window honoured | n/a | ✅ | 401 |
| 22 | Fresh timestamp accepted | n/a | ✅ | 200, correct grants |
| 23 | Stale signed body cannot be re-windowed | n/a | ✅ | 401 (timestamp is signed material) |
| 24 | Duplicate delivery, sequential | ✅ | ✅ | both 200, exactly 1 purchase / 1 log row / 2 access rows |
| 25 | Concurrent duplicate (unique-violation path) | ✅ | ✅ | exactly 1 winner, 1 purchase, 2 access rows |
| 26 | Different event type, same receipt/charge | ✅ | ✅ | both processed (no false duplicate) |
| 27 | REBILL is a distinct charge | ✅ | ✅ | 2 purchases, still 2 access rows (entitlement not stacked) |
| 28 | `subscription-created` hyphenated event | — | ✅ | 200 + subscription row + `subscription` access type |
| 29 | Non-granting events never grant | — | ✅ (11 events: `refund`, `refunded`, `subscription-cancelled`, `subscription-pause`, `subscription-pending-cancelation`, `transaction-pending`, `cart-abandoned`, `lead-added`, `subscription-trial-end`, `shipped`, `on_hold`) | 200, 0 new purchases, 0 new grants |
| 30 | Refund revokes access | ✅ | ✅ | `purchases.status = refunded`, `user_app_access.is_active = false` |
| 31 | Cancel revokes access | ✅ | ✅ | `subscription_status.status = cancelled`, access deactivated |
| 32 | Unverified buyer fails closed | ✅ | ✅ | 500, purchase `pending` + `user_id = null`, 0 access rows |
| 33 | No fabricated accounts | ✅ | ✅ | `auth.admin.createUser` never called |
| 34 | Grant path is exactly-once | ✅ | ✅ | upsert on `(user_id, app_slug)` |
| 35 | Non-POST | ✅ | ✅ | 405 |
| 36 | CORS preflight | ✅ | ✅ | 200 |
| 37 | JSON delivery is not a signature bypass | ✅ | — | valid `hash_key` → 200; forged `hash_key` → 401 |
| 38 | Custom fields / array-valued fields are signed | — | ✅ | 200 (proves `custom_var1` and `licenses[]` are part of the digest) |
| 39 | Processing failure is retryable | ✅ | ✅ | 500 + audit row `failed` |
| 40 | No secret in logs or audit payload | ✅ | ✅ | every log line and `webhook_logs` row grepped for the test secrets |
| 41 | Side effects of the Zaxxa spec | ✅ | — | mutating `products[0][prod_name]` still verifies (proves the signed-material scope) |
| 42 | Zaxxa never signs a timestamp | ✅ | — | a month-old `trans_date` still verifies (documents why no window is enforced) |
| 43 | Amended hash / stale MD5 verification | ✅ | ✅ | digest mismatches rejected |
| 44 | Digest algorithm correctness | ✅ | ✅ | `md5Hex` matches known RFC 1321 vectors; canonical string matches the documented example body field-for-field and matches an independent re-implementation of the documented PHP algorithm |
| 45 | `?secret=` query parameter no longer accepted | ✅ | ✅ | a request carrying only `?secret=…` and no valid signature is 401 |

Additional coverage: 36 tests in `tests/webhook-verify.test.ts` (providers +
primitives + `claimWebhookEvent` semantics), 28 in `tests/webhook-zaxxa.test.ts`,
46 in `tests/webhook-paykickstart.test.ts`.

### Verification commands run

```
npx vitest run tests/webhook-verify.test.ts tests/webhook-zaxxa.test.ts tests/webhook-paykickstart.test.ts
  → Test Files 3 passed (3), Tests 110 passed (110)

npx vitest run   # full repo suite, regression check
  → Test Files 37 passed (37), Tests 602 passed (602)

node node_modules/eslint/bin/eslint.js . --ext ts,tsx --report-unused-disable-directives --max-warnings 821
  → 797 problems (0 errors, 797 warnings), exit 0

node node_modules/typescript/bin/tsc --noEmit --strict --noUnusedLocals --noUnusedParameters \
     --allowImportingTsExtensions … (all six changed files)
  → clean
```

Note: `node_modules/` was empty in this workspace and dependency installation is
out of scope for this subagent, so `npx vitest` resolved the declared
dependencies into `node_modules/` as a side effect of fetching the runner.
`node_modules` is git-ignored, so the working tree diff is unaffected.

---

## 5. Residual risks

1. **Zaxxa's digest is MD5 over a concatenation, not an HMAC.** This is the
   platform's specification and cannot be changed client-side. It is still
   unforgeable without the API signature (an attacker cannot compute
   `MD5(seller_id + secret + receipt + amount)` without the secret), but MD5 is
   cryptographically broken and the construction has no length-prefixing. A
   stolen Zaxxa API signature is the whole security boundary for Zaxxa.
2. **Zaxxa signs no timestamp.** `trans_date` is present but unauthenticated, so
   an attacker who replays a captured body can freely rewrite it. The control is
   `trans_type:trans_receipt` idempotency, which makes a byte-identical replay a
   no-op. There is no way to detect a *modified* replay cryptographically.
3. **Zaxxa's signed material excludes the product.** Only `seller_id`,
   `trans_amount` and `trans_receipt` are covered. A payload could name a
   different product while keeping a valid `hash_key`; the entitlement that
   results is bounded by the exact-match catalog lookup (no fuzzy matching) and,
   in practice, by the idempotency claim on the same receipt.
4. **PayKickstart's secret is per campaign.** Misconfiguration (a single
   `PAYKICKSTART_WEBHOOK_SECRET` for a multi-campaign account, or a missing
   `PAYKICKSTART_WEBHOOK_SECRETS` entry) is the most likely production failure
   mode: legitimate IPNs from an unlisted campaign will be **rejected** (fail
   closed) until the campaign id is added. Monitor for 401s after go-live.
5. **`webhook_logs` has no unique constraint**, so two concurrent deliveries of
   the same event can both insert a `pending` row before either inserts a grant.
   Entitlement grants remain exactly-once because `purchases` enforces
   `UNIQUE(platform, platform_transaction_id)` and `processPurchase` re-checks
   for an existing purchase before granting, and because `grantAppAccess` upserts
   on `(user_id, app_slug)`. **The recommended migration below upgrades the
   claim to true atomicity and should be applied before deploy.**
6. **Test-mode IPNs are authenticated and processed.** `mode` is part of the
   signed material, so a `test` IPN genuinely originates from this PayKickstart
   account and grants real entitlements. Whether that is wanted is an operational
   decision; `mode` is always logged so test traffic is visible.
7. **No IP allow-list** is available for either provider, so source IP cannot be
   used as an additional control. The functions must rely on the signature plus
   TLS.
8. **Pre-existing issue in a file this subagent does not own:**
   `_shared/purchaseProcessor.ts` derives its advisory-lock key with a `BigInt`
   (`FNV-1a` 64-bit) and passes it to `supabase.rpc('pg_advisory_lock', { key: lockKey })`.
   If the Supabase client serialises that argument with `JSON.stringify`, a
   `BigInt` throws and every purchase fails. This should be verified (and the key
   masked to ≤ 2⁵³-1, as this subagent does for the `webhook_logs` claim) by the
   owner of that file. The webhook handlers surface the failure as a retryable
   500 rather than swallowing it, so a retry can succeed.
9. **`webhook_payload` in `webhook_logs` stores the full inbound payload**,
   including the presented `hash_key` / `hash` values and buyer PII (email, IP).
   It contains no configured secrets — the tests assert this — but it is
   sensitive data subject to retention policy.

---

## 6. Required secrets and configuration (names only)

Set these before deploy. Values are obviously fake in all code and tests; no
real secret appears in this repository.

### Secrets

| Env var | Required | Notes |
|---|---|---|
| `ZAXXA_WEBHOOK_SECRET` | **Yes** (Zaxxa only) | The Zaxxa **API Signature** — *Settings → Account Settings → "Show API Signature"*. Account-wide. |
| `PAYKICKSTART_WEBHOOK_SECRETS` | **Yes** (PayKickstart) | JSON object `{"<campaign_id>": "<secret>"}` — one entry per PayKickstart campaign selling VideoRemix products. Required because the vendor's own docs state a static secret only verifies one campaign. |
| `PAYKICKSTART_WEBHOOK_SECRET` | Optional fallback | Single-campaign accounts only. Applies to **no** campaign id unless explicitly listed in `PAYKICKSTART_WEBHOOK_SECRETS`, so it cannot verify an unrelated campaign. |
| `SUPABASE_URL` | Yes | Existing |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Existing |

### Behavioural configuration

| Env var | Default | Notes |
|---|---|---|
| `PAYKICKSTART_REPLAY_WINDOW_MINUTES` | `10080` (7 days) | Replay window on the signed `transaction_time`. Generous by design because idempotency is the primary duplicate control and this is defence-in-depth. `0` disables. |

### Vendors to configure

- **Zaxxa:** product → *General Settings* → *Third Party Script Integration* = `Yes` → *Notification Handler URL* = `https://<project>.supabase.co/functions/v1/webhook-zaxxa`. ZPN must be on for each product that should grant access.
- **PayKickstart:** each campaign → *Product IPN URL* = `https://<project>.supabase.co/functions/v1/webhook-paykickstart`, and the *Secret Key* below it recorded in `PAYKICKSTART_WEBHOOK_SECRETS` against that campaign's id.

### Platform configuration (cross-agent dependency)

1. **Recommended migration — atomic claiming.** Apply before deploy (owned by
   the migrations workstream, not by this subagent):

   ```sql
   -- Make webhook_logs claiming atomic. `claimWebhookEvent` already detects a
   -- Postgres 23505 unique violation and treats it as a concurrent duplicate;
   -- without this index the insert simply succeeds for both racers.
   CREATE UNIQUE INDEX IF NOT EXISTS webhook_logs_provider_event_key
     ON public.webhook_logs (
       platform,
       event_type,
       COALESCE(webhook_payload ->> 'transaction_id',
                webhook_payload ->> 'trans_receipt')
     )
     WHERE COALESCE(webhook_payload ->> 'transaction_id',
                    webhook_payload ->> 'trans_receipt') IS NOT NULL;
   ```

2. **`verify_jwt = false` for both functions.** These are public, unauthenticated
   inbound webhook endpoints; they authenticate the *sender* via the provider
   signature, not via a Supabase JWT. If JWT verification is left on, every
   legitimate delivery is rejected before the signature is ever checked.
   `supabase/config.toml` does not currently declare any per-function settings:

   ```toml
   [functions.webhook-zaxxa]
   verify_jwt = false

   [functions.webhook-paykickstart]
   verify_jwt = false
   ```

   `config.toml` is outside this subagent's file ownership, so this is handed off.

3. **Entitlement catalog.** `products_catalog` rows for every purchasable Zaxxa /
   PayKickstart product, with `apps_granted` populated and `sku` matching the
   Zaxxa `products[x][prod_number]`. PayKickstart sends no SKU, so it relies on
   the exact-name path (`platform_product_mappings.platform_product_name` or the
   catalog `name` / `slug`). Note that `matchProduct` does not read
   `platform_product_mappings.platform_product_id`, so PayKickstart's numeric
   `product_id` cannot be used for matching today.

4. **Verified-buyer prerequisites.** No grant lands without a verified Clerk
   identity row in `public.clerk_identities` (see
   `_shared/identity.ts`). A verified seller who bought before their identity row
   exists will be recorded as a `pending` purchase and completed on the platform's
   next re-delivery, or by the reconciliation script. Re-delivery must be
   possible — hence the 500 (retryable) response on processing failure.

### Cross-agent dependencies / handoffs

| # | Item | Owner |
|---|---|---|
| 1 | Apply the `webhook_logs_provider_event_key` unique index | migrations workstream |
| 2 | Set `verify_jwt = false` for both functions in `supabase/config.toml` | deploy / config owner |
| 3 | Verify (and if needed fix) the `BigInt` advisory-lock key in `_shared/purchaseProcessor.ts` | purchaseProcessor owner |
| 4 | Seed `products_catalog` + `platform_product_mappings` for Zaxxa/PayKickstart products | catalog owner |
| 5 | Decide whether `mode: 'test'` PayKickstart IPNs should grant | product / vendor ops |
| 6 | Set the actual `ZAXXA_WEBHOOK_SECRET` and `PAYKICKSTART_WEBHOOK_SECRETS` values in the deploy environment | ops |

---

## 7. Files changed

| File | Status |
|---|---|
| `supabase/functions/_shared/webhookGuard.ts` | rewritten — provider-agnostic fail-closed primitives |
| `supabase/functions/webhook-zaxxa/index.ts` | rewritten — thin Deno bootstrap |
| `supabase/functions/webhook-zaxxa/verify.ts` | new — Zaxxa ZPN spec + purchase mapping |
| `supabase/functions/webhook-zaxxa/handler.ts` | new — testable request path |
| `supabase/functions/webhook-paykickstart/index.ts` | rewritten — thin Deno bootstrap |
| `supabase/functions/webhook-paykickstart/verify.ts` | new — PayKickstart IPN spec + purchase mapping |
| `supabase/functions/webhook-paykickstart/handler.ts` | new — testable request path |
| `tests/webhook-verify.test.ts` | new — 36 tests |
| `tests/webhook-zaxxa.test.ts` | new — 28 tests |
| `tests/webhook-paykickstart.test.ts` | new — 46 tests |
| `docs/completion/payment-security.md` | new — this report |

No other file was modified. `webhook-stripe`, `webhook-paypal`, `run-ai-app`,
`proxy-openai` and `src/**` are untouched.
