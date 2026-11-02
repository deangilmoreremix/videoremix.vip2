// tests/converted-app-pages.test.ts
//
// The React conversions of the awesome-llm-apps open from the App Library.
// Every entry must point at a real page, each page must belong to one app,
// and each page must run as its own app (the runner picks the config by the
// slug the page sends: a page sending another app's slug got that app's
// prompt). No page may call the per-app functions that were never deployed.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const source = readFileSync(join(ROOT, "src/config/convertedAppPages.ts"), "utf8");
const entries = [...source.matchAll(/^ {2}"([a-z0-9-]+)": \(\) => import\("\.\.\/pages\/agents\/(\w+)"\),$/gm)].map(
  (m) => ({ slug: m[1], page: m[2] }),
);

describe("converted app pages", () => {
  it("maps the converted apps", () => {
    expect(entries.length).toBeGreaterThanOrEqual(70);
  });

  it("every entry points at a page that exists, and no page serves two apps", () => {
    for (const { page } of entries) expect(existsSync(join(ROOT, `src/pages/agents/${page}.tsx`)), page).toBe(true);
    const pages = entries.map((entry) => entry.page);
    expect(new Set(pages).size).toBe(pages.length);
  });

  it("every mapped app is in the catalog", async () => {
    const { APP_REGISTRY } = await import("../src/config/appRegistry");
    const catalog = new Set(APP_REGISTRY.filter((app) => app.family === "awesome-llm").map((app) => app.slug));
    expect(entries.filter(({ slug }) => !catalog.has(slug)).map(({ slug }) => slug)).toEqual([]);
  });

  it("each page runs as its own app, through the shared runner", () => {
    for (const { slug, page } of entries) {
      const code = readFileSync(join(ROOT, `src/pages/agents/${page}.tsx`), "utf8");
      const slugs = [...code.matchAll(/runViaRunner\(\s*"([^"]+)"/g)].map((m) => m[1]);
      expect(slugs.length, `${page} never runs`).toBeGreaterThan(0);
      expect(new Set(slugs), page).toEqual(new Set([slug]));
      expect(code, `${page} calls a per-app function`).not.toMatch(/functions\/v1\//);
    }
  });
});
