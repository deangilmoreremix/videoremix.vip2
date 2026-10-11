# Staging Certification Report — VideoRemix.vip / SapienX

**Workstream:** Subagent 5 — Staging Certification (production-readiness mission)
**Branch:** `kilo/pr19-completion` · **Review PR:** #20 (`kilo/pr19-completion` → `fix/sapienx-130-app-catalog`, stacked on PR #19)
**Head commit audited:** `3f0b854a`
**Date:** 2026-10-11

**Outcome: NO-GO for production.** One release-gate blocker found and fixed
(Gate 1, CI never ran for PR #20). Netlify preview verified good. The staging certification
matrix could not be executed: the staging targets and provider credentials do not exist in
this environment, and the local dependency tree is not installed. Procedures and the exact
missing-credential list are now written so certification can start immediately on unblock.

**Not performed:** no git commands, no `npm install`, no deployments, no Supabase connection,
no use of production `.env` values, no Clerk or provider credential use. No secret values
appear in this report.

---

## 1. Gate 1 blocker — CI/CD never ran for PR #20 (CONFIRMED, FIXED)

### Root cause

Both gating workflows filtered `pull_request` on the PR **base** branch:

```yaml
# .github/workflows/ci.yml (before)
on:
  pull_request:
    branches: [main, develop]

# .github/workflows/netlify-deploy.yml (before)
on:
  pull_request:
    branches: [ main, master ]
```

In GitHub Actions, `on.pull_request.branches` matches the branch the PR is **merged into**,
not the branch it comes from. PR #20 targets `fix/sapienx-130-app-catalog`, which is in
neither list, so **neither workflow was ever triggered**.

### Evidence

```
$ gh run list --commit 3f0b854a        # PR #20 head
[]

$ gh api repos/:owner/:repo/commits/3f0b854a/check-runs
Redirect rules - videoremix      netlify         3f0b854a  completed/success
Header rules - videoremix        netlify         3f0b854a  completed/success
Pages changed - videoremix       netlify         3f0b854a  completed/neutral
Macroscope - Correctness Check   macroscopeapp    3f0b854a  completed/skipped

$ gh pr checks 20
netlify/videoremix/deploy-preview   pass   deploy-preview-20--videoremix.netlify.app
CodeRabbit                           pass   (bot review skipped)
Redirect rules - videoremix          pass
Header rules - videoremix            pass
Pages changed - videoremix           neutral
```

The only green checks are the **Netlify GitHub integration** and review bots. No
`CI/CD Pipeline` run, no `Netlify Deployment` run. The "CI/CD and Netlify preview pass"
release gate was therefore **not verifiable** for this PR — the Netlify preview is produced
by Netlify's own GitHub integration, which is independent of these workflows and independent
of whether the tests pass.

The only other `CI/CD Pipeline` / `Netlify Deployment` runs that exist for this branch
head are 18 `pull_request`-event runs from Oct 1–2 (run ids `36964428540` back to
`36804188022`, **all `failure`**) — those fired because those PRs targeted `main`, which
matched the old filter. That is exactly the false confidence: CI appeared to have a long
history of running on `fix/sapienx-130-app-catalog` while never running for the actual
release PR.

### Why this mattered more than usual here

PR #20's diff to `.github/workflows/ci.yml` **removed** `continue-on-error: true` from the
"Run tests" step. Tests are now a hard CI gate. A workflow that never runs cannot enforce
any gate — hard or soft.

### Fix applied

All three workflows now trigger on every PR, with production deploys still gated to push /
workflow_dispatch. Production deploy guards were left byte-for-byte intact.

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | `pull_request.branches: [main, develop]` → unfiltered `pull_request.types: [opened, synchronize, reopened, ready_for_review]` |
| `.github/workflows/netlify-deploy.yml` | `pull_request.branches: [main, master]` → unfiltered `pull_request.types: [opened, synchronize, reopened, ready_for_review]`; prod deploy guard unchanged |
| `.github/workflows/birthday-landing-deploy.yml` | dropped `branches: [main]` on the `pull_request` trigger; the path filters (`public/birthday-special/**`, `public/_redirects`) keep the blast radius small |

Production-deploy safety, verified after the edit:

```
$ grep -n "if: github.event_name\|--prod" .github/workflows/*.yml
netlify-deploy.yml:55:    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
netlify-deploy.yml:82:            netlify deploy --prod --dir=./dist
netlify-deploy.yml:98:    if: github.event_name == 'pull_request'          # preview only, no --prod
birthday-landing-deploy.yml:56:        if: github.event_name == 'pull_request'
birthday-landing-deploy.yml:63:        if: github.event_name == 'push'
birthday-landing-deploy.yml:64:        run: netlify deploy --prod ...
```

- `build-and-deploy` (the only `--prod` path in `netlify-deploy.yml`) still requires
  `push` to `main`/`master` or `workflow_dispatch`. **A PR cannot trigger a production
  deploy.**
- `preview-deploy` still requires `pull_request`, still runs `netlify deploy` **without**
  `--prod`. Preview deploys on PRs are permitted.
- `birthday-landing-deploy.yml` prod deploy still requires `push` to `main`.

### Verification status of the fix

The changes are uncommitted in the working tree. GitHub only evaluates workflow files from
the repository, so the fix takes effect on the next push and cannot be confirmed from here
without committing (prohibited for this workstream). Confirmation is a single command:

```bash
gh pr checks 20     # expect: CI/CD Pipeline and Netlify Deployment now appear and go green
```

Note that PR #20 already has a Netlify deploy-preview, so `netlify-deploy.yml`'s
`preview-deploy` job will additionally produce a second (branch-named) preview alongside
Netlify's own `deploy-preview-20`. Both are non-production.

---

## 2. Local gate suite — BLOCKED (dependency tree not installed)

The local dependency tree is missing. `node_modules/` contains only 17 committed symlinks
under `node_modules/.bin/` whose targets do not exist:

```
$ ls -la node_modules/
total 8
drwxr-xr-x 2 root root 4096 Oct 11 17:13 .bin
$ readlink -f node_modules/.bin/eslint
(empty)

$ npm run lint
sh: 1: eslint: not found

$ node node_modules/vitest/vitest.mjs --version
Error: Cannot find module '/workspace/app/node_modules/vitest/vitest.mjs'
```

`git ls-files node_modules` tracks 17 files — exactly those `.bin` symlinks, pinned by commit
`c1fafe33 chore: restore node_modules binaries and commit finished work`. The packages
themselves were never committed. There is a single git worktree and no other `node_modules`
anywhere on the filesystem, so this is not a worktree-path issue.

`npm install` / `npm ci` is prohibited for this workstream, so the gates were **not** run.
The tree is demonstrably restorable, from cache, without network:

```
$ npm ci --offline --dry-run
added 830 packages in 2s
135 packages are looking for funding
(exit 0)
```

Unblock with `npm ci --offline`, then run the four gates and compare against the baseline.

### Reference baseline (from `docs/completion/MISSION_STATUS.md` §6, commit `144d1053`)

| Gate | Baseline |
|---|---|
| `npm run lint` | exit 0 — 797 warnings, budget 821 |
| `npx vitest run` | 30 files / 421 tests pass |
| `npm run build` | exit 0 |
| `npx tsc -b` | 1,630 legacy errors (non-blocking by explicit decision) |

### Static pre-validation performed instead

With the gates unrunnable, the highest-risk parts were verified statically. The lint gate is
insulated from concurrent test churn — `eslint.config.js:11-13` ignores `**/*.test.ts`,
`**/*.test.tsx` and `tests/**` — so the real risk is vitest *collection*, which aborts the
entire run on a single module-level import or Playwright error.

Applying `vitest.config.ts`'s exclude list to the working tree (re-run at 17:35 UTC, after
the tree shifted during the audit):

