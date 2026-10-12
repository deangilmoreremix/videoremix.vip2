# Netlify CI/CD Implementation — Release Gate, Contexts, Verification

**Branch:** `kilo/pr19-completion` (PR #20 head, `b7aad5cd`)
**Scope owned here:** `netlify.toml`, `package.json` (scripts section only), `scripts/netlify-release-gate.mjs`, `scripts/tsc-baseline.json`, this report.
**Decision implemented:** Netlify is the official build / test / preview / production platform. GitHub is source control + PRs only. GitHub Actions are billing-locked and are **not** part of the deploy path and cannot gate deploys.

---

## 1. What changed (exact diff surface)

### `package.json` — scripts section only (no dependency changes)
```json
"release:gate": "node scripts/netlify-release-gate.mjs",
```

### `netlify.toml` — `[build]` block
```toml
[build]
  command = "npm run release:gate"   # was: "npm run build"
  publish = "dist"
```
- `publish = "dist"` unchanged.
- All existing `[[redirects]]` (personalizer API endpoints, `/auth/*` Supabase redirect, `/api/*` catch-all) and all `[[headers]]` (security headers incl. CSP/HSTS, cache headers) are **unchanged** — verified line-by-line (8 redirect blocks, 9 header blocks, byte-identical to the pre-change file except the `[build]` block).
- `[build.environment]` keeps `NODE_VERSION = "20"` / `NPM_VERSION = "10"` and adds `NPM_FLAGS = "--include=dev"` (defensive: guarantees the gate toolchain devDependencies — eslint, vitest, typescript, vite — are installed even if `NODE_ENV=production` is ever set at the site level; verified `npm ci --include=dev` is valid on npm 10 and installs the full 830-package tree). `NODE_ENV` is deliberately **not** set: `vite build` already defaults to production mode, and Netlify's build image does not set `NODE_ENV` by default.

### New context blocks (non-secret values only)
```toml
[context.production.environment]
  VITE_APP_ENV = "production"

[context.deploy-preview.environment]
  VITE_APP_ENV = "preview"

[context.branch-deploy.environment]
  VITE_APP_ENV = "staging"
```
`VITE_APP_ENV` is an inert non-secret marker (verified: not read anywhere in `src/` today; available for future use). **No secrets are committed in netlify.toml or any tracked file.**

### New files
- `scripts/netlify-release-gate.mjs` — the release gate (the CI/CD).
- `scripts/tsc-baseline.json` — TypeScript legacy-debt baseline (`baselineErrors: 1621`) + counting method + update instructions.

---

## 2. Gate design — steps (run in order, fail-fast)

`netlify.toml` runs `npm run release:gate` → `node scripts/netlify-release-gate.mjs`. Single-step runs for ops/debugging: `node scripts/netlify-release-gate.mjs --step=<id>` (`--list` shows ids).

| # | Step id | Command | What it enforces |
|---|---|---|---|
| 1 | `validate-env` | `npm run validate-env` | Required build-time env present and well-formed (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| 2 | `lint` | `npm run lint` | ESLint, approved warning budget `--max-warnings 821` (currently 796). Exits 0 only at 0 errors and ≤821 warnings |
| 3 | `test` | `npx vitest run` | **Full** vitest suite — all 41 files / 634 tests (currently measured) |
| 4 | `test-catalog` | `npx vitest run src/config/appRegistry.test.ts` | Named step: **asserts the file exists**, then runs it — catalog integrity (117+13=130 apps) must pass |
| 5 | `test-security` | `npx vitest run tests/webhook-paykickstart.test.ts tests/webhook-verify.test.ts tests/webhook-zaxxa.test.ts` | Named step: **asserts ≥1 `tests/webhook-*.test.ts` exists**, then runs all of them — provider-correct webhook verification regression suite |
| 6 | `typescript` | `npx tsc -b` + error count vs `scripts/tsc-baseline.json` | FAILS only on **regression**: measured `error TS` count > baseline (1621). Legacy debt stays non-blocking |
| 7 | `build` | `npm run build` | Vite production build succeeds and `dist/index.html` exists |

Each step prints `PASS [n/7] <id> (<seconds>s)` or `FAIL: step n/7 <id> — <reason>`; the script then prints a summary block and `GATE RESULT: PASS|FAIL`.

### Why failures block deploys
Netlify fails a deploy when the `[build] command` exits non-zero. The gate therefore:
- propagates every child exit code (no `|| true`, no `continue-on-error` anywhere);
- fails fast: the first failing step aborts the gate with `process.exit(1)`, so later steps (including the build) never run — proven below;
- additionally asserts the *existence* of the two critical suites (steps 4–5), so a deleted/regressed security or catalog suite cannot silently pass;
- treats "tsc exited non-zero but reported zero diagnostics" as a failure (toolchain/config breakage must not look like a clean pass).

---

## 3. TypeScript baseline mechanism (legacy debt, non-blocking)

- **Counting method** (documented in `scripts/tsc-baseline.json`): run `npx tsc -b` and count output lines matching `error TS` — one such line = one compiler diagnostic. Reproduce: `npx tsc -b 2>&1 | grep -c 'error TS'`.
- **Current baseline: 1621** — re-measured during this workstream on `b7aad5cd` (exact match with the documented figure; down from ~3,435 before the `@` path alias).
- `npx tsc -b` exits non-zero whenever *any* error exists (expected at baseline), so the exit code alone is **not** the verdict — only `count > baseline` fails.
- On regression the gate prints the measured count, baseline, delta, and the first 10 error lines (with file:line) for triage, e.g.:
  `FAIL: step 6/7 typescript — type-check REGRESSION: 1621 errors > baseline 1620 (+1).`
- To burn down debt: fix errors, re-run the counting method, then update `baselineErrors` in `scripts/tsc-baseline.json`.
- To prove the detector without editing the committed file: `NETLIFY_GATE_TSC_BASELINE=<lower>` (env override) or `NETLIFY_GATE_TSC_BASELINE_FILE=<path>` (temp baseline JSON).

---

## 4. Environment / context mapping (secret NAMES only — values live in the Netlify UI)

Secrets are set in **Netlify UI → Site configuration → Build & deploy → Environment variables**, scoped "same for all contexts" or "different per deploy context". Nothing secret is committed.

| Scope | Variable names | Set where |
|---|---|---|
| All contexts (build-time, **required** by step 1) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public values) | All contexts |
| Production context | `VITE_CLERK_PUBLISHABLE_KEY` (prod Clerk instance), `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, `PERSONALIZER_WORKER_KEY`, `PERSONALIZER_WORKER_URL`, `MAIGRET_WORKER_SECRET`, `MAIGRET_WORKER_URL` (prod values); optional `VITE_REQUEST_SIGNING_SECRET`, `VITE_OPENAI_API_KEY` if used by the client build | Production |
| Deploy Preview (PR) context | Same NAMES with test/preview values, or omit (previews then only exercise the gate + non-secret features) | Deploy previews |
| Branch deploy (staging) context | Same NAMES with staging values | Branch deploys |
| Committed in netlify.toml (non-secret) | `VITE_APP_ENV` (`production` / `preview` / `staging`), `NPM_FLAGS`, `NODE_VERSION`, `NPM_VERSION` | netlify.toml |

Supabase migrations and Edge Functions (incl. payment webhooks) are **not** deployed by this path — they remain separate controlled procedures (see §6).

---

## 5. Verification outputs (local, exactly as Netlify invokes the gate)

Environment note: the workspace `node_modules` was empty (dangling `.bin` symlinks) at start. Restored from the **committed** `package-lock.json` with `npm ci` (749 packages, no dependency changes; `git status` shows `package.json` / `package-lock.json` unmodified). Toolchain: tsc 5.9.3, vitest 4.1.7, eslint 9.39.4.

### 5.1 Full gate — PASS (exit 0)
Command: `node scripts/netlify-release-gate.mjs`

```
[netlify-release-gate] === Netlify release gate: 7 step(s) (fail-fast; non-zero exit fails the deploy) ===
--- [1/7] validate-env: validate-env (required env vars) ---
PASS [1/7] validate-env (0.2s)
--- [2/7] lint: lint (approved warning budget 821) ---
PASS [2/7] lint (12.1s)
--- [3/7] test: test — FULL vitest suite ---
 Test Files  41 passed (41)
      Tests  634 passed (634)
PASS [3/7] test (51.6s)
--- [4/7] test-catalog: catalog integrity suite must exist and pass ---
 Test Files  1 passed (1)
      Tests  7 passed (7)
PASS [4/7] test-catalog (1.9s)
--- [5/7] test-security: webhook verification regression suites must exist and pass ---
security regression suites: tests/webhook-paykickstart.test.ts, tests/webhook-verify.test.ts, tests/webhook-zaxxa.test.ts
 Test Files  3 passed (3)
      Tests  110 passed (110)
PASS [5/7] test-security (3.1s)
--- [6/7] typescript: tsc -b regression check vs baseline ---
tsc reported 1621 error(s) (baseline 1621, source scripts/tsc-baseline.json). First 10:
...
type-check within baseline: 1621 <= 1621 (legacy debt non-blocking, no regression)
PASS [6/7] typescript (25.4s)
--- [7/7] build: build — vite production build (dist/) ---
PASS [7/7] build (16.4s)
=== GATE SUMMARY ===
  PASS validate-env (0.2s)
  PASS lint (12.1s)
  PASS test (51.6s)
  PASS test-catalog (1.9s)
  PASS test-security (3.1s)
  PASS typescript (25.4s)
  PASS build (16.4s)
GATE RESULT: PASS — 7 step(s), 110.6s total. Deploy may proceed.
```
Exit code: `0`. Build output: `dist/index.html` present, 1013 files in `dist/`.

### 5.2 Regression detector — isolated (env override), FAIL (exit 1)
```
$ NETLIFY_GATE_TSC_BASELINE=1620 node scripts/netlify-release-gate.mjs --step=typescript
tsc baseline overridden via NETLIFY_GATE_TSC_BASELINE=1620
tsc reported 1621 error(s) (baseline 1620, source env:NETLIFY_GATE_TSC_BASELINE). First 10:
src/App.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
... (10 triage lines printed) ...
... 1611 more (run locally: npx tsc -b 2>&1 | grep -c 'error TS')
FAIL: step 6/7 typescript — type-check REGRESSION: 1621 errors > baseline 1620 (+1). Documented legacy debt is non-blocking, but growth fails the deploy.
GATE RESULT: FAIL — the deploy MUST NOT proceed.
EXIT:1
```

### 5.3 Regression detector — temp baseline file, FAIL (exit 1)
```
$ NETLIFY_GATE_TSC_BASELINE_FILE=/tmp/kilo/tsc-baseline-lower.json node scripts/netlify-release-gate.mjs --step=typescript
tsc reported 1621 error(s) (baseline 1600, source /tmp/kilo/tsc-baseline-lower.json). First 10:
FAIL: step 6/7 typescript — type-check REGRESSION: 1621 errors > baseline 1600 (+21). ...
GATE RESULT: FAIL — the deploy MUST NOT proceed.
EXIT:1
```

### 5.4 Full gate with simulated regression — FAIL, fail-fast proven (exit 1)
```
$ NETLIFY_GATE_TSC_BASELINE=1620 node scripts/netlify-release-gate.mjs
PASS [1/7] validate-env (0.1s)
PASS [2/7] lint (12.7s)
PASS [3/7] test (51.3s)          # 41 files / 634 tests
PASS [4/7] test-catalog (1.7s)   # 7 tests
PASS [5/7] test-security (3.0s)  # 110 tests
FAIL: step 6/7 typescript — type-check REGRESSION: 1621 errors > baseline 1620 (+1). ...
GATE RESULT: FAIL — the deploy MUST NOT proceed.
```
- Step 7 (build) **never ran** (grep for `[7/7] build` in that run's output: 0 matches) — fail-fast confirmed.
- The override was an ephemeral env var; the committed `scripts/tsc-baseline.json` (1621) was never modified. Restore verified: running step `typescript` with no override → `1621 <= 1621`, `GATE RESULT: PASS`, exit 0.

---

## 6. Build-path audit — no GitHub Actions, no Supabase deploys

- `package.json` scripts: grep for `gh`/`actions`/`github` → **no matches**. The gate invokes only: `npm run validate-env`, `npm run lint`, `npx vitest run`, `npx tsc -b`, `npm run build`.
- `netlify.toml`: the only occurrence of "GitHub/Actions" is the comment stating Actions are NOT used; no `gh`, workflow, or Supabase-CLI references.
- Build path (`vite build` via `vite.config.ts`): no Supabase CLI, no migration application, no edge-function deploy. (`vite.config.ts` contains only a dev-server proxy alias for `*.supabase.co` and a functions-path ignore.)
- Supabase migrations / Edge Functions (incl. provider webhooks) are deployed via separate controlled procedures (`scripts/deploy-functions.js`, supabase CLI flows) and are **not** reachable from the Netlify build command.
- The retired CI workflows (`.github/workflows/*.disabled`) are outside this build path; their retirement is owned by the GitHub Actions workstream.

---

## 7. Risks & required Netlify site settings (for the coordinator)

**Risks**
1. **Build duration / build minutes.** Full gate ≈ **111 s** on this machine (tests ≈ 52 s, tsc ≈ 25 s, lint ≈ 12 s, build ≈ 16 s). Every PR deploy preview pays this cost — watch the site's build-minute budget on Netlify; the dominant term is the vitest suite.
2. **Required env at build time.** If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set in the Netlify UI (all contexts), step 1 fails and **every** deploy (prod + previews) is blocked by design. These are public values.
3. **Lint budget.** Step 2 fails if warnings exceed 821 or any error appears; currently 796 — only ~25 warnings of headroom. New app-code warnings in `src/**` consume it.
4. **tsc baseline drift.** If an agent legitimately reduces errors without updating `scripts/tsc-baseline.json`, the gate stays green (≤ baseline passes); if errors grow beyond 1621, deploys fail until either fixed or the baseline is consciously updated. This is the intended ratchet.
5. **devDependencies toolchain.** Gate depends on devDeps (`eslint`, `vitest`, `typescript`, `vite`). `NPM_FLAGS=--include=dev` in netlify.toml is the safety net if `NODE_ENV=production` is ever set at site level.

**Required Netlify UI/API site settings (precise list for the coordinator)**
1. **Deploy previews: ON** (Site configuration → Build & deploy → Deploy notifications/Deploy contexts → *Deploy previews* → "Any pull request against your production branch..." — at minimum "only for PRs from same repo") so PRs build through the gate.
2. **Branch deploys: ON, limited to the staging branch** (e.g. `staging`) — this is what `[context.branch-deploy.environment]` (`VITE_APP_ENV = "staging"`) applies to. Do not enable "all branches".
3. **Production deploys: auto-publish vs. approval** — recommended: keep **publishing locked / require approval for production deploys** (Site configuration → Build & deploy → Build settings → *Deploy previews and production deploys* → "Lock deploys" / approval) so the human GO decision stays in the loop even though the gate is automated.
4. **Rollback: available (Netlify instant rollback)** — no config needed, but confirm the site plan includes instant rollback and that a previous known-good production deploy exists to roll back to.
5. **Environment variables per context (names in §4)** — set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for all contexts (blocking!), plus the production-scoped secret names.
6. **Build image / settings** — `NODE_VERSION=20`, `NPM_VERSION=10`, `NPM_FLAGS=--include=dev` are now committed in netlify.toml (no UI action needed); base directory = repo root, build command = `npm run release:gate`, publish directory = `dist` (matches the toml; verify the UI is not overriding the build command).
7. **Required status checks (if the PR workflow uses them)** — if branch protection on `main` requires checks, they must reference **Netlify** (e.g. the Netlify deploy-preview status/check on the PR), not GitHub Actions, since Actions are billing-locked and retired.
8. **Netlify Functions env** (runtime, not build) — production-scoped names from §4 (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, `PERSONALIZER_WORKER_*`, `MAIGRET_WORKER_*`) so personalizer endpoints work in production/preview.

---

## 8. Files edited in this workstream
- `netlify.toml` — build command → gate; `NPM_FLAGS`; production/deploy-preview/branch-deploy context env blocks (non-secret only); redirects/headers untouched.
- `package.json` — added `release:gate` script (scripts section only).
- `scripts/netlify-release-gate.mjs` — new: the fail-fast 7-step gate.
- `scripts/tsc-baseline.json` — new: 1621 baseline + counting method + history.
- `docs/completion/netlify-cicd-implementation.md` — this report.
