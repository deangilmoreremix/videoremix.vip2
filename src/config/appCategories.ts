// src/config/appCategories.ts
//
// The Awesome LLM app categories, named like the sections of the upstream
// repository (github.com/Shubhamsaboo/awesome-llm-apps), with their counts.

import { APP_REGISTRY } from "./appRegistry";

const LABELS: Record<string, string> = {
  "starter-ai-agents": "Starter AI Agents",
  "advanced-ai-agents": "Advanced AI Agents",
  "multi-agent-teams": "Multi-agent Teams",
  "rag-tutorials": "RAG",
  "agent-skills": "Agent Skills",
  "mcp-ai-agents": "MCP Agents",
  "llm-apps-memory": "LLM Apps with Memory",
  "chat-with-x": "Chat with X",
  "generative-ui-agents": "Generative UI Agents",
  "voice-ai-agents": "Voice Agents",
  "autonomous-game-playing-agents": "Game-playing Agents",
  "always-on-agents": "Always-on Agents",
  "ai-browser-tools": "Browser Tools",
  "llm-optimization-tools": "LLM Optimization",
  "llm-finetuning": "Fine-tuning",
  "ai-agent-framework-crash-course": "Framework Crash Courses",
};

export interface AppCategory {
  id: string;
  label: string;
  count: number;
}

export function categoryLabel(id: string): string {
  return LABELS[id] ?? id.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Every category that has Awesome LLM apps, largest first. */
export const APP_CATEGORIES: AppCategory[] = (() => {
  const counts = new Map<string, number>();
  for (const app of APP_REGISTRY) {
    if (app.family !== "awesome-llm") continue;
    counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: categoryLabel(id), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
})();

/** Search the Awesome LLM apps by name, description and category. */
export function searchApps(query: string, limit = 8) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const words = needle.split(/\s+/);
  return APP_REGISTRY.filter((app) => app.family === "awesome-llm")
    .map((app) => {
      const name = app.name.toLowerCase();
      const haystack = `${name} ${app.description.toLowerCase()} ${categoryLabel(app.category).toLowerCase()}`;
      if (!words.every((word) => haystack.includes(word))) return null;
      const score = (name.includes(needle) ? 2 : 0) + (name.startsWith(needle) ? 1 : 0);
      return { app, score };
    })
    .filter((entry): entry is { app: (typeof APP_REGISTRY)[number]; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.app.name.localeCompare(b.app.name))
    .slice(0, limit)
    .map((entry) => entry.app);
}
