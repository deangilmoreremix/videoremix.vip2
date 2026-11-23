import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CATEGORIES, searchApps } from "../src/config/appCategories";
import { APP_REGISTRY } from "../src/config/appRegistry";
import { friendlyRunError } from "../src/lib/userApiKeys";
import { AGENTOS_NAV, AGENTOS_NAV_SECTIONS } from "../src/components/agentos/mission-control/navigation";

describe("apps-first home", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
    Object.defineProperty(window, "localStorage", { value: globalThis.localStorage, configurable: true });
  });

  it("the categories cover all 117 Awesome LLM apps, with readable names", () => {
    const total = APP_CATEGORIES.reduce((sum, category) => sum + category.count, 0);
    expect(total).toBe(APP_REGISTRY.filter((app) => app.family === "awesome-llm").length);
    expect(total).toBe(117);
    for (const category of APP_CATEGORIES) expect(category.label).not.toMatch(/^[a-z]+(-[a-z]+)+$/);
    expect(APP_CATEGORIES.find((category) => category.id === "rag-tutorials")?.label).toBe("RAG");
  });

  it("search finds apps by name and by what they do", () => {
    expect(searchApps("podcast").map((app) => app.slug)).toContain("ai-blog-to-podcast-agent");
    expect(searchApps("chat pdf").map((app) => app.slug)).toContain("chat-with-pdf-gpt-llama3");
    expect(searchApps("")).toEqual([]);
    expect(searchApps("a", 5)).toHaveLength(5);
  });

  it("remembers the recent apps, newest first, without duplicates", async () => {
    const { getRecentApps, recordRecentApp, RECENT_APPS_LIMIT, hasRunAnApp, markAppRun } = await import(
      "../src/lib/recentApps"
    );
    for (const slug of ["a", "b", "c", "a", "d", "e", "f", "g"]) recordRecentApp(slug);
    expect(getRecentApps()).toEqual(["g", "f", "e", "d", "a", "c"]);
    expect(getRecentApps()).toHaveLength(RECENT_APPS_LIMIT);
    expect(hasRunAnApp()).toBe(false);
    markAppRun();
    expect(hasRunAnApp()).toBe(true);
  });

  it("explains key problems in plain words", () => {
    expect(friendlyRunError("OpenAI error 401: Incorrect API key provided")).toMatch(/didn't accept your key/);
    expect(friendlyRunError('{"code":"insufficient_quota"}')).toMatch(/out of credit/);
    expect(friendlyRunError("Rate limit reached (429)")).toMatch(/limiting/);
    expect(friendlyRunError("Something else")).toBe("Something else");
  });

  it("puts the apps first in the menu", () => {
    expect(AGENTOS_NAV_SECTIONS[0].id).toBe("apps");
    expect(AGENTOS_NAV.filter((link) => link.section === "apps").map((link) => link.label)).toEqual([
      "Home",
      "App Library",
      "My Apps",
    ]);
    expect(AGENTOS_NAV.filter((link) => link.rail).map((link) => link.label)).toEqual([
      "Home",
      "App Library",
      "Agents",
      "Missions",
      "Settings",
    ]);
  });
});
