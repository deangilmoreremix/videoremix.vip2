# Missing Credentials & Authorizations

Exactly what is needed to execute staging certification, and which command is blocked by
which credential. Every item below is **absent** from the working environment. Nothing was
provisioned, connected, or authorized while this was written.

No credential values appear in this document or anywhere in the repository.

## What was available

| Resource | Available? | Notes |
|---|---|---|
| Local repo + branch state | Yes | Work performed, evidence gathered |
| GitHub read access via `gh` | Yes | PR/checks/run queries used for the Gate 1 and Gate 2 evidence |
| Public Netlify deploy preview | Yes | Read-only HTTP verification performed |
| Local `node_modules` | **No** | Only 17 dangling `.bin` symlinks are tracked in git; no packages installed. See the note at the end. |
| Production `.env` | Present but **out of bounds** | Points at the production Supabase project; deliberately not read, copied, or used |

## Missing credentials, by command

### 1. Staging Supabase project — blocks Gate 5, 6, 7, 8, 9, 10

Required identifiers (names only):

- `STAGING_SUPABASE_PROJECT_REF` — the project ref (the subdomain of the project URL)
- Staging project URL and anon key
- Staging **service-role** key (function runtime only — never a `VITE_` variable)
- `SUPABASE_ACCESS_TOKEN` — a Personal Access Token for the CLI

Blocked commands:

```bash
supabase db push --project-ref <STAGING_SUPABASE_PROJECT_REF>      # needs: project ref + access token
supabase secrets set ... --project-ref <STAGING_SUPABASE_PROJECT_REF>  # needs: access token
supabase secrets list --project-ref <STAGING_SUPABASE_PROJECT_REF>    # needs: access token
node scripts/deploy-functions.js                                    # needs: SUPABASE_ACCESS_TOKEN + VITE_SUPABASE_URL
```

Note that `scripts/deploy-functions.js` refuses to run without both. Deriving the project ref
from the URL means a single wrong URL silently targets the wrong project — verify the ref
before running it.

**Authorization required:** owner approval to create a staging project, plus approval to
apply migration `20261011120000_clerk_credit_system_alignment.sql` (Gate 5). This migration
re-keyes credits/usage from `auth.users` UUIDs to Clerk text subs and revokes
`PUBLIC`/`EXECUTE` on the credit functions — an irreversible data-shape change that must not
be applied blind.

### 2. Staging Clerk instance — blocks Gates 6, 7, 8, 9, 10

Required identifiers:

- `VITE_CLERK_PUBLISHABLE_KEY` (staging instance, development mode) — for the browser build
- Clerk **secret** key (server-side only)
- `CLERK_WEBHOOK_SECRET` — only if the Clerk sync function is in scope

Blocked commands:

```bash
netlify env:set VITE_CLERK_PUBLISHABLE_KEY ... --site <STAGING_NETLIFY_SITE_ID>
# then the whole authentication matrix (A1–A6) — all of it requires a live staging Clerk
```

**Authorization required:** creation of a development-mode Clerk instance for the staging
domain, with its redirect URLs restricted to that domain.

### 3. Staging Netlify site — blocks Gates 2 (staging), 9, 10

Required identifiers:

