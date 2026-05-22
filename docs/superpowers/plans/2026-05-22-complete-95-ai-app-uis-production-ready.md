# Complete 95 Production-Ready AI App UIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (strongly recommended) to implement this plan task-by-task with fresh subagents per batch + two-stage reviews (spec compliance then code quality). This is a very large scope (95 custom UIs).

**Goal:** Deliver fully functional, production-ready custom React UIs for all 95 internal AI apps (the ones mapped from awesome-llm-apps) so that users with access can launch them directly inside the VideoRemix dashboard at `/ai-app/:slug`, with rich interactive controls matching the experience and patterns from the original Streamlit demos on theunwindai.com / awesome-llm-apps, backed by real Supabase Edge Functions, without duplicating any existing GTM, sales copy, testimonials, or Stripe marketing code.

**Architecture:** 
- Marketing + access gating + Stripe remains 100% in existing `AppDetailPage` + `appsData.ts` (no changes or duplication).
- Runner at `/ai-app/:slug` uses the existing `AIAppShell` + new registry + per-app custom components.
- Each app's "brain" lives in an enhanced `run-ai-app` Edge Function (or per-category functions) that receives structured inputs and returns rich outputs (text, images, audio, structured data).
- Hybrid implementation: Reusable UI primitives + per-app specific forms + shared Edge Function dispatcher with per-app prompts/tools/config. This keeps the system maintainable while giving each app its own tailored experience.

**Tech Stack:**
- Frontend: React + TypeScript + existing Tailwind/shadcn components + Lucide icons
- State & calls: Supabase client → Edge Functions
- Backend: Deno Edge Functions (OpenAI SDK or fetch, Supabase Storage, pgvector for RAG)
- Registry: Lazy-loaded React components with graceful fallback to Generic

**Non-Goals (to avoid scope creep and duplication):**
- No changes to marketing pages, sales copy, or purchase flows.
- No "Clone code" button (already removed from shell).
- Auth/access strictly via existing Supabase mechanisms.
- The 15 legacy external Netlify apps remain untouched.

---

## Current State Verification (as of 2026-05-22)

- 95 apps exist only as metadata + GTM in `appsData.ts` and Supabase `apps` table.
- No custom per-app React UIs exist (only `GenericAIApp` placeholder + registry scaffolding).
- Git history and plans confirm this work was never completed.
- Template + registry + shell + route + basic Edge stub already in place from prior steps.

## File Structure Decisions

New files will live under:
- `src/components/ai/apps/` — one folder per app + shared primitives
- `supabase/functions/run-ai-app/` — enhanced dispatcher + per-app handlers
- `src/lib/ai-app-primitives/` — reusable form/output components

## Overall Phases

**Phase 0: Infrastructure Hardening (1-2 days)**
**Phase 1-12: Category Batches (8-10 apps each)**
**Phase 13: Polish, Testing, Production Hardening, Documentation**

Each batch task will produce working, testable software for that group of apps.

---

### Phase 0: Infrastructure Hardening

#### Task 0.1: Enhance Edge Function to Real Dispatcher

**Files:**
- Modify: `supabase/functions/run-ai-app/index.ts`
- Create: `supabase/functions/run-ai-app/app-configs.ts` (or move to DB table later)
- Create: `supabase/functions/_shared/ai-utils.ts`

- [ ] **Step 1:** Define per-app config shape (system prompt, model, tools, output schema, required inputs)

```ts
// Example in app-configs.ts
export const APP_CONFIGS: Record<string, AppConfig> = {
  "ai-sales-intelligence-pro": {
    systemPrompt: "You are an expert sales intelligence agent...",
    model: "gpt-4o",
    tools: ["web_search", "supabase_rag"],
    outputSchema: { type: "object", properties: { ... } },
  },
  // ... one entry per app or group by category
};
```

- [ ] **Step 2:** Update the Edge Function to load config by `appSlug`, call OpenAI with the right prompt + tools + user inputs, handle RAG via Supabase when needed, return structured result + usage.

- [ ] **Step 3:** Add proper error handling, rate limiting, usage logging to `app_runs` table.

- [ ] **Step 4:** Test locally with `supabase functions serve` + curl for 3 different apps.

- [ ] **Step 5:** Commit

