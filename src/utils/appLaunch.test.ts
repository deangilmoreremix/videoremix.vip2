import { describe, expect, it } from "vitest";
import type { AppMeta } from "../config/appRegistry";
import { getAppLaunchTarget } from "./appLaunch";

const awesomeApp = (slug: string): AppMeta => ({
  slug,
  name: slug,
  description: "test",
  category: "test",
  group: "test",
  family: "awesome-llm",
  source: "awesome-llm",
});

describe("getAppLaunchTarget", () => {
  it("opens additional VideoRemix apps externally", () => {
    const app: AppMeta = {
      slug: "funnelcraft-ai",
      name: "FunnelCraft AI",
      description: "test",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      source: "user",
      externalUrl: "https://ai-funnelcraft.videoremix.vip",
    };

    expect(getAppLaunchTarget(app)).toEqual({
      kind: "external",
      destination: "https://ai-funnelcraft.videoremix.vip",
    });
  });

  it("routes a verified dedicated React product to /agents/:slug", () => {
    expect(getAppLaunchTarget(awesomeApp("ai-consultant-agent"))).toEqual({
      kind: "route",
      destination: "/agents/ai-consultant-agent",
    });
  });

  it("routes non-dedicated Awesome LLM products to the shared runner", () => {
    expect(getAppLaunchTarget(awesomeApp("project-graveyard"))).toEqual({
      kind: "route",
      destination: "/ai-runner/project-graveyard",
    });
  });

  it("does not route a known legacy alias as the source product", () => {
    expect(getAppLaunchTarget(awesomeApp("ai-deep-research-agent"))).toEqual({
      kind: "route",
      destination: "/ai-runner/ai-deep-research-agent",
    });
  });
});
