// src/pages/agentos/ArtifactsPage.tsx
//
// Artifacts: everything an execution produced, browseable by kind.
//
// WHAT THIS PAGE SHOWS
//   Real rows from agentos.artifacts. There is no "sample" data and no
//   placeholder: an empty tenant gets the empty state, and the totals come
//   from the same table the grid reads.
//
// WHY THE SEARCH IS CLIENT-SIDE
//   The grid shows the artifacts the caller can see; the search box narrows
//   that window. Pushing the term to PostgREST would need a case-insensitive
//   filter the AgentOS query surface does not model, and the label on the
//   input says which window it searches so nobody reads it as a full-text
//   index.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AsyncBoundary } from "../../components/agentos/shared";
import { Modal, PageHeader, Section, Stat } from "../../components/agentos/ui";
import { ArtifactGrid } from "../../components/agentos/artifacts";
import { formatBytes, formatBytesTotal, machineTime, relativeTime } from "../../components/agentos/format";
import {
  listArtifacts,
  summarizeArtifacts,
  type ArtifactSummary,
} from "../../services/agentos/artifacts";
import { listWorkers } from "../../services/agentos/workers";
import type { Artifact, ArtifactKind, Worker } from "../../types/agentos";

const PAGE_SIZE = 60;

const KINDS: ArtifactKind[] = ["file", "text", "image", "audio", "video", "report"];

const ArtifactsPage: React.FC = () => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [summary, setSummary] = useState<ArtifactSummary | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [kind, setKind] = useState<ArtifactKind | "all">("all");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [artifactsResult, summaryResult, workersResult] = await Promise.all([
        listArtifacts({ kind: kind === "all" ? undefined : kind, limit: PAGE_SIZE, offset: 0 }),
        summarizeArtifacts(),
        listWorkers({ includeArchived: true }),
      ]);
      if (cancelled) return;

      setArtifacts(artifactsResult.data?.items ?? []);
      setHasMore(artifactsResult.data?.hasMore ?? false);
      setSummary(summaryResult.data ?? null);
      setWorkers(workersResult.data ?? []);

      const firstError = [artifactsResult, summaryResult, workersResult].find(
        (result) => result.error,
      );
      setError(firstError?.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, reloadKey]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const result = await listArtifacts({
      kind: kind === "all" ? undefined : kind,
      limit: PAGE_SIZE,
      offset: artifacts.length,
    });
    setLoadingMore(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setArtifacts((current) => [...current, ...(result.data?.items ?? [])]);
    setHasMore(result.data?.hasMore ?? false);
  }, [artifacts.length, kind]);

  const workerNames = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return artifacts;
    return artifacts.filter(
      (artifact) =>
        artifact.name.toLowerCase().includes(needle) ||
        (artifact.preview ?? "").toLowerCase().includes(needle),
    );
  }, [artifacts, query]);

  const selectedWorkerName = selected?.worker_id
    ? workerNames.get(selected.worker_id)
    : undefined;

  return (
    <>
      <Helmet>
        <title>Artifacts — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Artifacts"
          description="Files, reports, and generated media produced by your workers."
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loaded artifacts"
              aria-label="Search artifacts"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-violet-400/40 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {(["all", ...KINDS] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  kind === option
                    ? "bg-violet-500/20 text-violet-200"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={false}
          loadingRows={4}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                label="Artifacts"
                value={(summary?.total ?? 0).toLocaleString()}
                tone="violet"
                hint={`across the most recent ${(summary?.window ?? 0).toLocaleString()} rows`}
              />
              <Stat
                label="Total size"
                value={formatBytesTotal(summary?.totalBytes ?? 0)}
                hint="sum of the stored artifact sizes"
              />
              <Stat
                label="Kinds"
                value={summary?.kinds ?? 0}
                tone="sky"
                hint="distinct artifact kinds in the window"
              />
            </div>

            <Section
              title="Artifacts"
              description={
                query
                  ? `${visible.length} of ${artifacts.length} loaded artifacts match.`
                  : "Newest first."
              }
            >
              <ArtifactGrid
                artifacts={visible}
                workerNames={workerNames}
                emptyTitle={query ? "No artifacts match that search" : "No artifacts yet"}
                emptyDescription={
                  query
                    ? "Try a different word, or clear the search."
                    : "Artifacts appear here when a worker produces a file, a report, or generated media."
                }
                onSelect={(artifact) => setSelected(artifact)}
              />

              {hasMore ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </Section>
          </div>
        </AsyncBoundary>
      </div>

      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.name ?? "Artifact"}
        description={
          selected
            ? `${selected.kind} · ${formatBytes(selected.size_bytes)} · ${relativeTime(selected.created_at)}`
            : undefined
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Preview
              </p>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
                {selected.preview || "No preview stored for this artifact."}
              </pre>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Details
              </p>
              <dl className="mt-1 space-y-1 text-xs text-white/60">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/40">Created</dt>
                  <dd>
                    <time dateTime={machineTime(selected.created_at)}>
                      {new Date(selected.created_at).toLocaleString()}
                    </time>
                  </dd>
                </div>
                {selected.worker_id ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Worker</dt>
                    <dd>
                      {selectedWorkerName ? (
                        <Link
                          to={`/agentos/workforce/${selected.worker_id}`}
                          className="text-violet-300 hover:text-violet-200"
                        >
                          {selectedWorkerName}
                        </Link>
                      ) : (
                        "unknown"
                      )}
                    </dd>
                  </div>
                ) : null}
                {selected.mime_type ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">MIME type</dt>
                    <dd>{selected.mime_type}</dd>
                  </div>
                ) : null}
                {selected.storage_path ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Storage path</dt>
                    <dd className="truncate">{selected.storage_path}</dd>
                  </div>
                ) : null}
                {selected.task_id ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Task</dt>
                    <dd className="truncate">{selected.task_id}</dd>
                  </div>
                ) : null}
                {selected.run_id ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Run</dt>
                    <dd className="truncate">{selected.run_id}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Metadata
              </p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/60">
                {Object.keys(selected.metadata ?? {}).length === 0
                  ? "No metadata recorded."
                  : JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};

export default ArtifactsPage;
