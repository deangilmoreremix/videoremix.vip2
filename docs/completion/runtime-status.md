# Runtime Status — Internal AI Apps (PR #19 completion)

Owner: application runtime / provider-API workstream. Last verified: 2026-10-11 (branch `kilo/pr19-completion`, merge commit `1c77b84b`).

This report covers the browser-side app runtime (`src/components/ai/**`, `src/pages/AIAppRunnerPage.tsx`) against the shared `run-ai-app` Supabase Edge Function. Edge-function code is owned by the auth workstream and is treated as read-only here; all line numbers below were re-read after the auth agent's credit-enforcement changes landed.

## 1. Runner architecture

Single shared execution path for all internal AI apps:

```
AIAppRunnerPage (src/pages/AIAppRunnerPage.tsx)
  -> getAIAppComponent(slug) (src/components/ai/apps/registry.ts, 114 lazy entries)
    -> app component -> useRunAIApp (src/components/ai/apps/useRunAIApp.ts)
      -> POST {supabaseUrl}/functions/v1/run-ai-app  (stream: true)
        -> OpenAI Responses API (supabase/functions/run-ai-app/index.ts)
```

- **Clerk-bearer auth.** `useRunAIApp.getAccessToken()` reads the Clerk token getter wired into Supabase (`getClerkTokenGetter`, src/utils/supabase.ts) and sends `Authorization: Bearer <clerk token>` (useRunAIApp.ts:130-142). The server verifies the JWT via `createSupabaseContext` and takes the user id **only** from verified claims (`authenticateRequest`, index.ts:322-346; comment + assignment index.ts:359-360, 405). A client-supplied `userId` is explicitly not part of the trusted input surface (index.ts:354-361).
- **SSE parsing.** The hook consumes `text/event-stream` responses: `response.output_text.delta` events append to `streamingContent`, `response.completed` populates the full response, `error` events throw, `[DONE]` flushes. A trailing line without a terminating newline is flushed (useRunAIApp.ts:201-205), and accumulated text is JSON-parsed with a plain-text fallback before `setOutput` (useRunAIApp.ts:207-216). The exact parsed value handed to `onResult` is stored in `finalOutputRef` so callers never receive a stale closure or the raw OpenAI items array (useRunAIApp.ts:36, 257-262). A user-initiated abort surfaces as `AbortError` and is treated as cancel, not failure (useRunAIApp.ts:264-268).
- **426 WS-spend guard.** Browser WebSockets cannot attach our auth header, so the old WS-first path silently lost identity. Non-realtime WebSocket upgrades are now refused with **426 Upgrade Required** (index.ts:368-392); only `?mode=realtime` upgrades proceed, and those verify identity exactly once in the upgrade handler before the socket is accepted (index.ts:372-383).
- **Credit enforcement (auth workstream, verified read-only).** Pre-call balance check returns **402 `INSUFFICIENT_CREDITS`** before any OpenAI spend (index.ts:489-510, 84-107); streamed responses are tee'd so billing extracts the terminal usage event while the client stream is forwarded byte-for-byte (index.ts:182-275, 550); non-streaming runs are billed post-call from real token usage (index.ts:572-587); realtime sessions are billed per connected minute on socket close (index.ts:905-929); unpriced models are refused (index.ts:478-487); billing failures never break the user-facing response (index.ts:114-153).

## 2. Per-category capability matrix

Population: **161 entries (158 unique — 3 duplicate slug declarations) in `src/config/internalAIApps.ts`**, **114** custom UIs in `src/components/ai/apps/registry.ts` (112 internal + 2 non-internal entries, see Partial item 6), **100** specialized configs in `supabase/functions/run-ai-app/app-configs.ts`, **117** generic fallback metas in `awesome-llm-fallbacks.ts`.

