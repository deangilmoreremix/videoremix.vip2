// src/config/appScreens.ts
//
// Which screen an Awesome LLM app opens in the dashboard:
//   "agent-page"  its own React agent page, at /dashboard/agents/:slug
//   "converted"   its converted React page, at /dashboard/apps/:slug
//   "upstream"    UpstreamAppPage, drawing upstream's screen, at /dashboard/apps/:slug
// A React page is used only when it matches upstream (the audit verdict
// "keep", scripts/conversion/audit-upstream-ui.ts); every other app opens the
// upstream screen.

import { AGENT_PAGE_SLUGS } from "./agentRegistry";
import { CONVERTED_APP_PAGES } from "./convertedAppPages";
import { UPSTREAM_AUDIT } from "./upstreamAudit.generated";

export type AppScreen = "agent-page" | "converted" | "upstream";

export function appScreen(slug: string): AppScreen {
  const kept = UPSTREAM_AUDIT[slug] === "keep";
  if (kept && AGENT_PAGE_SLUGS.has(slug)) return "agent-page";
  if (kept && CONVERTED_APP_PAGES[slug]) return "converted";
  return "upstream";
}

/** Where the app opens inside the dashboard. */
export function dashboardAppPath(slug: string): string {
  return appScreen(slug) === "agent-page" ? `/dashboard/agents/${slug}` : `/dashboard/apps/${slug}`;
}
