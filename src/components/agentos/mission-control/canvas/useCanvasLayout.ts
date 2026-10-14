// src/components/agentos/mission-control/canvas/useCanvasLayout.ts
//
// Maps the user's real rows (workers, missions, models, runs) and their
// persisted canvas rows into reactflow nodes and edges.
//
// The mapping is pure so it can be unit tested without a DOM, and so a
// re-render never reshuffles the board: persisted positions always win, and a
// derived position is only used for a node that has never been placed.

import { useCallback, useMemo } from "react";
import type { Edge, Node } from "reactflow";
import type {
  ExecutionRun,
  Mission,
  ModelCatalogEntry,
  Task,
  Worker,
} from "../../../../types/agentos";
import type { CanvasEdgeRow, CanvasNodeRow } from "../api";
import { deriveInitialLayout } from "../api";

export interface CanvasInputs {
  workers: Worker[];
  missions: Mission[];
  tasks: Task[];
  models: ModelCatalogEntry[];
  runs: ExecutionRun[];
  canvasNodes: CanvasNodeRow[];
  canvasEdges: CanvasEdgeRow[];
}

export interface CanvasLayout {
  nodes: Node[];
  edges: Edge[];
}

const WORKER_TONE: Record<string, string> = {
  draft: "idle",
  active: "active",
  paused: "warn",
  archived: "neutral",
};

const MISSION_TONE: Record<string, string> = {
  draft: "idle",
  planned: "neutral",
  active: "running",
  blocked: "blocked",
  completed: "success",
  failed: "error",
  cancelled: "neutral",
};

const RUN_TONE: Record<string, string> = {
  running: "running",
  succeeded: "success",
  failed: "error",
  cancelled: "neutral",
  timeout: "error",
};

export function buildLayout(inputs: CanvasInputs): CanvasLayout {
  // Start from the persisted layout when one exists; otherwise derive from the
  // user's rows so the first visit is not blank.
  const derived =
    inputs.canvasNodes.length > 0
      ? { nodes: inputs.canvasNodes, edges: inputs.canvasEdges }
      : deriveInitialLayout({
          workspaces: [],
          workers: inputs.workers,
          missions: inputs.missions,
          tasks: inputs.tasks,
          models: inputs.models,
          runs: inputs.runs,
          canvasNodes: [],
          canvasEdges: [],
        });

  const missionById = new Map(inputs.missions.map((mission) => [mission.id, mission]));
  const workerById = new Map(inputs.workers.map((worker) => [worker.id, worker]));
  const modelById = new Map(inputs.models.map((model) => [model.id, model]));
  const runById = new Map(inputs.runs.map((run) => [run.id, run]));

  const tasksByMission = new Map<string, Task[]>();
  for (const task of inputs.tasks) {
    if (!task.mission_id) continue;
    const list = tasksByMission.get(task.mission_id) ?? [];
    list.push(task);
    tasksByMission.set(task.mission_id, list);
  }

  const nodes: Node[] = derived.nodes.map((row) => {
    const kind = row.node_kind;

    if (kind === "worker" && row.ref_id) {
      const worker = workerById.get(row.ref_id);
      return {
        id: row.id,
        type: "worker",
        position: row.position,
        data: {
          workerId: row.ref_id,
          name: worker?.name ?? row.label,
          role: worker?.role ?? "",
          model: worker?.model_id ?? "",
          status: worker?.status ?? "draft",
        },
      };
    }

    if (kind === "task" && row.ref_id) {
      const mission = missionById.get(row.ref_id);
      const tasks = tasksByMission.get(row.ref_id) ?? [];
      return {
        id: row.id,
        type: "task",
        position: row.position,
        data: {
          missionId: row.ref_id,
          title: mission?.title ?? row.label,
          status: mission?.status ?? "draft",
          priority: mission?.priority ?? 5,
          taskCount: tasks.length,
        },
      };
    }

    if (kind === "model") {
      const modelId = String(row.data?.modelId ?? row.ref_id ?? row.label);
      const model = modelById.get(modelId);
      return {
        id: row.id,
        type: "model",
        position: row.position,
        data: {
          modelId,
          title: model?.display_name ?? row.label,
          provider: model?.provider ?? "openai",
          contextWindow: model?.context_window ?? 0,
          rateIn: model?.credit_rate_in ?? 0,
          rateOut: model?.credit_rate_out ?? 0,
        },
      };
    }

    if (kind === "runtime") {
      const runId = row.ref_id ? runById.get(row.ref_id) : null;
      const latest = runId ?? inputs.runs[0] ?? null;
      return {
        id: row.id,
        type: "runtime",
        position: row.position,
        data: {
          runId: latest?.id ?? null,
          status: latest?.status ?? "unknown",
          model: latest?.model_id ?? null,
        },
      };
    }

    if (kind === "workspace" && row.ref_id) {
      const workerCount = inputs.workers.filter(
        (worker) => worker.workspace_id === row.ref_id,
      ).length;
      return {
        id: row.id,
        type: "workspace",
        position: row.position,
        data: {
          workspaceId: row.ref_id,
          name: row.label,
          workerCount,
        },
      };
    }

    // Unknown node kinds never reach the canvas.
    return { id: row.id, type: "default", position: row.position, data: row.data };
  });

  const edges: Edge[] = derived.edges.map((row) => ({
    id: row.id,
    source: row.source_node_id,
    target: row.target_node_id,
    type: "mission",
    label: row.label || row.edge_kind,
    data: { edge_kind: row.edge_kind, animated: row.animated },
    animated: row.animated,
  }));

  return { nodes, edges };
}

