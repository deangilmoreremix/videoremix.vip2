# Catalog Parity Report

**Workstream:** catalog / upstream-parity (PR #19 — `fix/sapienx-130-app-catalog`)
**Registry under test:** `src/config/appRegistry.ts` (customer-facing catalog)
**Upstream reference:** Awesome-LLM catalog snapshot captured from upstream commit `4bf51ab`, recorded in `src/data/github_app_catalog.json`
**Status date:** 2026-10-11

## 1. Verified counts

| Surface | Count | Source of truth | Verified by |
| --- | --- | --- | --- |
| Awesome LLM products (canonical slugs) | 117 | `src/data/appsData.ts` (`rawAppsData`) | `src/config/appRegistry.test.ts` |
| VideoRemix additional apps (external) | 13 | `src/config/appRegistry.ts` (`VIDEOREMIX_EXTRA_APPS`) | `src/config/appRegistry.test.ts` |
| **Total customer-facing products** | **130** | `APP_REGISTRY` (`TOTAL_APP_COUNT`) | `src/config/appRegistry.test.ts` |
| Unique customer-facing slugs | 130 (no duplicates) | `APP_REGISTRY_BY_SLUG` | `src/config/appRegistry.test.ts` |
| Legacy bundles | 12 | `src/data/bundleData.ts` | `src/data/__tests__/bundleData.test.ts` |
| Legacy bundle app references | 101 (all unique across bundles) | `src/data/bundleData.ts` | `src/data/__tests__/bundleData.test.ts` |
| Upstream snapshot entries | 116 (108 unique normalized ids) | `src/data/github_app_catalog.json` | this report |
| Legacy slug aliases | 37 | `src/utils/appLaunch.ts` (`LEGACY_SLUG_ALIASES`) | `src/utils/appLaunch.test.ts` |

All counts above are asserted by the surviving test suite and were re-run green on
2026-10-11: `npx vitest run src/config/appRegistry.test.ts src/utils/appLaunch.test.ts src/pages/ApplicationsPage.test.tsx src/data/__tests__/bundleData.test.ts tests/useApps.test.ts`.

## 2. Canonical vs legacy data files

### Canonical (production sources — do not add a second catalog)

| File | Role |
| --- | --- |
| `src/data/appsData.ts` | 117 Awesome LLM products; the single source of product identity (slug = `id`). |
| `src/config/appRegistry.ts` | Composes the 117 + 13 VideoRemix external apps into the 130-product `APP_REGISTRY`; exposes `getAppMeta`, `isExternalApp`. |
| `src/config/agentRegistry.ts` | `AGENT_PAGE_SLUGS` — the verified subset of 17 slugs with dedicated `/agents/:slug` React pages; everything else launches via `/ai-runner/:slug`. |
| `src/bundleData.ts` consumers | Launch routing derives from `getAppLaunchTarget` (`src/utils/appLaunch.ts`), never from legacy maps. |

### Legacy (historical data — read-only inputs, never customer-facing)

| File | Contents | Disposition |
| --- | --- | --- |
| `src/data/bundleData.ts` | 12 category bundles referencing 101 pre-rebrand app slugs. Purchases seeded from bundle slugs are normalized through `LEGACY_SLUG_ALIASES` (37 entries) before access comparison in `src/hooks/useUserAccess.ts`. | Kept as purchase-seed history; slugs resolve via alias map. |
| `src/data/github_app_catalog.json` | Upstream Awesome-LLM snapshot @ `4bf51ab` (116 entries, underscored ids). | Drift reference only (section 3). |
| `src/data/enhancedAppsData.ts` | Legacy sales-copy/storefront slugs (140 keys). | Sales copy enrichment only; storefront renames (e.g. `profile-gen`) resolve via alias map. |
| `src/data/streamlitAppsData.tsx` | 9 legacy Streamlit demo entries. | Archive; not routable. |
| `src/data/appsData.ts.bak`, `.clean2`, `.clean3` | Historical working copies of `appsData.ts`. | Backups; not imported by production code. |

The legacy 201-entry `agentComponents` map is intentionally NOT used for launch
routing: it contains historical aliases and known semantic mismatches
(see the `getAppLaunchTarget` doc comment in `src/utils/appLaunch.ts`).

## 3. Upstream drift report (upstream `4bf51ab` vs current catalog)

Classification method: upstream entry ids are normalized (trim, lowercase,
underscore → hyphen) and compared against the 117 canonical slugs. Entries are
"matched" on exact normalized equality, "renamed" on exact-name or strict-prefix
equivalence, otherwise "removed". Canonical slugs with no upstream counterpart
are "new".

### 3.1 Summary

| Category | Count | Notes |
| --- | --- | --- |
| Upstream entries in snapshot | 116 | 108 unique normalized ids |
| Direct slug matches | 54 unique (61 entries) | 7 extra entries come from duplicated upstream ids (3.3) |
| Renamed (upstream id → canonical slug) | 14 | table 3.2 |
| Removed (no canonical counterpart) | 41 | table 3.4 |
| New in catalog (not in snapshot) | 50 | table 3.5 |

### 3.2 Renamed upstream entries (upstream id → canonical slug)

| Upstream id | Upstream name | Canonical slug |
| --- | --- | --- |
| `ai_blog_to_podcast` | AI Blog to Podcast | `ai-blog-to-podcast-agent` |
| `ai_blog_to_podcast_agent_duplicate` | AI Blog to Podcast Agent | `ai-blog-to-podcast-agent` |
| `ai_meme_generator` | AI Meme Generator | `ai-meme-generator-agent-browser` |
| `ai_travel_agent` | AI Travel Agent | `ai-travel-agent-local-cloud` |
| `multimodal_uiux_feedback_agent_team` | Multimodal UI/UX Feedback Agent Team | `multimodal-ui-ux-feedback-agent-team` |
| `ai_legal_agent_team` | AI Legal Agent Team | `ai-legal-agent-team-cloud-local` |
| `ai_services_agency` | AI Services Agency | `ai-services-agency-crewai` |
| `ai_blog_search` | AI Blog Search | `ai-blog-search-rag` |
| `corrective_rag` | Corrective RAG | `corrective-rag-crag` |
| `hybrid_search_rag` | Hybrid Search RAG | `hybrid-search-rag-cloud` |
| `business-knowledgebase-ai` | RAG as a Service | `rag-as-a-service` |
| `chat_with_github` | Chat with GitHub | `chat-with-github-gpt-llama3` |
| `chat_with_pdf` | Chat with PDF | `chat-with-pdf-gpt-llama3` |
| `chat_with_research_papers` | Chat with Research Papers | `chat-with-research-papers-arxiv-gpt-llama3` |

Renames are pinned for purchase normalization where confidence is high: only
`chat_with_github` is a key in `LEGACY_SLUG_ALIASES` (it also exercises the
underscore/hyphen normalization path). The remaining renames are recorded here
but intentionally not pinned — the canonical registry is the single source of
truth, so access checks fall through to exact canonical-slug comparison.

### 3.3 Duplicated upstream ids (8 ids appear twice in the snapshot)

`ai-music-generator-agent`, `ai-sales-intelligence-agent-team`,
`ai-vc-due-diligence-agent-team`, `devpulse-ai`,
`ai-competitor-intelligence-agent-team`, `ai-finance-agent-team`,
`multimodal-design-agent-team`, `multimodal-uiux-feedback-agent-team`.

Duplicates are harmless: each duplicated id normalizes to a single canonical
slug, so the many-to-one alias/registry resolution collapses them. The canonical
registry itself has zero duplicate slugs (asserted in `appRegistry.test.ts`).

### 3.4 Removed upstream entries (no canonical counterpart, 41)

Includes upstream "skill prompt" stubs without standalone implementations
(`email-drafter`, `strategy-advisor`, `project-planner`, `meeting-notes`,
`decision-helper`, `fact-checker`, `content-creator`, `editor`, `ux-designer`,
`visualization-expert`, `academic-researcher`, `code-reviewer`, `data-analyst`,
`debugger`, `deep-research`, `fullstack-developer`, `python-expert`,
`sprint-planner`, `technical-writer`) and single-project entries whose
canonical equivalents carry materially different slugs. High/medium-confidence
canonical candidates are listed for traceability; none are pinned as aliases.

| Upstream id | Upstream name | Likely canonical candidate | Confidence |
| --- | --- | --- | --- |
| `product_launch_intelligence_agent` | Product Launch Intelligence Agent | `ai-product-launch-intelligence-agent` | high |
| `agentic_rag_embedding_gemma` | Agentic RAG Embedding Gemma | `agentic-rag-with-embedding-gemma` | high |
| `knowledge_graph_rag_citations` | Knowledge Graph RAG Citations | `knowledge-graph-rag-with-citations` | high |
| `deep-research` | Deep Research | `ai-deep-research-agent` | high |
| `llm_app_personalized_memory` | LLM App Personalized Memory | `llm-app-with-personalized-memory` | high |
| `local_chatgpt_with_memory` | Local ChatGPT with Memory | `local-chatgpt-clone-with-memory` | high |
| `openai_sdk_crash_course` | OpenAI SDK Crash Course | `openai-agents-sdk-crash-course` | high |
| `trust_gated_agent_team` | Trust Gated Agent Team | `trust-gated-multi-agent-research-team` | medium |
| `voice_rag_openaisdk` | Voice RAG OpenAI SDK | `voice-rag-agent-openai-sdk` | medium |
| `ai_travel_planner_mcp_agent_team` | AI Travel Planner MCP Agent Team | `ai-travel-planner-mcp-agent` | medium |
| `contextualai_rag_agent` | ContextualAI RAG Agent | `contextual-ai-rag-agent` | medium |
| `llama3.1_local_rag` | Llama3.1 Local RAG | `llama-3-1-local-rag` | medium |
| `rag_agent_cohere` | RAG Agent Cohere | `rag-agent-with-cohere` | medium |
| `rag_chain` | RAG Chain | `basic-rag-chain` | medium |
| `rag_database_routing` | RAG Database Routing | `rag-with-database-routing` | medium |
| `ai_arxiv_agent_memory` | AI ArXiv Agent Memory | `ai-arxiv-agent-with-memory` | medium |
| `ai_travel_agent_memory` | AI Travel Agent Memory | `ai-travel-agent-with-memory` | medium |
| `multi_llm_memory` | Multi LLM Memory | `multi-llm-application-with-shared-memory` | medium |
| `ai_news_and_podcast_agents` | AI News and Podcast Agents | `ai-social-media-news-and-podcast-agent` | medium |
| `gemma3_finetuning` | Gemma3 Finetuning | `gemma-3-fine-tuning` | medium |
| `llama3.2_finetuning` | Llama3.2 Finetuning | `llama-3-2-fine-tuning` | medium |
| `ai_3dpygame_r1` | AI 3D Pygame R1 | `ai-3d-pygame-agent` | medium |
| `multimodal_uiux_feedback_agent_team` (dup) | Multimodal UI/UX Feedback Agent Team | `multimodal-ui-ux-feedback-agent-team` | medium |
| `meeting-notes` | Meeting Notes | `ai-meeting-agent` | low |
| `project-planner` | Project Planner | `project-graveyard` | low |
| `strategy-advisor` | Strategy Advisor | — | low |
| `sprint-planner` | Sprint Planner | — | low |
| `email-drafter`, `decision-helper`, `fact-checker`, `content-creator`, `editor`, `ux-designer`, `visualization-expert`, `academic-researcher`, `code-reviewer`, `data-analyst`, `debugger`, `fullstack-developer`, `python-expert`, `technical-writer` | upstream skill-prompt stubs | — | low |

### 3.5 New canonical products (50, not present in the `4bf51ab` snapshot)

`project-graveyard`, `first-reader`, `scope-creep-detector`,
`commit-archaeologist`, `dependency-doctor`, `advisor-orchestrator-worker`,
`thinking-out-loud`, `ai-x402-paying-agent`, `gemini-multimodal-agent`,
`ai-deep-research-agent`, `ai-system-architect-agent`,
`ai-financial-coach-agent`, `earnings-call-analyst-agent`,
`ai-health-fitness-agent`, `ai-product-launch-intelligence-agent`,
`ai-mental-wellbeing-agent`, `ai-social-media-news-and-podcast-agent`,
`trust-gated-multi-agent-research-team`,
`always-on-hacker-news-briefing-agent`, `release-radar-agent`,
`llm-panel-agent-team`, `insurance-claim-live-agent-team`,
`voice-rag-agent-openai-sdk`, `generative-ui-starter-project`,
`ai-dashboard-canvas-agent`, `ai-mcp-app-builder`,
`mcp-apps-generative-ui-showcase`, `ai-shadcn-component-generator`,
`ai-3d-pygame-agent`, `ai-travel-planner-mcp-agent`,
`openai-remote-mcp-tool-bridge`, `agentic-rag-with-embedding-gemma`,
`contextual-ai-rag-agent`, `typed-agentic-rag-with-pydantic-ai`,
`llama-3-1-local-rag`, `multimodal-agentic-rag`, `rag-agent-with-cohere`,
`basic-rag-chain`, `rag-with-database-routing`,
`knowledge-graph-rag-with-citations`, `needle-a-new-way-to-find`,
`ripple-change-one-thing-find-what-else-needs-to-change`,
`ai-arxiv-agent-with-memory`, `ai-travel-agent-with-memory`,
`llm-app-with-personalized-memory`, `local-chatgpt-clone-with-memory`,
`multi-llm-application-with-shared-memory`, `gemma-3-fine-tuning`,
`llama-3-2-fine-tuning`, `openai-agents-sdk-crash-course`.

Most of these are the same underlying upstream projects under expanded
canonical slugs (see 3.4 candidates); the genuinely new entries are the
SkillBench-style dev-tool agents (first 7) and the new RAG/showcase projects.

## 4. Duplicate and alias analysis

### 4.1 Registry duplicates

None. 130 unique slugs asserted in `src/config/appRegistry.test.ts`.

### 4.2 Legacy slug aliases (`LEGACY_SLUG_ALIASES`, 37 entries)

Legacy slugs that purchases may be seeded from (bundle slugs, renamed upstream
ids, legacy storefront slugs) resolve to canonical registry slugs through
`resolveCanonicalSlug` in `src/utils/appLaunch.ts`. `src/hooks/useUserAccess.ts`
normalizes both sides of every access comparison with it.

Composition:

| Source | Entries |
| --- | --- |
| Legacy bundle slugs (`src/data/bundleData.ts`) | 35 |
| Legacy VideoRemix storefront slug (`enhancedAppsData.ts`) | 1 (`profile-gen` → `ai-profilegen`) |
| Renamed upstream id (`github_app_catalog.json`) | 1 (`chat_with_github` → `chat-with-github-gpt-llama3`) |

Enforced invariants (asserted in `src/utils/appLaunch.test.ts`):

1. **Many-to-one** — multiple legacy slugs may resolve to one canonical slug;
   currently `ai-music-generator-agent` (2 aliases) and `ai-audio-tour-agent`
   (2 aliases).
2. **No alias key equals a canonical slug** (after underscore/hyphen + case +
   whitespace normalization) — an alias is only consulted for non-canonical
   slugs, so canonical slugs pass through untouched.
3. **No alias chains** — no alias value is itself an alias key.
4. **Every alias value exists in the 130-product registry** — including
   external apps (`ai-profilegen`).

Normalization: `normalizeSlug` trims, lowercases, and maps underscores to
hyphens, so `chat_with_github`, `CHAT_WITH_GITHUB` and `chat-with-github` all
resolve identically. Unknown slugs return `undefined` and callers fall back to
the input slug, which keeps already-canonical and unmapped slugs working.

### 4.3 Bundle coverage

Of the 101 legacy bundle slugs, 35 resolve to canonical registry slugs via the
alias map; the remaining 66 have no canonical counterpart in the 130-product
catalog (pre-rebrand bundle contents that were retired in the catalog rebuild).
Access checks for those slugs fall through to exact comparison and therefore
grant no catalog entitlement — the documented behavior is that entitlement
follows canonical product identity, not legacy bundle membership.

## 5. Related artifacts

- `docs/completion/functionality-matrix.md` — 130-row per-product matrix.
- `docs/completion/runtime-status.md` — per-product runtime verification status
  (maintained separately; referenced by the functionality matrix).
