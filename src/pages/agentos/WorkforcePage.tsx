// src/pages/agentos/WorkforcePage.tsx
//
// Workforce overview: every worker the caller owns or can see through a
// workspace, with search and a status filter. The "new worker" action sends the
// user to the creation wizard.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Bot, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  EmptyState,
  FilterGroup,
  PageHeader,
  Pill,
  SearchInput,
  StatusDot,
} from "../../components/agentos/ui";
import { AsyncBoundary } from "../../components/agentos/shared";
import { listWorkers } from "../../services/agentos/workers";
import { WORKER_STATUS_STYLE } from "../../components/agentos/ui";
import type { Worker, WorkerStatus } from "../../types/agentos";

const FILTERS: Array<{ value: WorkerStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const WorkforcePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WorkerStatus | "all">("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = await listWorkers({ includeArchived: filter === "archived" });
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        setWorkers([]);
      } else {
        setError(null);
        setWorkers(result.data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, filter, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return workers.filter((worker) => {
      if (filter !== "all" && worker.status !== filter) return false;
      if (!needle) return true;
      return [worker.name, worker.role, worker.instructions, worker.model_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [workers, query, filter]);

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Workforce — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Workforce"
          description="Your digital workers. Each one has an identity, a role, a model, and its own tools."
          actions={
            <button
              type="button"
              onClick={() => navigate("/agentos/workforce/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New worker
            </button>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SearchInput
            id="workforce-search"
            label="Search workers by name, role or model"
            value={query}
            onChange={setQuery}
            placeholder="Search workers by name, role or model"
            className="min-w-[240px] flex-1"
          />
          <FilterGroup
            label="Filter workers by status"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          loadingRows={4}
          empty={
            <EmptyState
              icon={Bot}
              title={query ? "No workers match that search" : "No workers yet"}
              description={
                query
                  ? "Try a different name, role or model."
                  : "Create your first digital worker to give it an identity, a model, and tools."
              }
              action={
                query ? null : (
                  <button
                    type="button"
                    onClick={() => navigate("/agentos/workforce/new")}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New worker
                  </button>
                )
              }
            />
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((worker) => {
              const style = WORKER_STATUS_STYLE[worker.status];
              return (
                <button
                  key={worker.id}
                  type="button"
                  onClick={() => navigate(`/agentos/workforce/${worker.id}`)}
                  className="group rounded-2xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-violet-400/30 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
                        <Bot className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-violet-200">
                          {worker.name}
                        </p>
                        <p className="text-xs text-white/45">{worker.role || "unassigned role"}</p>
                      </div>
                    </div>
                    <StatusDot tone={style.tone} title={style.label} />
                  </div>

                  <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs text-white/50">
                    {worker.instructions || worker.goals || "No instructions yet."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone="violet">{worker.model_id}</Pill>
                    <Pill tone={style.pill}>{style.label}</Pill>
                    {Array.isArray(worker.tools) && worker.tools.length > 0 ? (
                      <Pill tone="slate">
                        {worker.tools.filter((tool) => tool.enabled).length} tool
                        {worker.tools.filter((tool) => tool.enabled).length === 1 ? "" : "s"}
                      </Pill>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </AsyncBoundary>
      </div>
    </>
  );
};

export default WorkforcePage;
