# Netlify CI/CD — Authoritative Guide

**Scope:** this document is the single source of truth for how VideoRemix.vip is built, tested,
previewed, deployed to production, and rolled back.

**Status (2026-10-12):** **Netlify is the only build, test, preview and production platform.**
GitHub is source control and pull requests only. All GitHub Actions workflows have been retired —
they are preserved as `.disabled` files and are inert (GitHub only loads `*.yml` / `*.yaml` from
`.github/workflows/`, so `.disabled` files never run and cannot gate anything).
See `docs/completion/gha-retirement-audit.md` for the per-workflow audit.

| Question | Answer |
|---|---|
| Where does code live? | GitHub (`kilo/pr19-completion` → `fix/sapienx-130-app-catalog` → `main`) |
| Where is it built and tested? | Netlify — on every build, for every context |
| Where are PR previews published? | Netlify Deploy Previews (one per PR, per commit) |
| Where does production come from? | Netlify production deploy of the production branch, published only with explicit approval |
| Who deploys migrations / Edge Functions? | Supabase CLI — a separate, manually controlled procedure (never part of a frontend build) |

**Why GitHub Actions is gone:** the account is billing-locked, so no job ever starts
(`The job was not started because your account is locked due to a billing issue`, runs fail in
2–3 s with `steps: []`). Workflows that cannot run gate nothing — today or tomorrow.

---

## 1. What runs on every Netlify build (the gate)

Netlify builds the site for **every** context that is enabled: production branch pushes,
pull requests (Deploy Previews), and any enabled branch deploys. Each build runs the same
pipeline, configured in `netlify.toml`:

```toml
[build]
  command = "npm run build"     # the gate is chained into this command
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION  = "10"
```

`netlify.toml`'s `[build] command` is the platform-side source of truth for the gate string; the
steps it must run, in order, are:

