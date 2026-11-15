import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Array<{ name: string; body: any }> = [];
let nextId = 0;

vi.mock("../../src/utils/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async (name: string, { body }: { body: any }) => {
        calls.push({ name, body });
        return { data: { data: { task: { id: `task-${++nextId}`, title: body.task?.title } } }, error: null };
      }),
    },
  },
}));

vi.mock("../../src/services/agentos/missions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/services/agentos/missions")>();
  return {
    ...actual,
    createMission: vi.fn(async (input: any) => ({ data: { id: "mission-1", title: input.title }, error: null })),
  };
});

import { APP_CATALOG_BY_SLUG } from "../../supabase/functions/_shared/app-catalog";
import {
  APP_MISSION_TEMPLATES,
  createAppMission,
  validateAppMission,
} from "../../src/services/agentos/appMissions";

describe("app missions", () => {
  beforeEach(() => {
    calls.length = 0;
    nextId = 0;
  });

  it("templates only use real apps", () => {
    for (const template of APP_MISSION_TEMPLATES) {
      expect(template.steps.length).toBeGreaterThan(1);
      for (const step of template.steps) expect(APP_CATALOG_BY_SLUG.has(step.app_slug)).toBe(true);
    }
  });

  it("explains what is missing", () => {
    expect(validateAppMission("", [{ app_slug: "ai-journalist-agent", request: "x" }])).toMatch(/name/);
    expect(validateAppMission("M", [])).toMatch(/at least one step/);
    expect(validateAppMission("M", [{ app_slug: "", request: "x" }])).toMatch(/step 1/);
    expect(validateAppMission("M", [{ app_slug: "nope", request: "x" }])).toMatch(/not an app/);
    expect(validateAppMission("M", [{ app_slug: "ai-journalist-agent", request: " " }])).toMatch(/step 1 what to do/);
  });

  it("creates each step in the mission, chained to the one before", async () => {
    const result = await createAppMission({
      title: "Research to posts",
      steps: [
        { app_slug: "ai-deep-research-agent", request: "Research EV batteries" },
        { app_slug: "ai-journalist-agent", request: "Write an article" },
        { app_slug: "ai-social-media-news-and-podcast-agent", request: "" },
      ],
    });
    expect(result.error).toBeNull();
    const tasks = calls.filter((call) => call.name === "agentos-tasks").map((call) => call.body.task);
    expect(tasks).toHaveLength(3);
    expect(tasks.map((task) => task.mission_id)).toEqual(["mission-1", "mission-1", "mission-1"]);
    expect(tasks.map((task) => task.depends_on)).toEqual([[], ["task-1"], ["task-2"]]);
    expect(tasks[0].input).toEqual({ app_step: { app_slug: "ai-deep-research-agent", request: "Research EV batteries" } });
    expect(tasks[1].title).toBe("2. AI Journalist Agent");
  });
});
