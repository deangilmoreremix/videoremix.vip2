# Backend Function Inventory — VideoRemix.vip

**Status:** In Progress  
**Last Updated:** 2026-05-01  
**Migration:** Netlify Functions → Supabase Edge Functions

---

## Executive Summary

| Metric | Count | Notes |
|---|---|---|
| Total React Agent Pages | 127 | `src/pages/agents/*.tsx` |
| Existing Netlify Functions | 10 | Deployed, working implementations |
| Functions to Create/Migrate | ~117 | Missing or needing migration |
| Total Edge Functions Target | ~127 | One per React page |
| Categories | 8 | Starter, Voice, RAG, Advanced, MCP, Crash Course, Skills, LLM Apps |

**Key Decision:** All backend logic moves to Supabase Edge Functions. React frontend calls via `supabase.functions.invoke()` instead of `fetch('/.netlify/functions/...')`.

---

## Existing Netlify Functions (10 — Port These First)

These have working TypeScript implementations. Port to Supabase Edge Functions with minimal changes.

| # | Function Name | React Page | Category | Dependencies | APIs | Priority |
|---|---|---|---|---|---|---|
| 1 | consultpro-ai | ConsultProAIPage | starter | @supabase/supabase-js, @anthropic-ai/sdk | Anthropic Claude | HIGH |
| 2 | email-gtm-agent | EmailGTMPage | starter | openai, email validation | OpenAI GPT | HIGH |
| 3 | finance-agent | FinanceAgentPage | advanced | yfinance, duckduckgo-search, xAI | xAI Grok | MEDIUM |
| 4 | financial-coach | FinancialCoachPage | advanced | openai, budgeting libs | OpenAI GPT | MEDIUM |
| 5 | launchrocket-ai | LaunchRocketAIPage | starter | openai, launch planning | OpenAI GPT | HIGH |
| 6 | podcastify-ai | PodcastifyAIPage | starter | openai, elevenlabs, agno | OpenAI TTS + ElevenLabs | HIGH |
| 7 | reasoning-agent | ReasoningAgentPage | starter | openai, numpy, pandas | OpenAI GPT | HIGH |
| 8 | salesforce-ai | SalesForceAIPage | starter | salesforce API (optional) | Salesforce REST | LOW |
| 9 | socialbuzz-ai | SocialBuzzAIPage | starter | social media APIs | Content generation | MEDIUM |
| 10 | web-scraping-agent | WebScrapingAgentPage | starter | playwright, firecrawl-py, scrapegraph | Browser automation | HIGH |

**Migration strategy:** Copy `.ts` → `supabase/functions/<name>/index.ts`, replace Node/CommonJS imports with Deno-compatible imports, change `process.env` → `Deno.env.get()`, test locally, deploy.

---

## Missing Functions by Category

### Priority Tier 1: Starter AI Agents (Complete All 16)

**Rationale:** These are simplest (single LLM call + minimal processing). Build momentum.

| # | App ID (catalog) | React Page | Function Name | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | ai_blog_to_podcast_agent | AiBlogToPodcastAgentPage | ai-blog-to-podcast-agent | ❌ | openai, firecrawl, agno, elevenlabs |
| 2 | ai_breakup_recovery_agent | AiBreakupRecoveryAgentPage | ai-breakup-recovery-agent | ❌ | openai, agno, safety guardrails |
| 3 | ai_data_analysis_agent | AiDataAnalysisAgentPage | ai-data-analysis-agent | ❌ | openai, pandas/Deno DF? |
| 4 | ai_data_visualisation_agent | AiDataVisualisationAgentPage | ai-data-visualisation-agent | ❌ | matplotlib Deno port? or return JSON for frontend chart |
| 5 | ai_life_insurance_advisor_agent | AiLifeInsuranceAdvisorAgentPage | ai-life-insurance-advisor-agent | ❌ | openai, e2b-code-interpreter |
| 6 | ai_medical_imaging_agent | AiMedicalImagingAgentPage | ai-medical-imaging-agent | ❌ | google-generativeai (vision), pillow |
| 7 | ai_meme_generator_agent_browseruse | AiMemeGeneratorAgentBrowserusePage | ai-meme-generator-agent-browseruse | ❌ | browser-use, playwright, openai, anthropic |
| 8 | ai_music_generator_agent | AiMusicGeneratorAgentPage | ai-music-generator-agent | ❌ | openai, suno/udio API? or audio synthesis |
| 9 | ai_reasoning_agent | ReasoningAgentPage | reasoning-agent | ✅ EXISTS | (already done) |
| 10 | ai_startup_trend_analysis_agent | StartupTrendsAgentPage | ai-startup-trend-analysis-agent | ❌ | agno, duckduckgo-search, newspaper4k |
| 11 | ai_travel_agent | AiTravelAgentPage | ai-travel-agent | ❌ | openai, google-search-results, icalendar |
| 12 | mixture_of_agents | MixtureOfAgentsPage | mixture-of-agents | ❌ | asyncio, together.ai |
| 13 | multimodal_ai_agent | MultimodalAiAgentPage | multimodal-ai-agent | ❌ | agno, google-generativeai |
| 14 | openai_research_agent | OpenaiResearchAgentPage | openai-research-agent | ❌ | openai-agents, web search |
| 15 | web_scraping_ai_agent | WebScrapingAiAgentPage | web-scraping-ai-agent | ❌ | playwright, scrapegraphai |
| 16 | xai_finance_agent | XaiFinanceAgentPage | xai-finance-agent | ❌ | yfinance, xAI Grok |

