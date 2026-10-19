// src/components/agentos/mission-control/inspector/InspectorPanel.tsx
//
// Right-hand inspector. Dispatches on the selected node kind so clicking a
// worker, mission, model or runtime node always opens the matching panel.

import { X } from "lucide-react";
import { Button } from "../../../ui/button";
import { OverviewPanel } from "./OverviewPanel";
import { WorkerInspector } from "./WorkerInspector";
import { TaskInspector } from "./TaskInspector";
import { ModelInspector } from "./ModelInspector";
import type {
  ExecutionRun,
  Mission,
  ModelCatalogEntry,
  Task,
  Worker,
} from "../../../../types/agentos";

export type InspectorSelection =
  | { kind: "none" }
  | { kind: "worker"; nodeId: string; worker: Worker }
  | { kind: "task"; nodeId: string; mission: Mission; tasks: Task[] }
  | { kind: "model"; nodeId: string; model: ModelCatalogEntry }
  | { kind: "runtime"; nodeId: string; run: ExecutionRun | null };

export interface InspectorPanelProps {
  selection: InspectorSelection;
  onClose: () => void;
  onSelectWorker?: (workerId: string) => void;
  onSelectMission?: (missionId: string) => void;
  /**
   * The counts the overview panel shows. They used to default to zero, so the
   * panel always read "0 workers / 0 workspaces / 0 missions" no matter what
   * the user actually had.
   */
  counts?: { workers: number; workspaces: number; missions: number };
  /**
   * The missions each worker's tasks belong to, keyed by worker id. The
   * worker inspector lists them, so without this it always said "No missions
   * for this worker".
   */
  missionsByWorker?: Record<string, Mission[]>;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selection,
  onClose,
  onSelectWorker,
  onSelectMission,
  counts,
  missionsByWorker,
}) => {
  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-white/10 bg-[#0b0b0d]">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Inspector
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-white/40 hover:text-white"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {selection.kind === "none" ? (
          <OverviewPanel
            workerCount={counts?.workers}
            workspaceCount={counts?.workspaces}
            missionCount={counts?.missions}
          />
        ) : null}

        {selection.kind === "worker" ? (
          <WorkerInspector
            worker={selection.worker}
            missions={missionsByWorker?.[selection.worker.id] ?? []}
            onSelectWorker={onSelectWorker}
            onSelectMission={onSelectMission}
          />
        ) : null}

        {selection.kind === "task" ? (
          <TaskInspector mission={selection.mission} tasks={selection.tasks} />
        ) : null}

        {selection.kind === "model" ? (
          <ModelInspector model={selection.model} />
        ) : null}

        {selection.kind === "runtime" ? <RuntimeInspector run={selection.run} /> : null}
      </div>
    </aside>
  );
};

const RuntimeInspector: React.FC<{ run: ExecutionRun | null }> = ({ run }) => (
  <div className="p-4">
    <p className="text-sm font-medium text-white">Execution runtime</p>
    {run ? (
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="text-white/40">Status</dt>
          <dd className="text-white/80">{run.status}</dd>
        </div>
        <div>
          <dt className="text-white/40">Model</dt>
          <dd className="text-white/80">{run.model_id ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-white/40">Trigger</dt>
          <dd className="text-white/80">{run.trigger}</dd>
        </div>
        <div>
          <dt className="text-white/40">Tokens</dt>
          <dd className="tabular-nums text-white/80">
            {run.prompt_tokens.toLocaleString()} in · {run.completion_tokens.toLocaleString()} out
          </dd>
        </div>
        <div>
          <dt className="text-white/40">Credits</dt>
          <dd className="tabular-nums text-violet-300">{Number(run.credits).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-white/40">Started</dt>
          <dd className="text-white/80">{new Date(run.started_at).toLocaleString()}</dd>
        </div>
        {run.ended_at ? (
          <div>
            <dt className="text-white/40">Ended</dt>
            <dd className="text-white/80">{new Date(run.ended_at).toLocaleString()}</dd>
          </div>
        ) : null}
        {run.error ? (
          <div>
            <dt className="text-white/40">Error</dt>
            <dd className="break-words text-rose-300">{run.error}</dd>
          </div>
        ) : null}
      </dl>
    ) : (
      <p className="mt-3 text-sm text-white/45">
        No runs recorded yet. Execute a task and the latest run appears here.
      </p>
    )}
  </div>
);

export default InspectorPanel;
