// src/components/agentos/artifacts/ArtifactGrid.tsx
//
// The responsive artifact grid.
//
// WHY THE EMPTY STATE LIVES HERE
//   The grid is the only thing that renders artifacts, so keeping the empty
//   state inside it means no caller can end up with a blank panel that looks
//   like a loading failure.

import { Package } from "lucide-react";
import type { Artifact } from "../../../types/agentos";
import { EmptyState } from "../ui";
import { ArtifactCard } from "./ArtifactCard";

export interface ArtifactGridProps {
  artifacts: Artifact[];
  /** Worker id -> worker name, so a card can name the worker that made it. */
  workerNames?: Map<string, string>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onSelect?: (artifact: Artifact) => void;
}

export const ArtifactGrid: React.FC<ArtifactGridProps> = ({
  artifacts,
  workerNames,
  emptyTitle = "No artifacts yet",
  emptyDescription = "Artifacts appear here when a worker produces a file, a report, or generated media.",
  emptyAction,
  onSelect,
}) => {
  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          workerName={artifact.worker_id ? workerNames?.get(artifact.worker_id) : undefined}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export default ArtifactGrid;