**Completion target:** Week 1 (Sprint 0)

---

### Priority Tier 2: RAG Apps (20)

**Prerequisite:** Verify Supabase pgvector extension enabled and `documents` table exists.

| # | App ID | React Page | Function Name | Vector DB | Priority |
|---|---|---|---|---|---|
| 1 | agentic_rag_embedding_gemma | AgenticRagEmbeddingGemmaPage | agentic-rag-embedding-gemma | LanceDB/Ollama | HIGH |
| 2 | agentic_rag_gpt5 | AgenticRagGpt5Page | agentic-rag-gpt5 | pgvector | HIGH |
| 3 | agentic_rag_math_agent | AgenticRagMathAgentPage? | agentic-rag-math-agent | Qdrant | MEDIUM |
| 4 | agentic_rag_with_reasoning | AgenticRagWithReasoningPage | agentic-rag-with-reasoning | pgvector | HIGH |
| 5 | ai_blog_search | AiBlogSearchPage | ai-blog-search | Qdrant | MEDIUM |
| 6 | autonomous_rag | AutonomousRagPage | autonomous-rag | pgvector | HIGH |
| 7 | contextualai_rag_agent | ContextualaiRagAgentPage | contextualai-rag-agent | Qdrant | MEDIUM |
| 8 | corrective_rag | CorrectiveRagPage | corrective-rag | Qdrant/pgvector | HIGH |
| 9 | deepseek_local_rag_agent | DeepseekLocalRagAgentPage | deepseek-local-rag-agent | Ollama | LOW |
| 10 | gemini_agentic_rag | GeminiAgenticRagPage | gemini-agentic-rag | Qdrant | MEDIUM |
| 11 | hybrid_search_rag | HybridSearchRagPage | hybrid-search-rag | Postgres/ES | MEDIUM |
| 12 | knowledge_graph_rag_citations | KnowledgeGraphRagCitationsPage | knowledge-graph-rag-citations | Neo4j + vector | LOW (Neo4j not in Supabase) |
| 13 | llama3.1_local_rag | Llama31LocalRagPage | llama3.1-local-rag | Ollama | LOW |
| 14 | local_hybrid_search_rag | LocalHybridSearchRagPage | local-hybrid-search-rag | SQLite | LOW |
| 15 | qwen_local_rag | QwenLocalRagPage | qwen-local-rag | Ollama | LOW |
| 16 | rag-as-a-service | RagAsAServicePage | rag-as-a-service | pgvector | HIGH |
| 17 | rag_agent_cohere | RagAgentCoherePage | rag-agent-cohere | Qdrant + Cohere | MEDIUM |
| 18 | rag_chain | RagChainPage | rag-chain | pgvector | HIGH |
| 19 | rag_database_routing | RagDatabaseRoutingPage | rag-database-routing | multi-source | MEDIUM |
| 20 | vision_rag | VisionRagPage | vision-rag | pgvector + vision | HIGH |

**Note:** For apps requiring external vector DBs (Qdrant, Neo4j, LanceDB, Ollama), either:
- A) Deploy those services separately (adds hosting complexity)
- B) Substitute with Supabase pgvector (may require algorithm adjustments)
- C) Implement as placeholder "Coming soon" until infra ready

**Recommended:** Use pgvector for all RAG initially (except vision_RAG which needs multimodal embeddings). This keeps everything on Supabase.

---

