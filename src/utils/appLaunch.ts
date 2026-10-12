import type { AppMeta } from "../config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../config/agentRegistry";

export type AppLaunchTarget =
  | { kind: "route"; destination: string }
  | { kind: "external"; destination: string };

/**
 * Normalize a slug for alias lookups: trim, lowercase, and treat underscores
 * and hyphens as equivalent. Upstream catalog ids use underscores
 * (e.g. `chat_with_github`) while registry slugs use hyphens.
 */
export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Legacy slug aliases (37 entries) mapping historical purchase/bundle slugs
 * and upstream catalog ids onto canonical registry slugs.
 *
 * Sources of legacy slugs:
 *   - `src/data/bundleData.ts` — the 12 legacy category bundles reference 101
 *     pre-rebrand slugs; purchases are seeded from these slugs, so access
 *     checks must resolve them back to canonical registry slugs.
 *   - `src/data/github_app_catalog.json` — the upstream Awesome-LLM snapshot
 *     captured at commit 4bf51ab; renamed upstream ids resolve here.
 *   - `src/data/enhancedAppsData.ts` — legacy VideoRemix storefront slugs.
 *
 * Invariants (enforced by `src/utils/appLaunch.test.ts`):
 *   - Many-to-one: multiple legacy slugs may resolve to one canonical slug.
 *   - No alias key may equal a canonical registry slug (after normalization).
 *   - No alias value may itself be an alias key (no alias chains).
 *   - Every alias value must exist in the customer-facing registry.
 */
export const LEGACY_SLUG_ALIASES: Record<string, string> = {
  // --- Legacy bundle slugs (src/data/bundleData.ts) ---
  "blog-to-podcast-ai": "ai-blog-to-podcast-agent",
  "ai-sales-intelligence-pro": "ai-sales-intelligence-agent-team",
  "competitor-spy-ai": "ai-competitor-intelligence-agent-team",
  "ai-music-idea-generator": "ai-music-generator-agent",
  "ai-music-jingle-assistant": "ai-music-generator-agent",
  "ai-film-producer": "ai-movie-production-agent",
  "ai-voice-support-agent": "customer-support-voice-agent",
  "ai-audio-guide-creator": "ai-audio-tour-agent",
  "local-tour-guide-ai": "ai-audio-tour-agent",
  "ai-hiring-assistant": "ai-recruitment-agent-team",
  "business-finance-ai-team": "ai-finance-agent-team",
  "profit-coach-ai": "ai-financial-coach-agent",
  "investment-research-assistant": "ai-investment-agent",
  "startup-due-diligence-ai": "ai-vc-due-diligence-agent-team",
  "revenue-data-analyst-ai": "ai-data-analysis-agent",
  "legal-pdf-explainer": "ai-legal-agent-team-cloud-local",
  "fraud-investigation-assistant": "ai-fraud-investigation-agent",
  "ai-app-builder-assistant": "ai-mcp-app-builder",
  "dashboard-designer-ai": "ai-dashboard-canvas-agent",
  "deep-research-pro": "ai-deep-research-agent",
  "research-planner-ai": "research-agent-gemini-interaction-api",
  "multi-ai-memory-hub": "multi-llm-application-with-shared-memory",
  "private-chatgpt-clone": "local-chatgpt-clone-with-memory",
  "browser-task-agent": "browser-mcp-agent",
  "ai-tool-router": "multi-mcp-agent-router",
  "notion-workspace-ai": "notion-mcp-agent",
  "travel-planner-ai": "ai-travel-planner-agent-team",
  "home-renovation-visualizer-ai": "ai-home-renovation-agent",
  "real-estate-marketing-ai": "ai-real-estate-agent-team",
  "travel-concierge-ai": "ai-travel-agent-with-memory",
  "pdf-business-assistant": "chat-with-pdf-gpt-llama3",
  "research-paper-assistant": "chat-with-research-papers-arxiv-gpt-llama3",
  "gmail-intelligence-ai": "chat-with-gmail",
  "blog-knowledge-search-ai": "ai-blog-search-rag",
  "multimodal-knowledge-ai": "multimodal-agentic-rag",
  // --- Legacy VideoRemix storefront slugs (src/data/enhancedAppsData.ts) ---
  "profile-gen": "ai-profilegen",
  // --- Renamed upstream catalog ids (underscored, 4bf51ab snapshot) ---
  chat_with_github: "chat-with-github-gpt-llama3",
};

const LEGACY_ALIAS_LOOKUP: Map<string, string> = new Map(
  Object.entries(LEGACY_SLUG_ALIASES).map(([legacySlug, canonicalSlug]) => [
    normalizeSlug(legacySlug),
    canonicalSlug,
  ]),
);

/**
 * Resolve a possibly-legacy slug to its canonical customer-facing slug.
 *
 * Returns `undefined` when the slug is not a known legacy alias (callers fall
 * back to the input slug, which is correct for already-canonical slugs and
 * unknown slugs alike).
 */
export function resolveCanonicalSlug(
  slug: string | null | undefined,
): string | undefined {
  if (!slug) return undefined;
  return LEGACY_ALIAS_LOOKUP.get(normalizeSlug(slug));
}

/**
 * Return the canonical launch destination for one customer-facing product.
 *
 * - Additional VideoRemix apps open their configured external app URL.
 * - Awesome LLM products with a verified dedicated React agent page keep that
 *   richer experience under /agents/:slug.
 * - All other Awesome LLM products launch through the shared SapienX runner.
 *
 * Do not derive launch routing from the legacy 201-entry agentComponents map:
 * that map contains historical aliases and known semantic mismatches.
 */
export function getAppLaunchTarget(app: AppMeta): AppLaunchTarget {
  if (app.family === "external") {
    const destination = app.externalUrl || app.url;
    if (destination) {
      return { kind: "external", destination };
    }
  }

  if (AGENT_PAGE_SLUGS.has(app.slug)) {
    return {
      kind: "route",
      destination: `/agents/${app.slug}`,
    };
  }

  return {
    kind: "route",
    destination: `/ai-runner/${app.slug}`,
  };
}
