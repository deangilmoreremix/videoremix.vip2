import { describe, it, expect } from "vitest";
import { getAppLaunchTarget } from "./appLaunch";
import type { AppMeta } from "../config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../config/agentRegistry";
import { APP_REGISTRY } from "../config/appRegistry";

describe("getAppLaunchTarget", () => {
  it("routes external VideoRemix apps to their external URL", () => {
    const app: AppMeta = {
      slug: "funnelcraft-ai",
      name: "FunnelCraft AI",
      description: "FunnelCraft AI",
      category: "user-apps",
      group: "user-apps",
      family: "external",
      externalUrl: "https://ai-funnelcraft.videoremix.vip",
      url: "https://ai-funnelcraft.videoremix.vip",
    };

    expect(getAppLaunchTarget(app)).toEqual({
      kind: "external",
      destination: "https://ai-funnelcraft.videoremix.vip",
    });
  });

  it("routes verified dedicated React products to /agents/:slug", () => {
    const slug = "ai-consultant-agent";
    const app: AppMeta = {
      slug,
      name: "AI Consultant Agent",
      description: "AI Consultant Agent",
      category: "agents",
      group: "agents",
      family: "awesome-llm",
    };

    expect(getAppLaunchTarget(app)).toEqual({
      kind: "route",
      destination: `/agents/${slug}`,
    });
  });

  it("routes shared-runner Awesome LLM products to /ai-runner/:slug", () => {
    const app: AppMeta = {
      slug: "project-graveyard",
      name: "Project Graveyard",
      description: "Project Graveyard",
      category: "agents",
      group: "agents",
      family: "awesome-llm",
    };

    expect(getAppLaunchTarget(app)).toEqual({
      kind: "route",
      destination: "/ai-runner/project-graveyard",
    });
  });

  it("does not route Awesome LLM apps to unrelated legacy aliases", () => {
    const app: AppMeta = {
      slug: "ai-deep-research-agent",
      name: "AI Deep Research Agent",
      description: "AI Deep Research Agent",
      category: "agents",
      group: "agents",
      family: "awesome-llm",
    };

    const target = getAppLaunchTarget(app);
    expect(target.destination).not.toBe("/ai-design-studio/ai-deep-research-agent");
    expect(target.destination).not.toBe("/ai-router-ai-design-studio");
    expect(target.destination).toMatch(/^\/(agents|ai-runner)\/ai-deep-research-agent$/);
  });

  it("uses a verified AGENT_PAGE_SLUGS source, not all historical route aliases", () => {
    const sourceIds = new Set(
      APP_REGISTRY.filter((app) => app.family === "awesome-llm").map((app) => app.slug),
    );

    const historicalAliases = [
      "ai-design-studio",
      "ai-router-ai-design-studio",
      "sales-monetizer",
      "landing-page",
      "local-business-voice-assistant",
    ];

    for (const alias of historicalAliases) {
      const app: AppMeta = {
        slug: alias,
        name: alias,
        description: alias,
        category: "agents",
        group: "agents",
        family: "awesome-llm",
      };

      const target = getAppLaunchTarget(app);
      if (AGENT_PAGE_SLUGS.has(alias)) {
        expect(target.destination).toBe(`/agents/${alias}`);
      } else {
        expect(target.destination).toBe(`/ai-runner/${alias}`);
      }
    }
  });
});
