# GitHub Actions Retirement — Audit Report

**Workstream:** GHA retirement subagent
**Branch:** `kilo/pr19-completion` (PR #20 head, `b7aad5cd`)
**Date:** 2026-10-12
**Mission:** Netlify becomes the official build/test/preview/production platform; GitHub is source
control + PRs only. GitHub Actions is billing-locked (jobs never start: *"The job was not started
because your account is locked due to a billing issue"*), so it gates nothing today and must gate
nothing tomorrow.

**Positioning against the mission's sequencing requirement:** GitHub Actions is retired only after
the Netlify-native gate is verified as its replacement. This document maps, responsibility by
responsibility, which Netlify mechanism now provides each capability, and names what has **no**
replacement (see §4) — that list is the residual the owner must accept or close before relying on
retirement.

**Not performed here:** no git commands (the coordinator stages/commits in the required order), no
`npm install`, no production change, no workflow-history deletion, no force anything. Disable only —
via rename to a non-active extension.

---

## 1. Per-workflow audit (as found at `b7aad5cd`)

### 1.1 `.github/workflows/ci.yml` — "CI/CD Pipeline"

**Triggers**
- `push` → branches `[main, develop]`
- `pull_request` → `types: [opened, synchronize, reopened, ready_for_review]`, deliberately
  **unfiltered by branch** (comment in file: `pull_request.branches` filters on the PR *base*
  branch, so restricting it silently skips PRs targeting release branches such as
  `fix/sapienx-130-app-catalog`). This was the fix from `docs/completion/staging-certification.md` §1.

**Jobs / steps**
- `build-and-test` on `ubuntu-latest`, matrix `node-version: [20.x]`:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (node from matrix, `cache: npm`)
  3. `npm ci`
  4. `npm run lint` — **blocking**
  5. `npx tsc --noEmit` — `continue-on-error: true`, **non-blocking** (comment records ≈1.6k
     pre-existing legacy errors; non-blocking by explicit coordinator decision)
  6. `npm test -- --run` (→ `vitest --run`) — **blocking**
  7. `npm run build` — **blocking**, with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from
     Actions secrets
  8. `actions/upload-artifact@v4` — `build-output` = `dist/`, `retention-days: 7`, `if: always()`

**Secrets used:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (2)
**Coverage provided:** lint (hard gate), type check (report only), unit tests (hard gate), build
(hard gate), 7-day build artifact retention.
**Notes:** the upload-artifact step runs `if: always()`, so it "succeeded" even on red builds — a
retained artifact from a failing build is not a release artifact.

### 1.2 `.github/workflows/netlify-deploy.yml` — "Netlify Deployment"

**Triggers**
- `push` → branches `[main, master]`
- `pull_request` → same unfiltered `types:` list as `ci.yml`
- `workflow_dispatch` → input `environment` (choice `production` | `preview`, **default
  `production`**)

**Jobs / steps**
- `test` (env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`): checkout → setup-node 20 → `npm ci` →
  `npm run validate-env` → `npm run lint` → `npm test -- --run`
- `build-and-deploy` (`needs: test`; `if: github.event_name == 'push' || github.event_name ==
  'workflow_dispatch'`; env `VITE_*`): checkout → setup-node → `npm ci` → `npm run build` →
  `npm install -g netlify-cli` → deploy:
  - `production` → `netlify deploy --prod --dir=./dist`
  - otherwise → `netlify deploy --dir=./dist`
  (env `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`) → "Deployment verification" step that only `echo`s
  a message (no HTTP check, no rollback hook, no health assertion)
- `preview-deploy` (`needs: test`; `if: github.event_name == 'pull_request'`; env `VITE_*`):
  checkout → setup-node → `npm ci` → `npm run build` → install netlify-cli →
  `netlify deploy --dir=./dist` (**no `--prod`**), env `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

**Secrets used:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NETLIFY_AUTH_TOKEN`,
`NETLIFY_SITE_ID` (4)
**Coverage provided:** environment validation (hard gate via `validate-env`), lint, unit tests,
build, PR preview deploys, production deploys, manual environment-targeted dispatch.
**Notes:**
- Production path is correctly guarded (`push` to `main`/`master`, or an explicit
  `workflow_dispatch`) — a PR cannot trigger a production deploy. Verified by grep:
  `netlify-deploy.yml:55 if: github.event_name == 'push' || github.event_name ==
  'workflow_dispatch'`; the only `--prod` sits at line 82 inside that job.
- `workflow_dispatch`'s default input value is `production`, so a manual dispatch with no input
  change deploys **production**. Netlify site settings (§3 of `docs/NETLIFY-CICD.md`) now make that
  an explicit human publish instead.
- Both Netllify deploy jobs install `netlify-cli` globally at build time from the public registry.

### 1.3 `.github/workflows/birthday-landing-deploy.yml` — "Birthday Landing Deployment"

**Triggers** (path-filtered, deliberately narrow blast radius)
- `pull_request` → paths `public/birthday-special/**`, `public/_redirects`,
  `.github/workflows/birthday-landing-deploy.yml` (no branch filter)
- `push` → branches `[main]`, same three paths

**Jobs / steps** — `build-and-deploy` on `ubuntu-latest`:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (node 20, `cache: npm`)
3. "Load public Supabase build values" — `source .env.lock`, then exports
   `VITE_SUPABASE_URL=$LOCKED_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY=$LOCKED_SUPABASE_ANON_KEY`
   into `$GITHUB_ENV` (`.env.lock` defines exactly `LOCKED_PROJECT_ID`, `LOCKED_SUPABASE_URL`,
   `LOCKED_SUPABASE_ANON_KEY`)
4. `npm ci`
5. `npm run build` — the full app build (its `prebuild` hook re-runs `validate-env` against the
   values loaded from `.env.lock`)
6. "Verify birthday landing output":
   `test -f dist/birthday-special/index.html`; `grep -q "I'm Turning"`; `grep -q "Every App Is Just"`
   (the `<h1>` is `I'm Turning 46 — So Every App Is Just $46.` — matched at
   `public/birthday-special/index.html:34`)
7. `npm install -g netlify-cli`
8. Deploy preview (`if: github.event_name == 'pull_request'`) —
   `netlify deploy --dir=dist --site=… --auth=…`
9. Deploy production (`if: github.event_name == 'push'`) —
   `netlify deploy --prod --dir=dist --site=… --auth=…`

**Secrets used:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (2). Build values come from the committed
`.env.lock` rather than from secrets.
**Coverage provided:** full app build (with env validation), birthday-landing static content
verification (file presence + two exact string assertions), path-filtered preview and production
publish.
**Notes:**
- No lint and no unit tests in this workflow — it is a static-site/deploy pipeline, not a gate.
- It builds the entire app (`npm run build`) instead of just the static landing page, so its cost is
  the same as a full build while it validates one page.
- Sourcing the committed `.env.lock` into the job environment means a change to that file silently
  changes build values for this workflow; in Netlify the equivalent values come from site-level
  environment configuration, which is versioned and audited by the platform.

---

## 2. Coverage map — what each responsibility becomes

| # | Responsibility | Where it ran (GHA) | Where it runs now (Netlify-native) | Status |
|---|---|---|---|---|
| 1 | Dependency install (`npm ci`) | all three workflows | Netlify build image runs `npm ci` on `package-lock.json` | **Covered** |
| 2 | Environment validation (`npm run validate-env`) | `netlify-deploy.yml` `test` job; `ci.yml` build step; `birthday-landing-deploy.yml` via `prebuild` | automatic npm `prebuild` hook of `npm run build` in every build context | **Covered** |
| 3 | Lint (`npm run lint`, budget 821) | `ci.yml`, `netlify-deploy.yml` | step 3 of the Netlify build gate (`docs/NETLIFY-CICD.md` §1) | **Covered** |
| 4 | Unit tests (`vitest --run`) | `ci.yml`, `netlify-deploy.yml` | step 4 of the Netlify build gate | **Covered** |
| 5 | Type check (`tsc --noEmit`, non-blocking) | `ci.yml` (`continue-on-error: true`) | **nothing** — it never blocked anything | **Not carried forward** (see §4.1) |
| 6 | Build (`npm run build` → `dist/`) | all three workflows | step 5 of the Netlify build gate; `netlify.toml` `command`/`publish` | **Covered** |
| 7 | PR preview deploys | `netlify-deploy.yml` `preview-deploy`; `birthday-landing-deploy.yml` PR step | Netlify Deploy Previews built from the PR head SHA (`deploy-preview-<PR#>--videoremix.netlify.app`) | **Covered** |
| 8 | Production deploys | `netlify-deploy.yml` `build-and-deploy` (`--prod` on `push`/`workflow_dispatch`); `birthday-landing-deploy.yml` (`--prod` on `push` to `main`) | Netlify production-context deploys from the production branch, published only by explicit human action (production-branch restriction + deploy locks) | **Covered** (stricter) |
| 9 | Build artifact retention (`dist/`, 7 days) | `ci.yml` upload-artifact | every Netlify deploy is a retained, immutable, addressable snapshot | **Covered** (better) |
| 10 | Birthday-landing static verification | `birthday-landing-deploy.yml` grep assertions | `public/birthday-special/**` is published verbatim by the Netlify build (a missing file breaks the deploy); the **string assertions are not re-implemented** | **Partially covered** (see §4.4) |
| 11 | Node version pinning | `actions/setup-node` `20.x` | `netlify.toml` `[build.environment] NODE_VERSION = "20"`, `NPM_VERSION = "10"` | **Covered** |
| 12 | Merge gating (a check that must pass before merge) | GitHub Actions checks + branch protection | **Netlify commit statuses** (`netlify/videoremix/deploy-preview`, `Redirect rules`, `Header rules`) required via GitHub branch protection | **Requires owner action** (§5) |
| 13 | Playwright e2e specs | none (excluded from vitest; no `playwright.config.*` in repo) | none | **Unchanged — still uncovered** (§4.2) |
| 14 | Supabase migrations / Edge Function deploys | none | none (deliberately separate) | **Out of scope** — manual, `docs/completion/db-clerk-migration.md` |
| 15 | Post-deploy verification (HTTP/health assertions) | `netlify-deploy.yml` "Deployment verification" step | nothing in CI; Netlify's own redirect/header/page-change checks run post-build | **Degraded** — but the old step was an `echo`, i.e. no real coverage (§4.5) |

**Net effect:** the gates that actually blocked merges (lint, tests, build, env validation) all have
Netlify-native equivalents. Everything that does not have an equivalent either never blocked
anything (type check, deploy "verification" echo) or was never runnable (Playwright e2e).

---

## 3. Retirement list — exact files disabled

Renamed (not deleted). Content is preserved verbatim with a one-line header comment explaining why
the file is disabled and pointing at `docs/NETLIFY-CICD.md`:

| Before | After |
|---|---|
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml.disabled` |
| `.github/workflows/netlify-deploy.yml` | `.github/workflows/netlify-deploy.yml.disabled` |
| `.github/workflows/birthday-landing-deploy.yml` | `.github/workflows/birthday-landing-deploy.yml.disabled` |

Active workflows remaining: **zero**. GitHub loads only `*.yml` / `*.yaml` from
`.github/workflows/`, so all three files are inert by extension. No workflow history was deleted;
nothing was force-pushed; no other file in `.github/` exists (verified: `.github/` contains only the
`workflows` directory).

---

## 4. What the Netlify replacement does NOT cover

These must be **called out and owned**, because they are the delta between "GHA retired" and
"everything CI used to do is still being done".

1. **`npx tsc --noEmit` (type check) runs nowhere now.** It was `continue-on-error: true` in
   `ci.yml` against ≈1.6k pre-existing errors, so retiring it removes a *report*, not a gate. The
   build (step 5) remains the correctness gate. If type checking is wanted as a real gate, it must
   be added to the Netlify build command **after** the baseline is burned down — otherwise the
   gate can never be green. Burn-down tracking: `docs/completion/MISSION_STATUS.md` §"type debt".
2. **Playwright e2e specs are still orphaned and unrunnable.**
   `tests/purchase-flow/**` imports `@playwright/test` and is excluded from vitest
   (`vitest.config.ts`); there is **no `playwright.config.*` in the repo**, so `npx playwright test`
   cannot run. No CI/GHA workflow ran them either, so nothing was lost — but e2e coverage does not
   exist in any platform. If e2e is required, add a `playwright.config.*` **and** a Netlify
   build-plugin/extra build step, plus a staging deploy to run it against.
3. **Cross-check on env var hygiene is not part of the gate.** The old `ci.yml` build step injected
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from Actions secrets; Netlify injects them from the
   site's environment configuration. Nothing verifies that a *forbidden* `VITE_*` secret-shaped
   variable (`VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_OPENAI_API_KEY`, `VITE_REQUEST_SIGNING_SECRET`)
   is unset. The post-build grep check is documented
   (`docs/completion/staging/environment-provisioning.md` §5) but **not enforced anywhere**. Recommend
   a gate step: `grep -rEl "service_role" dist/assets/*.js && exit 1 || true`.
4. **Birthday-landing content assertions** (exact strings) are not re-implemented. The static files
   are published and a missing `index.html` would surface as a 404 on the published deploy, but no
   gate fails on landing-page content drift.
5. **Post-deploy verification was never real.** `netlify-deploy.yml`'s "Deployment verification" step
   only `echo`ed two lines. Netlify's own redirect/header/page-change checks are the only post-build
   validation. If smoke checks after a production publish are desired, they are a manual procedure
   (see `docs/NETLIFY-CICD.md` §4).
6. **Cross-platform / multi-version matrix.** GHA ran one Node version on one OS; Netlify pins one
   Node version. Equivalent coverage; a second runtime target would need its own deploy context.
7. **Migration and Edge Function deploys were never automated** and remain manual Supabase CLI
   procedures (`docs/completion/db-clerk-migration.md`). Netlify builds must not run them — noted as
   a correctness property, not a gap.
8. **GitHub-side settings are outside the repo and outside this workstream**: branch protection that
   requires checks (see §5), and the unused Actions secrets (see §6).

---

## 5. Branch protection — unverifiable from inside this repository

**I cannot read repository/branch-protection settings from this checkout.** It must be verified and
fixed by the repository owner. Concretely:

- If `main` has a protection rule that still **requires** `CI/CD Pipeline`, `Netlify Deployment`,
  or any *GitHub Actions* status check, that rule will **block every merge forever** — those checks
  can never run or pass while the account is billing-locked, and the workflows no longer exist.
- The required-check list must be switched to the Netlify commit statuses
  (`netlify/videoremix/deploy-preview`, `Redirect rules - videoremix`,
  `Header rules - videoremix`) plus at least one approving review.
- Stale required-check entries themselves block merges even when no workflow produces them.

**Owner action (mandatory before relying on retirement):** GitHub → Settings → Branches → edit the
`main` protection rule → *Require status checks to pass before merging* → select the Netlify checks
only; remove every GitHub Actions check; verify with a throwaway PR that the merge button is
controlled by the Netlify `deploy-preview` status.

Recorded as an open item in `docs/completion/GO_NO_GO.md`-style gate tracking; Gate 8
("CI/CD and Netlify preview pass") already records that GHA execution is externally blocked.

---

## 6. Remaining GitHub Actions dependencies found in the repo (report-only — not edited)

None of these files are in my ownership, so they were **not** edited. Findings only:

### 6.1 No badges, no artifact/CLI consumers

- **README badges:** no CI badge found. No `img.shields.io`, no
  `github.com/<owner>/<repo>/actions/workflows/*.yml/badge.svg` reference in any **tracked** file —
  `git grep -Ein 'badge\.svg|shields\.io|actions/workflows'` over the repository (excluding
  `node_modules`) returns nothing. The only matches for the generic term are third-party READMEs
  inside `node_modules` and this report. Nothing in `README.md` will break or show a permanently-red
  CI badge.
- **`gh` CLI usage in scripts:** no script or npm script calls `gh run`, `gh pr checks`, `gh api` or
  otherwise expects Actions artifacts or Actions-triggered state. `gh` appears only inside prose in
  `docs/completion/*` audit documents (historical evidence) and in
  `.kilo/skills/receiving-code-review/SKILL.md` (generic guidance).
- **`actions/upload-artifact` consumers:** nothing in the repo downloads the `build-output`
  artifact; Netlify deploys replace it.

### 6.2 Stale documentation references (cosmetic; recommend the coordinator route readers here)

| File | Line(s) | What it says | Problem after retirement |
|---|---|---|---|
| `NETLIFY_DEPLOYMENT_GUIDE.md` (root) | 59–60, 69 | "CI/CD Pipeline (GitHub Actions) — Automated: Full CI/CD pipeline in `.github/workflows/netlify-deploy.yml`"; documents `NETLIFY_AUTH_TOKEN` for the workflow | Points readers at a now-disabled workflow |
| `docs/NETLIFY_DEPLOYMENT.md` | whole file | Node 18, generic GitHub-Actions-era guide, no test gate, no production approval, no rollback | Superseded by `docs/NETLIFY-CICD.md` (also has the wrong Node version — `netlify.toml` pins 20) |
| `PRODUCTION_READINESS.md` (root) | 7 | "GitHub Actions CI/CD - Created workflow" | Stale claim |
| `deploy-email-hook.sh` (root) | 41–42 | "Option 3: Deploy via GitHub Actions (recommended for production)" | Recommends the retired path |
| `docs/completion/staging/environment-provisioning.md` | 79–80, 128 | "Add the same three `VITE_*` values as GitHub Actions secrets … if the staging deploys are driven by `netlify-deploy.yml`"; register row `NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID` → "deploy jobs in `netlify-deploy.yml`" | Instructions for configuring Actions secrets that are no longer needed |
| `docs/completion/staging/credential-requirements.md` | 72–81 | staging deploy via `netlify deploy` needs `NETLIFY_AUTH_TOKEN` (still true for manual CLI) | Mostly still valid; only the Actions-secret framing is stale |
| `docs/completion/staging/go-no-go-gates.md` | 25, 33 | Gate 1 evidence: "`gh pr checks <PR>` shows `CI/CD Pipeline` → success" | The evidence criterion must become the Netlify `deploy-preview` status |
| `docs/completion/GO_NO_GO.md` | 21, 42 | Gate 8 records GHA as externally blocked ("workflows verified to dispatch; only runner startup is blocked"); approval #6 "GitHub account billing resolution → re-run GHA for Gate 8" | Approval #6 becomes **not required** — Netlify already covers Gate 8. Coordinator-owned file; not edited here |
| `docs/completion/ci-netlify-report.md`, `staging-certification.md`, `MISSION_STATUS.md` | various | Historical audit evidence referencing the workflows | Accurate history; leave as-is |

### 6.3 Active GitHub Actions secrets that become unused

`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` were consumed
by the retired workflows. They are no longer read by any automation. Deleting/rotating them is a
repository-owner action (not possible from this checkout). Until then they are dormant, not exposed —
but note that `NETLIFY_AUTH_TOKEN` is a high-privilege credential whose only remaining legitimate use
is a human running `netlify deploy --prod` locally.

---

## 7. Verification performed

| Check | Command / method | Result |
|---|---|---|
| Workflows disabled | `ls -la .github/workflows/` | `birthday-landing-deploy.yml.disabled`, `ci.yml.disabled`, `netlify-deploy.yml.disabled` — **no `*.yml` / `*.yaml` present** |
| Headers present | read each `.disabled` file | one-line disable rationale + pointer to `docs/NETLIFY-CICD.md` at the top of each |
| Content preserved | full reads before rename, byte counts after | identical to pre-retirement content plus the header comment |
| Other `.github/` content | `ls -la .github/` | only the `workflows/` directory; no ISSUE_TEMPLATE, no dependabot config, no other Actions dependency |
| CI badge references | `git grep -Ein 'badge\.svg|shields\.io|actions/workflows'` (excluding `node_modules`) | **no match** — no CI badge anywhere in tracked files, including `README.md` |
| `gh` CLI / artifact consumers | grep `gh run`, `gh pr checks`, `gh api`, `upload-artifact`, `actions/setup-node` | no script or npm-script consumer; only prose in audit docs |
| Birthday landing content still present | grep `public/birthday-special/index.html` | `I'm Turning 46 — So Every App Is Just $46.` (line 34) — the assertions in the retired workflow still describe real content |
| Gate commands exist | read `package.json` | `lint` (budget 821), `test` (`vitest`), `build` (`vite build` + `prebuild` → `validate-env`) all present and runnable by a Netlify build |

**Not verified here (owner actions):** Netlify site settings (production branch, deploy locks,
required status checks), GitHub branch protection, and any live Netlify build run. `netlify.toml`
and `package.json` are owned by other workstreams and were neither read for the gate value nor
edited.

---

## 8. Bottom line

- **Exact files disabled:** `.github/workflows/ci.yml.disabled`,
  `.github/workflows/netlify-deploy.yml.disabled`,
  `.github/workflows/birthday-landing-deploy.yml.disabled` (renamed from `ci.yml`,
  `netlify-deploy.yml`, `birthday-landing-deploy.yml`; active workflows remaining: **0**).
- **Coverage map:** lint, vitest, build, env validation and Node pinning move to the Netlify build
  gate; PR previews and production deploys move to Netlify deploy/deploy-preview; birthday landing
  static files move to the Netlify build of `public/birthday-special/**`.
- **Not covered:** type check (never blocking), Playwright e2e (never runnable), forbidden-`VITE_*`
  leak enforcement, birthday-landing string assertions, post-deploy smoke checks.
- **Requires Netlify site-settings action (names):** production branch under
  *Project configuration → Build & deploy → Continuous Deployment → Branches and deploy contexts*;
  *Lock publishing to this deploy* / *Start auto publishing* (deploy locks) on the Deploys page;
  enabling Deploy Previews.
- **Requires GitHub-side owner action:** branch protection required checks switched from GitHub
  Actions checks to Netlify commit statuses (§5) and removal of the now-unused Actions secrets
  (§6.3).

Authoritative operator documentation: `docs/NETLIFY-CICD.md`.