```
collected_candidates = 34 test files
missing_local_imports = 0      # every ./ , ../ and @/ import in all 34 files resolves
```

- 34 collected files vs the 30-file baseline — four files added by concurrent agents during
  the audit (31 at first scan, 34 on re-run; the tree was still moving).
- **Zero unresolved local imports.** No collection-time import failures are expected from
  missing modules.
- `vitest.config.ts` excludes are applied correctly: the stale root junk tests
  (`create-database-schema.test.ts`, `test-supabase-features.test.ts`), the Playwright-only
  `tests/purchase-flow/**`, `src/utils/errorHandling.test.ts` and
  `src/pages/agents/__tests__/**` are all excluded.
- `mermaid` is declared as a real dependency in `package.json:76` — the previous undeclared
  static import that broke collection is fixed.
- A static `it(`/`test(` count gives ~503 occurrences across the 34 files. This is an
  **under-estimate** of executed tests (it does not expand `it.each` or nested describes) and
  is offered only as a plausibility check against the 421-test baseline, not as a result.

**No executed gate results are claimed.** The four commands above must be run and recorded
after `npm ci --offline`.

---

## 3. Netlify verification — PASS for PR #20

### Preview built from the GitHub commit

```
$ gh api repos/:owner/:repo/commits/3f0b854a/statuses
netlify/videoremix/deploy-preview   success   https://deploy-preview-20--videoremix.netlify.app
netlify/videoremix/deploy-preview   pending  https://app.netlify.com/projects/videoremix/deploys/6acbbef7822715000872edf0
```

