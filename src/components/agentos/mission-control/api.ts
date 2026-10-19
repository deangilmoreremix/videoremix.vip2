// src/components/agentos/mission-control/api.ts
//
// Client-side data access for the Mission Control canvas. RLS-gated reads and
// writes only — this module never touches the service-role key and cannot read
// another tenant's rows even if asked to.
//
// Owned by the Mission Control surface. Shaped so the canvas can:
//   * load the user's workspaces, workers, missions, tasks, models and runs
//   * derive a first canvas layout from those rows
//   * persist node positions and edges to agentos.canvas_nodes / canvas_edges

import { agentosDb } from "../../../services/agentos/client";
import type {
  CanvasEdge,
  CanvasNodeKind,
  Mission,
  ModelCatalogEntry,
  Task,
  Worker,
  Workspace,
  ExecutionRun,
} from "../../../types/agentos";

export interface MissionControlData {
  workspaces: Workspace[];
  workers: Worker[];
  missions: Mission[];
  tasks: Task[];
  models: ModelCatalogEntry[];
  runs: ExecutionRun[];
  canvasNodes: CanvasNodeRow[];
  canvasEdges: CanvasEdgeRow[];
}

export interface CanvasNodeRow {
  id: string;
  workspace_id: string | null;
  node_kind: CanvasNodeKind;
  ref_id: string | null;
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  z_index: number;
}

export interface CanvasEdgeRow {
  id: string;
  workspace_id: string | null;
  source_node_id: string;
  target_node_id: string;
  edge_kind: CanvasEdge["edge_kind"];
  label: string;
  animated: boolean;
}

const CANVAS_NODE_COLUMNS = "id, workspace_id, node_kind, ref_id, label, position, data, z_index";
const CANVAS_EDGE_COLUMNS = "id, workspace_id, source_node_id, target_node_id, edge_kind, label, animated";

/** Load everything the canvas needs in one pass. */
export async function loadMissionControlData(): Promise<MissionControlData> {
  const [workspaces, workers, missions, tasks, models, runs, canvasNodes, canvasEdges] =
    await Promise.all([
      agentosDb.from("workspaces").select("*"),
      agentosDb.from("workers").select("*").is("archived_at", null),
      agentosDb.from("missions").select("*"),
      agentosDb.from("tasks").select("*").order("created_at", { ascending: false }).limit(200),
      agentosDb.from("model_catalog").select("*"),
      agentosDb.from("execution_runs").select("*").order("started_at", { ascending: false }).limit(100),
      agentosDb.from("canvas_nodes").select(CANVAS_NODE_COLUMNS),
      agentosDb.from("canvas_edges").select(CANVAS_EDGE_COLUMNS),
    ]);

  return {
    workspaces: (workspaces.data ?? []) as Workspace[],
    workers: (workers.data ?? []) as Worker[],
    missions: (missions.data ?? []) as Mission[],
    tasks: (tasks.data ?? []) as Task[],
    models: (models.data ?? []) as ModelCatalogEntry[],
    runs: (runs.data ?? []) as ExecutionRun[],
    canvasNodes: (canvasNodes.data ?? []) as CanvasNodeRow[],
    canvasEdges: (canvasEdges.data ?? []) as CanvasEdgeRow[],
  };
}

/** True when the user has ever saved a canvas layout. */
export function hasPersistedCanvas(data: MissionControlData): boolean {
  return data.canvasNodes.length > 0;
}

/**
 * Derive an initial layout from the user's real rows. Workers anchor at the
 * left, their missions to the right, models along the top, and the runtime node
 * below. Positions are deterministic so a reload does not reshuffle the board.
 */
