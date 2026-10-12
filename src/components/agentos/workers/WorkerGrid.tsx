// src/components/agentos/workers/WorkerGrid.tsx
//
// Responsive grid of worker cards with an empty state. Keeping the grid and its
// empty state in one component means no caller can accidentally render a bare
// div when there are no workers.

import type { Worker } from "../../../types/agentos";
import { Bot } from "lucide-react";
import { EmptyState } from "../ui";
import { WorkerCard } from "./WorkerCard";

export interface WorkerGridProps {
  workers: Worker[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onSelect?: (workerId: string) => void;
}

export const WorkerGrid: React.FC<WorkerGridProps> = ({
  workers,
  emptyTitle = "No workers yet",
  emptyDescription = "Create your first digital worker to give it an identity, a model, and tools.",
  emptyAction,
  onSelect,
}) => {
  if (workers.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workers.map((worker) => (
        <WorkerCard key={worker.id} worker={worker} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default WorkerGrid;
