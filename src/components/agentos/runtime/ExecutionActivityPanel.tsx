// src/components/agentos/runtime/ExecutionActivityPanel.tsx
//
// Live execution transcript.
//
// Polls the execution_events table while it is mounted and appends new events
// as they arrive. Polling (rather than a durable websocket) because the
// transcript is authoritative from the database, and a viewer that reconnects
// must always converge on the same history. Reactivity is deliberately left to
// Supabase Realtime when it is wired; the poll interval is the fallback.

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { agentosDb } from "../../../services/agentos/client";
import type { ExecutionEvent } from "../../../types/agentos";
import { EmptyState, Pill, Spinner } from "../ui";

const LEVEL_ICON = {
  debug: Info,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
} as const;

const LEVEL_TONE = {
  debug: "slate",
  info: "sky",
  warn: "amber",
  error: "rose",
  success: "emerald",
} as const;

const POLL_MS = 2_000;

export interface ExecutionActivityPanelProps {
  taskId?: string;
  runId?: string;
  /** Max events to keep in view. */
  limit?: number;
  className?: string;
}

export const ExecutionActivityPanel: React.FC<ExecutionActivityPanelProps> = ({
  taskId,
  runId,
  limit = 200,
  className,
}) => {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const seenRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!taskId && !runId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let query = agentosDb
      .from("execution_events")
      .select("*")
      .order("seq", { ascending: true })
      .limit(limit);

    if (runId) query = query.eq("run_id", runId);
    if (taskId) query = query.eq("task_id", taskId);

    const { data, error: loadError } = await query;
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as ExecutionEvent[];
    setEvents(rows);

    // WHY A SEPARATE LIVE REGION
    //   The transcript used to be the live region itself, so every 2 s poll
    //   re-announced the whole history — hundreds of events, every time. The
    //   list is now static for assistive tech and a small live region
    //   announces only what actually arrived, which is the only thing a
    //   listener cares about.
    const previous = seenRef.current;
    const added = rows.filter((row) => !previous.has(row.id)).length;
    seenRef.current = new Set(rows.map((row) => row.id));
    if (loadedRef.current && added > 0) {
      setAnnouncement(`${added} new activity event${added === 1 ? "" : "s"}`);
    }
    loadedRef.current = true;

    setError(null);
    setLoading(false);
  }, [taskId, runId, limit]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, reloadKey]);

  // Poll only while there is something to watch: a live run keeps polling, a
  // finished run polls twice and then stops, so the tab does not idle forever.
  const hasLiveRun = events.some(
    (event) => event.kind === "run.started" || event.kind === "model.request",
  );
  const hasTerminal = events.some(
    (event) =>
      event.kind === "run.succeeded" ||
      event.kind === "run.failed" ||
      event.kind === "run.cancelled" ||
      event.kind === "run.timeout",
  );

  useEffect(() => {
    if (!taskId && !runId) return;
    if (hasTerminal) return;
    if (!hasLiveRun) return;
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [taskId, runId, hasLiveRun, hasTerminal, load]);

  if (loading) {
    return (
      <div className={className}>
        <Spinner label="Loading activity…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} role="alert">
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="text-xs text-rose-300 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
        >
          Could not load activity ({error}) — retry
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={Info}
        title="No execution events yet"
        description="Events appear here as soon as a task is claimed and run."
      />
    );
  }

  return (
    <div className={className}>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <ol className="space-y-2" aria-label="Execution activity">
        {events.map((event) => {
          const Icon = LEVEL_ICON[event.level] ?? Info;
          const tone = LEVEL_TONE[event.level] ?? "sky";
          return (
            <li
              key={event.id}
              className="flex gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={tone}>{event.kind}</Pill>
                  <span className="text-[11px] text-white/35">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-white/75">{event.message}</p>
                {event.payload && Object.keys(event.payload).length > 0 ? (
                  <pre className="mt-1.5 overflow-x-auto rounded-lg bg-black/40 p-2 text-[11px] text-white/45">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default ExecutionActivityPanel;