export function deriveInitialLayout(data: MissionControlData): {
  nodes: CanvasNodeRow[];
  edges: CanvasEdgeRow[];
} {
  const nodes: CanvasNodeRow[] = [];
  const edges: CanvasEdgeRow[] = [];

  const COL = { worker: -360, mission: 40, model: 40, runtime: 300 };
  const ROW = 90;

  data.workers.forEach((worker, index) => {
    nodes.push({
      id: `worker:${worker.id}`,
      workspace_id: worker.workspace_id,
      node_kind: "worker",
      ref_id: worker.id,
      label: worker.name,
      position: { x: COL.worker, y: index * ROW },
      data: { role: worker.role, model: worker.model_id, status: worker.status },
      z_index: index,
    });
  });

  data.missions.slice(0, 12).forEach((mission, index) => {
    nodes.push({
      id: `mission:${mission.id}`,
      workspace_id: mission.workspace_id,
      node_kind: "task",
      ref_id: mission.id,
      label: mission.title,
      position: { x: COL.mission, y: index * ROW },
      data: { status: mission.status, priority: mission.priority },
      z_index: 100 + index,
    });

    // Connect the mission to the workers that own its tasks.
    const workerIds = new Set(
      data.tasks
        .filter((task) => task.mission_id === mission.id && task.assigned_worker_id)
        .map((task) => task.assigned_worker_id as string),
    );
    for (const workerId of workerIds) {
      edges.push({
        id: `edge:worker:${workerId}->mission:${mission.id}`,
        workspace_id: mission.workspace_id,
        source_node_id: `worker:${workerId}`,
        target_node_id: `mission:${mission.id}`,
        edge_kind: "assignment",
        label: "assigned",
        animated: true,
      });
    }
  });

  data.models.slice(0, 6).forEach((model, index) => {
    nodes.push({
      id: `model:${model.id}`,
      workspace_id: null,
      node_kind: "model",
      ref_id: null,
      label: model.display_name,
      position: { x: index * 200, y: -140 },
      data: {
        modelId: model.id,
        provider: model.provider,
        contextWindow: model.context_window,
        rateIn: model.credit_rate_in,
        rateOut: model.credit_rate_out,
      },
      z_index: 200 + index,
    });
  });

  const latestRun = data.runs[0];
  if (latestRun) {
    nodes.push({
      id: `runtime:${latestRun.id}`,
      workspace_id: null,
      node_kind: "runtime",
      ref_id: latestRun.id,
      label: `Run ${latestRun.status}`,
      position: { x: COL.runtime, y: -140 },
      data: { status: latestRun.status, runId: latestRun.id, model: latestRun.model_id },
      z_index: 300,
    });
  }

  return { nodes, edges };
}

/**
 * Turn a canvas node into the row the database stores.
 *
 * The canvas identifies a node by a stable key (`worker:<uuid>`), so the
 * entity it points at is recoverable from the key itself. The workspace is
 * looked up from the entity, so a node inherits the workspace it belongs to.
 */
export function toCanvasNodeRow(
  node: { id: string; type?: string; position: { x: number; y: number }; data?: Record<string, unknown> },
  data: {
    workers: Worker[];
    missions: Mission[];
    models: ModelCatalogEntry[];
    runs: ExecutionRun[];
    workspaces?: Workspace[];
  },
): {
  id: string;
  workspace_id: string | null;
  node_kind: CanvasNodeKind;
  ref_id: string | null;
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  z_index: number;
} {
  const [kind, refId] = splitCanvasKey(node.id);
  const nodeKind = (node.type ?? kind ?? "worker") as CanvasNodeKind;
  const nodeData = node.data ?? {};

  let workspaceId: string | null = null;
  let label = typeof nodeData.name === "string" ? nodeData.name : "";
  let entityRef: string | null = refId ?? null;

  if (nodeKind === "worker" && refId) {
    const worker = data.workers.find((candidate) => candidate.id === refId);
    workspaceId = worker?.workspace_id ?? null;
    label = label || worker?.name || "Worker";
  } else if (nodeKind === "task" && refId) {
    const mission = data.missions.find((candidate) => candidate.id === refId);
    workspaceId = mission?.workspace_id ?? null;
    label = label || (typeof nodeData.title === "string" ? nodeData.title : mission?.title || "Mission");
  } else if (nodeKind === "model") {
    const modelId = typeof nodeData.modelId === "string" ? nodeData.modelId : null;
    const model = data.models.find((candidate) => candidate.id === modelId);
    label = label || model?.display_name || "Model";
    entityRef = modelId;
  } else if (nodeKind === "runtime") {
    const runId = typeof nodeData.runId === "string" ? nodeData.runId : null;
    const run = data.runs.find((candidate) => candidate.id === runId);
    label = label || (run ? `Run ${run.status}` : "Run");
    entityRef = runId;
  } else if (nodeKind === "workspace" && refId) {
    const workspace = data.workspaces?.find((candidate) => candidate.id === refId);
    workspaceId = workspace?.id ?? null;
    label = label || workspace?.name || "Workspace";
  }

  return {
    id: node.id,
    workspace_id: workspaceId,
    node_kind: nodeKind,
    ref_id: entityRef,
    label,
    position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    data: nodeData,
    z_index: 0,
  };
}