export interface SelectionResolution {
  selection: import("../inspector/InspectorPanel").InspectorSelection;
}

/**
 * Turn a selected reactflow node id back into the row it represents, so the
 * inspector can open the real record.
 */
export function resolveSelection(
  nodeId: string | null,
  inputs: CanvasInputs,
): import("../inspector/InspectorPanel").InspectorSelection {
  if (!nodeId) return { kind: "none" };

  const row = inputs.canvasNodes.find((node) => node.id === nodeId);
  if (!row) {
    // Not persisted to the canvas table yet: on an unseeded board the nodes are
    // derived directly from the user's rows, with ids shaped "<kind>:<refId>"
    // (see deriveInitialLayout). Resolve those too so a click / command-bar
    // selection opens the real record instead of falling back to the overview.
    return resolveDerivedSelection(nodeId, inputs);
  }

  if (row.node_kind === "worker" && row.ref_id) {
    const worker = inputs.workers.find((entry) => entry.id === row.ref_id);
    if (!worker) return { kind: "none" };
    return { kind: "worker", nodeId, worker };
  }

  if (row.node_kind === "task" && row.ref_id) {
    const mission = inputs.missions.find((entry) => entry.id === row.ref_id);
    if (!mission) return { kind: "none" };
    const tasks = inputs.tasks.filter((task) => task.mission_id === mission.id);
    return { kind: "task", nodeId, mission, tasks };
  }

  if (row.node_kind === "model") {
    const modelId = String(row.data?.modelId ?? row.ref_id ?? row.label);
    const model = inputs.models.find((entry) => entry.id === modelId);
    if (!model) return { kind: "none" };
    return { kind: "model", nodeId, model };
  }

  if (row.node_kind === "runtime") {
    const run = row.ref_id ? inputs.runs.find((entry) => entry.id === row.ref_id) : inputs.runs[0];
    return { kind: "runtime", nodeId, run: run ?? null };
  }

  return { kind: "none" };
}

// Resolve a derived (not-yet-saved) canvas node id of the form "<kind>:<refId>"
// back to the row it represents.
function resolveDerivedSelection(
  nodeId: string,
  inputs: CanvasInputs,
): import("../inspector/InspectorPanel").InspectorSelection {
  if (nodeId.startsWith("worker:")) {
    const worker = inputs.workers.find((entry) => `worker:${entry.id}` === nodeId);
    return worker ? { kind: "worker", nodeId, worker } : { kind: "none" };
  }
  if (nodeId.startsWith("mission:")) {
    const mission = inputs.missions.find((entry) => `mission:${entry.id}` === nodeId);
    if (!mission) return { kind: "none" };
    const tasks = inputs.tasks.filter((task) => task.mission_id === mission.id);
    return { kind: "task", nodeId, mission, tasks };
  }
  if (nodeId.startsWith("model:")) {
    const model = inputs.models.find((entry) => `model:${entry.id}` === nodeId);
    return model ? { kind: "model", nodeId, model } : { kind: "none" };
  }
  if (nodeId.startsWith("runtime:")) {
    const run = inputs.runs.find((entry) => `runtime:${entry.id}` === nodeId) ?? inputs.runs[0] ?? null;
    return { kind: "runtime", nodeId, run };
  }
  return { kind: "none" };
}

/** Tone maps re-exported for node components. */
export const CANVAS_TONES = {
  worker: WORKER_TONE,
  mission: MISSION_TONE,
  run: RUN_TONE,
};

/** Debounce helper used by the autosave effect. */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  return useCallback(
    (...args: A) => {
      window.setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );
}

/** Convenience wrapper for pages that need the layout memoized. */
export function useCanvasLayout(inputs: CanvasInputs): CanvasLayout {
  return useMemo(() => buildLayout(inputs), [inputs]);
}
