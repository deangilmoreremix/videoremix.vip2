// src/components/agentos/activity/ActivityItem.tsx
//
// One entry of the activity timeline.
//
// WHY ONE COMPONENT FOR TWO SOURCES
//   The audit trail and the execution transcript are merged into a single
//   stream, so the timeline needs one item component. Without it the two
//   halves of the stream would drift apart in spacing, timestamps, and how
//   they name the actor.
//
// WHY A LINK ONLY WHERE A ROUTE EXISTS
//   A related entity is linked only when the AgentOS router actually has a
//   destination for it. A link to a route that does not exist is worse than
//   no link at all, so anything else is shown as plain text.

import { Link } from "react-router-dom";
import {
  Activity,
  BarChart,
  Check,
  CircleAlert,
  Cpu,
  FileText,
  GitBranch,
  Layers,
  ListChecks,
  Pencil,
  Plug,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityEntry } from "../../../types/agentos";
import { Pill, type PillTone } from "../ui";
import { machineTime, relativeTime } from "../format";

export interface ActivityItemProps {
  entry: ActivityEntry;
  /** The signed-in user's id, so the timeline can say "you" instead of an id. */
  currentUserId?: string;
}

/** A destination for the related entity, when the router has one. */
export interface ActivityLink {
  to: string;
  label: string;
}

const EVENT_VISUALS: Record<string, { icon: LucideIcon; tone: PillTone }> = {
  "run.started": { icon: Zap, tone: "sky" },
  "run.claimed": { icon: Zap, tone: "sky" },
  "run.succeeded": { icon: Check, tone: "emerald" },
  "run.failed": { icon: CircleAlert, tone: "rose" },
  "run.cancelled": { icon: CircleAlert, tone: "amber" },
  "run.timeout": { icon: CircleAlert, tone: "amber" },
  "plan.created": { icon: ListChecks, tone: "violet" },
  "tool.called": { icon: Terminal, tone: "slate" },
  "tool.result": { icon: Terminal, tone: "slate" },
  "app.invoked": { icon: Plug, tone: "violet" },
  "model.request": { icon: Cpu, tone: "slate" },
  "model.response": { icon: Cpu, tone: "slate" },
  "memory.retrieved": { icon: Layers, tone: "sky" },
  "memory.written": { icon: Layers, tone: "sky" },
  "handoff.requested": { icon: GitBranch, tone: "amber" },
  "approval.requested": { icon: Shield, tone: "amber" },
  "approval.granted": { icon: Shield, tone: "emerald" },
  "approval.rejected": { icon: Shield, tone: "rose" },
  "usage.recorded": { icon: BarChart, tone: "slate" },
};

const TONE_CLASS: Record<PillTone, string> = {
  neutral: "border-white/15 bg-white/5 text-white/70",
  violet: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  amber: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  rose: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  sky: "border-sky-400/30 bg-sky-500/15 text-sky-200",
  slate: "border-white/10 bg-white/5 text-white/50",
};

/** The icon and colour that stand for an entry. */
function activityVisual(entry: ActivityEntry): { icon: LucideIcon; tone: PillTone } {
  if (entry.source === "event") {
    return EVENT_VISUALS[entry.kind] ?? { icon: Activity, tone: "slate" };
  }

  const action = entry.kind.toLowerCase();
  if (action.startsWith("create") || action.startsWith("add")) {
    return { icon: Check, tone: "emerald" };
  }
  if (action.startsWith("delete") || action.startsWith("remove")) {
    return { icon: CircleAlert, tone: "rose" };
  }
  if (action.startsWith("update") || action.startsWith("change")) {
    return { icon: Pencil, tone: "sky" };
  }
  return { icon: FileText, tone: "violet" };
}

/**
 * The route for the entity an entry is about, when the router has one.
 *
 * The AgentOS router exposes a worker, a mission, and the operations console.
 * An entity type with no page of its own points at the operations console,
 * which is where the entity's execution shows up.
 */
function activityLink(entry: ActivityEntry): ActivityLink | null {
  if (entry.source === "event") {
    if (entry.task_id) return { to: "/agentos/operations", label: "task" };
    if (entry.worker_id) return { to: `/agentos/workforce/${entry.worker_id}`, label: "worker" };
    return null;
  }

  const id = entry.entity_id;
  if (!id) return null;
  if (entry.entity_type === "worker") {
    return { to: `/agentos/workforce/${id}`, label: "worker" };
  }
  if (entry.entity_type === "mission") {
    return { to: `/agentos/missions/${id}`, label: "mission" };
  }
  if (entry.entity_type) {
    return { to: "/agentos/operations", label: entry.entity_type };
  }
  return null;
}

/** A Clerk user id is long; the tail is the part that identifies it. */
function shortActor(actorId: string): string {
  const withoutPrefix = actorId.startsWith("user_") ? actorId.slice(5) : actorId;
  return withoutPrefix.length > 8 ? `${withoutPrefix.slice(0, 8)}…` : withoutPrefix;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ entry, currentUserId }) => {
  const { icon: Icon, tone } = activityVisual(entry);
  const link = activityLink(entry);
  const isYou = Boolean(currentUserId) && entry.actor_clerk_id === currentUserId;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${TONE_CLASS[tone]}`}
          title={entry.kind}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="mt-1 w-px flex-1 bg-white/5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={entry.source === "audit" ? "violet" : "slate"}>{entry.kind}</Pill>
          {entry.acting_as ? <Pill tone="slate">{entry.acting_as}</Pill> : null}
          <time
            dateTime={machineTime(entry.created_at)}
            className="text-[11px] text-white/30"
            title={new Date(entry.created_at).toLocaleString()}
          >
            {relativeTime(entry.created_at)}
          </time>
        </div>

        <p className="mt-1.5 break-words text-sm text-white/75">{entry.message}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
          {entry.actor_clerk_id ? (
            <span>{isYou ? "you" : shortActor(entry.actor_clerk_id)}</span>
          ) : (
            <span>system</span>
          )}
          {link ? (
            <Link to={link.to} className="text-violet-300/80 hover:text-violet-200">
              {link.label}
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
