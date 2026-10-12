// src/components/agentos/mission-control/MissionControlCanvas.tsx
//
// The interactive Mission Control canvas.
//
// Real data: nodes come from the user's workers, missions, the model catalog
// and their latest execution run. Positions persist to agentos.canvas_nodes
// and edges to agentos.canvas_edges, debounced so a drag writes once instead
// of once per frame.
//
// Keyboard: 0 fit view, + / - zoom, Delete removes the selected node (behind a
// confirmation). Everything else is standard reactflow.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import { EmptyCanvasState } from "./canvas/EmptyCanvasState";
import { CanvasToolbar } from "./canvas/CanvasToolbar";
import {
  ModelNode,
  RuntimeNode,
  TaskNode,
  WorkerNode,
  WorkspaceNode,
} from "./nodes";
import MissionConnectionEdge from "./MissionConnectionEdge";
import {
  deleteCanvasEdge,
  deleteCanvasNode,
  saveCanvasEdge,
  saveCanvasPosition,
} from "./api";
import { buildLayout } from "./canvas/useCanvasLayout";
import type { CanvasInputs } from "./canvas/useCanvasLayout";

const NODE_TYPES = {
  worker: WorkerNode,
  task: TaskNode,
  model: ModelNode,
  runtime: RuntimeNode,
  workspace: WorkspaceNode,
};

const EDGE_TYPES = {
  mission: MissionConnectionEdge,
};

export interface MissionControlCanvasProps {
  inputs: CanvasInputs;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSeed: () => void;
  seeding?: boolean;
  hasUnsavedChanges?: boolean;
}

export const MissionControlCanvas: React.FC<MissionControlCanvasProps> = ({
  inputs,
  selectedNodeId,
  onSelectNode,
  onSeed,
  seeding = false,
  hasUnsavedChanges = false,
}) => {
  const [nodes, setNodes] = useState<Node[]>(() => buildLayout(inputs).nodes);
  const [edges, setEdges] = useState<Edge[]>(() => buildLayout(inputs).edges);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Node | null>(null);
  const saveTimer = useRef<number | null>(null);
  const { zoomIn, zoomOut, fitView } = useCanvasFlow();

  // Rebuild when the underlying data changes (new worker, new mission, ...).
  useEffect(() => {
    const layout = buildLayout(inputs);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [inputs]);

  const hasContent = inputs.workers.length > 0 || inputs.missions.length > 0;
  const hasPersisted = inputs.canvasNodes.length > 0;

  // Reflect the shell's selection back into the node state.
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    );
  }, [selectedNodeId]);

  const persistPosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (!hasPersisted) return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void saveCanvasPosition(nodeId, position);
      }, 750);
    },
    [hasPersisted],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((current) => {
        const next = applyNodeChanges(changes, current);
        // Persist the position of any node that just finished a drag.
        for (const change of changes) {
          if (change.type === "position" && !change.dragging && change.position) {
            persistPosition(change.id, change.position);
          }
        }
        return next;
      });
    },
    [persistPosition],
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
    for (const change of changes) {
      if (change.type === "remove") void deleteCanvasEdge(change.id);
    }
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    void saveCanvasEdge({
      workspace_id: null,
      source_node_id: connection.source,
      target_node_id: connection.target,
      edge_kind: "handoff",
      label: "handoff",
      animated: true,
    });
  }, []);

  const saveAll = useCallback(async () => {
    setSaving(true);
    await Promise.all(
      nodes.map((node) =>
        saveCanvasPosition(node.id, {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        }),
      ),
    );
    setSaving(false);
  }, [nodes]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    await deleteCanvasNode(confirmDelete.id);
    setNodes((current) => current.filter((node) => node.id !== confirmDelete.id));
    onSelectNode(null);
    setConfirmDelete(null);
  }, [confirmDelete, onSelectNode]);

  // Keyboard interactions.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.key === "0") {
        event.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn({ duration: 200 });
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        zoomOut({ duration: 200 });
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        const selected = nodes.find((node) => node.id === selectedNodeId);
        if (selected) {
          event.preventDefault();
          setConfirmDelete(selected);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fitView, zoomIn, zoomOut, nodes, selectedNodeId]);

  if (!hasContent && !hasPersisted) {
    return (
      <div className="grid h-full place-items-center p-8">
        <EmptyCanvasState
          hasWorkers={inputs.workers.length > 0}
          onSeedSample={onSeed}
          seeding={seeding}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectNodesOnDrag={false}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-[#0a0a0a]"
      >
        <Background gap={24} size={1} color="#ffffff10" />
        <MiniMap
          pannable
          zoomable
          className="!border !border-white/10 !bg-[#0d0d0f]"
          maskColor="rgba(0,0,0,0.6)"
          nodeColor={() => "#a78bfa"}
        />
        <Controls
          showInteractive={false}
          className="!border-white/10 !bg-[#0d0d0f] [&>button]:!border-white/10 [&>button]:!bg-[#0d0d0f] [&>button]:!text-white/50 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10">
        <CanvasToolbar
          zoomIn={() => zoomIn({ duration: 200 })}
          zoomOut={() => zoomOut({ duration: 200 })}
          fitView={() => fitView({ padding: 0.2, duration: 300 })}
          onSave={() => void saveAll()}
          onSeed={onSeed}
          saving={saving}
          seeding={seeding}
          hasUnsavedChanges={hasUnsavedChanges}
          canSave={hasPersisted}
        />
      </div>

      {confirmDelete ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d0f] p-5">
            <h3 className="text-sm font-semibold text-white">Remove this node?</h3>
            <p className="mt-1.5 text-sm text-white/50">
              This removes the node from your saved layout. The worker, mission or model it
              represents is not deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
              >
                Remove node
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// reactflow's zoom helpers require being inside a provider; this wrapper keeps
// the consumer API simple (the shell renders <ReactFlowProvider>).
function useCanvasFlow() {
  const { zoomIn, zoomOut, fitView } = useReactFlowInternal();
  return { zoomIn, zoomOut, fitView };
}

import { useReactFlow as useReactFlowInternal } from "reactflow";

export default MissionControlCanvas;
