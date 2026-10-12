import { describe, it, expect } from "vitest";
import {
  getAppLaunchTarget,
  LEGACY_SLUG_ALIASES,
  resolveCanonicalSlug,
  normalizeSlug,
} from "./appLaunch";
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

describe("LEGACY_SLUG_ALIASES", () => {
  const registrySlugs = new Set(APP_REGISTRY.map((app) => app.slug));
  const aliasEntries = Object.entries(LEGACY_SLUG_ALIASES);

  it("has 37 legacy alias entries with unique keys", () => {
    expect(aliasEntries).toHaveLength(37);
    expect(new Set(aliasEntries.map(([legacy]) => legacy)).size).toBe(37);
  });

  it("every alias value is a real customer-facing registry slug", () => {
    for (const [legacy, canonical] of aliasEntries) {
      expect(registrySlugs.has(canonical), `${legacy} -> ${canonical}`).toBe(
        true,
      );
    }
  });

  it("no alias key equals a canonical registry slug (after normalization)", () => {
    for (const [legacy] of aliasEntries) {
      expect(registrySlugs.has(normalizeSlug(legacy))).toBe(false);
    }
  });

  it("contains no alias chains (no alias value is itself an alias key)", () => {
    for (const [, canonical] of aliasEntries) {
      expect(LEGACY_SLUG_ALIASES[canonical]).toBeUndefined();
    }
  });

  it("is many-to-one: at least two aliases share a canonical target", () => {
    const counts = new Map<string, number>();
    for (const [, canonical] of aliasEntries) {
      counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
    }
    const shared = [...counts.entries()].filter(([, n]) => n > 1);
    expect(shared.length).toBeGreaterThan(0);
  });
});

describe("resolveCanonicalSlug", () => {
  const registrySlugs = new Set(APP_REGISTRY.map((app) => app.slug));

  it("resolves every legacy alias to its canonical slug", () => {
    for (const [legacy, canonical] of Object.entries(LEGACY_SLUG_ALIASES)) {
      expect(resolveCanonicalSlug(legacy)).toBe(canonical);
    }
  });

  it("resolves legacy bundle purchase slugs to canonical registry slugs", () => {
    expect(resolveCanonicalSlug("blog-to-podcast-ai")).toBe(
      "ai-blog-to-podcast-agent",
    );
    expect(resolveCanonicalSlug("deep-research-pro")).toBe(
      "ai-deep-research-agent",
    );
    expect(resolveCanonicalSlug("profit-coach-ai")).toBe(
      "ai-financial-coach-agent",
    );
  });

  it("normalizes underscores to hyphens (upstream catalog ids)", () => {
    expect(resolveCanonicalSlug("chat_with_github")).toBe(
      "chat-with-github-gpt-llama3",
    );
    expect(resolveCanonicalSlug("CHAT_WITH_GITHUB")).toBe(
      "chat-with-github-gpt-llama3",
    );
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(resolveCanonicalSlug("  Deep-Research-PRO  ")).toBe(
      "ai-deep-research-agent",
    );
  });

  it("returns undefined for already-canonical slugs", () => {
    for (const slug of [
      "ai-deep-research-agent",
      "ai-profilegen",
      "project-graveyard",
    ]) {
      expect(registrySlugs.has(slug)).toBe(true);
      expect(resolveCanonicalSlug(slug)).toBeUndefined();
    }
  });

  it("returns undefined for unknown slugs", () => {
    expect(resolveCanonicalSlug("not-a-real-app-slug")).toBeUndefined();
  });

  it("returns undefined for empty or missing input", () => {
    expect(resolveCanonicalSlug("")).toBeUndefined();
    expect(resolveCanonicalSlug(undefined)).toBeUndefined();
    expect(resolveCanonicalSlug(null)).toBeUndefined();
  });

  it("is idempotent: resolving a resolved slug stays stable", () => {
    for (const [, canonical] of Object.entries(LEGACY_SLUG_ALIASES)) {
      expect(resolveCanonicalSlug(canonical)).toBeUndefined();
    }
  });
});
