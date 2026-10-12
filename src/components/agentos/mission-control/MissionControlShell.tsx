// src/components/agentos/mission-control/MissionControlShell.tsx
//
// The Mission Control page shell: top bar, sidebar, canvas, inspector.
//
// All data is fetched through api.ts (RLS-scoped). The command bar opens a real
// search over the loaded rows, so it needs no extra round trip and never shows
// a result the user cannot open.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "../ui/Spinner";
import { MissionControlCanvas } from "./MissionControlCanvas";
import { MissionControlSidebar } from "./MissionControlSidebar";
import { MissionControlTopbar } from "./MissionControlTopbar";
import { CommandBar } from "./command-bar/CommandBar";
import { InspectorPanel, type InspectorSelection } from "./inspector/InspectorPanel";
import {
  loadMissionControlData,
  seedCanvasFromData,
  type MissionControlData,
} from "./api";
import { resolveSelection } from "./canvas/useCanvasLayout";
import type { CanvasInputs } from "./canvas/useCanvasLayout";
import type { Mission, Worker } from "../../../types/agentos";

export interface MissionControlShellProps {
  /** Rendered inside the page (below the shell). */
  children?: React.ReactNode;
}

export const MissionControlShell: React.FC<MissionControlShellProps> = () => {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

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

  // Cmd/Ctrl+K opens the command palette.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

  const searchable: { workers: Worker[]; missions: Mission[] } = useMemo(
    () => ({
      workers: inputs.workers,
      missions: inputs.missions.map((mission) => mission as Mission),
    }),
    [inputs],
  );

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Spinner label="Loading Mission Control…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <MissionControlSidebar pendingApprovalCount={0} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MissionControlTopbar
          workspaces={data.workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceChange={setActiveWorkspaceId}
          onOpenCommandBar={() => setCommandOpen(true)}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1">
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
          </main>
          {inspectorOpen ? (
            <InspectorPanel
              selection={selection}
              onClose={() => setInspectorOpen(false)}
              onSelectWorker={(workerId) => setSelectedNodeId(`worker:${workerId}`)}
              onSelectMission={(missionId) => setSelectedNodeId(`mission:${missionId}`)}
            />
          ) : null}
        </div>
      </div>

      <CommandBar
        open={commandOpen}
        onOpenChange={setCommandOpen}
        workers={searchable.workers}
        missions={searchable.missions}
        onSelectWorker={(workerId) => setSelectedNodeId(`worker:${workerId}`)}
        onSelectMission={(missionId) => setSelectedNodeId(`mission:${missionId}`)}
      />
    </div>
  );
};

export default MissionControlShell;
