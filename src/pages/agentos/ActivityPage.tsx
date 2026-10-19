// src/pages/agentos/ActivityPage.tsx
//
// Activity: the audit trail and the execution transcript in one timeline.
//
// THE HONEST STATE OF THIS PAGE
//   agentos.audit_logs exists, is RLS-protected, and has NO WRITER in this
//   port: no service, edge function, or trigger inserts a row into it. The
//   audit half of the timeline is therefore always empty, and the page says
//   so above the stream instead of letting a silent empty list look like
//   "nothing happened". The execution-event half is live: the runtime writes
//   every step of every run.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Info } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AsyncBoundary, useClerkUserId } from "../../components/agentos/shared";
import { PageHeader, Section } from "../../components/agentos/ui";
import { ActivityFeed } from "../../components/agentos/activity";
import { listActivityFeed } from "../../services/agentos/activity";
import type { ActivityEntry, ActivitySource } from "../../types/agentos";

const PAGE_SIZE = 40;

const SOURCES: Array<{ value: ActivitySource | "all"; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "event", label: "Execution events" },
  { value: "audit", label: "Audit trail" },
];

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

const ActivityPage: React.FC = () => {
  const { clerkUserId } = useClerkUserId();

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [source, setSource] = useState<ActivitySource | "all">("all");
  const [entityType, setEntityType] = useState("");
  const [actorId, setActorId] = useState("");

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await listActivityFeed({
        source,
        entityType: entityType || undefined,
        actorId: actorId || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (cancelled) return;

      setEntries(result.data?.items ?? []);
      setHasMore(result.data?.hasMore ?? false);
      setError(result.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [source, entityType, actorId, reloadKey]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const result = await listActivityFeed({
      source,
      entityType: entityType || undefined,
      actorId: actorId || undefined,
      limit: PAGE_SIZE,
      offset: entries.length,
    });
    setLoadingMore(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setEntries((current) => [...current, ...(result.data?.items ?? [])]);
    setHasMore(result.data?.hasMore ?? false);
  }, [source, entityType, actorId, entries.length]);

  // The filter options are the values present in what has been loaded, so the
  // page never offers a filter the caller cannot satisfy.
  const entityTypes = useMemo(() => unique(entries.map((entry) => entry.entity_type)), [entries]);
  const actors = useMemo(() => unique(entries.map((entry) => entry.actor_clerk_id)), [entries]);

  return (
    <>
      <Helmet>
        <title>Activity — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader
          title="Activity"
          description="What happened in your tenant: the audit trail and the runtime transcript, newest first."
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-white/45">
            Source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as ActivitySource | "all")}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {SOURCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-white/45">
            Entity type
            <select
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">All entities</option>
              {entityTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-white/45">
            Actor
            <select
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Everyone</option>
              {actors.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white/50">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>
            The audit trail has no writer in this port yet:{" "}
            <code className="text-white/70">agentos.audit_logs</code> exists and is protected by
            RLS, but nothing inserts into it. The timeline below is therefore the execution event
            stream; audit entries will appear here as soon as a writer lands. Entity types and
            actors come from the audit side, so those two filters narrow the audit trail.
          </p>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={false}
          loadingRows={5}
        >
          <Section
            title="Timeline"
            description={
              source === "audit"
                ? "Mutating actions, newest first."
                : source === "event"
                  ? "Execution events, newest first."
                  : "Audit trail and execution events, newest first."
            }
          >
            <ActivityFeed
              entries={entries}
              currentUserId={clerkUserId || undefined}
              emptyTitle="No activity yet"
              emptyDescription="Run a mission or a worker task and the runtime transcript will show up here."
            />

            {hasMore ? (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </Section>
        </AsyncBoundary>
      </div>
    </>
  );
};

export default ActivityPage;
