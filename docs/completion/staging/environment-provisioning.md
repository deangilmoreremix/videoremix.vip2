# Staging Environment Provisioning

Procedures for building the staging targets. **Names only — no values are recorded anywhere
in this repository.**

## 0. Create isolated targets

Staging must be fully isolated from production. Create three new resources; do not reuse any
production identifier.

| Target | What to create | Production resource it must NOT be |
|---|---|---|
| Database + edge functions | New Supabase project (staging) | `.env` currently points at the production project — never source staging from it |
| Auth | New Clerk instance in **test/development mode** | The production Clerk instance |
| Hosting | New Netlify site (staging) | `5dc577a2-e84f-4230-a9e3-43f51a5e0a4c` is the production site id in `.netlify/state.json` |

Record the staging Supabase project ref, Clerk instance keys, and Netlify site id in your
platform secret store, not in git.

## 1. Staging Supabase project

```bash
# 1a. Migrations, in order. The credit-system alignment migration is a HARD prerequisite
#     for run-ai-app / proxy-openai: those functions bill against Clerk text subs, and
#     deploying them before this migration applies makes every run fail closed.
supabase db push --project-ref <STAGING_SUPABASE_PROJECT_REF>

# 1b. Edge-function secrets (function runtime only, never exposed to the browser).
supabase secrets set \
  OPENAI_API_KEY=<staging-openai-key> \
  ZAXXA_WEBHOOK_SECRET=<staging-zaxxa-webhook-secret> \
  PAYKICKSTART_WEBHOOK_SECRET=<staging-paykickstart-webhook-secret> \
  SUPABASE_URL=<staging-supabase-url> \
  SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key> \
  SUPABASE_ANON_KEY=<staging-anon-key> \
  --project-ref <STAGING_SUPABASE_PROJECT_REF>

# 1c. Verify (lists names + digests only — never values).
supabase secrets list --project-ref <STAGING_SUPABASE_PROJECT_REF>

# 1d. Deploy the edge functions. This script iterates all 213 function directories and
#     requires an access token plus the URL to derive the project ref from.
export SUPABASE_ACCESS_TOKEN=<staging-supabase-access-token>
export VITE_SUPABASE_URL=<staging-supabase-url>
node scripts/deploy-functions.js
```

`supabase secrets set` values are write-only; `supabase secrets list` returns names and
SHA-256 digests only, so it is safe to paste into an audit log.

## 2. Staging Clerk instance

1. Create a Clerk application in development mode for the staging domain.
2. Note the **publishable key** (goes into the browser build) and the **secret key** (server
   only).
3. Configure the allowed redirect URLs for the staging Netlify domain only.
4. If Clerk webhooks are in scope, record `CLERK_WEBHOOK_SECRET` as an edge-function secret
   (`supabase/functions` reference it).

## 3. Staging Netlify site

Create a staging site and set the build-time variables. The build runs
`npm run validate-env` as a `prebuild` hook, which **hard-fails** if
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing or malformed.

```bash
# Frontend build variables (inlined into the public bundle by Vite — these are the ONLY
# variables that may be public, and none of them may be a secret):
netlify env:set VITE_SUPABASE_URL        "<staging-supabase-url>"       --site <STAGING_NETLIFY_SITE_ID>
netlify env:set VITE_SUPABASE_ANON_KEY   "<staging-anon-key>"           --site <STAGING_NETLIFY_SITE_ID>
netlify env:set VITE_CLERK_PUBLISHABLE_KEY "<staging-clerk-publishable>" --site <STAGING_NETLIFY_SITE_ID>
netlify env:set VITE_SITE_URL            "<staging-site-url>"           --site <STAGING_NETLIFY_SITE_ID>

# Deploy credentials (used by the Netlify Deployment workflow's preview/prod jobs):
export NETLIFY_AUTH_TOKEN=<staging-netlify-auth-token>
export NETLIFY_SITE_ID=<staging-netlify-site-id>
```

Add the same three `VITE_*` values as GitHub Actions secrets for the **staging** repository
or environment if the staging deploys are driven by `netlify-deploy.yml`.

## 4. Variable register

Every variable the platform reads, with its consumer. Anything marked **public** is inlined
into the JavaScript bundle and must never be a secret. Anything marked **server-only** must
never have a `VITE_` prefix.

### Frontend build (Vite, `src/**`, `netlify/functions/**`)

| Variable | Visibility | Where used | Required? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | public | `src/utils/supabase.ts`, `src/lib/supabaseClient.ts`, every Supabase client | **Yes** |
| `VITE_SUPABASE_ANON_KEY` | public | `src/utils/supabase.ts:5`, `src/lib/supabaseClient.ts`, RLS-scoped client init | **Yes** |
| `VITE_CLERK_PUBLISHABLE_KEY` | public | `src/providers/ClerkProvider.tsx` — Clerk mount | **Yes** |
| `VITE_SITE_URL` | public | canonical URL / redirect construction | Recommended |
| `VITE_SENTRY_DSN` | public | Sentry browser SDK | Optional |
| `VITE_STRIPE_PUBLISHABLE_KEY` | public | Stripe publishable flows | If Stripe in scope |