```bash
git add supabase/functions/run-ai-app/
git commit -m "feat: production Edge Function dispatcher for all 95 AI apps"
```

#### Task 0.2: Build Reusable AI UI Primitives Library

**Files:**
- Create: `src/components/ai/primitives/`

- [ ] Create `PromptTextarea.tsx`, `FileUploaderForRAG.tsx`, `MultiStepWizard.tsx`, `ResultMarkdown.tsx`, `ResultAudioPlayer.tsx`, `ResultTable.tsx`, `LoadingOverlay.tsx`, `UsageMeter.tsx` (if not already in shell), etc.

- [ ] Each primitive is self-contained, accessible, and styled consistently with the VideoRemix design system.

- [ ] Export from an index.

- [ ] Test each primitive in isolation (Storybook or simple test page).

#### Task 0.3: Finalize Registry & Fallback Behavior

**Files:**
- Modify: `src/components/ai/apps/registry.ts`

- [ ] Ensure every one of the 95 slugs has an entry (even if pointing to a thin wrapper around primitives for now).

- [ ] Add "isProductionReady" flag per app for admin visibility.

---

### Phases 1-12: Category Batches (≈8 apps per batch)

For each batch:

**Pre-requisite for the batch:** Review the original Streamlit code (or the detailed description + steps in `appsData.ts`) for each app in the batch to extract exact input fields and output expectations.

**Per app in batch (repeatable 8 times):**

#### Task B.N: Implement [Exact App Name] UI + Wiring

**Files:**
- Create: `src/components/ai/apps/[slug]/index.tsx`
- Modify (if needed): `registry.ts` to register the lazy import
- Modify (if needed): `app-configs.ts` in Edge Function for this app's specific prompt/tools

- [ ] **Step 1:** Copy `_TEMPLATE.tsx` into the folder and rename.

- [ ] **Step 2:** Build the exact form controls based on the original demo (text, textarea, file upload, selects, multi-inputs, etc.). Use the new primitives.

- [ ] **Step 3:** Map form state to the `inputs` object expected by the Edge Function.

- [ ] **Step 4:** Implement rich result rendering (markdown, images, downloadable files, tables, audio, etc.).

- [ ] **Step 5:** Wire real call to `supabase.functions.invoke('run-ai-app', ...)` with proper loading, error, and success states.

- [ ] **Step 6:** Integrate with shell's Save to Project and Download (store result JSON + any files in Supabase Storage under user folder).

- [ ] **Step 7:** Add any app-specific features (e.g., voice recording for voice apps, code editor for coding apps).

- [ ] **Step 8:** Manual test end-to-end with a real user account that has access.

- [ ] **Step 9:** Commit with clear message including the app slug.

Example commit: `feat(ai-apps): production UI for ai-sales-intelligence-pro + Edge wiring`

**Batches (based on user's original 12 categories):**

- Batch 1: Sales, Lead Gen & Prospecting (10 apps)
- Batch 2: Content Creation & Marketing (10)
- Batch 3: Video, Audio & Voice (9)
- Batch 4: RAG, Knowledgebase & Document Chat (13)
- ... continue for the remaining 8 categories.

After each full batch: 
- Run full test of the batch
- Update admin visibility if needed
- Commit as a group

---

### Phase 13: Final Production Polish & Rollout

- Global error boundaries and retry logic
- Streaming responses where OpenAI supports it (for better UX on long-running apps)
- Usage quotas enforcement visible in the shell
- Mobile responsiveness audit for all 95
- Performance: ensure lazy loading works and bundle size stays reasonable
- Documentation: internal wiki page + "How to add the 96th app" guide
- Final verification: every one of the 95 has `isProductionReady: true` in registry/config

---

## Execution Recommendation

**Use Subagent-Driven Development** for this entire plan.

- One fresh subagent per batch (or even per 2-3 apps inside a batch).
- Controller (you) reviews spec compliance after each subagent finishes its batch.
- Then code quality review.
- Only then mark batch complete and move to next.

This is the only way to deliver 95 high-quality production UIs without losing context or quality.

**Plan saved.** Ready to begin execution on your command.

Which batch do you want to start with first? (I recommend starting with Batch 1: Sales/Lead Gen as they are high-value and have clear input/output patterns.) 

Once you choose, I will dispatch the first subagent using the proper subagent-driven-development workflow.