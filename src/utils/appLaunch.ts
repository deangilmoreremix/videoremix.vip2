import type { AppMeta } from "../config/appRegistry";

export type AppLaunchTarget =
  | { kind: "route"; destination: string }
  | { kind: "external"; destination: string };

export function getAppLaunchTarget(app: AppMeta): AppLaunchTarget {
  if (app.family === "external") {
    const destination = app.externalUrl || app.url;
    if (destination) {
      return { kind: "external", destination };
    }
  }

  return {
    kind: "route",
    destination: `/ai-runner/${app.slug}`,
  };
}
