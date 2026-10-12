// src/pages/agentos/MissionsPage.tsx
//
// Mission list with a status filter, showing the real task counts behind each
// mission. Counts come from the tasks table so nothing is inferred.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Plus, Target } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, MISSION_STATUS_STYLE, PageHeader, Pill, Spinner } from "../../components/agentos/ui";
import { listMissions, listTasks } from "../../services/agentos/missions";
import type { Mission, MissionStatus, Task } from "../../types/agentos";

const FILTERS: Array<{ value: MissionStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const MissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<MissionStatus | "all">("all");

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [missionsResult, tasksResult] = await Promise.all([listMissions(), listTasks()]);
      if (cancelled) return;
      if (missionsResult.error) {
        setError(missionsResult.error.message);
        setMissions([]);
      } else {
        setError(null);
        setMissions(missionsResult.data ?? []);
      }
      setTasks(tasksResult.data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const taskCounts = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>();
    for (const task of tasks) {
      if (!task.mission_id) continue;
      const entry = counts.get(task.mission_id) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "completed") entry.done += 1;
      counts.set(task.mission_id, entry);
    }
    return counts;
  }, [tasks]);

  const visible = useMemo(
    () => (filter === "all" ? missions : missions.filter((mission) => mission.status === filter)),
    [missions, filter],
  );

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Missions — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader
          title="Missions"
          description="A mission groups tasks and assigns them to workers. Every state below comes from the task queue, not a mock."
          actions={
            <button
              type="button"
              onClick={() => navigate("/agentos/missions/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New mission
            </button>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === option.value
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          loadingRows={4}
          empty={
            <EmptyState
              icon={Target}
              title={filter === "all" ? "No missions yet" : `No ${filter} missions`}
              description="A mission groups tasks and assigns each to a worker so the queue can run them."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/agentos/missions/new")}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New mission
                </button>
              }
            />
          }
        >
          <div className="space-y-3">
            {visible.map((mission) => {
              const counts = taskCounts.get(mission.id) ?? { total: 0, done: 0 };
              const style = MISSION_STATUS_STYLE[mission.status];
              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => navigate(`/agentos/missions/${mission.id}`)}
                  className="block w-full rounded-2xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-violet-400/30 hover:bg-black/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{mission.title}</p>
                      {mission.goal ? (
                        <p className="mt-1 line-clamp-1 text-xs text-white/50">{mission.goal}</p>
                      ) : null}
                    </div>
                    <Pill tone={style.pill}>{style.label}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <span>
                      {counts.done}/{counts.total} tasks complete
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>priority {mission.priority}</span>
                    <span aria-hidden="true">·</span>
                    <span>created {new Date(mission.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </AsyncBoundary>

        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200/80">
            Queued tasks run when something calls the executor. Without pg_cron or a provisioned worker,
            run the queue on demand from{" "}
            <button
              type="button"
              className="text-violet-300 underline"
              onClick={() => navigate("/agentos/operations")}
            >
              Operations
            </button>
            .
          </p>
        </div>

        {loading ? (
          <div className="mt-4 flex justify-center">
            <Spinner />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default MissionsPage;