### Priority Tier 3: Voice AI Agents (3)

| # | App ID | React Page | Function Name | APIs | Special Needs |
|---|---|---|---|---|---|
| 1 | ai_audio_tour_agent | AiAudioTourAgentPage | ai-audio-tour-agent | OpenAI TTS + STT | Audio file handling |
| 2 | customer_support_voice_agent | CustomerSupportVoiceAgentPage | customer-support-voice-agent | OpenAI Realtime? | Streaming or upload-process |
| 3 | voice_rag_openaisdk | VoiceRagOpenaisdkPage | voice-rag-openaisdk | STT + RAG + TTS | Pipeline |

**Challenge:** Edge Functions are stateless, request-response. Streaming voice requires WebSocket, which Edge Functions support with `ws` WebSocket standard library. Test feasibility. Non-realtime (upload audio → process → return audio) is safer.

---

### Priority Tier 4: Advanced Multi-Agent Teams (10+)

**Complexity:** Highest. These need conversation memory, agent handoffs, tool calling loops.

Strategy: Implement a generic `agent-orchestrator` Edge Function that can run any agent team configuration. Or create one function per app with hardcoded agent definitions.

| App ID | React Page | Function Name | Notes |
|---|---|---|---|
| ai_deep_research_agent | AiDeepResearchAgentPage | ai-deep-research-agent | Research loop with web search |
| ai_vc_due_diligence_agent_team | ? | ai-vc-due-diligence-agent-team | Multiple specialist agents |
| ai_research_planner_executor | ? | ai-research-planner-executor | Planning → execution pipeline |
| ai_consultant_agent | AiConsultantAgentPage? | ai-consultant-agent | Business consultant |
| ai_system_architect_agent | AiSystemArchitectR1Page | ai-system-architect-r1 | Technical architecture design |
| ai_financial_coach_agent | AiFinancialCoachAgentPage | ai-financial-coach-agent | Already exists as `financial-coach` |
| ai_movie_production_agent | AiMovieProductionAgentPage | ai-movie-production-agent | Script → storyboard → shots |
| ai_investment_agent | ? | ai-investment-agent | Finance research + analysis |
| ai_product_launch_intelligence_agent | ProductLaunchIntelligenceAgentPage | ai-product-launch-intelligence-agent | Market + competitor research |
| ai_fraud_investigation_agent | AiFraudInvestigationAgentPage | ai-fraud-investigation-agent | Pattern detection, anomaly |
| ai_journalist_agent | AiJournalistAgentPage | ai-journalist-agent | News research + article drafting |
| ai_mental_wellbeing_agent | AiMentalWellbeingAgentPage | ai-mental-wellbeing-agent | Supportive chat, safety guardrails |
| ai_meeting_agent | AiMeetingAgentPage | ai-meeting-agent | Transcription + summary (needs STT) |
| ai_self_evolving_agent | ? | ai-self-evolving-agent | Meta-learning (complex) |
| ai_sales_intelligence_agent_team | ? | ai-sales-intelligence-agent-team | CRM + lead research |
| ai_social_media_news_podcast_agent | ? | ai-social-media-news-podcast-agent | RSS → podcast pipeline |
| openwork_browser_automation_agent | WebScrapingAgentPage? | openwork-browser-automation-agent | Browser automation |
| trust_gated_multi_agent_research_team | TrustGatedAgentTeamPage | trust-gated-multi-agent-research-team | Agent verification loop |
| ai_competitor_intelligence_agent_team | AiCompetitorIntelligenceAgentTeamPage | ai-competitor-intelligence-agent-team | Multi-researcher agents |
| ... and more

**MVP Approach:** For Sprint 0-1, provide placeholder response: `{ "status": "coming_soon", "message": "This advanced agent is under construction" }`. Then iteratively implement high-value ones (deep research, consultant, system architect).

---

### Priority Tier 5: Vision & Multimodal (6)

| App ID | React Page | Function Name | APIs |
|---|---|---|---|
| ai_medical_imaging_agent | AiMedicalImagingAgentPage | ai-medical-imaging-agent | Google Vision + LLM |
| ai_meme_generator_agent_browseruse | AiMemeGeneratorAgentBrowserusePage | ai-meme-generator-agent-browseruse | DALL-E + browser-use |
| ai_3dpygame_r1 | Ai3dpygameR1Page | ai-3dpygame-r1 | Game screenshot analysis |
| multimodal_coding_agent_team | MultimodalCodingAgentTeamPage | multimodal-coding-agent-team | Code + image reasoning |
| multimodal_design_agent_team | MultimodalDesignAgentTeamPage | multimodal-design-agent-team | Design critique |
| multimodal_ui_ux_feedback_agent_team | ? | multimodal-ui-ux-feedback-agent-team | UI screenshot → feedback |

