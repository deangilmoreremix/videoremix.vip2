// tests/converted-app-aliases.test.ts
//
// The converted Awesome LLM apps are still registered under their
// pre-rebrand slugs. The browser (the converted UI) and run-ai-app (the tuned
// config) each resolve the customer-facing slug through an alias map; the two
// maps must be identical, or a converted UI would run with the wrong prompt.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/supabaseClient", () => ({ supabase: {} }));
vi.mock("../src/utils/supabase", () => ({ supabase: {}, supabaseAuth: {}, setClerkTokenGetter: () => undefined }));

const ROOT = join(__dirname, "..");

function serverMap(fn = "run-ai-app"): Record<string, string> {
  const source = readFileSync(join(ROOT, `supabase/functions/${fn}/converted-app-aliases.ts`), "utf8");
  return Object.fromEntries([...source.matchAll(/^ {2}"([a-z0-9-]+)": "([a-z0-9-]+)",$/gm)].map((m) => [m[1], m[2]]));
}

function serverConfigKeys(): Set<string> {
  const source = readFileSync(join(ROOT, "supabase/functions/run-ai-app/app-configs.ts"), "utf8");
  return new Set([...source.matchAll(/^ {2}"([a-z0-9-]+)": \{/gm)].map((m) => m[1]));
}

describe("converted app aliases", () => {
  it("browser and run-ai-app resolve the same apps to the same converted slug", async () => {
    const { CONVERTED_APP_ALIASES } = await import("../src/components/ai/apps/registry");
    expect(serverMap()).toEqual(CONVERTED_APP_ALIASES);
    expect(serverMap("run-ai-app-live")).toEqual(CONVERTED_APP_ALIASES);
    expect(Object.keys(CONVERTED_APP_ALIASES).length).toBe(25);
  });

  it("every aliased app opens its converted UI and has a tuned server config", async () => {
    const { CONVERTED_APP_ALIASES, isAIAppImplemented } = await import("../src/components/ai/apps/registry");
    const configs = serverConfigKeys();
    for (const [canonical, legacy] of Object.entries(CONVERTED_APP_ALIASES)) {
      expect(isAIAppImplemented(canonical), canonical).toBe(true);
      expect(configs.has(legacy), legacy).toBe(true);
    }
  });

  it("every Awesome LLM app in the library has a runnable path", async () => {
    const { APP_REGISTRY } = await import("../src/config/appRegistry");
    const { AGENT_PAGE_SLUGS } = await import("../src/config/agentRegistry");
    const { isInternalAIApp } = await import("../src/config/internalAIApps");
    const awesome = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
    expect(awesome.length).toBe(117);
    const unrunnable = awesome.filter((app) => !AGENT_PAGE_SLUGS.has(app.slug) && !isInternalAIApp(app.slug));
    expect(unrunnable.map((app) => app.slug)).toEqual([]);
  });

  it("the live runner has a config for every Awesome LLM app that opens in the runner", async () => {
    const { APP_REGISTRY } = await import("../src/config/appRegistry");
    const { AGENT_PAGE_SLUGS } = await import("../src/config/agentRegistry");
    const { getAppConfig } = await import("../supabase/functions/run-ai-app-live/app-configs.ts");
    const runner = APP_REGISTRY.filter((app) => app.family === "awesome-llm" && !AGENT_PAGE_SLUGS.has(app.slug));
    expect(runner.length).toBe(100);
    expect(runner.filter((app) => !getAppConfig(app.slug)).map((app) => app.slug)).toEqual([]);
  });

  it("returns the same component for an app on every call, so its form is not remounted", async () => {
    const { getAIAppComponent } = await import("../src/components/ai/apps/registry");
    expect(getAIAppComponent("ai-blog-to-podcast-agent")).toBe(getAIAppComponent("ai-blog-to-podcast-agent"));
  });
});
