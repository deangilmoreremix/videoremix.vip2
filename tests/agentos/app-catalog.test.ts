// The agent runtime's app catalog matches the dashboard's, and the
// videoremix_apps tool offers exactly the apps an agent may run.
import { describe, expect, it } from "vitest";
import { APP_REGISTRY } from "../../src/config/appRegistry";
import { APP_CATALOG } from "../../supabase/functions/_shared/app-catalog";
import {
  allowedCatalogApps,
  buildAppsToolSpec,
  closestCatalogSlugs,
  isCatalogApp,
  unknownAppMessage,
} from "../../supabase/functions/_shared/app-catalog-tool";

const awesome = APP_REGISTRY.filter((app) => app.family === "awesome-llm");

describe("agent app catalog", () => {
  it("has every Awesome LLM app the dashboard shows (run scripts/agentos/generate-app-catalog.ts)", () => {
    expect(APP_CATALOG.map((app) => app.slug).sort()).toEqual(awesome.map((app) => app.slug).sort());
    expect(APP_CATALOG).toHaveLength(117);
  });

  it("offers all 117 apps to an agent with no allow-list", () => {
    expect(allowedCatalogApps(undefined)).toHaveLength(117);
    expect(allowedCatalogApps([])).toHaveLength(117);
    const spec = buildAppsToolSpec([]);
    const slug = (spec.parameters as any).properties.app_slug;
    expect(slug.enum).toHaveLength(117);
  });

  it("offers exactly the allowed apps", () => {
    const allowed = [awesome[0].slug, awesome[5].slug, awesome[9].slug];
    const spec = buildAppsToolSpec(allowed);
    const slug = (spec.parameters as any).properties.app_slug;
    expect(slug.enum.sort()).toEqual([...allowed].sort());
    for (const app of allowed) expect(spec.description).toContain(app);
    expect(spec.description).not.toContain(awesome[1].slug + ":");
  });

  it("refuses an unknown slug and suggests close matches", () => {
    expect(isCatalogApp("ai-blog-to-podcast-agent")).toBe(true);
    expect(isCatalogApp("blog-podcast")).toBe(false);
    expect(closestCatalogSlugs("blog-podcast")).toContain("ai-blog-to-podcast-agent");
    expect(unknownAppMessage("blog-podcast")).toMatch(/Did you mean: .*ai-blog-to-podcast-agent/);
    expect(unknownAppMessage("zz")).toBe("zz is not a VideoRemix app.");
  });
});
