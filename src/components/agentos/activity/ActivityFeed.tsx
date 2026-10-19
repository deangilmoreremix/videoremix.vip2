// src/components/agentos/activity/ActivityFeed.tsx
//
// The activity timeline.
//
// WHY AN ORDERED LIST
//   A timeline is a sequence, so it is an <ol>: the order is in the markup,
//   not only in the CSS, and a screen reader announces how many entries there
//   are and which one it is on.

import { History } from "lucide-react";
import type { ActivityEntry } from "../../../types/agentos";
import { EmptyState } from "../ui";
import { ActivityItem } from "./ActivityItem";

export interface ActivityFeedProps {
  entries: ActivityEntry[];
  /** The signed-in user's id, so the timeline can say "you" instead of an id. */
  currentUserId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entries,
  currentUserId,
  emptyTitle = "Nothing has happened yet",
  emptyDescription = "Activity appears here as workers run, tools are called, and missions progress.",
  emptyAction,
}) => {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry) => (
        <ActivityItem key={`${entry.source}-${entry.id}`} entry={entry} currentUserId={currentUserId} />
      ))}
    </ol>
  );
};

export default ActivityFeed;
