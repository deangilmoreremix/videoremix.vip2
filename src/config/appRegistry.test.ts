import { describe, expect, it } from "vitest";
import {
  APP_REGISTRY,
  AWESOME_LLM_APP_COUNT,
  VIDEOREMIX_EXTRA_APP_COUNT,
  TOTAL_APP_COUNT,
} from "./appRegistry";

describe("SapienX app registry invariants", () => {
  it("contains exactly 117 Awesome LLM products and 13 VideoRemix extras", () => {
    expect(AWESOME_LLM_APP_COUNT).toBe(117);
    expect(VIDEOREMIX_EXTRA_APP_COUNT).toBe(13);
    expect(TOTAL_APP_COUNT).toBe(130);
    expect(APP_REGISTRY).toHaveLength(130);
  });

  it("contains 130 unique customer-facing slugs", () => {
    const slugs = APP_REGISTRY.map((app) => app.slug);
    expect(new Set(slugs).size).toBe(130);
  });

  it("keeps Awesome LLM and VideoRemix products as the only customer-facing families", () => {
    expect(APP_REGISTRY.filter((app) => app.family === "awesome-llm")).toHaveLength(117);
    expect(APP_REGISTRY.filter((app) => app.family === "external")).toHaveLength(13);
  });

  it("does not expose legacy canonical runner aliases as additional products", () => {
    const slugs = new Set(APP_REGISTRY.map((app) => app.slug));

    // These are historical implementation aliases, not additional customer products.
    expect(slugs.has("deep-research-pro")).toBe(false);
    expect(slugs.has("profit-coach-ai")).toBe(false);
    expect(slugs.has("local-business-analytics-ai")).toBe(false);

    // Their current Awesome LLM product identities remain present.
    expect(slugs.has("ai-deep-research-agent")).toBe(true);
    expect(slugs.has("ai-financial-coach-agent")).toBe(true);
    expect(slugs.has("ai-data-analysis-agent")).toBe(true);
  });
});
