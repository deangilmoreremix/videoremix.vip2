# App Completion — APPLICATION COMPLETION workstream (PR #19 completion)

Owner: application completion. Branch `kilo/pr19-completion`. Status date: 2026-10-11.

File scope for this workstream: `src/components/ai/**`, `src/config/**`,
`src/pages/agents/**`, and strictly additive entries in
`supabase/functions/run-ai-app/app-configs.ts`. Server-side gaps are reported,
not edited (Subagent 3 owns the rest of `run-ai-app`).

---

## 1. Per-app dispositions — the 7 previously unconfigured apps

All seven returned demo-mode placeholders before this workstream because
`getAppConfig` found neither an `APP_CONFIGS` entry nor an awesome-llm fallback
meta (`getAppConfig` → `null` → index.ts:419-432 demo branch). All seven now
have real `app-configs.ts` entries (`APP_CONFIGS` grew 100 → **107**), so they
execute through the canonical runner with a specialized prompt, real model, and
declared tools.

> Counts per capability below are the **honest delivered scope** of each entry —
> no config claims a capability the runner cannot deliver.

### 1.1 `knowledge-graph-rag-citations` — **Partial** (Ready for the grounded-citations path)

- Config: `app-configs.ts` `knowledge-graph-rag-citations` entry — multi-hop
  reasoning, `[n]` inline citations mapped to verbatim quotes, entity triples
  (`knowledgeGraph`), `reasoningPath`, and a `gaps` array for claims that could
  **not** be grounded. `tools: ["file_search"]`.
- UI: new dedicated component (`src/components/ai/apps/knowledge-graph-rag-citations/index.tsx`)
  — sources textarea + text-file upload + question; renders answer, citation
  list with quotes, entity graph, reasoning path, and an "Not grounded in
  sources" warning block. Replaces the GenericAIApp single-box wrapper.
- Delivered: grounded, verifiable answers over **user-supplied sources**.
- Missing: file_search over a hosted vector store (no vector-store creation
  service — see §4). The config performs ungrounded-claim flagging instead of
  allowing hallucinated citations.
- Evidence: `src/components/ai/apps/__tests__/knowledge-graph-rag-citations.test.tsx`
  (3 tests: validation, run payload, cited-answer rendering).

### 1.2 `llm-app-personalized-memory` — **Ready** (per-browser memory; not cross-device)

- Config: `llm-app-personalized-memory` entry — reads `memory` + `history`
  inputs, personalizes replies, returns `reply` / `recalledFacts` /
  `memoryUpdates` / `followUpQuestion`. No external tools needed.
- UI: new `MemoryChatApp` (`src/components/ai/apps/MemoryChatApp.tsx`, shared
  with §1.3) — real chat surface; the conversation is replayed as `history`
  (last 8 turns), model-proposed durable facts (`memoryUpdates`) are persisted
  per-browser in `localStorage` and replayed as the `memory` block; "Memory (n)"
  panel shows/forgets stored facts.
- Delivered: "keeps context across conversations" — within one browser.
- Missing: cross-device/server-side memory (documented limitation, not
  advertised as present).
- Evidence: `__tests__/MemoryChatApp.test.tsx` (4 tests: send payload,
  deduplicated memory persistence, load + forget).

### 1.3 `local-chatgpt-with-memory` — **Partial** (memory works; "local" model does not)

- Config + UI: same `MemoryChatApp` path as §1.2 with its own
  `local-chatgpt-with-memory` config entry.
- **Not Implemented (exact missing piece):** the advertised *local* (on-device)
  model. The runner executes `gpt-5.5` server-side; there is no in-browser
  inference path in this codebase, and adding one (WebLLM/transformers.js
  runtime + model weights) is a separate project-level decision. The product
  page copy for `local-chatgpt-clone-with-memory` ("Fully local…") overstates
  what runs here; recommend copy revision or an explicit "cloud model" note.

### 1.4 `ai-sales-email-writer-email-writer` — **Ready** (was also unreachable, §2)

- Config: sales-email-writer entry (3 variants, tips, follow-up sequence,
  `web_search_preview` for prospect research).

### 1.5 `ai-sales-email-writer-intelligence-pro` — **Ready** (was also unreachable, §2)