/** Split a canvas key into its kind and the entity id it points at. */
function splitCanvasKey(id: string): [string | null, string | null] {
  const separator = id.indexOf(":");
  if (separator < 0) return [null, null];
  const kind = id.slice(0, separator);
  const rest = id.slice(separator + 1);
  // An edge key looks like `edge:worker:<uuid>->mission:<uuid>`.
  if (kind === "edge") return [null, null];
  return [kind, rest.includes("->") ? null : rest];
}

/**
 * Persist a canvas node. The owner stamp comes from the BEFORE INSERT trigger,
 * so ownership cannot be forged from the browser.
 */
export async function saveCanvasNode(node: {
  id: string;
  workspace_id: string | null;
  node_kind: CanvasNodeKind;
  ref_id: string | null;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
  z_index?: number;
}): Promise<void> {
  await agentosDb.from("canvas_nodes").upsert({
    id: node.id,
    workspace_id: node.workspace_id,
    node_kind: node.node_kind,
    ref_id: node.ref_id,
    label: node.label,
    position: node.position,
    data: node.data ?? {},
    z_index: node.z_index ?? 0,
    updated_at: new Date().toISOString(),
  });
}

export async function saveCanvasPosition(nodeId: string, position: { x: number; y: number }): Promise<void> {
  await agentosDb
    .from("canvas_nodes")
    .update({ position, updated_at: new Date().toISOString() })
    .eq("id", nodeId);
}

export async function deleteCanvasNode(nodeId: string): Promise<void> {
  await agentosDb.from("canvas_nodes").delete().eq("id", nodeId);
}

/**
 * Persist a canvas edge.
 *
 * The edge references two canvas nodes, and the database enforces that with
 * a foreign key — so both endpoints must exist first. A node that has never
 * been dragged (and therefore never persisted) would otherwise make the edge
 * insert fail with a foreign-key violation and the connection would be lost.
 */
export async function saveCanvasEdge(
  edge: Omit<CanvasEdgeRow, "id"> & { id?: string },
  endpoints?: Array<{
    id: string;
    workspace_id: string | null;
    node_kind: CanvasNodeKind;
    ref_id: string | null;
    label: string;
    position: { x: number; y: number };
    data?: Record<string, unknown>;
    z_index?: number;
  }>,
): Promise<void> {
  if (endpoints) {
    for (const node of endpoints) {
      await saveCanvasNode(node);
    }
  }

  await agentosDb.from("canvas_edges").upsert({
    id: edge.id ?? `edge:${edge.source_node_id}->${edge.target_node_id}`,
    workspace_id: edge.workspace_id,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    edge_kind: edge.edge_kind,
    label: edge.label,
    animated: edge.animated,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCanvasEdge(edgeId: string): Promise<void> {
  await agentosDb.from("canvas_edges").delete().eq("id", edgeId);
}

/** Seed the user's canvas with their real workers, missions, models and run. */
export async function seedCanvasFromData(data: MissionControlData): Promise<void> {
  const layout = deriveInitialLayout(data);

  // Replace the previous layout in one pass: delete rows the user no longer has
  // then insert the new set.
  await agentosDb.from("canvas_edges").delete().neq("id", "__never__");
  await agentosDb.from("canvas_nodes").delete().neq("id", "__never__");

  if (layout.nodes.length > 0) {
    await agentosDb.from("canvas_nodes").insert(
      layout.nodes.map((node) => ({
        id: node.id,
        workspace_id: node.workspace_id,
        node_kind: node.node_kind,
        ref_id: node.ref_id,
        label: node.label,
        position: node.position,
        data: node.data,
        z_index: node.z_index,
      })),
    );
  }

  if (layout.edges.length > 0) {
    await agentosDb.from("canvas_edges").insert(
      layout.edges.map((edge) => ({
        id: edge.id,
        workspace_id: edge.workspace_id,
        source_node_id: edge.source_node_id,
        target_node_id: edge.target_node_id,
        edge_kind: edge.edge_kind,
        label: edge.label,
        animated: edge.animated,
      })),
    );
  }
}
