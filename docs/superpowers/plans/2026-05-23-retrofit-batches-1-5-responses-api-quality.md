# Retrofit Plan: Batches 1–5 — Responses API Tool Quality + Realtime Enablement

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`. Execute in two parallel subagent passes (Prompt strengthening Group A and Group B simultaneously), then a final registry push. Do NOT stop between batches — execute all retrofits continuously.

**Goal:** Bring Batches 1–5 (42 apps) to the same Responses API quality standard as Batch 6 — explicit tool usage workflows, verification traces where applicable, realtime where valuable, richer structured outputs.

---

## What Batch 6 Has That Batches 1–5 Don't

| Feature | Batch 6 | Batches 1–5 |
|---------|---------|-------------|
| Explicit "TOOL USAGE WORKFLOW" in prompt | ✅ All 10 apps | ❌ None |
| `verificationTrace` key in expectedOutputKeys | ✅ All 8 code apps | ❌ None |
| Realtime voice config | ✅ 3 apps | ❌ None |
| Parse code_execution traces | ✅ Task 0.2 done | ❌ Not applicable |
| Parse web_search citations | ✅ Task 0.2 done | ❌ Not applicable |

---

## Retrofit Pass 1: Prompt Strengthening (Batches 1–3)

### Batch 1: Sales, Lead Gen & Prospecting (10 apps — all web_search_preview)

All 10 have `tools: ["web_search_preview"]`. Add explicit "WEB SEARCH WORKFLOW" paragraph telling the model to call web_search_preview FIRST to get real-time data.

**Pattern:**
```
TOOL USAGE WORKFLOW (Responses API):
1. Analyze the user's input (target company, prospect criteria, or sales context).
2. Call web_search_preview to get real-time company news, financial data, contact info, or market insights.
3. Incorporate the fresh search results into your structured JSON response.
4. Return ONLY valid JSON matching the expected keys.
```

Add `"verificationTrace"` to expectedOutputKeys (for web searches, this will capture source citations).

### Batch 2: Content Creation & Marketing (10 apps — mostly web_search_preview, some file_search)

The content apps should be told when to search for trends/trends vs. when to generate.

Add workflow paragraph. For web_search apps: same pattern as Batch 1. For file_search apps (ai-documentation-writer, ai-video-script-producer): add guidance on when to use file_search.

### Batch 3: Video, Audio & Voice AI (9 apps — some web_search, some realtime)

The two realtime apps (`ai-intake-voice-agent`, `ai-dictation-assistant`) already have `tools: ["realtime"]` + `realtimeVoice`. Confirm the prompts mention voice-adaptive behavior.

For `ai-music-jingle-assistant`: add `web_search_preview` to research current music trends.

---

## Retrofit Pass 2: Prompt Strengthening (Batches 4–5)

### Batch 4: RAG, Knowledgebase & Document Chat (13 apps — mostly file_search, some web_search)

These apps primarily use `file_search` to index uploaded documents. Add `file_search` workflow:
```
TOOL USAGE WORKFLOW (Responses API):
1. Analyze the user's query and context.
2. If the query requires information from uploaded documents, call file_search first.
3. Incorporate the retrieved document context into your answer.
4. Return ONLY valid JSON matching the expected keys.
```

For apps with both file_search + web_search: add both workflow steps.

### Batch 5: Research & Analysis (12 apps — mix of web_search + file_search)

Strengthen with appropriate workflow paragraphs based on tool type.

---

## Realtime Enablement (2–3 Strategic Apps from Batches 1–5)

Add `realtime` + `realtimeVoice` to apps where voice would dramatically improve the experience:

| App | Voice | Rationale |
|-----|-------|-----------|
| `ai-strategy-advisor` | "fable" | Talk through strategic decisions with AI advisor |
| `ai-business-growth-consultant` | "nova" | Voice-first business consulting |
| `market-research-ai` | "shimmer" | Voice-driven research briefing |

Add to tools: `["realtime"]` (append, don't replace) + `realtimeVoice`.

---

## Implementation Tasks

### Task R.1: Batch 1 Prompt Retrofit (10 apps, web_search)

**File:** `supabase/functions/run-ai-app/app-configs.ts:19-98`

For each of the 10 apps: insert "TOOL USAGE WORKFLOW" paragraph before the "Return ONLY valid JSON" clause, add `verificationTrace` to expectedOutputKeys.

### Task R.2: Batch 2 Prompt Retrofit (10 apps)

**File:** `supabase/functions/run-ai-app/app-configs.ts:101-182`

Same pattern. For ai-music-jingle-assistant: add `web_search_preview` tool if not present.

### Task R.3: Batch 3 Prompt Retrofit + Realtime confirm (9 apps)

**File:** `supabase/functions/run-ai-app/app-configs.ts:185-360`

Confirm realtime prompts are voice-adaptive (already mostly done based on earlier scan). Add web_search to `ai-music-jingle-assistant`. Add realtime to 3 strategic apps from batches 1-5.

### Task R.4: Batch 4 Prompt Retrofit (13 apps)

**File:** `supabase/functions/run-ai-app/app-configs.ts:367-462`

file_search workflow for all. web_search + file_search apps get both.

### Task R.5: Batch 5 Prompt Retrofit (12 apps)

**File:** `supabase/functions/run-ai-app/app-configs.ts:625-815`

Same pattern.

### Task R.6: Commit + Build + Push

```bash
npm run build  # must pass
git add -A
git commit -m "feat(app-configs): retrofit Batches 1-5 prompts with TOOL USAGE WORKFLOW for Responses API + add realtime to 3 strategic apps"
git push
```

---

## Success Criteria

- All 42 apps in Batches 1–5 have explicit tool workflow in their systemPrompt
- `verificationTrace` added to expectedOutputKeys for all web_search_preview apps (Batches 1-5)
- 3 new apps have `realtime` added (ai-strategy-advisor, ai-business-growth-consultant, market-research-ai)
- `npm run build` passes
- No app in Batches 1-5 is broken by these changes (they're purely additive to prompts + key lists)