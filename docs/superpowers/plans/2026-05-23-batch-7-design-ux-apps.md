# Complete Batch 7: Design & UX Apps (6 Custom UIs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task with fresh subagent per task, spec compliance review, then code quality review.

**Goal:** Replace GenericAIApp wrappers for all 6 Batch 7 Design & UX apps with production-grade custom React UIs that fully leverage OpenAI Responses API (tools, streaming, structured outputs, multi-turn) and Realtime/WebSocket features for a superior user experience.

**Architecture:** Each app gets its own focused index.tsx following the established pattern from Batches 1-5. All apps share the enhanced `useRunAIApp` hook (WebSocket streaming, multi-turn context, auto-retry, error suggestions). Vision apps get image upload. All UIs integrate with the global tabbed AIAppShell + ResultPanel for copy/save/expand/fullscreen. Multi-turn is enabled for design iteration ("refine this", "make it more modern").

**Tech Stack:** React + TypeScript + Tailwind + existing primitives (PromptTextarea, BasicFileUpload, StructuredResult, ResultActions, Button) + useRunAIApp hook + OpenAI Responses API (via Edge Function with tools already configured).

---

## File Structure for Batch 7

All 6 apps currently have thin wrappers at:
`src/components/ai/apps/<slug>/index.tsx`  (import GenericAIApp)

We will replace the content of each with a full custom component (no new directories needed).

Shared primitives to reuse (already exist):
- `src/components/ai/primitives/PromptTextarea.tsx`
- `src/components/ai/primitives/BasicFileUpload.tsx`
- `src/components/ai/primitives/StructuredResult.tsx`
- `src/components/ai/primitives/ResultActions.tsx`
- `src/components/ui/button.tsx`, `label.tsx`

---

## Task 1: Custom UI for ai-design-studio (Vision + Multi-turn)

**Files:**
- Modify: `src/components/ai/apps/ai-design-studio/index.tsx` (replace Generic wrapper)
- Test: (optional smoke test via build)

- [ ] **Step 1: Analyze existing vision pattern**

Read `src/components/ai/apps/visual-document-ai/index.tsx` and `src/components/ai/apps/home-renovation-visualizer-ai/index.tsx` for image upload + vision pattern.

- [ ] **Step 2: Implement rich form**

Form fields (matching config):
- designGoal (textarea)
- style (select: modern/minimalist/bold/playful)
- targetPlatform (multi or select)
- colorPreference (text)
- Optional: reference image upload (BasicFileUpload → base64 passed as imageUrl or referenceImage)

Enable multi-turn: `const { run, ... } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });`

Add "Refine this design" button that appends to conversation.

- [ ] **Step 3: Beautiful result rendering**

Use StructuredResult or custom cards for:
- designConcept
- colorPalette (swatches)
- typography
- componentIdeas (nice list)
- layoutSuggestions

Include "Iterate" / "Generate variations" buttons that use multi-turn.

- [ ] **Step 4: Verify build + TypeScript**

Run `npm run build` and fix any issues.

- [ ] **Step 5: Commit**

`git add ... && git commit -m "feat(Batch7): production UI for ai-design-studio with vision + multi-turn iteration"`

---

## Task 2: Custom UI for landing-page-critic-ai (Vision + Web Search + Multi-turn)

**Files:**
- Modify: `src/components/ai/apps/landing-page-critic-ai/index.tsx`

- [ ] **Step 1: Form with URL + image upload + goal/audience**

Inputs: landingPageUrl or upload screenshot, targetGoal, targetAudience.

Use BasicFileUpload for screenshot.

- [ ] **Step 2: Result view**

Score big number, strengths/weaknesses lists, uxAnalysis, conversionAnalysis, recommendations, abTestIdeas.

Add "Improve this landing page" multi-turn flow.

- [ ] **Step 3: Commit**

---

## Task 3-6: Remaining 4 apps (ai-ux-designer, dashboard-designer-ai, landing-page-copy-ai, conversion-copy-editor)

Each follows the same pattern:
- Rich form matching expected inputs in systemPrompt
- Enable multi-turn for "make it more persuasive", "alternative version", etc.
- Nice structured result output (use existing primitives)
- No vision needed (they use web_search_preview)
- Commit per app

Detailed forms:
- ai-ux-designer: productConcept, targetUsers, primaryUseCase, constraints
- dashboard-designer-ai: dataSources, userRole, keyMetrics, desiredInsights
- landing-page-copy-ai: productService, targetAudience, uniqueValueProp, conversionGoal
- conversion-copy-editor: currentCopy (textarea), goal, audience, platform

All should feel "delightful" for design professionals.

---

## Verification for Whole Batch

After all 6 tasks:
- `npm run build` clean
- All 6 show "Enhanced UI • Production Ready" badge in AIAppRunnerPage
- Vision apps can upload images and get analysis
- All support multi-turn iteration via the hook
- WebSocket streaming is active (faster responses)
- ResultPanel copy/save/expand works globally
- Usage tracking visible in shell

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-batch-7-design-ux-apps.md`.**

Ready to execute with Subagent-Driven Development (recommended).

Which sub-batch first? 7.1 (the two vision apps) or all 6 sequentially?