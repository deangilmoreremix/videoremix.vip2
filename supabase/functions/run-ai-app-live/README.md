# run-ai-app-live

The source deployed as the **`run-ai-app`** edge function on the live project.

`../run-ai-app` is a newer version that also charges credits from the
`credits` schema. That schema, and its migrations
(`20260924000000`–`20260924000002`, `20261011120000`), are not applied on
the live project, so deploying `../run-ai-app` there would refuse every run
with `500 CREDIT_BALANCE_UNAVAILABLE`. The owner chose to keep the apps free
of credit charges for now, so the live function is this one.

It is the live v51 `index.ts` unchanged, with one change to
`app-configs.ts`: `getAppConfig` resolves a slug the app library sends to,
in order,

1. its own specialized config,
2. the tuned config of the converted app it aliases
   (`converted-app-aliases.ts`), or
3. the Awesome LLM fallback prompt built from its catalog entry
   (`awesome-llm-fallbacks.ts`), on `gpt-4o-mini` like every other config.

Before this, v51 only knew the 96 pre-rebrand slugs, so 96 of the 100
Awesome LLM apps that open in the runner answered "Demo mode".

Deploy: upload the four `.ts` files here as the function **`run-ai-app`**
(entrypoint `index.ts`, `verify_jwt` off, as it is live) through the
Supabase Management API or the Supabase MCP `deploy_edge_function` tool.
The CLI deploys a function from the directory of the same name, so it would
pick up `../run-ai-app` instead.

When the credit system is applied live, deploy `../run-ai-app` instead and
delete this directory.
