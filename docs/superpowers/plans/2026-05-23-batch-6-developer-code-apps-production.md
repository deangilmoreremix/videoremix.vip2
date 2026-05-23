# Batch 6: Developer & Code Apps – Production UIs + First-Class OpenAI Responses & Realtime Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (strongly recommended) to implement this plan task-by-task with fresh subagents per task (or per 2-app mini-batch) + two-stage reviews (spec compliance then code quality). This batch delivers 10 high-value developer tools that deeply leverage the new OpenAI Responses API tools (`code_execution`, `web_search_preview`) and selective Realtime voice for magical "talk to your AI pair programmer" experiences.

**Goal:** Deliver 10 production-ready, custom React UIs for the Developer & Code category. Every app must actually exercise the advanced Responses API capabilities (especially the hosted `code_execution` sandbox) so the output is verifiably better than a plain LLM call. Two to three apps will also expose Realtime voice for voice-driven planning and review workflows. All 10 must be added to `productionReadySlugs`, pass manual + automated checks, and feel distinctly more powerful because of the tool usage.

**Architecture:**
- Backend: Existing `/v1/responses` Edge function + tool definitions already support `code_execution` and `web_search_preview`. We harden prompt workflows, output parsing for tool traces, and add a first-class Realtime voice session handler (ephemeral token + WebRTC/WebSocket bridge) so selected apps can stream audio in both directions.
- Frontend: Every app follows `_TEMPLATE.tsx` + Batch 1–5 lessons exactly (no local error rendering, stable runner, primitives-first, no reloads). New shared primitives are created for code (syntax, diffs, execution traces, Mermaid diagrams, sprint boards).
- Data contract: The `expectedOutputKeys` in `app-configs.ts` become the source of truth for both the form fields the UI collects and the rich visual sections it renders.

**Tech Stack:**
- OpenAI Responses API (`/v1/responses`) with hosted tools
- OpenAI Realtime API (for the 2–3 voice-enabled apps)
- Supabase Edge Functions (Deno)
- React + TypeScript + existing UI primitives + shadcn
- React Syntax Highlighter / Shiki or Monaco (lightweight) for code
- Mermaid.js or react-flow for architecture diagrams
- TDD + subagent-driven reviews on every task

---

## Pre-flight Verification (do this first)

- [ ] Confirm current OpenAI Responses + tool support works for at least one Batch 6 stub by temporarily pointing a test page at `ai-code-review-pro` (or any) and observing whether `code_execution` traces appear in the raw response.
- [ ] Verify the Edge function WebSocket path can be upgraded (current code already handles `upgrade: websocket`).
- [ ] Confirm `_TEMPLATE.tsx` lessons are still the law (no drift in any recent Batch 5 app).

---

## Phase 0: Make the Advanced Features Actually Deliver Better Apps (Responses + Realtime Hardening)

### Task 0.1: Audit & Strengthen All 10 Batch 6 App Configs for Real Tool Leverage

**Files:**
- Modify: `supabase/functions/run-ai-app/app-configs.ts:463-543`

The current prompts say "Use code execution to generate and test code" but give the model no explicit workflow and no way to surface the verification trace in the final JSON. We must upgrade every prompt so the model:
1. Explicitly decides when to call the tool.
2. After tool results come back, incorporates the stdout/stderr/test results into the final structured answer (e.g. `verificationOutput`, `testResults`).
3. Returns richer keys that the UI can render beautifully (execution trace, verified snippets, etc.).

- [ ] **Step 1:** Write a small verification script (or manual test via the Supabase function logs) that calls one Batch 6 app with `code_execution` and inspects the raw `output` array for `code_execution_call` / `code_execution_output` items.
- [ ] **Step 2:** For each of the 8 apps that declare `code_execution`, rewrite the `systemPrompt` to contain a clear "Tool Usage Workflow" paragraph and add new expected keys where useful: `verificationTrace`, `executedCode`, `testResults`, `confidenceAfterExecution`.
- [ ] **Step 3:** For the 4 apps that also have `web_search_preview`, add explicit instructions: "When you need the absolute latest package versions, security advisories, or framework patterns, call web_search_preview first."
- [ ] **Step 4:** Update `expectedOutputKeys` arrays to include the new trace keys (non-breaking for existing callers because the UI will be built against the new keys).
- [ ] **Step 5:** Add `realtimeVoice` + `tools: ["realtime"]` to three high-leverage apps: `ai-app-builder-assistant`, `build-plan-generator`, `sprint-planner-ai`. These become "Voice Pair Programmer" experiences.
- [ ] **Step 6:** Run `deno fmt` + `deno lint` on the file and commit the enhanced configs.

