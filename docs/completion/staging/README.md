# Staging Certification Procedures

Procedures for provisioning a staging environment and certifying VideoRemix.vip / SapienX
against the production release gates.

**Status: NOT YET EXECUTED.** These are executable procedures. Provisioning was deliberately
not performed because the required staging credentials are unavailable in the working
environment (see `credential-requirements.md`). No Supabase project was contacted, no
Netlify site was created, no Clerk instance was touched, and no provider webhook secret was
used while authoring this document.

**Scope guard:** staging must be a *separate* Supabase project, a *separate* Clerk instance,
and a *separate* Netlify site from production. The working directory's `.env` points at the
**production** project, so staging values must never be sourced from it.

| Document | Purpose |
|---|---|
| `environment-provisioning.md` | Create the staging Supabase/Clerk/Netlify targets and set every required variable (names only — no values, ever) |
| `certification-test-matrix.md` | The 8 functional areas to certify with exact steps and pass criteria |
| `go-no-go-gates.md` | The 10 production release gates and the evidence each requires |
| `credential-requirements.md` | Exactly which credential/authorization is missing, and which command needs it |

## Hard safety rules

1. **Never commit a secret.** Only variable *names* belong in these documents. Values belong
   in the target platform's secret store (Supabase secrets, Netlify env, Clerk dashboard).
2. **Never point staging at production resources.** A staging run against the production
   Supabase project would bill real credits and mutate real customer entitlements.
3. **Never run the staging matrix with `OPENAI_API_KEY` set to the production key.** Real
   spend occurs. Use a separate key with a hard spend cap.
4. **Never deploy a webhook function to production before its secret exists.** Both purchase
   webhook guards are fail-closed by design — deploying without the secret *rejects every
   real purchase event*. See `go-no-go-gates.md` Gate 4.
5. Migrations must be applied **before** the functions that depend on them
   (`supabase/migrations/20261011120000_clerk_credit_system_alignment.sql` is a hard
   prerequisite for `run-ai-app` / `proxy-openai`).

## Prerequisites

- A staging Supabase project (ref + anon key + service-role key)
- A staging Clerk instance (publishable key + secret key)
- A staging Netlify site (site id + auth token)
- An OpenAI key scoped and spend-capped for staging
- ZAXXA and PayKickstart webhook signing secrets (staging-mode provider accounts)
- Node.js 20.x and a working `node_modules` (`npm ci`) to run the local gates
