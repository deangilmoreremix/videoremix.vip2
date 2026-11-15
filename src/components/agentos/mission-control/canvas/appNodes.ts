// src/components/agentos/mission-control/canvas/appNodes.ts
//
// The apps on the Mission Control canvas.
//
// An app appears when something in the workforce uses it:
//   * an agent whose allowed apps name it   (agent → app, "can run")
//   * a mission with a step that runs it      (mission → app, "step N")
//   * a schedule that runs it                 (shown on the node: "every …")
//
// App nodes are derived from those rows every time and are not stored in
// agentos.canvas_nodes, so they always match what the agents and missions
// really use. An agent with no allow-list may run every app; drawing all 117
// would bury the board, so such agents get no app edges.

import type { Edge, Node } from "reactflow";
import { getAppMeta } from "../../../../config/appRegistry";
import type { Mission, Schedule, Task, Worker } from "../../../../types/agentos";

export const MAX_APP_NODES = 24;

export interface AppNodeData {
  appSlug: string;
  name: string;
  category: string;
  agentCount: number;
  missionCount: number;
  schedules: string[];
  running: boolean;
}

function appSlugOf(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const step = (input as Record<string, unknown>).app_step;
  if (typeof step !== "object" || step === null) return null;
  const slug = (step as Record<string, unknown>).app_slug;
  return typeof slug === "string" && slug ? slug : null;
}

export function buildAppLayer(params: {
  workers: Worker[];
  missions: Mission[];
  tasks: Task[];
  schedules: Schedule[];
  /** Ids of the worker and mission nodes on the board, to draw edges to. */
  nodeIds: Set<string>;
  /** Where the app column starts. */
  origin?: { x: number; y: number };
}): { nodes: Node<AppNodeData>[]; edges: Edge[] } {
  const usage = new Map<string, AppNodeData & { order: number }>();
  const edges: Edge[] = [];
  let order = 0;

  const touch = (slug: string): (AppNodeData & { order: number }) | null => {
    const meta = getAppMeta(slug);
    if (!meta) return null;
    let entry = usage.get(slug);
    if (!entry) {
      entry = {
        appSlug: slug,
        name: meta.name,
        category: meta.category,
        agentCount: 0,
        missionCount: 0,
        schedules: [],
        running: false,
        order: order++,
      };
      usage.set(slug, entry);
    }
    return entry;
  };

  for (const worker of params.workers) {
    const allowed = worker.permissions?.allowed_app_slugs ?? [];
    for (const slug of allowed) {
      const entry = touch(slug);
      if (!entry) continue;
      entry.agentCount += 1;
      const source = `worker:${worker.id}`;
      if (params.nodeIds.has(source)) {
        edges.push({
          id: `edge:${source}->app:${slug}`,
          source,
          target: `app:${slug}`,
          type: "mission",
          label: "can run",
          data: { edge_kind: "assignment", animated: false },
          animated: false,
        });
      }
    }
  }

  const missionIds = new Set(params.missions.map((mission) => mission.id));
  const stepsByMission = new Map<string, Task[]>();
  for (const task of params.tasks) {
    if (!task.mission_id || !missionIds.has(task.mission_id) || !appSlugOf(task.input)) continue;
    const list = stepsByMission.get(task.mission_id) ?? [];
    list.push(task);
    stepsByMission.set(task.mission_id, list);
  }
  for (const [missionId, steps] of stepsByMission) {
    const seen = new Set<string>();
    for (const task of steps) {
      const slug = appSlugOf(task.input) as string;
      const entry = touch(slug);
      if (!entry) continue;
      if (task.status === "running") entry.running = true;
      if (seen.has(slug)) continue;
      seen.add(slug);
      entry.missionCount += 1;
      const source = `mission:${missionId}`;
      if (params.nodeIds.has(source)) {
        const running = task.status === "running";
        edges.push({
          id: `edge:${source}->app:${slug}`,
          source,
          target: `app:${slug}`,
          type: "mission",
          label: task.title.split(".")[0] ? `step ${task.title.split(".")[0]}` : "step",
          data: { edge_kind: "handoff", animated: running },
          animated: running,
        });
      }
    }
  }

  for (const schedule of params.schedules) {
    const slug = appSlugOf(schedule.input);
    if (!slug || !schedule.enabled) continue;
    const entry = touch(slug);
    if (entry) entry.schedules.push(schedule.cron);
  }

  const origin = params.origin ?? { x: -420, y: 400 };
  const kept = [...usage.values()].sort((a, b) => a.order - b.order).slice(0, MAX_APP_NODES);
  const keptSlugs = new Set(kept.map((entry) => entry.appSlug));

  const nodes: Node<AppNodeData>[] = kept.map((entry, index) => {
    const { order: _order, ...data } = entry;
    return {
      id: `app:${entry.appSlug}`,
      type: "app",
      // Rows of four under the agents and missions, so the apps stay in the
      // middle of the board and clear of the inspector on the right.
      position: { x: origin.x + (index % 4) * 260, y: origin.y + Math.floor(index / 4) * 150 },
      data,
    };
  });

  return {
    nodes,
    edges: edges.filter((edge) => keptSlugs.has(edge.target.slice("app:".length))),
  };
}
