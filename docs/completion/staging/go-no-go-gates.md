# Production GO / NO-GO Gate Checklist

Ten mandatory release gates. **All ten must be GO.** Any NO-GO blocks the release.

Gate numbering is derived from the mission's completion evidence in `docs/completion/`
(ci-netlify-report.md, auth-security-report.md, catalog-parity.md, runtime-status.md) and
from the eight certification areas in `certification-test-matrix.md`. No canonical gate
list exists in the repository — if the mission's authoritative numbering differs, map by
the "Evidence required" column, which is the part that is load-bearing.

## Derivation note

Gates 1–2 come from the CI/CD workstream, gates 3–4 from the security/auth workstream,
gates 5–8 from the eight certification areas (authentication, entitlement, credits,
purchase flow), and gates 9–10 from the catalog/runtime workstream. Every gate states the
exact artifact that constitutes its evidence.

---

## Gate 1 — CI/CD pipeline green

**Requirement:** the full pipeline runs and passes for the release commit.

**Evidence required**
- `gh pr checks <PR>` shows `CI/CD Pipeline` → `success` on the release commit's SHA.
- Steps: `npm run lint` (exit 0, ≤821 warnings), `npm test -- --run` (all pass — this step
  is a hard gate; `continue-on-error` was removed from it in PR #20), `npm run build`
  (exit 0). Type check is non-blocking by explicit decision (legacy baseline ~1,630 errors).
- `npx tsc -b` error count is at or below the recorded baseline.

**Current status: BLOCKED.** `pull_request.branches: [main, develop]` matched only the PR
*base* branch, so PR #20 (base `fix/sapienx-130-app-catalog`) never triggered the workflow
at all — `gh run list --commit <PR-20-head>` returned `[]`. Fixed in this change; needs a
push to take effect. See `staging-certification.md`.

## Gate 2 — Build & host configuration valid

**Evidence required**
- `netlify.toml`: `[build] command = "npm run build"`, `publish = "dist"`, no duplicate
  `from` paths across `netlify.toml` and `public/_redirects`.
- `gh pr checks` shows `netlify/videoremix/deploy-preview` → success on the release SHA,
  and the preview URL serves `200` (root and `/birthday-special/`).
- `npm run validate-env` passes (the `prebuild` hook hard-fails the build without
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

**Current status: PASS.** Verified for PR #20: preview `200`/`200`, Netlify redirect/header
rules checks success, and the root `netlify.toml` contains no duplicate `from` paths.
**Cleanup recommended before merge:** `.netlify/netlify.toml` is tracked in HEAD as a
Netlify resolution snapshot with absolute paths from another developer's machine and two
conflicting duplicate `/api/personalizer/{scan,generate}` redirect pairs. It is inert today
only because root `netlify.toml` takes precedence in Netlify's resolution order — `.gitignore`
listing `.netlify` does not help, because ignore rules never apply to already-tracked files,
so the file ships with the repository and would break any local Netlify build.

## Gate 3 — No secrets in the bundle or the repo

**Evidence required**
- `grep` of `dist/assets/*.js` for service-role keys, OpenAI keys and signing secrets
  returns nothing.
- `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_OPENAI_API_KEY`, `VITE_REQUEST_SIGNING_SECRET`
  are **not set** in any frontend build environment.
- CI logs and workflow files contain no secret literals.

**Current status: PASS (code-level), CONDITIONAL (ops).** The three variables are dead code
with no live consumer reachable from the app entry. The condition is operational: they must
not be set in the staging or production Netlify environments, because Vite inlines every set
`VITE_*` value into the public bundle.

## Gate 4 — Webhooks fail closed

**Evidence required**
- `webhook-zaxxa` and `webhook-paykickstart` reject an **unsigned** payload (`4xx`) and
  grant nothing (matrix C1/C2).
- A replay of a correctly signed event is a no-op (C4).
- `ZAXXA_WEBHOOK_SECRET` and `PAYKICKSTART_WEBHOOK_SECRET` exist as Supabase secrets before
  the functions are deployed.

**Current status: PASS (code), UNPROVEN (runtime).** Fail-closed guards are implemented in
`supabase/functions/_shared/webhookGuard.ts`. Not runtime-verified: the secrets are not set
in any environment reachable from here. **Sequencing rule: set the secrets BEFORE deploying
the webhook functions** — deploying first makes the functions reject every real purchase.

## Gate 5 — Database migration applied in order

**Evidence required**
- `supabase/migrations/20261011120000_clerk_credit_system_alignment.sql` applied to the
  target database **before** `run-ai-app` / `proxy-openai` are deployed.
- `credits.add_credits` / `credits.deduct_credits` reject the anon key (service_role only).
- Credits/usage keyed on Clerk text subs, not `auth.users` UUIDs.

**Current status: BLOCKED — approval required.** The migration exists as a file only. It has
not been applied to any database, and applying it is an owner decision.

**New during audit (ordering risk):** a second, untracked migration
`20261011160000_clerk_identity_table.sql` appeared from a concurrent workstream, alongside
new `supabase/functions/_shared/identity.ts`, `webhook-*/handler.ts` and `webhook-*/verify.ts`
modules. **Confirm the intended apply order between the two migrations before applying
either** — the credit/identity schema must be correct before `run-ai-app` / `proxy-openai`
are deployed, and the new `identity.ts` shared module suggests the identity model is still
being reworked.

## Gate 6 — Authentication certified

**Evidence required:** matrix block A, rows A1–A6, all passing, with the JWT-tamper and
unauthenticated rows backed by captured HTTP responses.

**Current status: BLOCKED — staging not provisioned.**

## Gate 7 — Entitlement certified

**Evidence required:** matrix block B, rows B1–B4, including the explicit negative test that
a superstring slug does not match, and the 130-catalog invariant.

**Current status: BLOCKED — staging not provisioned.**

## Gate 8 — Credited AI execution certified

**Evidence required:** matrix blocks D and F (D1–D6, F1–F6), including the 402-before-call
proof (no upstream model request when the balance is insufficient) and the `426` non-realtime
upgrade rejection.

**Current status: BLOCKED — staging not provisioned.**

## Gate 9 — Purchase flow certified

**Evidence required:** matrix block C, rows C1–C7, for **both** ZAXXA and PayKickstart.

**Current status: BLOCKED — staging not provisioned and provider webhook secrets unavailable.**

## Gate 10 — Legacy deep links & catalog compatibility certified

**Evidence required:** matrix block G, rows G1–G4, plus the invariant suite (37
`LEGACY_SLUG_ALIASES`, many-to-one, no alias equal to a canonical slug).

**Current status: BLOCKED — staging not provisioned.**

---

## Decision record

| Gate | Status |
|---|---|
| 1 — CI/CD pipeline green | **BLOCKED** (fix applied; needs push + re-verification) |
| 2 — Build & host config valid | **PASS** (with a `.netlify/netlify.toml` cleanup recommendation) |
| 3 — No secrets in bundle/repo | **PASS** (conditional on ops: do not set the 3 dead `VITE_*` secrets) |
| 4 — Webhooks fail closed | **PASS** in code; **UNPROVEN** at runtime |
| 5 — Migration applied in order | **BLOCKED** — owner approval required |
| 6 — Authentication | **BLOCKED** — staging not provisioned |
| 7 — Entitlement | **BLOCKED** — staging not provisioned |
| 8 — Credited AI execution | **BLOCKED** — staging not provisioned |
| 9 — Purchase flow | **BLOCKED** — staging not provisioned |
| 10 — Legacy deep links / catalog | **BLOCKED** — staging not provisioned |

**Overall: NO-GO for production.** Gates 1–5 are closeable by CI/ops actions; gates 6–10 are
closeable only by executing the certification matrix against a provisioned staging
environment, which requires the credentials listed in `credential-requirements.md`.