| Category | Apps (evidence) | Backend capability | UI capability | Verdict |
|---|---|---|---|---|
| Specialist agents (sales, code, design, finance/legal, HR, local/travel) | Registry batches 1, 6-10 (~66 apps); e.g. `ai-sales-intelligence-pro`, `ai-bug-fixer`, `contract-summary-ai` | Specialized prompts + models in APP_CONFIGS; `web_search_preview` configured for 63 apps | Custom forms + `StructuredResult`/`ExecutionTrace` rendering | **Ready** — end-to-end through run-ai-app |
| RAG / knowledgebase chat | Batch 4 (13 apps) + backfilled RAG apps (`knowledge-graph-rag-citations`, `local-rag-agent`, …) | `file_search` on 26 configs, **but the tool is omitted server-side when no `vector_store_ids` are supplied** (index.ts:291-308) | `BasicFileUpload` wired into 31 app UIs | **Partial** — no vector-store creation/selection UI anywhere; uploaded files are passed as text lines, not file_search payloads |
| Research & analysis | Batch 5 (12 apps: `deep-research-pro`, `academic-research-ai`, `fact-check-ai`, …) | `web_search_preview` configs; strong prompts | Custom UIs; research apps render traces | **Ready** for search-backed research; deep multi-source agent behavior is single-model only |
| Multi-agent teams | `mixture-of-agents`, `insurance-claim-live-agent-team`, `ai-travel-planner-agent-team`, `multimodal-uiux-feedback-agent-team`, `business-finance-ai-team` | Dedicated edge functions exist for some (e.g. `mixture-of-agents`, `multi-agent-researcher`), but the internal-app UIs route through single-model run-ai-app | `mixture-of-agents` and `insurance-claim-live-agent-team` are GenericAIApp wrappers | **Partial** — no orchestration; dedicated functions not wired to these slugs |
| Voice / realtime | 8 apps render `RealtimeVoiceSession` (`ai-intake-voice-agent`, `ai-dictation-assistant`, `ai-app-builder-assistant`, `build-plan-generator`, `sprint-planner-ai`, `ai-strategy-advisor`, `ai-business-growth-consultant`, `market-research-ai`); all 8 have `realtime` configs | `?mode=realtime` proxy to OpenAI Realtime with per-minute billing (index.ts:805-1027) | Voice UI + permission handling present | **Ready** for the 2 primary voice apps; Partial elsewhere — `VOICE_ENABLED_APPS` (registry.ts:327-334) lists only 5 of the 8, so `ai-strategy-advisor`, `ai-business-growth-consultant`, `market-research-ai` render voice UI without the flag |
| File + image inputs | 26 `file_search` configs, 6 `vision` configs (e.g. `visual-document-ai`, `browser-task-agent`) | `file_search` needs vector stores (see RAG). **Vision is treated as a capability marker, not transmitted content** — `buildResponseTools` skips it (index.ts:310-312) and the request body is built as a plain string (index.ts:436-457), so images cannot actually reach the model as image content | 31 apps import `BasicFileUpload`; no image-input primitive feeds run-ai-app | **Not Implemented** for true multimodal image input; Partial for text-extracted file content |
| Generic chat / memory apps | `private-chatgpt-clone`, `private-ai-chat-with-memory`, `local-chatgpt-with-memory`, `llama3-stateful-chat`, `llm-app-personalized-memory`, … | Generic `summary/details/nextSteps` config via `getAppConfig` fallback (app-configs.ts:849-868) | GenericAIApp single-prompt UI | **Partial** — despite "local model" naming, everything runs `gpt-5.5` server-side; "memory" is localStorage conversation replay only (`_context` preamble, useRunAIApp.ts:110-121), with no persistence layer |

## 3. App status lists

### Ready (production-ready path, verified)
All **114** registry slugs are marked production-ready (registry ∩ `productionReadySlugs` = 114/114). Batches 1-10 plus overflow/backfilled apps have: custom UI + specialized or fallback app config + working auth + credit-gated run-ai-app execution. Reference verification: `ai-sales-intelligence-pro` (config app-configs.ts:21-28, UI registry.ts:18) — research, generate, stream, structured render, error/402 guidance all wired.

