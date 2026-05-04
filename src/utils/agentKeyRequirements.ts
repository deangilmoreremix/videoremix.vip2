/**
 * Agent API Key Requirements
 *
 * Defines which API keys are required for each agent.
 * Maps agent slugs to their required key configurations.
 */

// Canonical API key types supported by the system
export type ApiKeyType =
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "GOOGLE_GENERATIVE_AI_KEY"
  | "EXA_API_KEY"
  | "FIRECRAWL_API_KEY"
  | "TOGETHER_API_KEY"
  | "XAI_GROK_API_KEY"
  | "COHERE_API_KEY"
  | "RAGIE_API_KEY"
  | "E2B_API_KEY";

// Human-readable label for each key type
export const API_KEY_LABELS: Record<ApiKeyType, string> = {
  OPENAI_API_KEY: "OpenAI API Key",
  ANTHROPIC_API_KEY: "Anthropic API Key",
  GOOGLE_GENERATIVE_AI_KEY: "Google Generative AI Key",
  EXA_API_KEY: "Exa API Key",
  FIRECRAWL_API_KEY: "Firecrawl API Key",
  TOGETHER_API_KEY: "Together AI API Key",
  XAI_GROK_API_KEY: "xAI (Grok) API Key",
  COHERE_API_KEY: "Cohere API Key",
  RAGIE_API_KEY: "Ragie API Key",
  E2B_API_KEY: "E2B API Key",
};

// Description of what each key is used for
export const API_KEY_DESCRIPTIONS: Record<ApiKeyType, string> = {
  OPENAI_API_KEY: "Used for GPT-4, GPT-3.5, and other OpenAI models",
  ANTHROPIC_API_KEY: "Used for Claude and other Anthropic models",
  GOOGLE_GENERATIVE_AI_KEY: "Used for Gemini and other Google AI models",
  EXA_API_KEY: "Used for AI-powered search and web research",
  FIRECRAWL_API_KEY: "Used for web scraping and data extraction",
  TOGETHER_API_KEY: "Used for Together AI hosted open-source models",
  XAI_GROK_API_KEY: "Used for xAI's Grok model",
  COHERE_API_KEY: "Used for Cohere's language models and embeddings",
  RAGIE_API_KEY: "Used for Ragie RAG-as-a-service",
  E2B_API_KEY: "Used for E2B cloud sandbox execution",
};

// Aggregate all supported key types
export const ALL_API_KEY_TYPES: ApiKeyType[] = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_GENERATIVE_AI_KEY",
  "EXA_API_KEY",
  "FIRECRAWL_API_KEY",
  "TOGETHER_API_KEY",
  "XAI_GROK_API_KEY",
  "COHERE_API_KEY",
  "RAGIE_API_KEY",
  "E2B_API_KEY",
];

// Mapping from agent slug to required API key types
// Derived from analyzing form fields across all agent pages
export const AGENT_KEY_REQUIREMENTS: Record<string, ApiKeyType[]> = {
  // OpenAI-based agents
  "ai-deep-research-agent": ["OPENAI_API_KEY", "FIRECRAWL_API_KEY"],
  "ai-email-gtm-reachout-agent": ["OPENAI_API_KEY"],
  "ai-startup-insight-fire1-agent": ["OPENAI_API_KEY", "FIRECRAWL_API_KEY"],
  "openai-research-agent": ["OPENAI_API_KEY"],
  "product-launch-intelligence-agent": ["OPENAI_API_KEY", "FIRECRAWL_API_KEY"],
  "rag-database-routing": ["OPENAI_API_KEY"],
  "multi-agent-researcher": ["OPENAI_API_KEY"],
  "llm-app-personized-memory": ["OPENAI_API_KEY"],
  "cursor-ai-experiments": ["OPENAI_API_KEY"],

  // Anthropic-based agents
  "rag-as-a-service": ["ANTHROPIC_API_KEY", "RAGIE_API_KEY"],
     "multi-ai-memory": ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
  "corrective-rag": ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],

  // Google/Gemini agents
  "gemini-agentic-rag": ["GOOGLE_GENERATIVE_AI_KEY"],
  "vision-rag": ["GOOGLE_GENERATIVE_AI_KEY"],
  "research-agent-gemini-interaction-api": ["GOOGLE_GENERATIVE_AI_KEY"],
  "rag-chain": ["GOOGLE_GENERATIVE_AI_KEY"],
  "multimodal-design-agent-team": ["GOOGLE_GENERATIVE_AI_KEY"],

  // Multimodal coding with multiple keys
  "multimodal-coding-agent-team": ["OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_KEY", "E2B_API_KEY"],

  // Together AI
  "mixture-of-agents": ["TOGETHER_API_KEY"],

  // xAI Grok
  "xai-finance-agent": ["OPENAI_API_KEY", "XAI_GROK_API_KEY"],

  // Voice & RAG with Qdrant
  "voice-rag-openaisdk": ["OPENAI_API_KEY", "COHERE_API_KEY"],

  // Web scraping / Firecrawl
  "web-scraping-agent": ["FIRECRAWL_API_KEY"],
  "customer-support-voice-agent": ["OPENAI_API_KEY", "FIRECRAWL_API_KEY"],

  // Travel with Google Maps
  "ai-travel-planner-mcp-agent-team": ["OPENAI_API_KEY"],

  // Teaching agent with multiple integrations
  "ai-teaching-agent-team": ["OPENAI_API_KEY"],

  // GitHub MCP
  "github-mcp-agent": ["OPENAI_API_KEY"],

  // Default fallback for agents without explicit requirements
  // They will use a minimal set
  "default": ["OPENAI_API_KEY"],
};

/**
 * Get required API key types for a given agent slug
 */
export function getRequiredKeysForAgent(agentSlug: string): ApiKeyType[] {
  const slug = agentSlug.toLowerCase();
  return AGENT_KEY_REQUIREMENTS[slug] || AGENT_KEY_REQUIREMENTS["default"] || [];
}

/**
 * Check if an agent requires a specific API key type
 */
export function doesAgentRequireKey(agentSlug: string, keyType: ApiKeyType): boolean {
  const requiredKeys = getRequiredKeysForAgent(agentSlug);
  return requiredKeys.includes(keyType);
}

/**
 * Get all agents that require a specific API key
 */
export function getAgentsRequiringKey(keyType: ApiKeyType): string[] {
  return Object.entries(AGENT_KEY_REQUIREMENTS)
    .filter(([, keys]) => keys.includes(keyType))
    .map(([slug]) => slug);
}