Example of a strengthened prompt (for `ai-bug-fixer`):

```ts
systemPrompt: `You are AI Bug Fixer... 
TOOL USAGE WORKFLOW (Responses API):
1. Analyze the bug description and provided code.
2. If you need to verify behavior, write a minimal reproduction or test and call the code_execution tool.
3. After receiving execution results (stdout, stderr, exit code), incorporate the evidence into your diagnosis and testCase.
4. Return ONLY the final JSON. Include "verificationTrace": { "executedCode": "...", "stdout": "...", "stderr": "...", "passed": true } when you used the tool.
...`
```

### Task 0.2: Harden Edge Function Output Parsing for Code Execution Traces & Realtime Sessions

**Files:**
- Modify: `supabase/functions/run-ai-app/index.ts`
- Create (if needed): helper `parseCodeExecutionTrace.ts`

- [ ] **Step 1:** Extend `parseResponseOutput` to recognize the exact item shapes returned by the hosted `code_execution` tool in 2026 (`code_execution_call`, `code_execution_output`, `code_interpreter` style items) and surface them under a `verificationTrace` key that the JSON final answer can reference.
- [ ] **Step 2:** Add a small helper that safely extracts stdout/stderr/exitCode from tool output items and never crashes the whole response.
- [ ] **Step 3:** Implement the Realtime voice bridge (new handler `handleRealtimeSession`):
  - Accept a WebSocket upgrade with `?mode=realtime&appSlug=xxx&voice=alloy`
  - Call OpenAI `/v1/realtime/sessions` (or the ephemeral token endpoint) using the app's `realtimeVoice`
  - Proxy audio + text events bidirectionally between the browser and OpenAI Realtime
  - On text deltas that look like structured JSON, emit them on the same channel the normal flow uses so the existing `useRunAIApp` hook can consume them with zero changes to the hook for the first version.
- [ ] **Step 4:** Add proper error handling, session cleanup, and usage recording for Realtime minutes (new RPC or reuse existing).
- [ ] **Step 5:** Write a minimal integration test (or manual curl + wscat) that proves a Realtime session can be established for one of the three apps.
- [ ] **Step 6:** Update the comment at the top of the file and the TOOL_DEFINITIONS if any new shapes appear.
- [ ] **Step 7:** Commit with message: `feat(run-ai-app): harden code_execution trace parsing + add Realtime voice session handler for developer apps`

### Task 0.3: Create Reusable Developer Primitives (used by all 10 UIs)

**Files:**
- Create: `src/components/ai/primitives/CodeBlock.tsx`
- Create: `src/components/ai/primitives/DiffViewer.tsx`
- Create: `src/components/ai/primitives/ExecutionTrace.tsx`
- Create: `src/components/ai/primitives/MermaidDiagram.tsx` (or ArchitectureDiagram)
- Create: `src/components/ai/primitives/TaskBoard.tsx` (for sprint & build plans)
- Modify: `src/components/ai/primitives/index.ts`
- Test: `src/components/ai/primitives/__tests__/CodeBlock.test.tsx` (and others)

- [ ] **Step 1:** Implement `CodeBlock` — syntax highlighting (use `react-syntax-highlighter` or a lightweight Shiki bundle already in the project), copy button, "Download .ts" button, optional "Run in sandbox" future hook.
- [ ] **Step 2:** Implement `DiffViewer` — unified or split diff for bug-fix apps (use `react-diff-viewer` or a simple pre-based visual).
- [ ] **Step 3:** Implement `ExecutionTrace` — collapsible panel that shows the model's code_execution steps, stdout, stderr, and final verdict (green/red).
- [ ] **Step 4:** Implement `MermaidDiagram` (or a thin wrapper) that safely renders architecture / flow diagrams from the `appArchitecture` or `componentArchitecture` strings.
- [ ] **Step 5:** Implement `TaskBoard` — kanban-style or table view for `taskBreakdown`, `sprintPlan`, `storyAllocation`.
- [ ] **Step 6:** Export everything from `index.ts`, add Storybook or simple visual test pages if the project uses them.
- [ ] **Step 7:** Write unit tests for each (render + interaction). All must pass.
- [ ] **Step 8:** Commit the new primitives as a foundation PR.