The Netlify check runs (`Header rules`, `Redirect rules`, `Pages changed`) all carry
`head_sha = 3f0b854a` — the PR #20 head commit. The preview is therefore built **from the
GitHub commit under review**, not from a branch push or a local artifact.

Live content verification (read-only HTTP):

```
https://deploy-preview-20--videoremix.netlify.app/            http=200  size=2305
https://deploy-preview-20--videoremix.netlify.app/birthday-special/  http=200  size=58899
<title>Dean's 46th Birthday Software Special | VideoRemix.vip</title>
```

### Build configuration

`netlify.toml`:

- `command = "npm run build"` — correct, and it triggers the `prebuild` hook
  `npm run validate-env`.
- `publish = "dist"` — correct.
- `NODE_VERSION = "20"`, `NPM_VERSION = "10"` — matches CI.

**No duplicate redirects.** PR #20 removed the conflicting block — the diff deletes five
`[[redirects]]` entries for `/api/personalizer/{scan,generate,save,job/create,job/:jobId/status}`
that pointed at `/.netlify/functions/personalizer-api`, which conflicted with the
`personalization-*` targets for the same paths. The surviving config has 6 unique
personalizer routes, `/auth/*` → Supabase auth, and a `/api/*` catch-all placed last.
`public/_redirects` contributes `/birthday-special`, `/birthday-special/`, `/assets/*` and
the SPA `/* → /index.html` fallback. No `from` path appears twice across either file.

### Caveat — stale `.netlify/` snapshot committed to the repo

`.netlify/netlify.toml` (299 lines) is tracked in HEAD and is a Netlify-generated resolution
snapshot containing **absolute paths from another developer's machine**
(`/Users/shasheemoore/Downloads/videoremixvip/videoremix.vip2/.kilo/worktrees/marmalade-agreement/...`).
It also contains two genuine duplicate/conflicting redirect pairs:

```
from = "/api/personalizer/scan"     to = "/.netlify/functions/personalization-scan-prospect"
from = "/api/personalizer/scan"     to = "/.netlify/functions/personalizer-api"      # conflict

from = "/api/personalizer/generate" to = "/.netlify/functions/personalization-generate-personalization"
from = "/api/personalizer/generate" to = "/.netlify/functions/personalizer-api"      # conflict
```

Impact on the current release: **none observed** — root `netlify.toml` takes precedence in
Netlify's documented configuration-resolution order, which is empirically confirmed by the
deploy preview serving correctly and passing the redirect/header checks against this same
commit. Note that `.gitignore` does **not** neutralise this file: `.netlify` is listed there,
but ignore rules never apply to already-tracked files, so all five `.netlify/**` files are
committed and are part of the deployed repository content. Risk going forward: any local
`netlify dev`/`netlify build` in this checkout would resolve `publish`/`functions`/`base` to
nonexistent macOS paths and fail, and a future change to Netlify's config resolution order
would activate the conflicting redirects. **Recommend removing `.netlify/` from the repo
before merge.** This is outside this workstream's file ownership
(`.github/workflows/**`, `docs/completion/**`) and was deliberately left untouched.

---

## 4. Gate 3 check — secret-shaped variables (new finding)

`src/` references three `VITE_`-prefixed names whose values would be secrets:

| Variable | Location | Consumer |
|---|---|---|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `src/utils/supabase.ts:6` — assigned, **never read** | none |
| `VITE_OPENAI_API_KEY` | `src/utils/agentKeyRequirements.ts:40` | reachable only via `useAgentKeyCheck`/`useAgentApiKeys`, not wired to the router |
| `VITE_REQUEST_SIGNING_SECRET` | `src/utils/requestSigner.ts:35` | **zero importers** |

None is reachable from the live app entry, so there is no current leak. But Vite inlines
**every** set `VITE_*` variable into the public bundle, so setting any of the three in a
staging or production Netlify environment would publish a database service-role key, an
OpenAI key, or a request-signing secret to every visitor.

