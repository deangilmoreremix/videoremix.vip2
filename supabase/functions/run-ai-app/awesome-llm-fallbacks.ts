// Generated from src/data/appsData.ts.
// These are the 117 customer-facing Awesome LLM product identities.
// The shared Responses API runner uses this metadata only when a product does not
// already have a specialized APP_CONFIGS entry.

export interface AwesomeLlmFallbackMeta {
  name: string;
  description: string;
  category: string;
}

export const AWESOME_LLM_FALLBACKS: Record<string, AwesomeLlmFallbackMeta> = {
  "project-graveyard": {
    "name": "Project Graveyard",
    "description": "Finds every side project you abandoned, tells you why each one died, and helps you finish the one worth going back to.",
    "category": "agent-skills"
  },
  "first-reader": {
    "name": "First Reader",
    "description": "Simulates real readers going through your draft and reports where they lose interest, where they stop reading, and what they remember afterward, without rewriting a word.",
    "category": "agent-skills"
  },
  "scope-creep-detector": {
    "name": "Scope Creep Detector",
    "description": "Checks whether a diff grew beyond its stated intent and recommends what to keep, split, or justify.",
    "category": "agent-skills"
  },
  "commit-archaeologist": {
    "name": "Commit Archaeologist",
    "description": "Reconstructs why a file or code region exists from its introducing commit, later edits, co-changes, and intent clues.",
    "category": "agent-skills"
  },
  "dependency-doctor": {
    "name": "Dependency Doctor",
    "description": "Checks a dependency manifest for standard-library pins, obsolete backports, unpinned entries, duplicate constraints, and yanked releases.",
    "category": "agent-skills"
  },
  "advisor-orchestrator-worker": {
    "name": "Advisor Orchestrator Worker",
    "description": "Meta Loop with Claude Fable 5.1 as advisor, GPT-6 Astra as orchestrator, and Gemini 3.8 Flash as worker.",
    "category": "agent-skills"
  },
  "thinking-out-loud": {
    "name": "Thinking Out Loud",
    "description": "Echoes a voice ramble back as a scannable brief, with the model's guesses quarantined and your reversals flagged.",
    "category": "agent-skills"
  },
  "self-improving-agent-skills": {
    "name": "Self-Improving Agent Skills",
    "description": "Automatically optimize agent skills using Gemini and ADK.",
    "category": "agent-skills"
  },
  "ai-blog-to-podcast-agent": {
    "name": "AI Blog to Podcast Agent",
    "description": "Turn any blog URL into a narrated podcast episode.",
    "category": "starter-ai-agents"
  },
  "ai-breakup-recovery-agent": {
    "name": "AI Breakup Recovery Agent",
    "description": "An agent team that talks you through the post-breakup spiral.",
    "category": "starter-ai-agents"
  },
  "ai-data-analysis-agent": {
    "name": "AI Data Analysis Agent",
    "description": "Ask questions of any CSV or Excel file in plain English.",
    "category": "starter-ai-agents"
  },
  "ai-medical-imaging-agent": {
    "name": "AI Medical Imaging Agent",
    "description": "Diagnostic analysis of X-rays and scans with Gemini.",
    "category": "starter-ai-agents"
  },
  "ai-meme-generator-agent-browser": {
    "name": "AI Meme Generator Agent (Browser)",
    "description": "Makes memes by driving a real browser, not an image API.",
    "category": "starter-ai-agents"
  },
  "ai-music-generator-agent": {
    "name": "AI Music Generator Agent",
    "description": "Prompt in, MP3 track out.",
    "category": "starter-ai-agents"
  },
  "ai-travel-agent-local-cloud": {
    "name": "AI Travel Agent (Local & Cloud)",
    "description": "Personalized day-by-day travel itineraries.",
    "category": "starter-ai-agents"
  },
  "ai-x402-paying-agent": {
    "name": "AI x402 Paying Agent",
    "description": "An agent with a wallet that pays per-call for the data it needs — no API keys.",
    "category": "starter-ai-agents"
  },
  "gemini-multimodal-agent": {
    "name": "Gemini Multimodal Agent",
    "description": "Video analysis plus web search in one agent.",
    "category": "starter-ai-agents"
  },
  "mixture-of-agents": {
    "name": "Mixture of Agents",
    "description": "Multiple LLMs answer, one aggregates the best response.",
    "category": "starter-ai-agents"
  },
  "xai-finance-agent": {
    "name": "xAI Finance Agent",
    "description": "Real-time stock analysis powered by Grok.",
    "category": "starter-ai-agents"
  },
  "openai-research-agent": {
    "name": "OpenAI Research Agent",
    "description": "Multi-agent topic research with the OpenAI Agents SDK.",
    "category": "starter-ai-agents"
  },
  "web-scraping-ai-agent": {
    "name": "Web Scraping AI Agent",
    "description": "Describe what to extract and the agent scrapes it.",
    "category": "starter-ai-agents"
  },
  "ai-home-renovation-agent": {
    "name": "AI Home Renovation Agent with Nano Banana Pro",
    "description": "Photos of your space in, renovation plan and photorealistic renders out.",
    "category": "advanced-ai-agents"
  },
  "devpulse-ai": {
    "name": "DevPulse AI - Multi-Agent Signal Intelligence",
    "description": "Aggregates and scores technical signals into a daily intelligence digest.",
    "category": "advanced-ai-agents"
  },
  "ai-deep-research-agent": {
    "name": "AI Deep Research Agent",
    "description": "Comprehensive web research with the OpenAI Agents SDK and Firecrawl.",
    "category": "advanced-ai-agents"
  },
  "ai-vc-due-diligence-agent-team": {
    "name": "AI VC Due Diligence Agent Team",
    "description": "Multi-agent startup investment analysis with Gemini 3.",
    "category": "advanced-ai-agents"
  },
  "research-agent-gemini-interaction-api": {
    "name": "AI Research Planner & Executor (Google Interactions API)",
    "description": "Multi-phase research with stateful conversations and auto-generated infographics.",
    "category": "advanced-ai-agents"
  },
  "ai-consultant-agent": {
    "name": "AI Consultant Agent",
    "description": "Market analysis and strategy recommendations with live web research.",
    "category": "advanced-ai-agents"
  },
  "ai-system-architect-agent": {
    "name": "AI System Architect Agent",
    "description": "Architecture reviews using DeepSeek R1 reasoning plus Claude.",
    "category": "advanced-ai-agents"
  },
  "ai-financial-coach-agent": {
    "name": "AI Financial Coach Agent",
    "description": "Personalized budget, debt, and savings analysis.",
    "category": "advanced-ai-agents"
  },
  "ai-movie-production-agent": {
    "name": "AI Movie Production Agent",
    "description": "Script drafts and casting ideas from a one-line movie concept.",
    "category": "advanced-ai-agents"
  },
  "ai-investment-agent": {
    "name": "AI Investment Agent",
    "description": "Stock comparison reports built on Yahoo Finance data.",
    "category": "advanced-ai-agents"
  },
  "earnings-call-analyst-agent": {
    "name": "Earnings Call Analyst Agent",
    "description": "Turns YouTube earnings calls into a playback-synced analyst workspace.",
    "category": "advanced-ai-agents"
  },
  "ai-health-fitness-agent": {
    "name": "AI Health & Fitness Agent",
    "description": "Tailored diet and workout plans from your goals.",
    "category": "advanced-ai-agents"
  },
  "ai-product-launch-intelligence-agent": {
    "name": "AI Product Launch Intelligence Agent",
    "description": "Go-to-market intelligence on competitor launches.",
    "category": "advanced-ai-agents"
  },
  "ai-fraud-investigation-agent": {
    "name": "AI Fraud Investigation Agent",
    "description": "Cross-references public records to flag facilities that don't add up.",
    "category": "advanced-ai-agents"
  },
  "ai-journalist-agent": {
    "name": "AI Journalist Agent",
    "description": "Researches, writes, and edits articles on any topic.",
    "category": "advanced-ai-agents"
  },
  "ai-mental-wellbeing-agent": {
    "name": "AI Mental Wellbeing Agent",
    "description": "A coordinated agent team for mental health support plans.",
    "category": "advanced-ai-agents"
  },
  "ai-meeting-agent": {
    "name": "AI Meeting Agent",
    "description": "Context, industry insights, and strategy briefs before you walk in.",
    "category": "advanced-ai-agents"
  },
  "ai-self-evolving-agent": {
    "name": "AI Self-Evolving Agent",
    "description": "Agents that rewrite their own workflows with EvoAgentX.",
    "category": "advanced-ai-agents"
  },
  "ai-sales-intelligence-agent-team": {
    "name": "AI Sales Intelligence Agent Team",
    "description": "Generates competitive sales battle cards in real time.",
    "category": "advanced-ai-agents"
  },
  "ai-social-media-news-and-podcast-agent": {
    "name": "AI Social Media News and Podcast Agent",
    "description": "Curates your trusted sources into briefs and generated podcasts.",
    "category": "advanced-ai-agents"
  },
  "trust-gated-multi-agent-research-team": {
    "name": "Trust-Gated Multi-Agent Research Team",
    "description": "Every agent verified, every action in a hash-chained audit trail.",
    "category": "advanced-ai-agents"
  },
  "always-on-hacker-news-briefing-agent": {
    "name": "Always-on Hacker News Briefing Agent",
    "description": "A scheduled scout that ships a ranked daily brief to Slack or email.",
    "category": "always-on-agents"
  },
  "release-radar-agent": {
    "name": "Release Radar Agent",
    "description": "Watches dependency releases and briefs you on breaking, deprecated, security, and major-version changes.",
    "category": "always-on-agents"
  },
  "ai-competitor-intelligence-agent-team": {
    "name": "AI Competitor Intelligence Agent Team",
    "description": "Structured competitor teardowns built from their own websites.",
    "category": "multi-agent-teams"
  },
  "ai-finance-agent-team": {
    "name": "AI Finance Agent Team",
    "description": "A financial analyst team in 20 lines of Python.",
    "category": "multi-agent-teams"
  },
  "ai-game-design-agent-team": {
    "name": "AI Game Design Agent Team",
    "description": "Full game concepts from a swarm of design specialists.",
    "category": "multi-agent-teams"
  },
  "ag2-adaptive-research-team": {
    "name": "AG2 Adaptive Research Team",
    "description": "Agent teamwork with routing and fallback, built on AG2.",
    "category": "multi-agent-teams"
  },
  "ai-legal-agent-team-cloud-local": {
    "name": "AI Legal Agent Team (Cloud & Local)",
    "description": "Research, contract analysis, and strategy from a full legal bench.",
    "category": "multi-agent-teams"
  },
  "ai-recruitment-agent-team": {
    "name": "AI Recruitment Agent Team",
    "description": "Resume screening to interview scheduling, end to end.",
    "category": "multi-agent-teams"
  },
  "ai-real-estate-agent-team": {
    "name": "AI Real Estate Agent Team",
    "description": "Property search, market analysis, and recommendations.",
    "category": "multi-agent-teams"
  },
  "ai-services-agency-crewai": {
    "name": "AI Services Agency (CrewAI)",
    "description": "A digital agency that scopes and plans your software project.",
    "category": "multi-agent-teams"
  },
  "ai-teaching-agent-team": {
    "name": "AI Teaching Agent Team",
    "description": "A faculty of agents that builds your complete learning path.",
    "category": "multi-agent-teams"
  },
  "multimodal-coding-agent-team": {
    "name": "Multimodal Coding Agent Team",
    "description": "Snap a photo of a coding problem, get a sandboxed solution.",
    "category": "multi-agent-teams"
  },
  "multimodal-design-agent-team": {
    "name": "Multimodal Design Agent Team",
    "description": "Design critiques from a Gemini-powered expert panel.",
    "category": "multi-agent-teams"
  },
  "multimodal-ui-ux-feedback-agent-team": {
    "name": "Multimodal UI/UX Feedback Agent Team",
    "description": "Landing page feedback plus an auto-generated improved version.",
    "category": "multi-agent-teams"
  },
  "ai-travel-planner-agent-team": {
    "name": "AI Travel Planner Agent Team",
    "description": "A complete trip itinerary, crafted by a team.",
    "category": "multi-agent-teams"
  },
  "llm-panel-agent-team": {
    "name": "LLM Panel Agent Team",
    "description": "Three vendors review the same diff blind, then argue it out anonymously.",
    "category": "multi-agent-teams"
  },
  "ai-audio-tour-agent": {
    "name": "AI Audio Tour Agent",
    "description": "Self-guided audio tours from your location, interests, and pace.",
    "category": "voice-ai-agents"
  },
  "customer-support-voice-agent": {
    "name": "Customer Support Voice Agent",
    "description": "Voice answers grounded in your own docs.",
    "category": "voice-ai-agents"
  },
  "insurance-claim-live-agent-team": {
    "name": "Insurance Claim Live Agent Team",
    "description": "Voice claim intake on Gemini 3.8 Live that writes a field notebook, looks at damage through the webcam, and sketches the incident.",
    "category": "voice-ai-agents"
  },
  "voice-rag-agent-openai-sdk": {
    "name": "Voice RAG Agent (OpenAI SDK)",
    "description": "Ask your PDFs questions, hear the answers.",
    "category": "voice-ai-agents"
  },
  "generative-ui-starter-project": {
    "name": "Generative UI Starter Project",
    "description": "A chat-driven kanban board you and the agent work together.",
    "category": "generative-ui-agents"
  },
  "ai-dashboard-canvas-agent": {
    "name": "AI Dashboard Canvas Agent",
    "description": "Describe a dashboard in chat, charts assemble on a live canvas.",
    "category": "generative-ui-agents"
  },
  "ai-mcp-app-builder": {
    "name": "AI MCP App Builder",
    "description": "Describe an MCP app, get a live sandboxed instance back.",
    "category": "generative-ui-agents"
  },
  "mcp-apps-generative-ui-showcase": {
    "name": "MCP Apps Generative UI Showcase",
    "description": "MCP apps that render real interactive UI, flight search included.",
    "category": "generative-ui-agents"
  },
  "ai-shadcn-component-generator": {
    "name": "AI Shadcn Component Generator",
    "description": "Chat your way to production-ready shadcn components.",
    "category": "generative-ui-agents"
  },
  "ai-3d-pygame-agent": {
    "name": "AI 3D Pygame Agent",
    "description": "DeepSeek R1 writes PyGame code, browser agents run it live.",
    "category": "autonomous-game-playing-agents"
  },
  "ai-chess-agent": {
    "name": "AI Chess Agent",
    "description": "Agent White vs Agent Black with validated moves.",
    "category": "autonomous-game-playing-agents"
  },
  "ai-tic-tac-toe-agent": {
    "name": "AI Tic-Tac-Toe Agent",
    "description": "Two different LLMs battle it out, move by move.",
    "category": "autonomous-game-playing-agents"
  },
  "browser-mcp-agent": {
    "name": "Browser MCP Agent",
    "description": "Drive a real browser with natural language over MCP.",
    "category": "mcp-ai-agents"
  },
  "github-mcp-agent": {
    "name": "GitHub MCP Agent",
    "description": "Explore and analyze any repo in plain English.",
    "category": "mcp-ai-agents"
  },
  "notion-mcp-agent": {
    "name": "Notion MCP Agent",
    "description": "Talk to your Notion pages from the terminal.",
    "category": "mcp-ai-agents"
  },
  "ai-travel-planner-mcp-agent": {
    "name": "AI Travel Planner MCP Agent",
    "description": "Itineraries built on live Airbnb and Google Maps data.",
    "category": "mcp-ai-agents"
  },
  "multi-mcp-agent-router": {
    "name": "Multi-MCP Agent Router",
    "description": "Specialist agents, each wired to its own MCP server.",
    "category": "mcp-ai-agents"
  },
  "openai-remote-mcp-tool-bridge": {
    "name": "OpenAI Remote MCP Tool Bridge",
    "description": "Connect OpenAI function calling directly to a remote MCP server.",
    "category": "mcp-ai-agents"
  },
  "agentic-rag-with-embedding-gemma": {
    "name": "Agentic RAG with Embedding Gemma",
    "description": "Fully local agentic RAG with EmbeddingGemma and Llama 3.2.",
    "category": "rag-tutorials"
  },
  "agentic-rag-with-reasoning": {
    "name": "Agentic RAG with Reasoning",
    "description": "Watch the agent's step-by-step reasoning as it retrieves.",
    "category": "rag-tutorials"
  },
  "ai-blog-search-rag": {
    "name": "AI Blog Search (RAG)",
    "description": "Agentic search over blog content, built on LangGraph.",
    "category": "rag-tutorials"
  },
  "autonomous-rag": {
    "name": "Autonomous RAG",
    "description": "GPT-4o answers from your PDFs, falls back to web search.",
    "category": "rag-tutorials"
  },
  "contextual-ai-rag-agent": {
    "name": "Contextual AI RAG Agent",
    "description": "Managed RAG: datastore to grounded chat in minutes.",
    "category": "rag-tutorials"
  },
  "corrective-rag-crag": {
    "name": "Corrective RAG (CRAG)",
    "description": "Retrieval that grades itself and retries before answering.",
    "category": "rag-tutorials"
  },
  "typed-agentic-rag-with-pydantic-ai": {
    "name": "Typed Agentic RAG with Pydantic AI",
    "description": "Validated answers with exact citations, or a refusal when evidence is weak.",
    "category": "rag-tutorials"
  },
  "deepseek-local-rag-agent": {
    "name": "Deepseek Local RAG Agent",
    "description": "Local DeepSeek reasoning over your own documents.",
    "category": "rag-tutorials"
  },
  "gemini-agentic-rag": {
    "name": "Gemini Agentic RAG",
    "description": "Query rewriting and web fallback with Gemini Flash Thinking.",
    "category": "rag-tutorials"
  },
  "hybrid-search-rag-cloud": {
    "name": "Hybrid Search RAG (Cloud)",
    "description": "Keyword plus vector search feeding Claude.",
    "category": "rag-tutorials"
  },
  "llama-3-1-local-rag": {
    "name": "Llama 3.1 Local RAG",
    "description": "Chat with any webpage, fully offline.",
    "category": "rag-tutorials"
  },
  "local-hybrid-search-rag": {
    "name": "Local Hybrid Search RAG",
    "description": "Hybrid search with everything running on your machine.",
    "category": "rag-tutorials"
  },
  "multimodal-agentic-rag": {
    "name": "Multimodal Agentic RAG",
    "description": "Text, PDFs, images, audio, and video, answered with citations.",
    "category": "rag-tutorials"
  },
  "local-rag-agent": {
    "name": "Local RAG Agent",
    "description": "Llama 3.2 and Qdrant, no API keys required.",
    "category": "rag-tutorials"
  },
  "rag-as-a-service": {
    "name": "RAG-as-a-Service",
    "description": "A production RAG service in under 50 lines.",
    "category": "rag-tutorials"
  },
  "rag-agent-with-cohere": {
    "name": "RAG Agent with Cohere",
    "description": "Command R7B retrieval with web-search fallback.",
    "category": "rag-tutorials"
  },
  "basic-rag-chain": {
    "name": "Basic RAG Chain",
    "description": "The minimal retrieval pipeline, applied to pharma research.",
    "category": "rag-tutorials"
  },
  "rag-with-database-routing": {
    "name": "RAG with Database Routing",
    "description": "Routes each question to the right database automatically.",
    "category": "rag-tutorials"
  },
  "vision-rag": {
    "name": "Vision RAG",
    "description": "Ask questions about images and PDF pages with Embed-4.",
    "category": "rag-tutorials"
  },
  "rag-failure-diagnostics-clinic": {
    "name": "RAG Failure Diagnostics Clinic",
    "description": "Find out why your RAG pipeline is wrong, systematically.",
    "category": "rag-tutorials"
  },
  "knowledge-graph-rag-with-citations": {
    "name": "Knowledge Graph RAG with Citations",
    "description": "Multi-hop answers with verifiable source attribution.",
    "category": "rag-tutorials"
  },
  "needle-a-new-way-to-find": {
    "name": "Needle - A New Way to Find",
    "description": "Search webpages by meaning and highlight the strongest source sentence, using a Chrome extension powered by TypeSafe Jev.",
    "category": "ai-browser-tools"
  },
  "ripple-change-one-thing-find-what-else-needs-to-change": {
    "name": "Ripple - Change One Thing, Find What Else Needs to Change",
    "description": "Find related inconsistencies and suggested fixes as you edit a Google Doc, using TypeSafe Jev and Gemini.",
    "category": "ai-browser-tools"
  },
  "ai-arxiv-agent-with-memory": {
    "name": "AI ArXiv Agent with Memory",
    "description": "Paper search that remembers your research interests.",
    "category": "llm-apps-memory"
  },
  "ai-travel-agent-with-memory": {
    "name": "AI Travel Agent with Memory",
    "description": "A travel assistant that remembers your preferences.",
    "category": "llm-apps-memory"
  },
  "llama3-stateful-chat": {
    "name": "Llama3 Stateful Chat",
    "description": "Session-persistent chat with Llama 3.",
    "category": "llm-apps-memory"
  },
  "llm-app-with-personalized-memory": {
    "name": "LLM App with Personalized Memory",
    "description": "A chatbot that keeps context across conversations.",
    "category": "llm-apps-memory"
  },
  "local-chatgpt-clone-with-memory": {
    "name": "Local ChatGPT Clone with Memory",
    "description": "Fully local, with a personal memory per user.",
    "category": "llm-apps-memory"
  },
  "multi-llm-application-with-shared-memory": {
    "name": "Multi-LLM Application with Shared Memory",
    "description": "Different models, one shared conversation memory.",
    "category": "llm-apps-memory"
  },
  "chat-with-github-gpt-llama3": {
    "name": "Chat with GitHub (GPT & Llama3)",
    "description": "Any repo, answered in 30 lines of RAG.",
    "category": "chat-with-x"
  },
  "chat-with-gmail": {
    "name": "Chat with Gmail",
    "description": "Ask your inbox questions.",
    "category": "chat-with-x"
  },
  "chat-with-pdf-gpt-llama3": {
    "name": "Chat with PDF (GPT & Llama3)",
    "description": "The classic, in 30 lines of Python.",
    "category": "chat-with-x"
  },
  "chat-with-research-papers-arxiv-gpt-llama3": {
    "name": "Chat with Research Papers (ArXiv) (GPT & Llama3)",
    "description": "Explore arXiv conversationally with GPT-4o.",
    "category": "chat-with-x"
  },
  "chat-with-substack": {
    "name": "Chat with Substack",
    "description": "Chat with any newsletter's archive.",
    "category": "chat-with-x"
  },
  "chat-with-youtube-videos": {
    "name": "Chat with YouTube Videos",
    "description": "Ask videos questions via their transcripts.",
    "category": "chat-with-x"
  },
  "toonify-token-optimization": {
    "name": "Toonify Token Optimization",
    "description": "Reduce LLM API costs by 30-60% using TOON format.",
    "category": "llm-optimization-tools"
  },
  "headroom-context-optimization": {
    "name": "Headroom Context Optimization",
    "description": "Reduce LLM API costs by 50-90%.",
    "category": "llm-optimization-tools"
  },
  "gemma-3-fine-tuning": {
    "name": "Gemma 3 Fine-tuning",
    "description": "4-bit LoRA with Unsloth, small and readable.",
    "category": "llm-finetuning"
  },
  "llama-3-2-fine-tuning": {
    "name": "Llama 3.2 Fine-tuning",
    "description": "Fine-tune in 30 lines, free on Colab.",
    "category": "llm-finetuning"
  },
  "google-adk-crash-course": {
    "name": "Google ADK Crash Course",
    "description": "Starter agent, structured outputs, tools (built-in, function, third-party, MCP), memory, callbacks, plugins, and multi-agent patterns. Model-agnostic.",
    "category": "ai-agent-framework-crash-course"
  },
  "openai-agents-sdk-crash-course": {
    "name": "OpenAI Agents SDK Crash Course",
    "description": "Starter agent, function calling, structured outputs, tools, memory, evaluation, handoffs, swarm orchestration, and routing logic.",
    "category": "ai-agent-framework-crash-course"
  }
};

export function getAwesomeLlmFallbackMeta(slug: string): AwesomeLlmFallbackMeta | null {
  return AWESOME_LLM_FALLBACKS[slug] || null;
}
