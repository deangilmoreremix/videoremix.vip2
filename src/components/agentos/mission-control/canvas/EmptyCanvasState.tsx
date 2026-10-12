// src/components/agentos/mission-control/canvas/EmptyCanvasState.tsx
//
// Shown when the user has nothing to draw. Offers the two productive actions:
// create a worker, or seed a demo worker + mission so the canvas is explorable
// (both write real rows).

import { useNavigate } from "react-router-dom";
import { Bot, Layout } from "lucide-react";
import { Button } from "../../../ui/button";
import { EmptyState } from "../../ui";

export interface EmptyCanvasStateProps {
  hasWorkers: boolean;
  onSeedSample: () => void;
  seeding?: boolean;
}

export const EmptyCanvasState: React.FC<EmptyCanvasStateProps> = ({
  hasWorkers,
  onSeedSample,
  seeding = false,
}) => {
  const navigate = useNavigate();

  return (
    <EmptyState
      className="border-none bg-transparent"
      icon={Layout}
      title={hasWorkers ? "Save your canvas layout" : "Nothing on the canvas yet"}
      description={
        hasWorkers
          ? "You have workers and missions but no saved layout. Seed one to place them on the board."
          : "Create a digital worker and a mission, then seed the canvas to place them here."
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => navigate("/agentos/workforce/new")}>
            <Bot className="mr-2 h-4 w-4" aria-hidden="true" />
            New worker
          </Button>
          <Button onClick={onSeedSample} disabled={seeding}>
            {seeding ? "Seeding…" : "Seed canvas"}
          </Button>
        </div>
      }
    />
  );
};

export default EmptyCanvasState;
