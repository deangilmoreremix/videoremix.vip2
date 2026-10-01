import type { AppMeta } from "../config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../config/agentRegistry";

export type AppLaunchTarget =
  | { kind: "route"; destination: string }
  | { kind: "external"; destination: string };

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