This is recorded as an operational prohibition in
`docs/completion/staging/environment-provisioning.md` §5, with a post-build grep check. It
does not block the release, but it must be honoured when the staging environment is created.

---

## 5. Staging certification — NOT EXECUTED (procedures written)

Staging certification was not performed and no staging resource was provisioned. Four
procedures were written under `docs/completion/staging/` so it can begin on unblock:

| Document | Contents |
|---|---|
| `README.md` | Scope, safety rules, prerequisites |
| `environment-provisioning.md` | Create isolated staging Supabase/Clerk/Netlify targets; the complete variable register (frontend build vars + all edge-function secrets) with consumer and visibility; the three prohibited secret-shaped `VITE_*` vars; post-provision fail-closed smoke checks |
| `certification-test-matrix.md` | The 8 functional areas — authentication, entitlement, purchase flow, credits, dashboard navigation, app launch, AI execution, legacy deep links, plus build-integrity regression — 43 numbered rows with exact steps and binary pass criteria |
| `go-no-go-gates.md` | The 10 mandatory release gates, the evidence each requires, and a current status per gate |
| `credential-requirements.md` | Every missing credential mapped to the exact command it blocks |

### Gate 10 numbering note

No canonical "10 mandatory release gates" document exists in the repository (searched the
markdown tree; `DEPLOYMENT_READINESS.md` and `FINAL_PRODUCTION_READINESS_REPORT.md` contain
only unrelated marketing/feature lists). The 10 gates in `go-no-go-gates.md` are derived
from the mission's own completion evidence and the eight certification areas requested for
this workstream. The derivation is documented in that file; the load-bearing part is the
"Evidence required" column, which should be used to remap if the authoritative numbering
differs.

### Current gate status

| Gate | Status |
|---|---|
| 1 — CI/CD pipeline green | **BLOCKED → fix applied**, needs push + re-verification |
| 2 — Build & host configuration valid | **PASS** (recommend removing `.netlify/` snapshot) |
| 3 — No secrets in bundle/repo | **PASS** in code; conditional on ops (see §4) |
| 4 — Webhooks fail closed | **PASS** in code; **UNPROVEN** at runtime |
| 5 — Migration applied in order | **BLOCKED** — owner approval required |
| 6 — Authentication | **BLOCKED** — staging not provisioned |
| 7 — Entitlement | **BLOCKED** — staging not provisioned |
| 8 — Credited AI execution | **BLOCKED** — staging not provisioned |
| 9 — Purchase flow | **BLOCKED** — staging not provisioned |
| 10 — Legacy deep links / catalog | **BLOCKED** — staging not provisioned |

---

## 6. Missing credentials & authorizations

Detailed in `docs/completion/staging/credential-requirements.md`. Summary:

| # | Missing | Gates blocked | First command that needs it |
|---|---|---|---|
| 1 | Staging Supabase project: ref, URL, anon key, service-role key + `SUPABASE_ACCESS_TOKEN` + approval to apply `20261011120000_clerk_credit_system_alignment.sql` | 5, 6, 7, 8, 9, 10 | `supabase db push --project-ref <ref>` |
| 2 | Staging Clerk instance: publishable key + secret key (+ `CLERK_WEBHOOK_SECRET` if in scope) | 6, 7, 8, 9, 10 | `netlify env:set VITE_CLERK_PUBLISHABLE_KEY ...` |
| 3 | Staging Netlify site: site id + auth token + staging `VITE_*` build vars | 2, 9, 10 | `netlify deploy --dir=./dist` |
| 4 | Spend-capped OpenAI **staging** key | 8 | `supabase secrets set OPENAI_API_KEY=...` |
| 5 | Staging-mode ZAXXA + PayKickstart webhook secrets | 9 | `supabase secrets set ZAXXA_WEBHOOK_SECRET=... PAYKICKSTART_WEBHOOK_SECRET=...` |
| 6 | Optional provider keys: Stripe, Anthropic, Resend, PayPal, Redis, personalizer worker, MUAPI, Zep | specific matrix rows | `npx tsx scripts/sync-stripe-pricing.ts` (Stripe) |
| 7 | `node_modules` restoration — prohibited for this workstream | local gate evidence | `npm ci --offline` |

Sequencing constraints that are not just missing-credential issues:

- **Migration before functions.** `run-ai-app` / `proxy-openai` bill against Clerk text
  subs; applying the migration after deploying them makes every run fail closed.