### Edge functions (`supabase/functions/**`, read via `Deno.env.get`)

| Variable | Where used | Required? |
|---|---|---|
| `OPENAI_API_KEY` | `proxy-openai`, `run-ai-app` — model execution | **Yes** (server-only) |
| `SUPABASE_URL` | all webhooks and functions — DB client | **Yes** (server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | `webhook-zaxxa`, `webhook-paykickstart`, `proxy-openai` — balance/entitlement writes | **Yes** (server-only) |
| `SUPABASE_ANON_KEY` | functions validating caller JWTs | Recommended |
| `ZAXXA_WEBHOOK_SECRET` | `webhook-zaxxa` — HMAC signature verification | **Yes** if the ZAXXA webhook is deployed |
| `PAYKICKSTART_WEBHOOK_SECRET` | `webhook-paykickstart` — HMAC signature verification | **Yes** if the PayKickstart webhook is deployed |
| `CLERK_WEBHOOK_SECRET` | Clerk sync function | If Clerk webhooks in scope |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe function + `src/lib/stripe-webhook.ts` | If Stripe in scope |
| `ANTHROPIC_API_KEY` | Anthropic-backed apps | If used |
| `RESEND_API_KEY` | transactional email | If used |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID` | PayPal functions + `netlify/functions/*` | If used |
| `REDIS_URL` | rate-limit / cache functions | If used |
| `SITE_URL` | function-side redirect and CORS construction | Recommended |

### Netlify functions (`netlify/functions/**`)

| Variable | Where used | Required? |
|---|---|---|
| `OPENAI_API_KEY` | AI-backed Netlify functions | **Yes** (server-only) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | privileged Netlify functions | **Yes** (server-only) |
| `PERSONALIZER_WORKER_URL`, `PERSONALIZER_WORKER_KEY` | personalizer prospect scanning | If used |
| `MAIGRET_WORKER_URL`, `MAIGRET_WORKER_SECRET` | extended platform scanning | If used |
| `MUAPI_URL`, `MUAPI_KEY` | image/video generation | If used |
| `ZEP_API_KEY` | Zep memory integration | If used |
| `GEMINI_API_KEY` | optional Gemini models | Optional |
| `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` | deploy jobs in `netlify-deploy.yml` | **Yes** to deploy |

## 5. Variables that must NOT be set in the frontend build

`src/` contains three `VITE_`-prefixed names whose values are secret-shaped. They are
currently dead code (no live consumer reachable from the app entry — verified: the only
importers are the excluded `src/pages/agents/**` dead routes, `useAgentKeyCheck` /
`useAgentApiKeys` hooks not reachable from the router, and `VITE_REQUEST_SIGNING_SECRET` has
**zero importers**):

| Variable | Status | Rule |
|---|---|---|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | assigned in `src/utils/supabase.ts:6`, never read | **Never set.** A service-role key in the bundle grants full DB access to any visitor. |
| `VITE_OPENAI_API_KEY` | `src/utils/agentKeyRequirements.ts:40`, only reachable from dead agent pages | **Never set.** Vite inlines it into public JS. |
| `VITE_REQUEST_SIGNING_SECRET` | `src/utils/requestSigner.ts:35`, zero importers | **Never set.** Dead, but inlining a signing secret would be a compromise. |

Vite inlines *every* set `VITE_*` variable into the bundle. Setting these in a staging
Netlify environment would publish them. Verify after build with:

```bash
npm run build
grep -rEl "service_role|<your-secret-fingerprint>" dist/assets/*.js && echo "LEAK — abort" || echo "clean"
```

## 6. Post-provision smoke checks (no purchase, no AI spend)

```bash
# Config sanity: netlify.toml must declare the right build and publish dir.
grep -A3 "^\[build\]" netlify.toml

# Deploy preview must serve and redirect correctly (SPA fallback must not 404).
curl -fsS -o /dev/null -w "%{http_code}\n" "$STAGING_SITE_URL/"
curl -fsS -o /dev/null -w "%{http_code}\n" "$STAGING_SITE_URL/birthday-special/"

# Edge functions must be reachable and fail CLOSED without a valid signature (expected: 401/403).
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$STAGING_SUPABASE_URL/functions/v1/webhook-zaxxa" \
  -H 'Content-Type: application/json' -d '{}'

# Run the AI function unauthenticated (expected: 401 — JWT-only identity).
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$STAGING_SUPABASE_URL/functions/v1/run-ai-app" \
  -H 'Content-Type: application/json' -d '{}'
```

A 200 from either unauthenticated call is an immediate **NO-GO** — see
`go-no-go-gates.md` Gate 1.