| Step | Command | Blocking? | What it proves |
|---|---|---|---|
| 1. Dependency install | `npm ci` (Netlify runs this automatically when `package-lock.json` is present) | yes | Reproducible, locked dependency tree |
| 2. Environment validation | `npm run validate-env` — runs automatically as the npm `prebuild` hook of `npm run build` | yes | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` exist and are well-formed; a missing/malformed build var **hard-fails the build** |
| 3. Lint | `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 821`) | yes | No lint **errors**; warnings stay under the 821 budget (the ratchet). `src/pages/agents/**`, `src/components/apps/**`, `netlify/functions/**` and `*/**.test.*` are grandfathered by `eslint.config.js` |
| 4. Unit tests | `npx vitest run` (the CI form of `npm test -- --run`) | yes | The whole vitest suite. Collection-time exclusions are declared in `vitest.config.ts` (stale root junk tests, Playwright-only specs) |
| 5. Build | `vite build` → `dist/` | yes | The app compiles and bundles |
| 6. Netlify post-processing | Netlify's own redirect/header rule checks and "Pages changed" analysis (posted as commit statuses) | yes | `public/_redirects` + `netlify.toml` redirects/headers resolve without conflict; the published file set changed as expected |

If any of steps 2–6 fails, **the deploy fails and is never published** — the previous production
deploy stays live. That is the gate.

### What the gate does not cover (call-outs)

These responsibilities existed in the retired workflows and have **no** Netlify-native equivalent.
They are tracked in `docs/completion/gha-retirement-audit.md` §4:

1. **Non-blocking type check.** `ci.yml` ran `npx tsc --noEmit` with `continue-on-error: true`
   (≈1.6k pre-existing legacy errors). No gate runs it today, blocking or otherwise. It was never
   a gate; the build (step 5) is the real correctness gate. Run it locally or burn it down
   deliberately: `npx tsc -b 2>&1 | grep -c "error TS"`.
2. **Playwright e2e specs.** `tests/purchase-flow/**` are excluded from vitest and there is no
   `playwright.config.*` in the repo, so they cannot run anywhere as-is. Not covered by any gate.
3. **Build-artifact upload.** `ci.yml` uploaded `dist/` as a 7-day Actions artifact. Netlify keeps
   every deploy as an immutable, addressable snapshot instead — a deploy *is* the artifact.
4. **Birthday-landing content assertions.** `birthday-landing-deploy.yml` asserted exact strings
   in the built output (`I'm Turning`, `Every App Is Just`). The Netlify build publishes
   `public/birthday-special/**` verbatim, so a *missing* file is caught by the build/deploy, but the
   **string assertions are not re-implemented** in any gate.
5. **Cross-platform gate (e.g. multiple Node/OS matrix).** The matrix was `node: [20.x]` on
   `ubuntu-latest` only; Netlify pins `NODE_VERSION = "20"`. Equivalent coverage; a second Node
   major would need a separate branch-deploy site.

---

## 2. Deploy Previews for pull requests

With the Netlify GitHub integration enabled, every pull request gets a Deploy Preview:

- URL shape: `deploy-preview-<PR#>--videoremix.netlify.app`
- Built from the **exact commit under review** (the PR head SHA), not from a branch push or a local
  artifact — so what you review is what was built from that commit.
- It runs the **full gate** (§1). A preview that fails the gate shows a failed `deploy-preview`
  commit status; the deploy is not published.
- Previews serve the same redirects/headers as production (`public/_redirects` +
  `netlify.toml`), so SPA fallback and the birthday landing behave identically:
  `curl -fsS -o /dev/null -w "%{http_code}\n" <preview-url>/birthday-special/` → `200`.

Enabling the settings that produce this: **Project configuration → Build & deploy → Continuous
Deployment → Branches and deploy contexts → Deploy Previews** (on by default for Git-connected
sites).

---

## 3. Production requires explicit approval

Production deploys are produced **only** by Netlify, only from the production branch, and only with
a human publish action. Enforce all three of the following site settings — **names exactly as they
appear in the Netlify UI**:

### 3.1 Production branch restriction

**Project configuration → Build & deploy → Continuous Deployment → Branches and deploy contexts →
Production branch**

- Set the production branch to `main` (and leave `master` unset/irrelevant for this repo).
- Only pushes to the production branch create a **production-context** deploy. Every other branch
  is a Deploy Preview or a branch deploy — never production.
- Push access to `main` is therefore deploy access to production. Restrict who can push/merge to
  `main` with GitHub branch protection (see §3.4).

### 3.2 Deploy locks (approval before anything goes live)

**Deploys page → Lock publishing to this deploy** (a.k.a. "stop auto publishing")

- With the site locked, new production deploys are still built, but **they are not published** to
  the live URL. The published deploy is pinned to the locked one.
- Someone with site access then either clicks **Start auto publishing** (unlock) or opens the new
  deploy's detail page and clicks **Publish deploy**. Both are explicit human actions.
- While locked, Netlify emits a `Deploy locked` notification; unlocking emits `Deploy unlocked`.
- Strictest mode: **Project configuration → Build & deploy → Continuous Deployment → Stop builds**
  stops all builds site-wide; use only during incident triage.

### 3.3 No GitHub workflow can auto-deploy

- `.github/workflows/ci.yml.disabled`, `netlify-deploy.yml.disabled` and
  `birthday-landing-deploy.yml.disabled` are inert. **Zero active workflows exist.**
- Nothing in the repository can trigger a deploy, run a build, or post a status from GitHub Actions.
- The `NETLIFY_AUTH_TOKEN` / `NETLIFY_SITE_ID` GitHub Actions secrets that the retired workflows
  consumed are no longer required by any automation. They remain as GitHub repository secrets until
  an owner removes them — that removal is an owner action (see §7).

Manual production deploy paths, for the record (all human-initiated):

```bash
# From a checkout linked to the site (netlify link), with NETLIFY_AUTH_TOKEN exported:
npm run build
netlify deploy --prod --dir=dist          # explicit, authenticated production publish
```

```text
# Or entirely in the UI:
Deploys → Trigger deploy → Deploy site     (builds and publishes the current branch commit)
Deploys → <choose a previous deploy> → Publish deploy   (instant rollback, no rebuild)
```

### 3.4 Merge-time gating (the part Netlify cannot do for you)

Netlify's gate blocks **deploys**, not **merges**. Merge protection is a GitHub setting and must be
configured deliberately, otherwise a red gate can still be merged:

1. **Repository → Settings → Branches → Branch protection rule for `main`** →
   **Require status checks to pass before merging**, and require the Netlify checks that matter:
   - `netlify/videoremix/deploy-preview` — the build/gate result (fails when lint, vitest, env
     validation or the build fails)
   - `Redirect rules - videoremix`, `Header rules - videoremix` — config integrity
   - (optional) `Pages changed - videoremix`
2. **Do not** require any `CI/CD Pipeline`, `Netlify Deployment` or other GitHub Actions check —
   those checks can never pass while the account is billing-locked, and no longer exist.
3. Enable **Require a pull request before merging** with at least one approving review, and keep
   push access to `main` limited to people who may publish production.
4. Optionally require the deploy request approval for untrusted contributors: with build variables
   marked as sensitive-scoped, Netlify emits `Deploy request pending` and an untrusted deploy needs
   an explicit accept before it even starts building.

Netlify's `deploy-preview` status is a commit status, so it can be selected as a required check.
**The exact list of required checks is unverifiable from inside this repository** — it lives in
GitHub branch-protection configuration. Treat §3.4 as a mandatory owner action item.

---

## 4. Rollback

Netlify deploys are atomic and immutable; every deploy is retained as a full snapshot, so rollback
is instant and never rebuilds anything.

**UI (primary path):**

1. Netlify dashboard → your site → **Deploys**.
2. Find the previous *successful* **production** deploy you want to return to (they stay listed
   indefinitely — only manual deletion removes one).
3. Open its detail page → **Publish deploy**. The site is back to that snapshot in seconds.
4. Recommended immediately after: **Deploys → Lock publishing to this deploy** while you triage, so
   the next git-triggered production deploy cannot overwrite the rollback. Unlock
   (**Start auto publishing**) once you are ready to move forward.

**What rollback does and does not do:**

| Rolled back | Not rolled back |
|---|---|
| All built assets for that deploy (HTML/JS/CSS/images, `dist/` contents) | **Environment variables** — they are site-level settings, not versioned per deploy |
| Function code shipped with that deploy | Supabase migrations and Edge Functions — separate procedure (§5) |
| The URL served to users (production URL never changes) | Anything in Supabase (DB rows, auth config, stored secrets) |

The env-var caveat is the real rollback risk: a rollback restores code that may expect an older
variable value while the site still serves the current one. If the failing change also touched a
build variable, restore the previous value first (`netlify env:set VAR_NAME <previous-value>`),
then publish the deploy.

**Verification after rollback:** confirm the live URL serves the expected content and the SPA
fallback still resolves a deep link (`/<any-app-route>` → `index.html`), then re-run
`npm run lint && npx vitest run && npm run build` locally or open a preview of the fix-forward
branch.

**Rollback is not a substitute for a fix.** After rolling back, fix forward on a branch, let a
Deploy Preview run the gate, merge to the production branch, publish, and unlock.

---

## 5. Environments matrix

Variables are recorded **by name only** — no values live in this repository or in any doc. Set
values in the Netlify UI (site → Site configuration → Environment variables) or with
`netlify env:set VAR_NAME <value>`.

### 5.1 Matrix

| Context | What triggers it | Site | Build vars (Vite, inlined into the public bundle) |
|---|---|---|---|
| **production** | push/merge to the production branch (`main`) | production site | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SITE_URL` |
| **deploy-preview** | every pull request commit | production site (preview deploy) | same names, preview/production values set per context |
| **branch-deploy (staging)** | push to an enabled branch (e.g. `staging`) | **separate staging site** | same names, **staging** values |
| dev (local) | `npm run dev` / `npm run build` | — | local `.env` (never committed) |

Optional/conditional build vars (same names in every context): `VITE_SENTRY_DSN`,
`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYPAL_CLIENT_ID`.

Optional **Netlify Functions** variables (server-side only, **never** `VITE_`-prefixed):
`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PERSONALIZER_WORKER_URL`,
`PERSONALIZER_WORKER_KEY`, `MAIGRET_WORKER_URL`, `MAIGRET_WORKER_SECRET`, `MUAPI_URL`, `MUAPI_KEY`,
`ZEP_API_KEY`, `GEMINI_API_KEY`.

**Never set these in any frontend build** — Vite inlines every `VITE_*` variable into the public
bundle, so each of these would publish a secret to every visitor:

| Prohibited variable | Why |
|---|---|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | service-role key = full DB access |
| `VITE_OPENAI_API_KEY` | spends real money |
| `VITE_REQUEST_SIGNING_SECRET` | signing secret |

Post-build leak check (also documented in `docs/completion/staging/environment-provisioning.md` §5):

```bash
npm run build
grep -rEl "service_role|sk-" dist/assets/*.js && echo "LEAK — abort" || echo "clean"
```

### 5.2 Staging must be isolated

The staging site, Supabase project and Clerk instance must be **new resources**, never the
production ones (production site id `5dc577a2-e84f-4230-a9e3-43f51a5e0a4c` is recorded in
`.netlify/state.json`; the local `.env` points at the production Supabase project and must not be
read, copied or used for staging). Full procedure, variable register and smoke checks:
`docs/completion/staging/environment-provisioning.md`.

---

## 6. Supabase migrations and Edge Functions — separate controlled procedures

**Migrations and Edge Functions are NOT part of any frontend build.** A Netlify build never touches
the database schema or deploys functions; that is a deliberate separation so that a frontend revert
never reverts schema, and a schema change never rides along with a deploy.

Both are run by a human with the Supabase CLI, from a machine that holds the access token, against a
named project ref. The authoritative procedure, apply order, backup/restore/reconcile scripts and
rollback plan are in **`docs/completion/db-clerk-migration.md`** (and the gate status in
`docs/completion/GO_NO_GO.md`). Summary:

1. **Staging first.** Apply the migration chain to the **staging** Supabase project and certify it
   (`docs/completion/staging/certification-test-matrix.md`). Production migration without a passing
   staging certification is a NO-GO.
2. **Apply order** (each later step assumes the earlier ones):
   `20260709030000_clerk_full_alignment_phase2.sql` →
   `20261011120000_clerk_credit_system_alignment.sql` →
   `20261011160000_clerk_identity_table.sql` →
   `20261011170000_webhook_logs_event_key.sql`
3. **Migration before functions.** `run-ai-app` / `proxy-openai` bill against Clerk identity rows;
   deploying them before the credit/identity migration makes every run fail closed.
4. **Set secrets before deploying the webhook functions.** `webhook-zaxxa` and
   `webhook-paykickstart` fail closed: a missing `*_WEBHOOK_SECRET` rejects every real purchase
   event. Confirm each secret exists (`supabase secrets list` → names + SHA-256 digests only) before
   `supabase functions deploy`.
5. **Function deploy order after migration:** `clerk-webhook` → purchase webhooks
   (`webhook-zaxxa`, `webhook-paykickstart`, `webhook-paypal`) → `run-ai-app` / `proxy-openai`.
6. **Record it.** Note the applied migration versions and function deploy hashes alongside the
   production deploy id, so a rollback story exists for both halves.

Frontend deploy ordering that pairs with this: migrate → deploy functions → certify → reconcile →
publish the frontend. A frontend-only production deploy (no migration in flight) is the normal case
and needs no Supabase action.

---

## 7. What changed from GitHub Actions

| Responsibility | Before (GitHub Actions) | Now (Netlify-native) |
|---|---|---|
| Lint | `ci.yml` → `npm run lint` | Step 3 of every Netlify build gate |
| Type check | `ci.yml` → `npx tsc --noEmit`, `continue-on-error: true` | **Not run anywhere** (it was never blocking). Run locally; burn down deliberately |
| Unit tests | `ci.yml` + `netlify-deploy.yml` → `npm test -- --run` | Step 4 of every Netlify build gate |
| Environment validation | `netlify-deploy.yml` → `npm run validate-env` | Step 2, automatic `prebuild` hook on `npm run build` |
| Build | `ci.yml` / `netlify-deploy.yml` / `birthday-landing-deploy.yml` → `npm run build` (with Supabase build env injected from Actions secrets) | Step 5, on Netlify, with build vars from the site's environment configuration |
| PR preview deploys | `netlify-deploy.yml` `preview-deploy` → `netlify deploy --dir=./dist` (needed `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` secrets) | Netlify Deploy Previews, built from the PR head SHA (§2) |
| Production deploys | `netlify-deploy.yml` `build-and-deploy` → `netlify deploy --prod --dir=./dist`, gated on `push` to `main`/`master` or `workflow_dispatch`; `birthday-landing-deploy.yml` → `netlify deploy --prod` on `push` to `main` | Netlify production-context deploys from the production branch, published only with explicit approval (§3). **No workflow deploys anything** |
| Build artifact retention | `actions/upload-artifact@v4` `dist/`, 7 days | Every Netlify deploy is a retained, addressable snapshot |
| Birthday landing verification | grep assertions on `dist/birthday-special/index.html` (`I'm Turning`, `Every App Is Just`) | Static file is published by the build; the string assertions are **not** re-implemented (see §1 call-outs) |
| Gating events | `pull_request.types: [opened, synchronize, reopened, ready_for_review]` on all three workflows (the earlier `pull_request.branches` filter silently skipped PRs whose *base* branch was a release branch) | Netlify builds every PR commit; merge gating via GitHub branch protection on Netlify commit statuses (§3.4) |
| Secrets consumed | Actions secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` | Netlify site environment variables (build vars) + `NETLIFY_AUTH_TOKEN` only for manual CLI deploys. The Actions secrets are now unused — remove them (§3.3) |
| Playwright e2e | nothing (excluded from vitest, no `playwright.config` in repo) | **still nothing** — unchanged, and still uncovered |
| Node/OS matrix | `node: [20.x]` on `ubuntu-latest` | `NODE_VERSION = "20"`, `NPM_VERSION = "10"` in `netlify.toml` |

**Retired workflow files** (renamed, not deleted — content preserved for audit, each with a header
comment pointing here):

```text
.github/workflows/ci.yml                         → .github/workflows/ci.yml.disabled
.github/workflows/netlify-deploy.yml             → .github/workflows/netlify-deploy.yml.disabled
.github/workflows/birthday-landing-deploy.yml    → .github/workflows/birthday-landing-deploy.yml.disabled
```

No workflow history was deleted and nothing was force-pushed.

### Owner actions required outside this repository's code

1. Configure §3.1–§3.2 (production branch, deploy locks) in the Netlify UI.
2. Configure §3.4 (required status checks on `main`, removing any GitHub Actions check requirement)
   in GitHub branch protection. **Not verifiable from inside this repo.**
3. Remove the now-unused `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` GitHub Actions secrets.
4. Optional: enable branch deploys on the staging site and point the `staging` branch at it.

---

## 8. Quick reference

```bash
# Verify the gate locally before pushing (same steps Netlify runs)
npm ci
npm run lint
npx vitest run
npm run build                 # includes the prebuild validate-env hook

# Confirm no workflow is active
ls .github/workflows/         # → only *.disabled files
```

Related documents: `docs/completion/gha-retirement-audit.md` (audit + coverage map),
`docs/completion/ci-netlify-report.md` (historical CI failure root-cause),
`docs/completion/staging-certification.md` (Netlify preview evidence),
`docs/completion/staging/*` (provisioning, certification matrix, gate derivation),
`docs/completion/db-clerk-migration.md` (migration + function procedures),
`docs/completion/GO_NO_GO.md` (release gate status).