- Config: email-intelligence entry — scorecard dimensions (subject hook,
  personalization, clarity, CTA, spam risk), rewrite, sequence advice, A/B
  tests, `web_search_preview`.

### 1.6 `always-on-hn-briefing-agent` — **Partial**

- Config: HN-briefing entry that uses `web_search_preview` to find current
  front-page stories and returns `brief`, ranked `topStories`, `themes`,
  `discussionHighlights`, `actionItems`, `sources`.
- Delivered: an **on-demand** HN brief grounded in real search results.
- **Not Implemented (exact missing pieces):** the "always-on" scheduler and the
  "ships a ranked daily brief to Slack or email" delivery. The runner is
  request/response only; there is no cron/scheduler and no Slack/email
  integration in this codebase. Requires either a scheduled edge function plus
  a delivery service (Subagent 3's surface) or a product-copy change.

### 1.7 `gemma3-finetuning` — **Partial** (preparation assistant; training not implemented)

- Config: **fine-tuning preparation** entry — dataset plan/row schema/quality
  checks, LoRA config, a complete runnable Unsloth 4-bit training script,
  evaluation plan, hardware/VRAM estimate, risks. `web_search_preview` for
  current best practices.
- Delivered: everything needed to *prepare* a Gemma 3 4-bit LoRA run, as
  concrete JSON plus copy-pasteable code.
- **Not Implemented (exact missing piece):** executing the fine-tune. LoRA
  training needs a GPU training service (Unsloth/cloud GPU) that this platform
  does not operate; the runner contract is prompt/response only. Deliberately
  scoped as a preparation assistant — no fake "training complete" output.

Note on §1.4/§1.5: these two slugs have **no customer-facing product row** in
`src/data/appsData.ts` (they are internal registry backfills), so no
functionality-matrix row changes for them; their appUrls deep link
(`/ai-app/ai-sales-email-writer-intelligence-pro`) has no matching React route
in `App.tsx` (App.tsx is owned by another workstream — reported, not edited).

---

## 2. Unreachable registry entries — fixed

`ai-sales-email-writer-email-writer` and `ai-sales-email-writer-intelligence-pro`
were in the `registry.ts` component map but absent from
`INTERNAL_AI_APP_SLUGS`, so `getAIAppComponent` threw
(`registry.ts:337-339`) and the runner could never render them.

- Fix: both slugs added to `INTERNAL_AI_APP_SLUGS` (`src/config/internalAIApps.ts`).
- Proof: `src/components/ai/apps/__tests__/registry.test.tsx` — resolution does
  not throw, the lazy loader renders the real component under Suspense, and a
  sweep asserts every registry slug is internal and resolves (14 tests).
- Bonus fix (same file): `VOICE_ENABLED_APPS` now lists all 8 apps that declare
  `realtime` in app-configs **and** render `RealtimeVoiceSession` —
  `ai-strategy-advisor`, `ai-business-growth-consultant`, `market-research-ai`
  were rendering the voice UI without the flag (runtime-status blocker 6).

---

## 3. Dead routes (`src/pages/agents/*` → non-existent edge functions)

### 3.1 Methodology (auditable one-liner)

```bash
python3 - <<'EOF'   # fetch-level audit used for every number in this section
import re, os, glob
funcs = set(os.listdir('supabase/functions')) - {'_shared'}
rows = []
for f in sorted(glob.glob('src/pages/agents/*.tsx')):
    src = open(f).read()
    for m in re.finditer(r'fetch\(', src):
        w = src[m.start():m.start()+300]
        fm = re.search(r'functions/v1/([A-Za-z0-9._-]+)', w)
        if fm and fm.group(1) not in funcs:
            rows.append((fm.group(1), os.path.basename(f), src[:m.start()].count('\n')+1))
print(len(rows), len(set(r[0] for r in rows)))
EOF
```

**Result: 127 dead fetch sites across 127 files, referencing 117 distinct
non-existent function names** (0 remain after this workstream). The previous
"94" figure (runtime-status §5) under-counted because it sampled greps rather
than enumerating every `fetch(` site; the delta is 23 names, mostly
tutorial/experimental pages (`openai-stateful-chat`, `rag-agent-openai`,
`research-agent-openai-interaction-api`, `*-py` variants) and external-app
placeholder pages (`ai-funnelcraft`, `referrals`, `salesmax`, `smartcrmcloser`,
…).

### 3.2 Disposition — all 127 sites rewired to the canonical runner

Every dead page now POSTs through a single bridge,
`src/pages/agents/runViaRunner.ts`:

- `${VITE_SUPABASE_URL}/functions/v1/run-ai-app`, `Authorization: Bearer <Clerk token>`
  (via `getClerkTokenGetter`), body `{ appSlug, inputs, stream: false }`.
- It **strips the legacy `userId`** the pages used to send (identity is
  JWT-derived server-side; a client `userId` is not trusted input),
  converts legacy `FormData` bodies to plain objects, and adapts the runner
  response to the pages' existing contract (`res.ok`/`res.json()` plus
  `result` and spread `output` keys), so no downstream page code changed.