### Partial (functionally degraded)
1. **46 internal slugs without custom UI** — they fall through `getAIAppComponent` to `GenericAIApp` (registry.ts:336-349). The `productionReadySlugs` set (159 slugs) contains **49 slugs with no registry component**, 3 of which are not internal apps at all, leaving 46 internal apps rendered as generic single-prompt forms: e.g. `academic-researcher`, `ai-consultant-agent`, `content-creator`, `data-analyst`, `decision-helper`, `editor`, `email-drafter`, `fact-checker`, `meeting-notes`, `project-planner`, `strategy-advisor`, `technical-writer`, `ux-designer`, `sprint-planner`, …
2. **14 GenericAIApp wrapper components** — one text box, no per-app forms or validation: `knowledge-graph-rag-citations`, `llama3-stateful-chat`, `llm-app-personalized-memory`, `local-chatgpt-with-memory`, `local-hybrid-search-rag`, `local-rag-agent`, `mcp-apps-generative-ui-showcase`, `notion-mcp-agent`, `mixture-of-agents`, `insurance-claim-live-agent-team`, `ai-sales-email-writer-email-writer`, `ai-sales-email-writer-intelligence-pro`, `always-on-hn-briefing-agent`, `gemma3-finetuning`.
3. **RAG apps** — vector-store gap (see matrix).
4. **Voice apps outside `VOICE_ENABLED_APPS`** — see matrix.
5. **`sprint-planner` naming mismatch** — `productionReadySlugs` contains `sprint-planner` but the registry key is `sprint-planner-ai`; the un-suffixed slug silently renders GenericAIApp.
6. **2 unreachable registry entries** — `ai-sales-email-writer-email-writer` and `ai-sales-email-writer-intelligence-pro` are registered but absent from `INTERNAL_AI_APP_SLUGS`, and `getAIAppComponent` throws for non-internal slugs (registry.ts:337-339), so they can never render through the runner.

### Not Implemented
1. **7 registered apps with no specialized config and no awesome-llm fallback** — `getAppConfig` returns null → demo-mode response even with `OPENAI_API_KEY` set (all 7 are GenericAIApp wrappers): `knowledge-graph-rag-citations`, `llm-app-personalized-memory`, `local-chatgpt-with-memory`, `ai-sales-email-writer-email-writer`, `ai-sales-email-writer-intelligence-pro`, `always-on-hn-briefing-agent`, `gemma3-finetuning`.
2. **94 dead edge-function routes** — see section 5.
3. **True multimodal image input** — see matrix (vision marker never transmitted).

## 4. Placeholder / fictional-output detections

1. **Demo-mode fallback** — `supabase/functions/run-ai-app/index.ts:419-432`: when `getAppConfig(slug)` is null or `OPENAI_API_KEY` is unset, the function returns `success: true` with `output.summary = "Demo mode for {slug}. Connect OPENAI_API_KEY and add config for full AI."` and `metadata.demo = true`. The runner surfaces this honestly: `AIAppRunnerPage` shows an amber "Demo mode" banner when `metadata.demo` is set (AIAppRunnerPage.tsx:324-328).
2. **Fictional contact data prompt** — `app-configs.ts:30` (`lead-research-scraper-ai`): the system prompt instructs the model to "Use plausible but fictional contact details for demo purposes." Leads returned by this app are synthetic, not researched; combined with `web_search_preview` this is misleading and should be reworded before launch.
3. **Generic fallback config** — `app-configs.ts:849-868` (`getAppConfig`): any slug with an awesome-llm fallback meta gets a generic "summary, details, nextSteps" prompt that does not reflect the marketed product behavior.
4. **14 GenericAIApp wrappers** — section 3, Partial item 2: these produce plausible but generic output for products advertised with specialized features.

## 5. Dead routes (src/pages/agents/* → non-existent edge functions)

**94 distinct function names are fetched by literal `fetch(...)` calls in `src/pages/agents/*.tsx` but do not exist under `supabase/functions/`.** These pages return runtime errors (edge function 404) instead of results. Verified examples (full list generated from `grep 'fetch(' src/pages/agents/*.tsx`):

