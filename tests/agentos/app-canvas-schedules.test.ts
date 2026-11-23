import { describe, expect, it } from "vitest";
import { buildAppLayer, MAX_APP_NODES } from "../../src/components/agentos/mission-control/canvas/appNodes";
import { isValidCron } from "../../src/services/agentos/cron";
import { readFileSync } from "node:fs";
import { APP_CATALOG } from "../../supabase/functions/_shared/app-catalog";

const worker = (id: string, apps?: string[]) =>
  ({ id, name: id, permissions: apps ? { allowed_app_slugs: apps } : {} }) as any;
const task = (id: string, mission: string, slug: string, status = "queued", title = "1. X") =>
  ({ id, mission_id: mission, input: { app_step: { app_slug: slug } }, status, title }) as any;

describe("apps on the canvas", () => {
  it("draws the apps agents, missions and schedules use, linked to them", () => {
    const layer = buildAppLayer({
      workers: [worker("w1", ["ai-journalist-agent"]), worker("w2")],
      missions: [{ id: "m1" } as any],
      tasks: [
        task("t1", "m1", "ai-deep-research-agent", "completed", "1. AI Deep Research Agent"),
        task("t2", "m1", "ai-journalist-agent", "running", "2. AI Journalist Agent"),
      ],
      schedules: [{ input: { app_step: { app_slug: "ai-teaching-agent-team" } }, enabled: true, cron: "0 9 * * 1" } as any],
      nodeIds: new Set(["worker:w1", "worker:w2", "mission:m1"]),
    });
    const ids = layer.nodes.map((node) => node.id).sort();
    expect(ids).toEqual(["app:ai-deep-research-agent", "app:ai-journalist-agent", "app:ai-teaching-agent-team"]);
    const journalist = layer.nodes.find((node) => node.id === "app:ai-journalist-agent")!.data;
    expect(journalist).toMatchObject({ agentCount: 1, missionCount: 1, running: true });
    expect(layer.nodes.find((node) => node.id === "app:ai-teaching-agent-team")!.data.schedules).toEqual(["0 9 * * 1"]);
    const edges = layer.edges.map((edge) => `${edge.source}->${edge.target}:${edge.label}`).sort();
    expect(edges).toEqual([
      "mission:m1->app:ai-deep-research-agent:step 1",
      "mission:m1->app:ai-journalist-agent:step 2",
      "worker:w1->app:ai-journalist-agent:can run",
    ]);
    expect(layer.edges.find((edge) => edge.target === "app:ai-journalist-agent" && edge.source === "mission:m1")!.animated).toBe(true);
  });

  it("does not draw every app for an agent with no allow-list, and caps the board", () => {
    expect(buildAppLayer({ workers: [worker("w")], missions: [], tasks: [], schedules: [], nodeIds: new Set() }).nodes).toEqual([]);
    const many = buildAppLayer({
      workers: [worker("w", APP_CATALOG.map((app) => app.slug))],
      missions: [],
      tasks: [],
      schedules: [],
      nodeIds: new Set(["worker:w"]),
    });
    expect(many.nodes).toHaveLength(MAX_APP_NODES);
    expect(many.edges).toHaveLength(MAX_APP_NODES);
  });

  it("schedule presets are valid timings", async () => {
    const source = readFileSync("src/pages/agentos/SchedulesPage.tsx", "utf8");
    const crons = [...source.matchAll(/cron: "([^"]+)" \}/g)].map((match) => match[1]);
    expect(crons.length).toBeGreaterThanOrEqual(5);
    for (const cron of crons) expect(isValidCron(cron)).toBe(true);
  });

  it("the queue lets app steps run without a worker", () => {
    const sql = readFileSync("supabase/migrations/20261115012416_agentos_app_steps_without_worker.sql", "utf8");
    expect(sql).toContain("AND (t.assigned_worker_id IS NOT NULL OR t.input ? 'app_step')");
    expect(sql).toContain("IF v_task.assigned_worker_id IS NULL AND NOT (COALESCE(v_task.input, '{}'::jsonb) ? 'app_step') THEN");
  });
});