- Slug remaps applied where the page slug was wrong: `sprint-planner` →
  `sprint-planner-ai` (the naming mismatch that silently rendered
  GenericAIApp) and `dashboard-designer-ai-` → `dashboard-designer-ai`.

**No pages were deleted.** No routes were removed. `/agents/:id` still renders
exactly the slugs mapped in `App.tsx` (owned by another workstream, untouched).

### 3.3 Category counts (what each site now delivers)

| Category | Sites | Names | What the page now does |
|---|---|---|---|
| **A — specialized config exists** | 72 | 62 | Real specialized behavior (app-configs entry incl. the 7 added in §1) |
| **B — generic fallback meta** | 12 | 12 | Real response via the generic summary/details/nextSteps fallback; **includes all 10 launch-route pages** (below) |
| **C — no config, no fallback** | 43 | 43 | Honest demo-mode placeholder with the runner's amber demo banner — **not** a specialized implementation (see 3.4) |

**Routes preserved / made working — the 10 dead pages on `AGENT_PAGE_SLUGS`
launch routes** (functionality-matrix.md "Launch" surface, must never break):
`ai-consultant-agent`, `ai-home-renovation-agent`, `ai-investment-agent`,
`ai-sales-intelligence-agent-team`, `ai-self-evolving-agent`,
`ai-travel-planner-agent-team`, `ai-vc-due-diligence-agent-team`,
`notion-mcp-agent`, `rag-failure-diagnostics-clinic`,
`self-improving-agent-skills` — all 10 fall in category B, so each launch route
now returns real model output instead of a 404. Additionally `toonify-token-optimization`,
`mixture-of-agents`, `llama3-stateful-chat`, `gemini-agentic-rag`, `vision-rag`,
`multi-mcp-agent-router`, `research-agent-gemini-interaction-api` (the other 7
`AGENT_PAGE_SLUGS`) already fetched existing functions and were left as-is.

### 3.4 Category C detail — Not Implemented until configs land

43 sites remain honestly marked **Not Implemented** (demo-mode):

- **30 legacy internal/tutorial slugs**: `decision-helper`, `email-drafter`,
  `meeting-notes`, `project-planner`, `strategy-advisor`, `technical-writer`,
  `ux-designer`, `content-creator`, `data-analyst`, `editor`, `fact-checker`,
  `code-reviewer`, `debugger`, `fullstack-developer`, `python-expert`,
  `academic-researcher`, `ai-news-and-podcast-agents`,
  `multimodal-uiux-feedback-agent-team`, `ai-dashboard-designer-ai`,
  `ai-router-ai-design-studio`, `llama3.2-finetuning`,
  `openai-sdk-crash-course`, `openai-stateful-chat`, `openai-agentic-rag`,
  `rag-agent-openai`, `research-agent-openai-interaction-api`,
  `local-risk-decision-ai-py`, `local-smart-search-ai`,
  `local-contract-summary-ai`, `visualization-expert`.
  Missing piece: an `app-configs.ts` entry (or awesome-llm fallback meta) per
  slug — out of this workstream's strictly-scoped app-configs.ts permission.