- `gmail-intelligence-ai` (ChatWithGmailPage.tsx:54), `research-memory-assistant` (AiArxivAgentMemoryPage.tsx:50), `notion-mcp-agent` (NotionMcpAgentPage.tsx:58), `decision-helper` (DecisionHelperPage.tsx:58)
- `openai-agentic-rag` (AgenticRagPage.tsx:49), `ai-travel-planner-agent-team` (AiTravelPlannerAgentTeamPage.tsx:58), `smart-search-ai` (HybridSearchRagPage.tsx:49), `hiring-plan-builder` (AiHealthFitnessAgentPage.tsx:101), `ai-news-content-writer` (AiJournalistAgentPage.tsx:50), `ai-funnelcraft` (AiFunnelcraftPage.tsx:68), `ai-home-renovation-agent` (AiHomeRenovationAgentPage.tsx:58), `local-risk-decision-ai-py` (LocalAiReasoningAgentPyPage.tsx:37), `pdf-business-assistant` (ChatWithPdfPage.tsx:64), `llama3.2-finetuning` (Llama32FinetuningPage.tsx:67), `local-business-growth-advisor` (AiDomainDeepResearchAgentPage.tsx:60), `ai-course-creator-assistant` (AiTeachingAgentTeamPage.tsx:49), `lead-research-scraper-ai` (WebScrapingAiAgentPage.tsx:31), `self-improving-agent-skills` (SelfImprovingAgentSkillsPage.tsx:58), `local-tour-guide-ai` (AiDataVisualisationAgentPage.tsx:72), `google-adk-crash-course` (GoogleAdkCrashCoursePage.tsx:65), `ai-personalizationstudio` (AiPersonalizationstudioPage.tsx:67)
- `build-plan-generator` (AiTravelAgentMemoryPage.tsx:49) and `sprint-planner` (SprintPlannerPage.tsx:59) — parallel legacy implementations of two apps that already work through run-ai-app with realtime config; the agent pages are redundant as well as dead
- Plus 76 further slugs (e.g. `academic-research-ai`, `ai-app-builder-assistant`, `ai-code-review-pro`, `ai-fullstack-builder`, `contract-summary-ai`, `deep-research-pro`, `finance-research-ai`, `fraud-investigation-assistant`, `market-research-ai`, `profit-coach-ai`, `real-estate-marketing-ai`, `travel-planner-ai`, …) — each has a working internal-app equivalent routed through run-ai-app.

## 6. Security findings

1. **Identity is server-verified** — userId comes only from the JWT; no trusted client-supplied identity (index.ts:359-360, 405). Good.
2. **OpenAI-spend bypass closed** — 426 for non-realtime WS (index.ts:388-391), pre-call 402 credit gate (index.ts:507-509), unpriced models refused (index.ts:478-487), realtime sessions gated by a one-minute-minimum balance check (index.ts:836-851). Good.
3. **CORS is wide open** — `Access-Control-Allow-Origin: *` on every response (index.ts:36). Acceptable for an anon-key edge function but should be tightened to the app origin before launch. (Auth workstream owns.)
4. **Catch-all leaks raw upstream messages** — index.ts:614-619 returns `error.message` verbatim on 500s; prefer a generic message plus server-side logging.
5. **Realtime token passed via query string** (index.ts:375) — mirrors Supabase's own realtime pattern and is verified server-side, but query strings land in proxy logs; prefer the `Sec-WebSocket-Protocol` header if OpenAI-compatible.
6. **Client holds no secrets** — browser code only reads `import.meta.env.VITE_SUPABASE_URL` (useRunAIApp.ts:132) and Clerk tokens; no service-role keys or OpenAI keys in `src/**`. Verified.
7. **Streaming error events bypass the 402 UI mapping** — the hook's `parseErrorSuggestion` maps 402 bodies, but mid-stream `error` events (useRunAIApp.ts:176-177) surface raw messages without the credit-purchase suggestion. Minor UX gap owned by this workstream.

## 7. Changes made by this workstream

Survived the worktree reset (verified in place):
- `useRunAIApp.ts` SSE fixes: trailing-line flush (201-205), parsed-output `onResult` via `finalOutputRef` (36, 207-216, 257-262), 402 credit suggestion (80-89), abort-as-cancel (264-268).
- `AIAppRunnerPage.tsx` demo-mode placeholder banner (324-328).
- `CodeBlock.test.tsx` fix and `MermaidDiagram.test.tsx` `vi.mock` isolation (mermaid now a real dependency — `package.json`: `"mermaid": "^12.1.0"`).