---

### Priority Tier 6: MCP AI Agents (5)

MCP (Model Context Protocol) agents require MCP server connections. Need to evaluate if Supabase Edge Functions can host MCP clients (likely yes via npm MCP packages).

| App ID | React Page | Function Name |
|---|---|---|
| browser_mcp_agent | BrowserMcpAgentPage | browser-mcp-agent |
| github_mcp_agent | GithubMcpAgentPage | github-mcp-agent |
| notion_mcp_agent | ? | notion-mcp-agent |
| ai_travel_planner_mcp_agent_team | AiTravelPlannerMcpAgentTeamPage | ai-travel-planner-mcp-agent-team |
| multi_mcp_agent_router | MultiMcpAgentRouterPage | multi-mcp-agent-router |

---

### Priority Tier 7: Agent Framework Crash Courses (12)

These are tutorial/demo apps showing specific Agents SDK patterns. Simple implementations.

| App ID | React Page | Function Name |
|---|---|---|
| 1_starter_agent | 1StarterAgentPage | 1-starter-agent |
| 4_running_agents | 4RunningAgentsPage | 4-running-agents |
| 5_1_in_memory_conversation_agent | 51InMemoryConversationAgentPage | 5-1-in-memory-conversation-agent |
| 5_2_persistent_conversation_agent | 52PersistentConversationAgentPage | 5-2-persistent-conversation-agent |
| 6_1_agent_lifecycle_callbacks | 61AgentLifecycleCallbacksPage | 6-1-agent-lifecycle-callbacks |
| 6_2_llm_interaction_callbacks | 62LlmInteractionCallbacksPage | 6-2-llm-interaction-callbacks |
| 6_3_tool_execution_callbacks | 63ToolExecutionCallbacksPage | 6-3-tool-execution-callbacks |
| 7_plugins | 7PluginsPage | 7-plugins |
| 7_sessions | 7SessionsPage | 7-sessions |
| 9_1_sequential_agent | 91SequentialAgentPage | 9-1-sequential-agent |
| 9_2_loop_agent | 92LoopAgentPage | 9-2-loop-agent |
| 9_3_parallel_agent | 93ParallelAgentPage | 9-3-parallel-agent |

---

### Priority Tier 8: Agent Skills (from awesome_agent_skills catalog)

These are reusable skill modules, not standalone apps. May be imported by other functions rather than deployed independently.

---

## Function Naming Convention

**Rule:** Match the fetch URL used in React page exactly.

Example from `ChatWithPdfPage.tsx`:
```typescript
fetch('/.netlify/functions/chat-with-pdf')
```

→ Function name: `chat-with-pdf`

Target Edge Function path: `supabase/functions/chat-with-pdf/index.ts`

**Kebab-case only.** No underscores, no uppercase.

---

## Secrets & Environment Variables

To be aggregated from:
1. Netlify Site Settings → Environment Variables
2. `netlify/functions/*.ts` files (process.env references)
3. `streamlit_metadata.json` (uses_st_secrets, uses_os_getenv fields)
4. `requirements.txt` / `pyproject.toml` in Streamlit source (API keys in code?)

**List to compile:**
- `OPENAI_API_KEY` — most functions
- `ANTHROPIC_API_KEY` — Claude-based
- `GOOGLE_API_KEY` / `GOOGLE_GENERATIVEAI_API_KEY` — Gemini
- `ELEVENLABS_API_KEY` — TTS
- `FIRECRAWL_API_KEY` / `FIRECRAWL_API_URL` — scraping
- `BROWSERBASE_API_KEY` / `BROWSERBASE_PROJECT_ID` — browser automation
- `SERPAPI_KEY` / `GOOGLE_SEARCH_API_KEY` / `SERPER_KEY` — search
- `COHERE_API_KEY` — Cohere embeddings/rerank
- `TOGETHER_API_KEY` — Together.ai (Llama, etc.)
- `SUNO_API_KEY` / `UDIO_API_KEY` — music gen
- `QDRANT_URL` / `QDRANT_API_KEY` — vector DB
- `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` — graph DB
- `LANGCHAIN_*` — langchain configs
- App-specific: `PLAID_CLIENT_ID`, `STRIPE_SECRET`, etc.