- **13 external VideoRemix app placeholder pages**: `ai-funnelcraft`,
  `ai-personalizationstudio`, `ai-personalizedcontent`, `ai-profilegen`,
  `ai-salesassistant`, `ai-salespage`, `ai-screenrecorder`, `ai-signature`,
  `ai-skills`, `ai-videoeditor`, `referrals`, `salesmax`, `smartcrmcloser`.
  These products launch to **external URLs** (functionality-matrix rows
  118–130); their `/agents` pages are unreachable duplicates with no product
  identity inside VideoRemix. Missing piece: a decision — delete the placeholder
  pages (they are not in `App.tsx`'s `agentComponents` map, so no route or
  entitlement references them) or keep them documented as dead code. **No
  deletion performed** — `App.tsx` (which owns the lazy imports) is another
  workstream's file.
- Also unreferenced-by-route after the fix: `sprint-planner` +
  `build-plan-generator` legacy pages (redundant parallel implementations —
  both apps work through the runner as `sprint-planner-ai` / `build-plan-generator`)
  and the `Gemma3FinetuningPage` duplicate of `/ai-runner/gemma3-finetuning`.

### 3.5 Type-safety evidence for the rewire

Before/after `tsc --noEmit -p tsconfig.app.json` diff over
`src/pages/agents/**` (line-number-normalized multiset): **18 pre-existing
TS6133 `'user' unused` errors removed, 0 new errors introduced**.

---

## 4. RAG: vector stores and file ingestion

### 4.1 What is now wired (client side)

- New `src/config/vectorStores.ts`: resolves vector store ids from (1) a
  per-user `localStorage` selection, then (2) the `VITE_OPENAI_VECTOR_STORE_ID`
  build-time default; exposes `getVectorStoreIds` / `setVectorStoreIds` /
  `withVectorStoreIds`.
- `useRunAIApp.run` (src/components/ai/apps/useRunAIApp.ts) merges
  `vector_store_ids` into runner inputs via `withVectorStoreIds`. The server
  already reads exactly these keys and only then attaches `file_search`
  (index.ts:291-308), so **the 26 file_search configs become functional the
  moment an operator sets the env var or a store id** — no server change needed
  for that half.
- Degraded path (unchanged, now documented): with no store configured the
  runner omits file_search and the app answers from the sources supplied inline
  in the request — the RAG configs are written to do this honestly (and
  `knowledge-graph-rag-citations` flags ungrounded claims).

### 4.2 Server-side gap — reported to Subagent 3

1. **Vector-store creation/list/selection service**: no edge function creates
   OpenAI vector stores or lists a user's stores. Needed for a real "upload a
   document → indexed" pipeline (create store → upload+attach file →
   persist store id per user). Until then `VITE_OPENAI_VECTOR_STORE_ID` +
   localStorage is the only id source, and file uploads are **not** indexed.
2. Request contract addition (optional, backward compatible): accept
   `inputs.file_ids` / `inputs.files: [{file_id}]` so callers can attach
   already-uploaded OpenAI files without a vector store.

### 4.3 File-ingestion constraints (verified in `BasicFileUpload.tsx`)

- **Accepted types**: `accept` defaults to `.txt,.pdf,.csv,.md`, but content is
  only read for `text/*` and `.txt/.md/.csv` (line 33); **PDFs pass the file
  name only — no text extraction** (no pdf.js in the pipeline).
- **Size**: 5 MB default (`maxSizeMB`), enforced client-side per file.
- **Content cap**: 10,000 characters per file (`slice(0, 10000)`).
- **Transport**: files never leave the browser as binaries; extracted text is
  sent inside the JSON `inputs`. My new citations UI accordingly restricts its
  uploader to `.txt,.md,.csv`.
- These are client-side constraints only — see the server-side request above
  for a real ingestion pipeline.

---

## 5. Vision and multi-agent

### 5.1 Vision — client side done where possible; transmission is a server gap

- Verified against the runner contract: `buildResponseTools` skips `vision`
  (index.ts:310-312) and the request content is built as a plain string
  (index.ts:436-457), so **no image bytes can reach the model today**.
- **Server-side contract request for Subagent 3** (index.ts, non-breaking):
  when `inputs` contains an image source (`imageUrl`, `imageDataUrl`, or
  `imageBase64` + `mimeType`), build the Responses API `input` as a content
  array — `[{type: "input_text", text: …}, {type: "input_image", image_url: …}]`
  — instead of concatenating a string; optionally accept
  `inputs.attachments: [{file_id}]` with `input_file` parts. The 6 vision
  configs (`visual-document-ai`, `multimodal-knowledge-ai`, `browser-task-agent`,
  …) then need no changes.
