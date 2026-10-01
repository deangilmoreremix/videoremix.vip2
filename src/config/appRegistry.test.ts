import { describe, it, expect } from "vitest";
import {
  APP_REGISTRY,
  AWESOME_LLM_APP_COUNT,
  VIDEOREMIX_EXTRA_APP_COUNT,
  TOTAL_APP_COUNT,
} from "./appRegistry";

describe("appRegistry catalog invariants", () => {
  it("has exactly 117 Awesome LLM products", () => {
    expect(AWESOME_LLM_APP_COUNT).toBe(117);
  });

  it("has exactly 13 VideoRemix additional products", () => {
    expect(VIDEOREMIX_EXTRA_APP_COUNT).toBe(13);
  });

  it("has exactly 130 total customer-facing products", () => {
    expect(TOTAL_APP_COUNT).toBe(130);
    expect(APP_REGISTRY.length).toBe(130);
  });

  it("has 130 unique customer-facing slugs", () => {
    const slugs = APP_REGISTRY.map((app) => app.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(130);
  });

  it("has no duplicate customer-facing slugs", () => {
    const slugs = APP_REGISTRY.map((app) => app.slug);
    const unique = new Set(slugs);
    expect(slugs.length).toBe(unique.size);
  });

  it("splits 117 awesome-llm and 13 external products", () => {
    const awesome = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
    const external = APP_REGISTRY.filter((app) => app.family === "external");
    expect(awesome.length).toBe(117);
    expect(external.length).toBe(13);
  });

  it("does not expose legacy renamed aliases as extra customer-facing products", () => {
    const legacyAliases = [
      "deep-research-pro",
      "profit-coach-ai",
      "local-business-analytics-ai",
      "ai-design-studio",
      "ai-router-ai-design-studio",
      "sales-monetizer",
      "landing-page",
    ];

    const slugs = new Set(APP_REGISTRY.map((app) => app.slug));
    for (const alias of legacyAliases) {
      expect(slugs.has(alias)).toBe(false);
    }
  });
});