New in this session:
1. **ESLint cleanup in `useRunAIApp.ts`** — all 4 `react-hooks/exhaustive-deps` warnings resolved: connection teardown extracted to a stable `teardownConnections` callback used by both unmount cleanup and `reset` (no more ref-in-cleanup warnings); `getAccessToken` added to `runSSE` deps; unused `slug`/`enableMultiTurn` removed from `run` deps; `reset` now lists its real deps.
2. **tsc fixes in owned files** — `useRunAIApp.ts` now builds the function URL from `import.meta.env.VITE_SUPABASE_URL` (repo-wide pattern; fixes the protected-property error) and the unused `supabase` import was removed; `AIAppRunnerPage.tsx` usage-RPC effect rewritten as async/await (fixes `.catch` on PromiseLike + implicit-any) and the unused `accessData` destructure removed.
3. **`AIAppRunnerPage.tsx`** — unused catch binding removed (optional catch binding).
4. **`MermaidDiagram.test.tsx`** — stale "mermaid not declared" comment updated.
5. **`node_modules` restored** via `npm ci` (worktree rebuild had pruned dependencies), enabling test/lint/build verification.

Lint state: owned set reports **0 errors / 297 warnings** (nearly all pre-existing repo-style `no-explicit-any`; repo budget 821).

## 8. Remaining blockers (with evidence)

1. **7 apps return demo-mode placeholders in production** (section 3/Not Implemented item 1) — needs specialized configs or awesome-llm fallback metas for: `knowledge-graph-rag-citations`, `llm-app-personalized-memory`, `local-chatgpt-with-memory`, `ai-sales-email-writer-email-writer`, `ai-sales-email-writer-intelligence-pro`, `always-on-hn-briefing-agent`, `gemma3-finetuning`. Evidence: `getAppConfig` → null → index.ts:419-432.
2. **94 dead agent routes** (section 5) — decide: point pages at run-ai-app, deploy the missing functions, or remove the pages. Evidence: `/tmp`-style audit reproducible with the documented grep one-liner.
3. **RAG vector-store gap** — all 26 `file_search` configs silently drop the tool when no `vector_store_ids` are supplied (index.ts:291-308), and no UI creates/selects vector stores. Needs a vector-store create/select UI + upload pipeline.
4. **Vision input never reaches the model** — request body is text-only (index.ts:436-457; vision skipped at 310-312).
5. **`lead-research-scraper-ai` fictional-contact prompt** (app-configs.ts:30) — product-integrity issue; copy implies real research.
6. **`VOICE_ENABLED_APPS` under-reports the 8 voice-capable apps** (registry.ts:327-334) — 3 apps render voice UI without the flag; also the `sprint-planner` vs `sprint-planner-ai` slug mismatch in `productionReadySlugs`.
7. **OPENAI_API_KEY / credits schema unverified in this environment** — no paid API calls were made per workstream rules; end-to-end success (402 gate aside) is inferred from code paths, not live runs.

## 9. Verification log (2026-10-11)

| Check | Result |
|---|---|
| `npx vitest run src/components/ai/primitives/__tests__/MermaidDiagram.test.tsx src/components/ai/primitives/__tests__/CodeBlock.test.tsx` | 2 files, 9 tests passed |
| `npx vitest run src/components/ai` (full AI suite) | 7 files, 33 tests passed |
| `npx eslint src/components/ai/apps/useRunAIApp.ts` | 0 errors; exhaustive-deps warnings eliminated (7 remaining `no-explicit-any`, pre-existing style) |
| `npx eslint` full owned set | 0 errors, 297 warnings (within 821 budget) |
| `npx tsc --noEmit -p tsconfig.app.json` | 0 errors in owned files (pre-existing repo-wide errors elsewhere untouched) |
| `npm run build` | success in 1m34s; mermaid resolves; dead imports tree-shaken |