All these go into **Supabase Secrets** (Project Settings → Secrets), accessible via `Deno.env.get('KEY_NAME')`.

---

## Migration Tracking Table

We'll create a spreadsheet or markdown table tracking each function's status:

| AppId | FunctionName | Netlify Exists? | Ported? | Deployed? | Tested? | Notes |
|---|---|---|---|---|---|---|
| consultpro-ai | consultpro-ai | ✅ | ❌ | ❌ | ❌ | Anthropic, large file |
| ai_blog_to_podcast_agent | ai-blog-to-podcast-agent | ❌ | ❌ | ❌ | ❌ | Need to build from scratch |
| ... | ... | ... | ... | ... | ... | ... |

---

## Template for Supabase Edge Function

Create `supabase/functions/template/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Import dependencies as needed (OpenAI, Anthropic, etc.)

// Initialize clients outside handler (cold start optimization)
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// ... other clients

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { user_id, ...params } = body;

    // TODO: Implement agent logic here
    // Call LLM, process, return JSON

    return new Response(
      JSON.stringify({ result: "ok" }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Phase 0 Execution — Migration Steps

### Step 1: Create Inventory Spreadsheet
- Done (this document)
- Add columns: `deployedAt`, `lastError`, `latencyP50`, `costPerMonth`

### Step 2: Secrets Audit
- Extract all env vars from Netlify dashboard
- Add missing keys to Supabase
- Verify `supabase secrets list` shows all required

### Step 3: Migrate 10 Existing Functions (Week 0, Days 1-2)
Order:
1. `reasoning-agent` (simplest — just OpenAI chat)
2. `financial-coach` (simple OpenAI)
3. `finance-agent` (xAI, but xAI API compatible with OpenAI SDK)
4. `email-gtm-agent` (OpenAI text gen)
5. `web-scraping-agent` (Playwright — may be heavy; test limits)
6. `consultpro-ai` (Anthropic — need Deno Anthropic SDK)
7. `launchrocket-ai` (OpenAI)
8. `podcastify-ai` (TTS + ElevenLabs)
9. `socialbuzz-ai` (social APIs)
10. `salesforce-ai` (Salesforce REST — optional)

Each: port → local test `supabase functions serve <name>` → `curl -X POST http://localhost:8000/functions/v1/<name>` → deploy → smoke test from UI.

### Step 4: Create Missing Functions (Week 0-1, Days 3-7)
Create in priority order:
- **Tier 1 (Starter Agents 6 missing)**: ai-blog-to-podcast-agent, ai-travel-agent, ai-data-analysis-agent, ai-breakup-recovery-agent, openai-research-agent, ai-meme-generator-agent-browseruse
- Implement as stub that returns placeholder → later enhance

### Step 5: Update React Frontend API Layer
- Create `src/lib/api.ts` with `callAgent(functionName: string, body: any)` using `supabase.functions.invoke()`
- Replace all `fetch('/.netlify/functions/...')` calls in 127 pages
- Handle auth: Supabase automatically forwards JWT token (enable JWT verification in Edge Function)

### Step 6: Test & Decommission Netlify
- All 127 functions must respond (even if placeholder)
- Remove `netlify/` directory
- Update deployment config (no Netlify functions needed)

---

## Superpowers Skills Sub-Agents for Migration

Each category gets a specialized "sub-agent" pattern:

- **Jobs (Starter):** Ship fast, minimal viable function, focus on core LLM call
- **Bezos (RAG):** Reliability, citations, accuracy, pgvector best practices
- **Voss (Voice):** Empathetic error messages, clear transcription, graceful degradation
- **Challenger (Multi-Agent):** Orchestrate with handoffs, show agent progress
- **Godin (Vision):** Remarkable outputs (images, memes), creative prompts

---

## Success Metrics

- **Coverage:** 100% of React pages have corresponding Edge Function (127/127)
- **Uptime:** Edge Functions error rate < 1%
- **Latency:** p50 < 1s (excluding external API latency)
- **Cost:** OpenAI API spend tracked per app (alerts if > threshold)

---

## Reference

- Netlify Functions code: `netlify/functions/*.ts`
- React Pages: `src/pages/agents/*.tsx`
- Catalog: `streamlit_apps_catalog.json`
- Supabase Edge Functions docs: https://supabase.com/docs/guides/functions

---

**Status:** In planning phase, starting implementation with inventory → secrets → migrate existing 10.