- Client-side reality check: the 31 apps importing `BasicFileUpload` can only
  supply text today; adding an image-input primitive has no effect until the
  server transmits image content. **Verdict: Not Implemented for true
  multimodal image input** (unchanged from runtime-status, now with an exact
  contract request).

### 5.2 Multi-agent — assessed; wiring is a server gap

- `mixture-of-agents/index.ts` is an **auto-generated stub** that authenticates
  via `supabase.auth.getUser` and requires a **user-uploaded OpenAI key** from
  `user_api_keys` — a different identity/credit model from the canonical
  runner (Clerk JWT + credit ledger). Wiring `mixture-of-agents` (and the other
  `*-agent-team` UIs) to it would bypass credit enforcement and break for
  everyone without a stored key.
- Deliberately **not** wired. The internal multi-agent UIs continue through
  single-model `run-ai-app` (generic fallback for these slugs).
- **Server-side contract request for Subagent 3**: either (a) implement real
  multi-model orchestration inside `run-ai-app` behind an
  `APP_CONFIGS.orchestration` field (e.g. `{type: "mixture", models: [...]}`)
  so it inherits Clerk auth + credit billing, or (b) upgrade the stub functions
  to the same auth/billing surface as `run-ai-app`. Client wiring is trivial
  once either exists (one config field / one appSlug passthrough).

---

## 6. Verification log (2026-10-11, this workstream)

| Check | Result |
|---|---|
| `npx vitest run src/components/ai` | **12 files, 66 tests passed** (was 8/46; +5 new files, 32 new tests) |
| `npx vitest run src/config src/pages` | 2 files, 11 tests passed |
| `npx eslint src/components/ai src/config src/pages/agents --ext ts,tsx` | **0 errors**, 283 warnings (repo budget 821; baseline was also 283) |
| `tsc --noEmit -p tsconfig.app.json` (owned dirs) | 0 new errors vs. pre-change baseline in `src/pages/agents` (18 pre-existing fixed); new files clean |
| `npm run build` | success (48.6s) |

New/changed tests: `apps/__tests__/registry.test.tsx` (14),
`apps/__tests__/MemoryChatApp.test.tsx` (4),
`apps/__tests__/knowledge-graph-rag-citations.test.tsx` (3),
`__tests__/vectorStores.test.ts` (5), `__tests__/runViaRunner.test.ts` (7).

Environment note: the worktree's `node_modules` had been pruned; it was
restored from the existing `package-lock.json` via the offline npm cache
(`npm ci --prefer-offline --ignore-scripts`). No manifest or dependency changes
were made.

---

## 7. Remaining blockers (evidence-backed)

1. **Category C pages (43 sites)** remain demo-mode — need app-configs entries
   or fallback metas per slug (§3.4); outside this workstream's app-configs
   permission. The 13 external-app placeholder pages additionally need a
   delete-or-keep decision (§3.4).
2. **RAG vector-store service missing** (§4.2) — no function to create/select
   stores or ingest uploads; `VITE_OPENAI_VECTOR_STORE_ID` + localStorage is
   the interim id source.
3. **Vision transmission** (§5.1) — server builds a text-only body; contract
   request specified.
4. **Multi-agent orchestration** (§5.2) — `mixture-of-agents` is a
   key-required stub; needs runner-side orchestration to inherit auth/credits.
5. **`always-on-hn-briefing-agent` scheduling/delivery** and
   **`gemma3-finetuning` training execution** (§1.6, §1.7) — no scheduler, no
   delivery service, no GPU training service in this codebase.
6. **`local-chatgpt-with-memory` "local" claim** (§1.3) — product copy overstates
   the runtime; copy revision or WebLLM-class runtime needed.
7. **`/ai-app/:slug` deep links** (`src/config/appUrls.ts`) have no matching
   route in `App.tsx` (e.g. `ai-sales-email-writer-intelligence-pro`); App.tsx
   is owned by another workstream — reported here.
8. **Live end-to-end runs not performed** (no paid OpenAI calls per workstream
   rules); behavior is verified from code paths and mocked-request tests only.
