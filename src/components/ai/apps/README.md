# AI Apps Template + Registry System

This folder contains the scalable system for all 95 first-party AI apps.

## How it works

- `registry.ts` → Central map of slug → lazy component
- `types.ts` → Shared contract every app must follow
- `GenericAIApp.tsx` → Fallback UI used until a custom one is built
- `_TEMPLATE.tsx` → Copy this when creating a new app
- `[slug]/index.tsx` → The real custom React UI for that app (forms, logic, outputs)

## Adding a new app (fast & consistent)

1. Copy `_TEMPLATE.tsx` → `your-slug/index.tsx`
2. Customize the form fields and output rendering to match the original demo
3. Register the lazy import in `registry.ts`
4. Done — the runner automatically uses the new UI

Until step 3 is done, users still get a working experience via the Generic template.

This design lets us deliver the 95 apps in clean batches without ever breaking the dashboard.