These primitives are the visible proof that the apps are "better because of the tools".

---

## Phase 1: Apps 1–4 (Foundation Developer Tools)

### Task 1.1: Production UI for `ai-app-builder-assistant`

**Files:**
- Replace: `src/components/ai/apps/ai-app-builder-assistant/index.tsx` (currently 7-line stub)
- Test: manual route `/ai-app/ai-app-builder-assistant`

Inputs from config: `appIdea`, `targetPlatform`, `techStack`, `complexity`

Rich output sections: Architecture diagram (Mermaid), Tech stack cards, Feature priority list, Phased roadmap, Code structure tree, Timeline + budget, **Verification trace** (because it uses code_execution).

- [ ] **Step 1:** Copy `_TEMPLATE.tsx` into the folder and rename the component.
- [ ] **Step 2:** Design the form with proper controlled inputs (textarea for idea, segmented control or select for platform, multi-select or chips for techStack, radio for complexity). Use `PromptTextarea` where appropriate.
- [ ] **Step 3:** Map every field exactly to the keys the backend expects.
- [ ] **Step 4:** In the output area, compose `MermaidDiagram`, `StructuredResult` sections, `CodeBlock` for key files, and `ExecutionTrace` when present.
- [ ] **Step 5:** Add voice toggle (if the Realtime handler from 0.2 is ready) — big "Talk to AI Pair Programmer" button that opens a floating voice panel.
- [ ] **Step 6:** Follow every lesson in the template header (onReset destructuring, no local error, ResultActions, etc.).
- [ ] **Step 7:** Run `npm run typecheck` (or tsc) and fix any errors.
- [ ] **Step 8:** Manual test end-to-end (real OpenAI key) — verify that `code_execution` was actually used (look for verificationTrace in the JSON or in Edge logs).
- [ ] **Step 9:** Self-review against the spec in this plan + `_TEMPLATE.tsx`.
- [ ] **Step 10:** Commit: `feat(ai-apps): production UI for ai-app-builder-assistant (Batch 6) with code_execution + voice`

### Task 1.2: Production UI for `ai-saas-architect`

Inputs: `saasIdea`, `targetMarket`, `pricingModel`, `coreFunctionality`

Outputs: architectureOverview, scalabilityPlan, techStack, securityConsiderations, multi-tenancyApproach, estimatedInfrastructureCost, goToMarketStrategy + tool traces.

- [ ] Repeat the 10-step pattern above, adapted to SaaS-specific visuals (cost calculator cards, multi-tenancy diagram, security checklist).

### Task 1.3: Production UI for `ai-code-review-pro`

Inputs: `codeToReview` (textarea or file), `language`, `focusArea` (multi-select), `repositoryContext`

Outputs: overallAssessment (score + visual), issues (table + per-issue CodeBlock + severity badges), positiveNotes, suggestedImprovements, securityConcerns, performanceTips + execution trace (the model actually ran linters/tests via the tool).

Special rendering: `DiffViewer` for suggested fixes, `ExecutionTrace` panel.

### Task 1.4: Production UI for `ai-bug-fixer`

Very similar to code-review but focused on one bug → root cause + verified fix + test case that the model actually executed.

Strong use of `DiffViewer` and `ExecutionTrace`.

After all four are done:

- [ ] Add the four slugs to `productionReadySlugs` in `registry.ts`
- [ ] Update the Batch 6 header comment
- [ ] Run the full test suite for the ai apps area
- [ ] Commit the group

---

## Phase 2: Apps 5–7 (Heavy Code Generation & Python Specialist)

### Task 2.1: `ai-fullstack-builder`

Rich project scaffolding UI. Tree view of `projectStructure`, ERD-ish view of `databaseSchema`, endpoint table, component cards, `CodeBlock` gallery for snippets, deployment checklist, **ExecutionTrace** proving the model generated + "tested" key pieces.

