// src/components/agentos/mission-control/canvas/CanvasToolbar.tsx
//
// Canvas controls: zoom, fit, save layout, seed layout, toggle the inspector.
//
// Actions are explicit rather than magic: saving persists node positions,
// seeding derives a layout from the user's real rows.

import {
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Wand2,
} from "lucide-react";
import { Button } from "../../../ui/button";

export interface CanvasToolbarProps {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  onSave: () => void;
  onSeed: () => void;
  saving?: boolean;
  seeding?: boolean;
  hasUnsavedChanges?: boolean;
  canSave?: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoomIn,
  zoomOut,
  fitView,
  onSave,
  onSeed,
  saving = false,
  seeding = false,
  hasUnsavedChanges = false,
  canSave = true,
}) => (
  <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/10 bg-[#0d0d0f]/90 p-1 backdrop-blur">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-white/50 hover:text-white"
      onClick={zoomOut}
      aria-label="Zoom out"
    >
      <Minus className="h-4 w-4" aria-hidden="true" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-white/50 hover:text-white"
      onClick={fitView}
      aria-label="Fit view"
    >
      <Maximize2 className="h-4 w-4" aria-hidden="true" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-white/50 hover:text-white"
      onClick={zoomIn}
      aria-label="Zoom in"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
    </Button>

    <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />

    <Button
      variant="ghost"
      size="sm"
      className={`h-8 px-2.5 text-xs ${hasUnsavedChanges ? "text-violet-300" : "text-white/50"}`}
      onClick={onSave}
      disabled={saving || !canSave}
    >
      {saving ? (
        <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      )}
      {hasUnsavedChanges ? "Save layout" : "Saved"}
    </Button>

    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2.5 text-xs text-white/50 hover:text-white"
      onClick={onSeed}
      disabled={seeding}
    >
      <Wand2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {seeding ? "Seeding…" : "Re-seed"}
    </Button>
  </div>
);

export default CanvasToolbar;
