// src/components/agentos/mission-control/inspector/InspectorPanel.tsx
//
// Right-hand inspector, floating over the canvas. Dispatches on the selected node kind so clicking a
// worker, mission, model or runtime node always opens the matching panel.

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";
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
  /** Collapsed, the inspector is a 52px rail; it is never removed outright. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

const MIN_WIDTH = 280;
const MAX_WIDTH = 560;
const WIDTH_KEY = "agentos.inspector.width";

function readWidth(): number {
  try {
    const stored = Number(window.localStorage.getItem(WIDTH_KEY));
    if (Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH) return stored;
  } catch {
    // Fall through to the default.
  }
  return 340;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selection,
  open = true,
  onOpenChange,
  onClose,
  onSelectWorker,
  onSelectMission,
  counts,
  missionsByWorker,
}) => {
  const [width, setWidth] = useState(readWidth);
  const dragging = useRef(false);

  // Drag the left edge to resize, as upstream's inspector does.
  const startResize = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    dragging.current = true;
    const startX = event.clientX;
    const startWidth = width;
    const move = (moveEvent: PointerEvent) => {
      if (!dragging.current) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (startX - moveEvent.clientX)));
      setWidth(next);
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [width]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      // The width still applies for this visit.
    }
  }, [width]);

  if (!open) {
    // Collapsed to a 52px rail on the right edge.
    return (
      <div className="absolute bottom-4 right-3 top-16 z-20 hidden w-[52px] md:block">
        <div className="agentos-panel flex h-full flex-col items-center rounded-2xl py-3">
          <button
            type="button"
            onClick={() => onOpenChange?.(true)}
            aria-label="Open inspector"
            className="rounded-xl p-2 text-white/55 hover:bg-white/[0.06] hover:text-white"
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 [writing-mode:vertical-rl]">
            Inspector
          </span>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Inspector"
      style={{ ["--inspector-width" as string]: `${width}px` }}
      className="agentos-panel agentos-float-up absolute inset-x-3 bottom-3 z-20 flex max-h-[55vh] flex-col overflow-hidden rounded-2xl md:inset-x-auto md:bottom-4 md:right-3 md:top-16 md:max-h-none md:w-[var(--inspector-width)]"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize inspector"
        onPointerDown={startResize}
        className="absolute inset-y-0 left-0 hidden w-1.5 cursor-col-resize hover:bg-agentos-brand/30 md:block"
      />
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Inspector
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-7 w-7 p-0 text-white/40 hover:text-white md:inline-flex"
            onClick={() => onOpenChange?.(false)}
            aria-label="Collapse inspector"
          >
            <PanelRightClose className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/40 hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Close inspector"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
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
          <dd className="tabular-nums text-agentos-brand-soft">{Number(run.credits).toLocaleString()}</dd>
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