### Task 2.2: `python-fixer-ai`

Specialized version of bug-fixer for Python. Extra emphasis on "pythonicAlternatives" and performance numbers coming from real execution.

### Task 2.3: `github-repo-assistant`

This one primarily uses `web_search_preview`. Form: repo URL + task selector + focus. Output: repoOverview cards, README summary, folder tree, contributor avatars, open issues list, code insights, recommendations. Show citations from web search when available.

After the three:

- Update registry + production list
- Group commit

---

## Phase 3: Apps 8–10 (Planning & Automation – Highest Voice Leverage)

### Task 3.1: `github-automation-agent`

Inputs: automationGoal (select or chips: create-issue, pr-template, release-workflow, etc.), repoContext, triggers.

Output: complete YAML or GitHub Action script in `CodeBlock`, trigger config, secrets table, setup instructions, example usage.

### Task 3.2: `build-plan-generator`

One of the three voice-enabled apps. Form: projectGoal (big textarea), constraints (timeline/budget/team), techStack.

Output sections: Gantt-style timeline, task breakdown table or `TaskBoard`, dependency graph (Mermaid), risk matrix, definition of done checklist, **voice button** "Dictate the project to me".

Because it uses both web_search and code_execution, the final plan can contain real package version recommendations and small verified starter snippets.

### Task 3.3: `sprint-planner-ai`

Second (or third) voice-enabled app. Classic agile inputs → beautiful sprint board (`TaskBoard`), burndown chart (simple SVG or chart lib already in project), allocation table, risks, retrospective prompts.

Voice: "Talk me through the stories while I stand up" experience.

After these three:

- Final registry update for the whole batch
- Add all 10 to `productionReadySlugs`
- Update any admin visibility / category filters if needed
- Full regression test of the /ai-app/* routes for the batch

---

## Phase 4: Verification, Polish & Rollout

### Task 4.1: Batch-Wide Manual QA Script

Create a lightweight checklist (or update existing) and execute it for all 10 apps:
- Form validation & empty-state handling
- Streaming works and feels fast
- Tool traces (code_execution, web citations) are visible and useful
- Voice sessions start/stop cleanly on the three voice apps (if infrastructure complete)
- Mobile responsive (these are power tools — still must work on tablet)
- Dark theme, loading, error, reset all follow the established pattern
- No console errors, no TypeScript errors

### Task 4.2: Update Documentation & "How the Tools Make These Apps Better" Section

- Update `src/components/ai/apps/README.md`
- Add a short "Developer Tools – Powered by Responses API" paragraph in the public marketing copy or internal wiki
- Document the three voice-enabled apps as the flagship "talk while you plan / review" experiences

### Task 4.3: Final Commit & Tag

```bash
git add -A
git commit -m "feat(ai-apps): Batch 6 complete — 10 developer tools with real code_execution, web_search_preview, and Realtime voice on 3 apps"
git tag batch-6-developer-tools-prod
```

### Task 4.4: Optional – Add to Admin "Production Ready" Bulk Toggle (if admin UI exists for it)

---

## Success Criteria (Definition of Done for the Whole Batch)

1. All 10 app slugs have real custom `index.tsx` > 120 lines each (not stubs).
2. All 10 are listed in `productionReadySlugs` and appear in the dashboard without the GenericAIApp fallback.
3. At least 70% of runs on the 8 `code_execution` apps actually invoke the tool (verifiable via Edge logs or by inspecting `verificationTrace` in output).
4. The three voice apps have a working "Talk" mode that produces usable structured output.
5. All new primitives render without console errors and have basic tests.
6. Zero drift from `_TEMPLATE.tsx` rules.
7. The batch passes the same manual + automated checks that previous batches passed before being marked production ready.

---

**Plan written.** Ready for execution.

**Recommended execution:** Use `superpowers:subagent-driven-development` — dispatch one fresh implementer subagent per task (or per 2-app group inside a phase), followed by spec-compliance review then code-quality review. This is exactly the workflow that delivered batches 1–5 at high quality.

When you are ready, say the word and I will begin dispatching the first subagent (starting with Phase 0 hardening so every subsequent UI task gets a rock-solid backend).
