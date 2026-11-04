// src/config/appTargets.ts
//
// Where a catalog app opens. Shared by the dashboard App Library and the
// public landing page, so a card opens the same place from either surface.

import type { AppMeta } from "./appRegistry";
import { AGENT_PAGE_SLUGS } from "./agentRegistry";

/** Where an app opens from inside the dashboard. */
export function dashboardAppTarget(app: AppMeta): { kind: "route" | "external"; destination: string } {
  if (app.family === "external") {
    const destination = app.externalUrl || app.url;
    if (destination) return { kind: "external", destination };
  }
  if (AGENT_PAGE_SLUGS.has(app.slug)) {
    return { kind: "route", destination: `/dashboard/agents/${app.slug}` };
  }
  return { kind: "route", destination: `/dashboard/apps/${app.slug}` };
}
