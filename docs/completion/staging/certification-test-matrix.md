# Staging Certification Test Matrix

Eight functional areas. Each has exact steps and an explicit pass/fail criterion. Run them
**in order** — later areas depend on state created by earlier ones.

**Preconditions**

- `environment-provisioning.md` completed; staging Supabase, Clerk, and Netlify targets live
  and isolated from production.
- Migration `20261011120000_clerk_credit_system_alignment.sql` applied (Gate 4 prerequisite).
- Edge functions deployed, `OPENAI_API_KEY` set to a spend-capped **staging** key.
- `ZAXXA_WEBHOOK_SECRET` and `PAYKICKSTART_WEBHOOK_SECRET` set for the functions under test.
- A staging browse session on `$STAGING_SITE_URL` with the browser devtools network tab open.

Record the actual result and evidence URL for every row. A row passes only on its stated
criterion — "works", "loads", or "no error" is not a pass.

---

## A. Authentication (Clerk)

| # | Step | Pass criterion |
|---|---|---|
| A1 | Load `$STAGING_SITE_URL/sign-up`. | Clerk sign-up component renders (not a custom form); turnstile/CAPTCHA present. No console error. |
| A2 | Register a new user with a fresh email. | Account created; redirected into the app; a `app_users` row exists for the Clerk **text** sub (not a UUID). |
| A3 | Sign out, then sign in at `$STAGING_SITE_URL/sign-in` with the same credentials. | Session established; dashboard renders with the signed-in identity. |
| A4 | While signed out, request a protected route (e.g. `/dashboard/my-apps`). | Redirect to `/sign-in` with the intended destination preserved in router state (`from`, `fromFull`); after sign-in you land on the original destination. |
| A5 | Copy the Clerk JWT from the network tab; call `run-ai-app` with a **modified** `sub` claim. | Request rejected. Identity is taken only from the verified JWT — never from a client-supplied field. |
| A6 | Call `proxy-openai` with no `Authorization` header. | `401`. Not `200`, not `500`. |

**A-block fails if:** any unauthenticated request returns `200`, or identity is read from the
request body.

## B. Entitlement resolution

| # | Step | Pass criterion |
|---|---|---|
| B1 | As the new user with **no** purchases, call the entitlement check for a catalog app. | Denied. Entitlements are exact-match — a superstring (e.g. `ai-blog-search-extra`) must **not** match `ai-blog-search`. |
| B2 | Grant exactly one app (e.g. `ai-sales-intelligence-pro`) via an admin path or a seeded purchase row. | That app is entitled. |
| B3 | Call the entitlement check for a *different* app. | Denied. No fuzzy/substring match. |
| B4 | Query the catalog size. | 130 unique slugs, 0 duplicates, 117 Awesome LLM + 13 VideoRemix. |

**B-block fails if:** any non-granted app returns entitled, or the catalog is not 130.

## C. Purchase flow (webhooks)

Test **both** providers. Never test against a live provider account — use staging mode.

| # | Step | Pass criterion |
|---|---|---|
| C1 | Send an **unsigned** POST to `webhook-zaxxa` with a valid-looking purchase payload. | Rejected `4xx`, no entitlement granted, no credit change. Fail-closed. |
| C2 | Send an unsigned POST to `webhook-paykickstart`. | Rejected `4xx`, no entitlement granted, no credit change. |
| C3 | Send a **correctly signed** ZAXXA purchase event for the test user. | Entitlement granted; `app_users` and purchase rows updated; response `2xx`. |
| C4 | Replay the **same** signed event (identical idempotency key). | Second delivery is a no-op: entitlement not regranted, credits not double-applied. |
| C5 | Repeat C3/C4 for PayKickstart. | Same outcome. |
| C6 | Inspect the purchase rows for temporary password usage. | No temp-password rows created. |
| C7 | Inspect the function logs for sensitive payload logging. | No full webhook body / secret logged. |

**C-block fails if:** any unsigned event grants an entitlement, or a replay double-credits.

## D. Credits

