// Converted Awesome LLM apps whose tuned config is registered under their
// pre-rebrand slug, keyed by the customer-facing slug the app library sends.
// Apps with their own agent page are not listed: they never use the runner.
//
// The browser resolves the same apps to their converted UI
// (CONVERTED_APP_ALIASES in src/components/ai/apps/registry.ts), so the UI and
// this config stay paired. Deno cannot import from src/, so the map is copied
// here; tests/converted-app-aliases.test.ts keeps the two identical.

export const CONVERTED_APP_ALIASES: Readonly<Record<string, string>> = {
  "ai-blog-to-podcast-agent": "blog-to-podcast-ai",
  "ai-competitor-intelligence-agent-team": "competitor-spy-ai",
  "ai-music-generator-agent": "ai-music-idea-generator",
  "ai-movie-production-agent": "ai-film-producer",
  "customer-support-voice-agent": "ai-voice-support-agent",
  "ai-audio-tour-agent": "ai-audio-guide-creator",
  "ai-recruitment-agent-team": "ai-hiring-assistant",
  "ai-finance-agent-team": "business-finance-ai-team",
  "ai-financial-coach-agent": "profit-coach-ai",
  "ai-data-analysis-agent": "revenue-data-analyst-ai",
  "ai-legal-agent-team-cloud-local": "legal-pdf-explainer",
  "ai-fraud-investigation-agent": "fraud-investigation-assistant",
  "ai-mcp-app-builder": "ai-app-builder-assistant",
  "ai-dashboard-canvas-agent": "dashboard-designer-ai",
  "ai-deep-research-agent": "deep-research-pro",
  "multi-llm-application-with-shared-memory": "multi-ai-memory-hub",
  "local-chatgpt-clone-with-memory": "private-chatgpt-clone",
  "browser-mcp-agent": "browser-task-agent",
  "ai-real-estate-agent-team": "real-estate-marketing-ai",
  "ai-travel-agent-with-memory": "travel-concierge-ai",
  "chat-with-pdf-gpt-llama3": "pdf-business-assistant",
  "chat-with-research-papers-arxiv-gpt-llama3": "research-paper-assistant",
  "chat-with-gmail": "gmail-intelligence-ai",
  "ai-blog-search-rag": "blog-knowledge-search-ai",
  "multimodal-agentic-rag": "multimodal-knowledge-ai",
};
