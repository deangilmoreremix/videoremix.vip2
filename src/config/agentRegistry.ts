import { rawAppsData } from "../data/appsData";

export type AgentLaunchKind = "agent-page" | "ai-runner";

export interface AgentMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
  group: string;
  image?: string;
  launchKind: AgentLaunchKind;
}

/**
 * Agent experiences that already have a concrete /agents/:id page.
 *
 * The broader imported agent source contains additional projects that are not
 * wired to a working route yet. Keeping the runnable set explicit prevents the
 * dashboard from advertising broken experiences.
 */
export const AGENT_PAGE_SLUGS = new Set<string>([
  "self-improving-agent-skills",
  "mixture-of-agents",
  "ai-home-renovation-agent",
  "ai-vc-due-diligence-agent-team",
  "research-agent-gemini-interaction-api",
  "ai-consultant-agent",
  "ai-investment-agent",
  "ai-self-evolving-agent",
  "ai-sales-intelligence-agent-team",
  "ai-travel-planner-agent-team",
  "notion-mcp-agent",
  "multi-mcp-agent-router",
  "gemini-agentic-rag",
  "vision-rag",
  "rag-failure-diagnostics-clinic",
  "llama3-stateful-chat",
  "toonify-token-optimization",
]);

/**
 * Imported agent experiences already accepted by the existing AI runner.
 * Agent pages take precedence when a slug exists in both sets.
 */
export const AI_RUNNER_AGENT_SLUGS = new Set<string>([
  "ai-blog-to-podcast-agent",
  "mixture-of-agents",
  "ai-home-renovation-agent",
  "ai-vc-due-diligence-agent-team",
  "ai-consultant-agent",
  "ai-investment-agent",
  "earnings-call-analyst-agent",
  "ai-self-evolving-agent",
  "ai-sales-intelligence-agent-team",
  "ai-finance-agent-team",
  "ai-travel-planner-agent-team",
  "insurance-claim-live-agent-team",
  "generative-ui-starter-project",
  "ai-dashboard-canvas-agent",
  "ai-mcp-app-builder",
  "mcp-apps-generative-ui-showcase",
  "ai-shadcn-component-generator",
  "notion-mcp-agent",
  "local-hybrid-search-rag",
  "multimodal-agentic-rag",
  "local-rag-agent",
  "vision-rag",
  "rag-failure-diagnostics-clinic",
  "llama3-stateful-chat",
  "headroom-context-optimization",
  "google-adk-crash-course",
]);

const runnableAgentSlugs = new Set<string>([
  ...AGENT_PAGE_SLUGS,
  ...AI_RUNNER_AGENT_SLUGS,
]);

export const AGENT_SOURCE_COUNT = rawAppsData.length;

export const AGENT_REGISTRY: AgentMeta[] = rawAppsData
  .filter((app) => runnableAgentSlugs.has(app.id))
  .map((app) => ({
    slug: app.id,
    name: app.name,
    description: app.description,
    category: app.category,
    group: app.group,
    image: app.image,
    launchKind: AGENT_PAGE_SLUGS.has(app.id) ? "agent-page" : "ai-runner",
  }));

export const STAGED_AGENT_COUNT = Math.max(
  0,
  AGENT_SOURCE_COUNT - AGENT_REGISTRY.length,
);

export function getAgentLaunchPath(agent: AgentMeta): string {
  return agent.launchKind === "agent-page"
    ? `/agents/${agent.slug}`
    : `/ai-runner/${agent.slug}`;
}
