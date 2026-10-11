# Functionality Matrix

**Workstream:** catalog / upstream-parity (PR #19 — `fix/sapienx-130-app-catalog`)
**Scope:** all 130 customer-facing products (117 Awesome LLM + 13 VideoRemix external)
**Status date:** 2026-10-11

## How to read this matrix

- **Runtime Status** links to the per-product verification entry in
  `docs/completion/runtime-status.md` (maintained by the runtime-verification
  workstream; anchors are the canonical slugs). A missing anchor means the
  runtime entry for that slug has not been written yet.
- **Launch** is the destination produced by `getAppLaunchTarget`
  (`src/utils/appLaunch.ts`): dedicated React agent pages under
  `/agents/:slug` for the 17 verified `AGENT_PAGE_SLUGS`, the shared runner
  under `/ai-runner/:slug` for all other Awesome LLM products, and the
  configured external URL for VideoRemix apps.
- **Family**: `awesome-llm` = product identity from `src/data/appsData.ts`;
  `external` = VideoRemix-built app hosted off-platform.
- Counts (117 / 13 / 130, unique slugs) are asserted in
  `src/config/appRegistry.test.ts`; catalog provenance and upstream drift are in
  `docs/completion/catalog-parity.md`.

## Summary

| Family | Products | Launch surface |
| --- | --- | --- |
| awesome-llm | 117 | `/agents/:slug` (17) + `/ai-runner/:slug` (100) |
| external | 13 | external URLs |
| **Total** | **130** | |

## Matrix

| # | Slug | Name | Family | Group | Category | Launch | Runtime Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `project-graveyard` | Project Graveyard | awesome-llm | agent-skills | agent-skills | `/ai-runner/project-graveyard` | [runtime-status](#project-graveyard) |
| 2 | `first-reader` | First Reader | awesome-llm | agent-skills | agent-skills | `/ai-runner/first-reader` | [runtime-status](#first-reader) |
| 3 | `scope-creep-detector` | Scope Creep Detector | awesome-llm | agent-skills | agent-skills | `/ai-runner/scope-creep-detector` | [runtime-status](#scope-creep-detector) |
| 4 | `commit-archaeologist` | Commit Archaeologist | awesome-llm | agent-skills | agent-skills | `/ai-runner/commit-archaeologist` | [runtime-status](#commit-archaeologist) |
| 5 | `dependency-doctor` | Dependency Doctor | awesome-llm | agent-skills | agent-skills | `/ai-runner/dependency-doctor` | [runtime-status](#dependency-doctor) |
| 6 | `advisor-orchestrator-worker` | Advisor Orchestrator Worker | awesome-llm | agent-skills | agent-skills | `/ai-runner/advisor-orchestrator-worker` | [runtime-status](#advisor-orchestrator-worker) |
| 7 | `thinking-out-loud` | Thinking Out Loud | awesome-llm | agent-skills | agent-skills | `/ai-runner/thinking-out-loud` | [runtime-status](#thinking-out-loud) |
| 8 | `self-improving-agent-skills` | Self-Improving Agent Skills | awesome-llm | agent-skills | agent-skills | `/agents/self-improving-agent-skills` | [runtime-status](#self-improving-agent-skills) |
| 9 | `ai-blog-to-podcast-agent` | AI Blog to Podcast Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-blog-to-podcast-agent` | [runtime-status](#ai-blog-to-podcast-agent) |
| 10 | `ai-breakup-recovery-agent` | AI Breakup Recovery Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-breakup-recovery-agent` | [runtime-status](#ai-breakup-recovery-agent) |
| 11 | `ai-data-analysis-agent` | AI Data Analysis Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-data-analysis-agent` | [runtime-status](#ai-data-analysis-agent) |
| 12 | `ai-medical-imaging-agent` | AI Medical Imaging Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-medical-imaging-agent` | [runtime-status](#ai-medical-imaging-agent) |
| 13 | `ai-meme-generator-agent-browser` | AI Meme Generator Agent (Browser) | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-meme-generator-agent-browser` | [runtime-status](#ai-meme-generator-agent-browser) |
| 14 | `ai-music-generator-agent` | AI Music Generator Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-music-generator-agent` | [runtime-status](#ai-music-generator-agent) |
| 15 | `ai-travel-agent-local-cloud` | AI Travel Agent (Local & Cloud) | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-travel-agent-local-cloud` | [runtime-status](#ai-travel-agent-local-cloud) |
| 16 | `ai-x402-paying-agent` | AI x402 Paying Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/ai-x402-paying-agent` | [runtime-status](#ai-x402-paying-agent) |
| 17 | `gemini-multimodal-agent` | Gemini Multimodal Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/gemini-multimodal-agent` | [runtime-status](#gemini-multimodal-agent) |
| 18 | `mixture-of-agents` | Mixture of Agents | awesome-llm | starter-ai-agents | starter-ai-agents | `/agents/mixture-of-agents` | [runtime-status](#mixture-of-agents) |
| 19 | `xai-finance-agent` | xAI Finance Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/xai-finance-agent` | [runtime-status](#xai-finance-agent) |
| 20 | `openai-research-agent` | OpenAI Research Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/openai-research-agent` | [runtime-status](#openai-research-agent) |
| 21 | `web-scraping-ai-agent` | Web Scraping AI Agent | awesome-llm | starter-ai-agents | starter-ai-agents | `/ai-runner/web-scraping-ai-agent` | [runtime-status](#web-scraping-ai-agent) |
| 22 | `ai-home-renovation-agent` | AI Home Renovation Agent with Nano Banana Pro | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-home-renovation-agent` | [runtime-status](#ai-home-renovation-agent) |
| 23 | `devpulse-ai` | DevPulse AI - Multi-Agent Signal Intelligence | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/devpulse-ai` | [runtime-status](#devpulse-ai) |
| 24 | `ai-deep-research-agent` | AI Deep Research Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-deep-research-agent` | [runtime-status](#ai-deep-research-agent) |
| 25 | `ai-vc-due-diligence-agent-team` | AI VC Due Diligence Agent Team | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-vc-due-diligence-agent-team` | [runtime-status](#ai-vc-due-diligence-agent-team) |
| 26 | `research-agent-gemini-interaction-api` | AI Research Planner & Executor (Google Interactions API) | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/research-agent-gemini-interaction-api` | [runtime-status](#research-agent-gemini-interaction-api) |
| 27 | `ai-consultant-agent` | AI Consultant Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-consultant-agent` | [runtime-status](#ai-consultant-agent) |
| 28 | `ai-system-architect-agent` | AI System Architect Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-system-architect-agent` | [runtime-status](#ai-system-architect-agent) |
| 29 | `ai-financial-coach-agent` | AI Financial Coach Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-financial-coach-agent` | [runtime-status](#ai-financial-coach-agent) |
| 30 | `ai-movie-production-agent` | AI Movie Production Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-movie-production-agent` | [runtime-status](#ai-movie-production-agent) |
| 31 | `ai-investment-agent` | AI Investment Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-investment-agent` | [runtime-status](#ai-investment-agent) |
| 32 | `earnings-call-analyst-agent` | Earnings Call Analyst Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/earnings-call-analyst-agent` | [runtime-status](#earnings-call-analyst-agent) |
| 33 | `ai-health-fitness-agent` | AI Health & Fitness Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-health-fitness-agent` | [runtime-status](#ai-health-fitness-agent) |
| 34 | `ai-product-launch-intelligence-agent` | AI Product Launch Intelligence Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-product-launch-intelligence-agent` | [runtime-status](#ai-product-launch-intelligence-agent) |
| 35 | `ai-fraud-investigation-agent` | AI Fraud Investigation Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-fraud-investigation-agent` | [runtime-status](#ai-fraud-investigation-agent) |
| 36 | `ai-journalist-agent` | AI Journalist Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-journalist-agent` | [runtime-status](#ai-journalist-agent) |
| 37 | `ai-mental-wellbeing-agent` | AI Mental Wellbeing Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-mental-wellbeing-agent` | [runtime-status](#ai-mental-wellbeing-agent) |
| 38 | `ai-meeting-agent` | AI Meeting Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-meeting-agent` | [runtime-status](#ai-meeting-agent) |
| 39 | `ai-self-evolving-agent` | AI Self-Evolving Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-self-evolving-agent` | [runtime-status](#ai-self-evolving-agent) |
| 40 | `ai-sales-intelligence-agent-team` | AI Sales Intelligence Agent Team | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/agents/ai-sales-intelligence-agent-team` | [runtime-status](#ai-sales-intelligence-agent-team) |
| 41 | `ai-social-media-news-and-podcast-agent` | AI Social Media News and Podcast Agent | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/ai-social-media-news-and-podcast-agent` | [runtime-status](#ai-social-media-news-and-podcast-agent) |
| 42 | `trust-gated-multi-agent-research-team` | Trust-Gated Multi-Agent Research Team | awesome-llm | advanced-ai-agents | advanced-ai-agents | `/ai-runner/trust-gated-multi-agent-research-team` | [runtime-status](#trust-gated-multi-agent-research-team) |
| 43 | `always-on-hacker-news-briefing-agent` | Always-on Hacker News Briefing Agent | awesome-llm | always-on-agents | always-on-agents | `/ai-runner/always-on-hacker-news-briefing-agent` | [runtime-status](#always-on-hacker-news-briefing-agent) |
| 44 | `release-radar-agent` | Release Radar Agent | awesome-llm | always-on-agents | always-on-agents | `/ai-runner/release-radar-agent` | [runtime-status](#release-radar-agent) |
| 45 | `ai-competitor-intelligence-agent-team` | AI Competitor Intelligence Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-competitor-intelligence-agent-team` | [runtime-status](#ai-competitor-intelligence-agent-team) |
| 46 | `ai-finance-agent-team` | AI Finance Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-finance-agent-team` | [runtime-status](#ai-finance-agent-team) |
| 47 | `ai-game-design-agent-team` | AI Game Design Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-game-design-agent-team` | [runtime-status](#ai-game-design-agent-team) |
| 48 | `ag2-adaptive-research-team` | AG2 Adaptive Research Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ag2-adaptive-research-team` | [runtime-status](#ag2-adaptive-research-team) |
| 49 | `ai-legal-agent-team-cloud-local` | AI Legal Agent Team (Cloud & Local) | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-legal-agent-team-cloud-local` | [runtime-status](#ai-legal-agent-team-cloud-local) |
| 50 | `ai-recruitment-agent-team` | AI Recruitment Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-recruitment-agent-team` | [runtime-status](#ai-recruitment-agent-team) |
| 51 | `ai-real-estate-agent-team` | AI Real Estate Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-real-estate-agent-team` | [runtime-status](#ai-real-estate-agent-team) |
| 52 | `ai-services-agency-crewai` | AI Services Agency (CrewAI) | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-services-agency-crewai` | [runtime-status](#ai-services-agency-crewai) |
| 53 | `ai-teaching-agent-team` | AI Teaching Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/ai-teaching-agent-team` | [runtime-status](#ai-teaching-agent-team) |
| 54 | `multimodal-coding-agent-team` | Multimodal Coding Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/multimodal-coding-agent-team` | [runtime-status](#multimodal-coding-agent-team) |
| 55 | `multimodal-design-agent-team` | Multimodal Design Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/multimodal-design-agent-team` | [runtime-status](#multimodal-design-agent-team) |
| 56 | `multimodal-ui-ux-feedback-agent-team` | Multimodal UI/UX Feedback Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/multimodal-ui-ux-feedback-agent-team` | [runtime-status](#multimodal-ui-ux-feedback-agent-team) |
| 57 | `ai-travel-planner-agent-team` | AI Travel Planner Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/agents/ai-travel-planner-agent-team` | [runtime-status](#ai-travel-planner-agent-team) |
| 58 | `llm-panel-agent-team` | LLM Panel Agent Team | awesome-llm | multi-agent-teams | multi-agent-teams | `/ai-runner/llm-panel-agent-team` | [runtime-status](#llm-panel-agent-team) |
| 59 | `ai-audio-tour-agent` | AI Audio Tour Agent | awesome-llm | voice-ai-agents | voice-ai-agents | `/ai-runner/ai-audio-tour-agent` | [runtime-status](#ai-audio-tour-agent) |
| 60 | `customer-support-voice-agent` | Customer Support Voice Agent | awesome-llm | voice-ai-agents | voice-ai-agents | `/ai-runner/customer-support-voice-agent` | [runtime-status](#customer-support-voice-agent) |
| 61 | `insurance-claim-live-agent-team` | Insurance Claim Live Agent Team | awesome-llm | voice-ai-agents | voice-ai-agents | `/ai-runner/insurance-claim-live-agent-team` | [runtime-status](#insurance-claim-live-agent-team) |
| 62 | `voice-rag-agent-openai-sdk` | Voice RAG Agent (OpenAI SDK) | awesome-llm | voice-ai-agents | voice-ai-agents | `/ai-runner/voice-rag-agent-openai-sdk` | [runtime-status](#voice-rag-agent-openai-sdk) |
| 63 | `generative-ui-starter-project` | Generative UI Starter Project | awesome-llm | generative-ui-agents | generative-ui-agents | `/ai-runner/generative-ui-starter-project` | [runtime-status](#generative-ui-starter-project) |
| 64 | `ai-dashboard-canvas-agent` | AI Dashboard Canvas Agent | awesome-llm | generative-ui-agents | generative-ui-agents | `/ai-runner/ai-dashboard-canvas-agent` | [runtime-status](#ai-dashboard-canvas-agent) |
| 65 | `ai-mcp-app-builder` | AI MCP App Builder | awesome-llm | generative-ui-agents | generative-ui-agents | `/ai-runner/ai-mcp-app-builder` | [runtime-status](#ai-mcp-app-builder) |
| 66 | `mcp-apps-generative-ui-showcase` | MCP Apps Generative UI Showcase | awesome-llm | generative-ui-agents | generative-ui-agents | `/ai-runner/mcp-apps-generative-ui-showcase` | [runtime-status](#mcp-apps-generative-ui-showcase) |
| 67 | `ai-shadcn-component-generator` | AI Shadcn Component Generator | awesome-llm | generative-ui-agents | generative-ui-agents | `/ai-runner/ai-shadcn-component-generator` | [runtime-status](#ai-shadcn-component-generator) |
| 68 | `ai-3d-pygame-agent` | AI 3D Pygame Agent | awesome-llm | autonomous-game-playing-agents | autonomous-game-playing-agents | `/ai-runner/ai-3d-pygame-agent` | [runtime-status](#ai-3d-pygame-agent) |
| 69 | `ai-chess-agent` | AI Chess Agent | awesome-llm | autonomous-game-playing-agents | autonomous-game-playing-agents | `/ai-runner/ai-chess-agent` | [runtime-status](#ai-chess-agent) |
| 70 | `ai-tic-tac-toe-agent` | AI Tic-Tac-Toe Agent | awesome-llm | autonomous-game-playing-agents | autonomous-game-playing-agents | `/ai-runner/ai-tic-tac-toe-agent` | [runtime-status](#ai-tic-tac-toe-agent) |
| 71 | `browser-mcp-agent` | Browser MCP Agent | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/ai-runner/browser-mcp-agent` | [runtime-status](#browser-mcp-agent) |
| 72 | `github-mcp-agent` | GitHub MCP Agent | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/ai-runner/github-mcp-agent` | [runtime-status](#github-mcp-agent) |
| 73 | `notion-mcp-agent` | Notion MCP Agent | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/agents/notion-mcp-agent` | [runtime-status](#notion-mcp-agent) |
| 74 | `ai-travel-planner-mcp-agent` | AI Travel Planner MCP Agent | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/ai-runner/ai-travel-planner-mcp-agent` | [runtime-status](#ai-travel-planner-mcp-agent) |
| 75 | `multi-mcp-agent-router` | Multi-MCP Agent Router | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/agents/multi-mcp-agent-router` | [runtime-status](#multi-mcp-agent-router) |
| 76 | `openai-remote-mcp-tool-bridge` | OpenAI Remote MCP Tool Bridge | awesome-llm | mcp-ai-agents | mcp-ai-agents | `/ai-runner/openai-remote-mcp-tool-bridge` | [runtime-status](#openai-remote-mcp-tool-bridge) |
| 77 | `agentic-rag-with-embedding-gemma` | Agentic RAG with Embedding Gemma | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/agentic-rag-with-embedding-gemma` | [runtime-status](#agentic-rag-with-embedding-gemma) |
| 78 | `agentic-rag-with-reasoning` | Agentic RAG with Reasoning | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/agentic-rag-with-reasoning` | [runtime-status](#agentic-rag-with-reasoning) |
| 79 | `ai-blog-search-rag` | AI Blog Search (RAG) | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/ai-blog-search-rag` | [runtime-status](#ai-blog-search-rag) |
| 80 | `autonomous-rag` | Autonomous RAG | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/autonomous-rag` | [runtime-status](#autonomous-rag) |
| 81 | `contextual-ai-rag-agent` | Contextual AI RAG Agent | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/contextual-ai-rag-agent` | [runtime-status](#contextual-ai-rag-agent) |
| 82 | `corrective-rag-crag` | Corrective RAG (CRAG) | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/corrective-rag-crag` | [runtime-status](#corrective-rag-crag) |
| 83 | `typed-agentic-rag-with-pydantic-ai` | Typed Agentic RAG with Pydantic AI | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/typed-agentic-rag-with-pydantic-ai` | [runtime-status](#typed-agentic-rag-with-pydantic-ai) |
| 84 | `deepseek-local-rag-agent` | Deepseek Local RAG Agent | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/deepseek-local-rag-agent` | [runtime-status](#deepseek-local-rag-agent) |
| 85 | `gemini-agentic-rag` | Gemini Agentic RAG | awesome-llm | rag-tutorials | rag-tutorials | `/agents/gemini-agentic-rag` | [runtime-status](#gemini-agentic-rag) |
| 86 | `hybrid-search-rag-cloud` | Hybrid Search RAG (Cloud) | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/hybrid-search-rag-cloud` | [runtime-status](#hybrid-search-rag-cloud) |
| 87 | `llama-3-1-local-rag` | Llama 3.1 Local RAG | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/llama-3-1-local-rag` | [runtime-status](#llama-3-1-local-rag) |
| 88 | `local-hybrid-search-rag` | Local Hybrid Search RAG | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/local-hybrid-search-rag` | [runtime-status](#local-hybrid-search-rag) |
| 89 | `multimodal-agentic-rag` | Multimodal Agentic RAG | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/multimodal-agentic-rag` | [runtime-status](#multimodal-agentic-rag) |
| 90 | `local-rag-agent` | Local RAG Agent | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/local-rag-agent` | [runtime-status](#local-rag-agent) |
| 91 | `rag-as-a-service` | RAG-as-a-Service | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/rag-as-a-service` | [runtime-status](#rag-as-a-service) |
| 92 | `rag-agent-with-cohere` | RAG Agent with Cohere | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/rag-agent-with-cohere` | [runtime-status](#rag-agent-with-cohere) |
| 93 | `basic-rag-chain` | Basic RAG Chain | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/basic-rag-chain` | [runtime-status](#basic-rag-chain) |
| 94 | `rag-with-database-routing` | RAG with Database Routing | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/rag-with-database-routing` | [runtime-status](#rag-with-database-routing) |
| 95 | `vision-rag` | Vision RAG | awesome-llm | rag-tutorials | rag-tutorials | `/agents/vision-rag` | [runtime-status](#vision-rag) |
| 96 | `rag-failure-diagnostics-clinic` | RAG Failure Diagnostics Clinic | awesome-llm | rag-tutorials | rag-tutorials | `/agents/rag-failure-diagnostics-clinic` | [runtime-status](#rag-failure-diagnostics-clinic) |
| 97 | `knowledge-graph-rag-with-citations` | Knowledge Graph RAG with Citations | awesome-llm | rag-tutorials | rag-tutorials | `/ai-runner/knowledge-graph-rag-with-citations` | [runtime-status](#knowledge-graph-rag-with-citations) |
| 98 | `needle-a-new-way-to-find` | Needle - A New Way to Find | awesome-llm | ai-browser-tools | ai-browser-tools | `/ai-runner/needle-a-new-way-to-find` | [runtime-status](#needle-a-new-way-to-find) |
| 99 | `ripple-change-one-thing-find-what-else-needs-to-change` | Ripple - Change One Thing, Find What Else Needs to Change | awesome-llm | ai-browser-tools | ai-browser-tools | `/ai-runner/ripple-change-one-thing-find-what-else-needs-to-change` | [runtime-status](#ripple-change-one-thing-find-what-else-needs-to-change) |
| 100 | `ai-arxiv-agent-with-memory` | AI ArXiv Agent with Memory | awesome-llm | llm-apps-memory | llm-apps-memory | `/ai-runner/ai-arxiv-agent-with-memory` | [runtime-status](#ai-arxiv-agent-with-memory) |
| 101 | `ai-travel-agent-with-memory` | AI Travel Agent with Memory | awesome-llm | llm-apps-memory | llm-apps-memory | `/ai-runner/ai-travel-agent-with-memory` | [runtime-status](#ai-travel-agent-with-memory) |
| 102 | `llama3-stateful-chat` | Llama3 Stateful Chat | awesome-llm | llm-apps-memory | llm-apps-memory | `/agents/llama3-stateful-chat` | [runtime-status](#llama3-stateful-chat) |
| 103 | `llm-app-with-personalized-memory` | LLM App with Personalized Memory | awesome-llm | llm-apps-memory | llm-apps-memory | `/ai-runner/llm-app-with-personalized-memory` | [runtime-status](#llm-app-with-personalized-memory) |
| 104 | `local-chatgpt-clone-with-memory` | Local ChatGPT Clone with Memory | awesome-llm | llm-apps-memory | llm-apps-memory | `/ai-runner/local-chatgpt-clone-with-memory` | [runtime-status](#local-chatgpt-clone-with-memory) |
| 105 | `multi-llm-application-with-shared-memory` | Multi-LLM Application with Shared Memory | awesome-llm | llm-apps-memory | llm-apps-memory | `/ai-runner/multi-llm-application-with-shared-memory` | [runtime-status](#multi-llm-application-with-shared-memory) |
| 106 | `chat-with-github-gpt-llama3` | Chat with GitHub (GPT & Llama3) | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-github-gpt-llama3` | [runtime-status](#chat-with-github-gpt-llama3) |
| 107 | `chat-with-gmail` | Chat with Gmail | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-gmail` | [runtime-status](#chat-with-gmail) |
| 108 | `chat-with-pdf-gpt-llama3` | Chat with PDF (GPT & Llama3) | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-pdf-gpt-llama3` | [runtime-status](#chat-with-pdf-gpt-llama3) |
| 109 | `chat-with-research-papers-arxiv-gpt-llama3` | Chat with Research Papers (ArXiv) (GPT & Llama3) | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-research-papers-arxiv-gpt-llama3` | [runtime-status](#chat-with-research-papers-arxiv-gpt-llama3) |
| 110 | `chat-with-substack` | Chat with Substack | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-substack` | [runtime-status](#chat-with-substack) |
| 111 | `chat-with-youtube-videos` | Chat with YouTube Videos | awesome-llm | chat-with-x | chat-with-x | `/ai-runner/chat-with-youtube-videos` | [runtime-status](#chat-with-youtube-videos) |
| 112 | `toonify-token-optimization` | Toonify Token Optimization | awesome-llm | llm-optimization-tools | llm-optimization-tools | `/agents/toonify-token-optimization` | [runtime-status](#toonify-token-optimization) |
| 113 | `headroom-context-optimization` | Headroom Context Optimization | awesome-llm | llm-optimization-tools | llm-optimization-tools | `/ai-runner/headroom-context-optimization` | [runtime-status](#headroom-context-optimization) |
| 114 | `gemma-3-fine-tuning` | Gemma 3 Fine-tuning | awesome-llm | llm-finetuning | llm-finetuning | `/ai-runner/gemma-3-fine-tuning` | [runtime-status](#gemma-3-fine-tuning) |
| 115 | `llama-3-2-fine-tuning` | Llama 3.2 Fine-tuning | awesome-llm | llm-finetuning | llm-finetuning | `/ai-runner/llama-3-2-fine-tuning` | [runtime-status](#llama-3-2-fine-tuning) |
| 116 | `google-adk-crash-course` | Google ADK Crash Course | awesome-llm | ai-agent-framework-crash-course | ai-agent-framework-crash-course | `/ai-runner/google-adk-crash-course` | [runtime-status](#google-adk-crash-course) |
| 117 | `openai-agents-sdk-crash-course` | OpenAI Agents SDK Crash Course | awesome-llm | ai-agent-framework-crash-course | ai-agent-framework-crash-course | `/ai-runner/openai-agents-sdk-crash-course` | [runtime-status](#openai-agents-sdk-crash-course) |
| 118 | `ai-personalizationstudio` | AI Personalization Studio | external | user-apps | user-apps | `https://ai-personalizationstudio.videoremix.vip` | [runtime-status](#ai-personalizationstudio) |
| 119 | `ai-personalizedcontent` | AI Personalized Content Hub | external | user-apps | user-apps | `https://ai-personalizedcontent.videoremix.vip` | [runtime-status](#ai-personalizedcontent) |
| 120 | `ai-profilegen` | Profile Gen | external | user-apps | user-apps | `https://ai-profilegen.videoremix.vip` | [runtime-status](#ai-profilegen) |
| 121 | `ai-referral-maximizer-pro` | AI Referral Maximizer Pro | external | user-apps | user-apps | `https://referrals.smartcrm.vip` | [runtime-status](#ai-referral-maximizer-pro) |
| 122 | `ai-sales-maximizer` | AI Sales Maximizer | external | user-apps | user-apps | `https://salesmax.smartcrm.vip` | [runtime-status](#ai-sales-maximizer) |
| 123 | `ai-screenrecorder` | AI Screen Recorder | external | user-apps | user-apps | `https://ai-screenrecorder.videoremix.vip` | [runtime-status](#ai-screenrecorder) |
| 124 | `ai-signature` | AI Signature | external | user-apps | user-apps | `https://ai-signature.videoremix.vip` | [runtime-status](#ai-signature) |
| 125 | `ai-skills-monetizer` | AI Skills & Resume | external | user-apps | user-apps | `https://ai-skills.videoremix.vip` | [runtime-status](#ai-skills-monetizer) |
| 126 | `ai-video-editor` | AI Video Editor | external | user-apps | user-apps | `https://ai-videoeditor.videoremix.vip` | [runtime-status](#ai-video-editor) |
| 127 | `funnelcraft-ai` | FunnelCraft AI | external | user-apps | user-apps | `https://ai-funnelcraft.videoremix.vip` | [runtime-status](#funnelcraft-ai) |
| 128 | `sales-assistant-app` | Sales Assistant Pro | external | user-apps | user-apps | `https://ai-salesassistant.videoremix.vip` | [runtime-status](#sales-assistant-app) |
| 129 | `sales-page-builder` | Sales Page Builder | external | user-apps | user-apps | `https://ai-salespage.videoremix.vip` | [runtime-status](#sales-page-builder) |
| 130 | `smartcrmcloser-pro` | Smart CRM Closer Pro | external | user-apps | user-apps | `https://smartcrmcloser.netlify.app` | [runtime-status](#smartcrmcloser-pro) |
