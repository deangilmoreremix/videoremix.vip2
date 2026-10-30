// src/components/agentos/mission-control/MissionControlShell.tsx
//
// The Mission Control page shell, after upstream's: a full-viewport canvas
// with the workspace bar and the inspector floating over it. The dashboard
// sidebar and topbar come from the layout, so there is one navigation.
//
// All data is fetched through api.ts (RLS-scoped).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "../ui/Spinner";
import { MissionControlCanvas } from "./MissionControlCanvas";
import { MissionControlTopbar } from "./MissionControlTopbar";
import { useOutletContext } from "react-router-dom";
import type { AgentOSOutletContext } from "../../../pages/agentos/AgentOSLayout";
import { InspectorPanel, type InspectorSelection } from "./inspector/InspectorPanel";
import {
  loadMissionControlData,
  seedCanvasFromData,
  type MissionControlData,
} from "./api";
import { resolveSelection } from "./canvas/useCanvasLayout";
import type { CanvasInputs } from "./canvas/useCanvasLayout";
import { countPendingApprovals } from "../../../services/agentos/approvals";
import type { Mission } from "../../../types/agentos";

export const MissionControlShell: React.FC = () => {
  // The command bar belongs to the dashboard layout. Outside it (in tests)
  // there is no outlet context, and the search pill simply does nothing.
  const outlet = useOutletContext<AgentOSOutletContext | undefined>();
  const openCommandBar = outlet?.openCommandBar ?? (() => undefined);
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  // On a phone the inspector is a bottom sheet over the canvas, so it starts
  // closed there and opens when a node is selected.
  const [inspectorOpen, setInspectorOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await loadMissionControlData();
      setData(loaded);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live pending-approval count for the sidebar badge; sourced from the
  // approvals table rather than a hardcoded literal.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await countPendingApprovals();
      if (!cancelled && !result.error) setPendingApprovals(result.data ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seed = useCallback(async () => {
    if (!data) return;
    setSeeding(true);
    try {
      await seedCanvasFromData(data);
      await load();
    } finally {
      setSeeding(false);
    }
  }, [data, load]);

  // Filter to the active workspace before handing data to the canvas.
  const inputs: CanvasInputs = useMemo(() => {
    if (!data) {
      return { workers: [], missions: [], tasks: [], models: [], runs: [], canvasNodes: [], canvasEdges: [] };
    }
    if (!activeWorkspaceId) {
      return {
        workers: data.workers,
        missions: data.missions,
        tasks: data.tasks,
        models: data.models,
        runs: data.runs,
        canvasNodes: data.canvasNodes,
        canvasEdges: data.canvasEdges,
      };
    }
    return {
      workers: data.workers.filter((worker) => worker.workspace_id === activeWorkspaceId),
      missions: data.missions.filter((mission) => mission.workspace_id === activeWorkspaceId),
      tasks: data.tasks.filter((task) => task.workspace_id === activeWorkspaceId),
      models: data.models,
      runs: data.runs,
      canvasNodes: data.canvasNodes.filter((node) => node.workspace_id === activeWorkspaceId),
      canvasEdges: data.canvasEdges.filter((edge) => edge.workspace_id === activeWorkspaceId),
    };
  }, [data, activeWorkspaceId]);

  const selection: InspectorSelection = useMemo(
    () => (data ? resolveSelection(selectedNodeId, inputs) : { kind: "none" }),
    [data, selectedNodeId, inputs],
  );

  /**
   * The counts and the per-worker mission map the inspector shows. Both used
   * to be missing, so the overview always read zero and the worker inspector
   * always said it had no missions.
   */
  const inspectorFacts = useMemo(() => {
    const workers = inputs.workers;
    const missions = inputs.missions;
    const tasks = inputs.tasks;

    const missionsByWorker: Record<string, Mission[]> = {};
    for (const task of tasks) {
      if (!task.mission_id || !task.assigned_worker_id) continue;
      const mission = missions.find((entry) => entry.id === task.mission_id);
      if (!mission) continue;
      const list = missionsByWorker[task.assigned_worker_id] ?? [];
      if (!list.some((entry) => entry.id === mission.id)) list.push(mission);
      missionsByWorker[task.assigned_worker_id] = list;
    }

    return {
      counts: {
        workers: workers.length,
        workspaces: data?.workspaces.length ?? 0,
        missions: missions.length,
      },
      missionsByWorker,
    };
  }, [inputs, data]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner label="Loading Mission Control…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div
          role="alert"
          className="mx-auto max-w-md rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-rose-100"
        >
          <h2 className="text-sm font-semibold">Could not load Mission Control</h2>
          <p className="mt-1 text-sm text-rose-100/80">{error ?? "no data"}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-xl border border-rose-300/30 px-3 py-1.5 text-sm hover:bg-rose-500/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* The canvas fills the viewport; everything else floats over it. */}
      <MissionControlCanvas
        inputs={inputs}
        selectedNodeId={selectedNodeId}
        onSelectNode={(nodeId) => {
          setSelectedNodeId(nodeId);
          if (nodeId) setInspectorOpen(true);
        }}
        onSeed={() => void seed()}
        seeding={seeding}
      />

      <MissionControlTopbar
        workspaces={data.workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChange={setActiveWorkspaceId}
        onOpenCommandBar={openCommandBar}
        pendingApprovals={pendingApprovals}
        counts={inspectorFacts.counts}
      />

      <InspectorPanel
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        selection={selection}
        counts={inspectorFacts.counts}
        missionsByWorker={inspectorFacts.missionsByWorker}
        onClose={() => setInspectorOpen(false)}
        onSelectWorker={(workerId) => setSelectedNodeId(`worker:${workerId}`)}
        onSelectMission={(missionId) => setSelectedNodeId(`mission:${missionId}`)}
      />

    </div>
  );
};

export default MissionControlShell;
