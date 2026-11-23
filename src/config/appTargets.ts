// src/config/appTargets.ts
//
// Where a catalog app opens. Shared by the dashboard App Library and the
// public landing page, so a card opens the same place from either surface.
// Which dashboard screen an app uses is decided in config/appScreens.

import type { AppMeta } from "./appRegistry";
import { dashboardAppPath } from "./appScreens";

/** Where an app opens from inside the dashboard. */
export function dashboardAppTarget(app: AppMeta): { kind: "route" | "external"; destination: string } {
  if (app.family === "external") {
    const destination = app.externalUrl || app.url;
    if (destination) return { kind: "external", destination };
  }
  return { kind: "route", destination: dashboardAppPath(app.slug) };
}