| # | Step | Pass criterion |
|---|---|---|
| D1 | Read the test user's credit balance via the UI or an authenticated call. | A balance is returned; matches the DB value exactly. |
| D2 | Run an AI app via `run-ai-app` (see F). | On success the balance decreases by exactly the published rate for the model used; a usage row is written. |
| D3 | Set the balance to 1 credit and run a paid app again. | Request is rejected `402` **before** any model call — verify in the function logs that no upstream OpenAI request was made. |
| D4 | Confirm the credit math against `src/lib/credit-math.ts` and its test suite. | Run-time deductions match the unit-tested rates for every model exercised. |
| D5 | Attempt `credits.add_credits` / `credits.deduct_credits` with the anon key. | Denied — the functions are `service_role`-only after the alignment migration. |
| D6 | Check that an unknown model name is rejected rather than silently billed at the cheapest rate. | `400` on an unrecognized model id. |

**D-block fails if:** the 402 gate fires *after* the model call, or a rate deviates from
`credit-math.ts`.

## E. Dashboard navigation

| # | Step | Pass criterion |
|---|---|---|
| E1 | Load `/dashboard` (Command Center). | Renders with the signed-in identity; no infinite skeleton, no error boundary. |
| E2 | Navigate to My Apps, App Library, Personalizer, Settings. | All five areas reachable and rendering. Agents appear as a **category inside** the App Library — not as a second inventory. |
| E3 | Trigger the 5-step onboarding flow as a brand-new user. | Onboarding completes and does not reappear. |
| E4 | Resize to a mobile viewport and open the dashboard. | Settings is reachable on mobile (the historical mobile bug must not have regressed). |
| E5 | Sign out and request each protected route. | All redirect to `/sign-in` with destination preserved. |

## F. App launch + AI execution

| # | Step | Pass criterion |
|---|---|---|
| F1 | From the catalog, launch an app the user is entitled to. | Navigates to `/ai-runner/:id` and the specialized component registers. |
| F2 | Launch an app the user is **not** entitled to. | Redirected to `/apps`; no runner mount. |
| F3 | Execute the app (research/generate). | Streamed response renders; a usage row and credit deduction exist; UI surfaces the 402 guidance on failure. |
| F4 | Exercise a **legacy deep link** (a pre-catalog slug from `LEGACY_SLUG_ALIASES`). | `resolveCanonicalSlug()` maps it to its canonical slug; the app opens and any prior entitlement still resolves. |
| F5 | Exercise an external-target app. | `window.open(..., "_blank", "noopener,noreferrer")`; no tabnabbing. |
| F6 | Open a WebSocket/upgrade request to `proxy-openai` that is not realtime. | `426` — the generic WebSocket spend bypass is closed. |

**F-block fails if:** an unentitled app runs, a legacy link 404s, or a non-realtime upgrade is
accepted.

## G. Legacy deep links & backwards compatibility

| # | Step | Pass criterion |
|---|---|---|
| G1 | Request a legacy purchase slug directly. | Resolves through `resolveCanonicalSlug()` to the canonical catalog entry; the customer's existing entitlement still works. |
| G2 | Request an unknown slug. | A clean not-found/redirect — never a 500 or a blank page. |
| G3 | Confirm no duplicate slug registry entries. | 130 unique canonical slugs; every alias maps many-to-one and no alias equals a canonical slug. |
| G4 | Verify `public/_redirects` and `netlify.toml` do not conflict. | `/birthday-special*`, `/assets/*` and the SPA `/* → /index.html` fallback all resolve; personalizer API routes resolve to distinct functions with no duplicate `from` paths. |

## H. Regression & build integrity (run on staging, after A–G)

| # | Step | Pass criterion |
|---|---|---|
| H1 | `npm run lint` on the deployed commit. | Exit 0; warnings ≤ 821 (the ratchet budget). |
| H2 | Full vitest suite on the deployed commit. | All collected files pass; no collection errors. |
| H3 | `npm run build`. | Exit 0. |
| H4 | Inspect `dist/assets/*.js` for secret-shaped strings. | No `service_role` key, no OpenAI key, no signing secret. |
| H5 | Re-run the C-block webhook checks **after** any webhook function redeploy. | Still fail-closed. A redeploy without the secret present must reject, not accept. |

---

## Sign-off

Certification passes only when **every** row in A–H passes, A/B/C/D/F/G/H have zero
exceptions, and each pass is backed by an evidence artifact (HTTP status + response body,
screenshot, or log excerpt) attached to the release record.

Any single failure in C, D, F or G is a production **NO-GO** without exception.