- **Webhook secrets before webhook functions.** The guards are fail-closed: deploying a
  webhook function without its secret makes it reject every real purchase event.
- **Staging site must not be the production site.** `5dc577a2-e84f-4230-a9e3-43f51a5e0a4c`
  is in `.netlify/state.json`; the `.env` in this checkout points at the production Supabase
  project. Neither may be used for staging.
- **The local `.env` is out of bounds.** It belongs to the production project and was not
  read, copied, or used.

---

## 7. CI failures attributable to concurrent agents

**None observed, and none can be attributed with confidence** — CI never ran for the changes
under review, so there are no agent-attributable CI failures to report. The static
pre-validation in §2 found no import-resolution or collection defects.

Note that the working tree shifted *during* this audit (concurrent agents were actively
editing `src/pages/agents/**`, `supabase/**` and `tests/**`). Every finding below was
re-verified against the tree as of 17:35 UTC.

Risks worth re-verifying after integration, all from concurrent agents' in-flight work:

| Risk | File(s) | Why it matters |
|---|---|---|
| New tests collected by the now-hard-gated test step | `tests/webhook-probe.test.ts`, `tests/webhook-verify.test.ts`, `tests/run-ai-app-credit-core.test.ts`, `src/components/ai/apps/__tests__/` | Four files added during the audit. `tests/webhook-probe.test.ts` imports `processPurchase` from `purchaseProcessor`, and `webhook-verify.test.ts` was checked for live dependencies — it contains **no** `Deno.env.get`, `process.env`, `fetch(` or `http` references, so it is a pure unit test. The remaining three are covered by the zero-missing-imports scan. Any *assertion* failure in them still fails CI, and that cannot be predicted statically. |
| A live-env probe test appearing | any new `tests/**` file | Considered and now **closed**: `tests/webhook-envprobe.test.ts` existed at the start of the audit and was deleted by a concurrent agent. No replacement that reads `process.env` or performs network I/O was found on disk. Worth one re-check after integration, because this pattern is the classic way a "mocked" test turns into a live one. |
| Test count grew past baseline | 34 collected files (baseline 30) | Four added files. A new failure would be invisible to the lint gate and only surfaced by the test gate. |
| Warning ratchet breach | any `src/**` file | `--max-warnings 821`; baseline 797. Concurrent agents editing `src/**` have 24 warnings of headroom. `tests/**` and `*.test.ts*` are ignored by eslint, so test additions cannot breach it. Note that the 128 modified files under `src/pages/agents/**` sit in an eslint-grandfathered directory (`eslint.config.js:73-85` turns the main rules off there), so they cannot breach the ratchet either. |
| Type-debt baseline drift | repo-wide | 1,630 legacy errors, non-blocking. Concurrent changes could raise it; recorded as a baseline check, not a gate. |
| New migration supersedes the Gate 5 prerequisite | `supabase/migrations/20261011160000_clerk_identity_table.sql` (new, untracked) | A second migration appeared during the audit, on top of `20261011120000_clerk_credit_system_alignment.sql`. **Ordering must be confirmed before applying** — Gate 5 requires that the credit/identity schema be correct *before* `run-ai-app` / `proxy-openai` are deployed. |

Each is cheap to re-check after `npm ci --offline` and integration:
`npm run lint; npx vitest run; npm run build; npx tsc -b 2>&1 | grep -c "error TS"`.

---

## 8. Files changed by this workstream

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | PR trigger no longer limited to `main`/`develop` bases — Gate 1 fix |
| `.github/workflows/netlify-deploy.yml` | PR trigger no longer limited to `main`/`master` bases — Gate 1 fix |
| `.github/workflows/birthday-landing-deploy.yml` | PR trigger branch filter dropped (path filters retained); prod deploy unchanged |
| `docs/completion/staging-certification.md` | this report |
| `docs/completion/staging/README.md` | new — procedure index and safety rules |
| `docs/completion/staging/environment-provisioning.md` | new — staging targets + full variable register |
| `docs/completion/staging/certification-test-matrix.md` | new — 8-area, 43-row matrix |
| `docs/completion/staging/go-no-go-gates.md` | new — 10 gates with required evidence |
| `docs/completion/staging/credential-requirements.md` | new — missing credentials mapped to commands |

No application code, tests, migrations, `netlify.toml`, or dependency manifests were
modified. No other subagent's files were touched.