- `STAGING_NETLIFY_SITE_ID`
- `NETLIFY_AUTH_TOKEN` for a staging site (must **not** be the production site's token)
- Staging build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SITE_URL`
- The same `VITE_*` values as GitHub Actions secrets, if staging deploys are driven by
  `netlify-deploy.yml`

Blocked commands:

```bash
netlify deploy --dir=./dist                 # needs NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID
netlify deploy --prod --dir=./dist          # production — NOT authorized here
```

**Authorization required:** creation of a staging site. The production site id
`5dc577a2-e84f-4230-a9e3-43f51a5e0a4c` is in `.netlify/state.json` and must **not** be used
for staging.

### 4. OpenAI staging key — blocks Gate 8

- `OPENAI_API_KEY` for the staging Supabase edge functions
  (`proxy-openai`, `run-ai-app`), spend-capped and on a separate billing context

Blocked commands:

```bash
supabase secrets set OPENAI_API_KEY=... --project-ref <STAGING_SUPABASE_PROJECT_REF>
# then matrix D2/D3 and F3 — each makes real model calls
```

**Authorization required:** a spend-capped key. Without a cap, the AI-execution matrix can
generate unbounded cost. Using the production key here is prohibited.

### 5. Provider webhook secrets — blocks Gate 9

- `ZAXXA_WEBHOOK_SECRET` — staging-mode ZAXXA account
- `PAYKICKSTART_WEBHOOK_SECRET` — staging-mode PayKickstart account

Blocked commands:

```bash
supabase secrets set ZAXXA_WEBHOOK_SECRET=... PAYKICKSTART_WEBHOOK_SECRET=... \
  --project-ref <STAGING_SUPABASE_PROJECT_REF>
# then matrix C3–C7 (the positive-path and replay tests) for both providers
```

C1/C2 (the negative, fail-closed tests) can be run without these, because they assert a
rejection — but a passing C1/C2 does **not** prove the secrets are configured correctly.

**Authorization required:** staging-mode provider accounts with webhook signing enabled.
Live-account testing is prohibited: it would create real purchases and mutate real customer
entitlements.

### 6. Optional, provider-dependent — blocks specific matrix rows only

| Credential | Blocks | Command needing it |
|---|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe flows, if in scope | `npx tsx scripts/sync-stripe-pricing.ts`, `scripts/sync-stripe-products.ts` |
| `ANTHROPIC_API_KEY` | Anthropic-backed apps (F3) | edge-function secret set |
| `RESEND_API_KEY` | transactional email | edge-function secret set |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | PayPal flows | edge-function secret set |
| `REDIS_URL` | rate-limit/cache functions | edge-function secret set |
| `PERSONALIZER_WORKER_URL`, `PERSONALIZER_WORKER_KEY` | personalizer prospect scan | Netlify function env |
| `MUAPI_URL`, `MUAPI_KEY` | image/video generation | Netlify function env |
| `ZEP_API_KEY` | Zep memory | Netlify function env |

---

## Local environment blocker: missing `node_modules`

**This is not a credential, but it blocks the local gate suite.**

The dependency tree is not installed. `node_modules/` contains only 17 committed symlinks
under `node_modules/.bin/` whose targets (`../eslint/...`, `../vite/...`, `../typescript/...`)
do not exist. Consequences, all observed directly:

```bash
$ npm run lint
sh: 1: eslint: not found

$ node node_modules/vitest/vitest.mjs --version
Error: Cannot find module '.../node_modules/vitest/vitest.mjs'
```

`npm ci --offline --dry-run` succeeds — it reports the full 830-package tree resolvable from
the local 153 MB npm cache in ~2 s with no network. So restoration is a single offline
command and would change no tracked file (the tree is gitignored; only the `.bin` symlinks
are tracked, and they are rewritten identically).

Restoration was **not** run because `npm install` is prohibited for this workstream. To
unblock, run:

```bash
npm ci --offline
```

Then the local gates:

```bash
npm run lint; echo exit=$?
npx vitest run
npm run build; echo exit=$?
npx tsc -b 2>&1 | grep -c "error TS"
```

## Summary of what is missing

| # | Missing | Gates blocked |
|---|---|---|
| 1 | Staging Supabase project (ref, URL, anon key, service-role key) + `SUPABASE_ACCESS_TOKEN` + migration approval | 5, 6, 7, 8, 9, 10 |
| 2 | Staging Clerk instance (publishable + secret key, optionally webhook secret) | 6, 7, 8, 9, 10 |
| 3 | Staging Netlify site (id + auth token) + staging `VITE_*` build vars | 2, 9, 10 |
| 4 | Spend-capped OpenAI staging key | 8 |
| 5 | Staging-mode ZAXXA + PayKickstart webhook secrets | 9 |
| 6 | Optional provider keys (Stripe, Anthropic, Resend, PayPal, Redis, personalizer worker, MUAPI, Zep) | specific matrix rows |
| 7 | `node_modules` restoration (`npm ci --offline`) — prohibited for this workstream | local gate evidence |

Items 1–5 are **credentials/authorizations** and cannot be produced from this environment.
Item 7 is an environment repair that only needs the prohibition lifted.
