// src/components/landing/landingData.ts
//
// Catalog helpers for the public landing page. The apps themselves come from
// the single catalog (config/appRegistry), which holds the Awesome LLM Apps
// collection (github.com/Shubhamsaboo/awesome-llm-apps) converted to run here.

import { APP_REGISTRY, type AppMeta } from "../../config/appRegistry";

export interface GroupInfo {
  key: string;
  label: string;
  emoji: string;
  glyph: string;
}

/** The catalog groups, in the order the awesome-llm-apps README lists them. */
export const GROUPS: GroupInfo[] = [
  { key: "agent-skills", label: "Agent Skills", emoji: "🧩", glyph: "◈" },
  { key: "ai-browser-tools", label: "Standalone Apps & Tools", emoji: "🛠️", glyph: "⌁" },
  { key: "starter-ai-agents", label: "Starter AI Agents", emoji: "🌱", glyph: "◎" },
  { key: "advanced-ai-agents", label: "Advanced AI Agents", emoji: "🚀", glyph: "⬡" },
  { key: "always-on-agents", label: "Always-on Agents", emoji: "🛰️", glyph: "◉" },
  { key: "multi-agent-teams", label: "Multi-agent Teams", emoji: "🤝", glyph: "▦" },
  { key: "voice-ai-agents", label: "Voice AI Agents", emoji: "🗣️", glyph: "≋" },
  { key: "generative-ui-agents", label: "Generative UI", emoji: "🖼️", glyph: "▣" },
  { key: "autonomous-game-playing-agents", label: "Game-Playing Agents", emoji: "🎮", glyph: "♜" },
  { key: "mcp-ai-agents", label: "MCP AI Agents", emoji: "♾️", glyph: "∞" },
  { key: "rag-tutorials", label: "RAG", emoji: "📀", glyph: "◐" },
  { key: "llm-apps-memory", label: "LLM Apps with Memory", emoji: "💾", glyph: "◫" },
  { key: "chat-with-x", label: "Chat with X", emoji: "💬", glyph: "◌" },
  { key: "llm-optimization-tools", label: "LLM Optimization", emoji: "🎯", glyph: "◇" },
  { key: "llm-finetuning", label: "LLM Fine-tuning", emoji: "🔧", glyph: "⚙" },
  { key: "ai-agent-framework-crash-course", label: "Framework Crash Courses", emoji: "🧑‍🏫", glyph: "▤" },
];

/** Accent color (r g b) per group, from the landing palette. Used by AppPoster. */
const GOLD = "255 208 131";
const AMBER = "240 173 67";
const RED = "228 22 54";
const PURPLE = "138 49 216";
const MAGENTA = "226 69 126";
export const GROUP_ACCENT: Record<string, [string, string]> = {
  "agent-skills": [GOLD, PURPLE],
  "ai-browser-tools": [AMBER, MAGENTA],
  "starter-ai-agents": [AMBER, RED],
  "advanced-ai-agents": [GOLD, RED],
  "always-on-agents": [AMBER, PURPLE],
  "multi-agent-teams": [MAGENTA, PURPLE],
  "voice-ai-agents": [PURPLE, MAGENTA],
  "generative-ui-agents": [GOLD, MAGENTA],
  "autonomous-game-playing-agents": [RED, AMBER],
  "mcp-ai-agents": [AMBER, PURPLE],
  "rag-tutorials": [GOLD, AMBER],
  "llm-apps-memory": [PURPLE, AMBER],
  "chat-with-x": [MAGENTA, GOLD],
  "llm-optimization-tools": [AMBER, RED],
  "llm-finetuning": [RED, PURPLE],
  "ai-agent-framework-crash-course": [GOLD, PURPLE],
};

const GROUP_BY_KEY = new Map(GROUPS.map((g) => [g.key, g]));

export function groupInfo(key: string): GroupInfo {
  return GROUP_BY_KEY.get(key) ?? { key, label: key, emoji: "✦", glyph: "✦" };
}

/** Every Awesome LLM app in the catalog, sorted by README group order. */
export const LANDING_APPS: AppMeta[] = APP_REGISTRY.filter((app) => app.family === "awesome-llm").sort(
  (a, b) => GROUPS.findIndex((g) => g.key === a.group) - GROUPS.findIndex((g) => g.key === b.group),
);

export const LANDING_APP_COUNT = LANDING_APPS.length;

export function countInGroup(group: string): number {
  return LANDING_APPS.filter((app) => app.group === group).length;
}

/** Groups that actually hold apps, so a chip never filters to nothing. */
export const ACTIVE_GROUPS = GROUPS.filter((g) => countInGroup(g.key) > 0);


/**
 * Apps whose real screenshots come from the upstream awesome-llm-apps repo
 * (docs/gallery and per-app assets), copied to public/landing/upstream/.
 */
const UPSTREAM_IMAGE_SLUGS = new Set([
  "project-graveyard",
  "self-improving-agent-skills",
  "advisor-orchestrator-worker",
  "ai-fraud-investigation-agent",
  "ai-home-renovation-agent",
  "insurance-claim-live-agent-team",
  "always-on-hacker-news-briefing-agent",
]);

/** True when the app has a real upstream screenshot. */
export function hasUpstreamImage(slug: string): boolean {
  return UPSTREAM_IMAGE_SLUGS.has(slug);
}

/**
 * The image for an app's card: the upstream screenshot where there is one,
 * otherwise a screenshot of the app's own screen (public/landing/apps/).
 * Callers fall back to an AppPoster if the file fails to load. The catalog's
 * Supabase thumbnail URLs are dead (404), so they are never used here.
 */
export function resolveAppImage(app: AppMeta): string | null {
  return UPSTREAM_IMAGE_SLUGS.has(app.slug) ? `/landing/upstream/${app.slug}.webp` : `/landing/apps/${app.slug}.webp`;
}

/** Apps for the decorative collages: real screenshots first, then the rest. */
export const THUMBNAIL_APPS: AppMeta[] = [
  ...LANDING_APPS.filter((app) => hasUpstreamImage(app.slug)),
  ...LANDING_APPS.filter((app) => !hasUpstreamImage(app.slug)),
];

/** Search an AI assistant for VideoRemix: the "Explore with AI" tiles. */
export const EXPLORE_PROMPT =
  "Explain what VideoRemix VIP (videoremix.vip) is: an app library of ready-to-run AI agents and LLM apps. What can I do with it and who is it for?";
