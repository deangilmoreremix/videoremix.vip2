// src/pages/agentos/MissionDetailPage.tsx
//
// One mission: its tasks with real queue state, and the live execution
// transcript for whichever task is selected.

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Ban, Play, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  ExecutionStatusBadge,
  ExecutionActivityPanel,
} from "../../components/agentos/runtime";
import { MISSION_STATUS_STYLE, PageHeader, Pill, Section, Spinner } from "../../components/agentos/ui";
import { cancelMission, cancelTask, getMission, listTasks, retryTask, runQueuedTasks } from "../../services/agentos/missions";
import type { Mission, Task } from "../../types/agentos";

const MissionDetailPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [missionResult, tasksResult] = await Promise.all([
        getMission(missionId),
        listTasks({ missionId }),
      ]);
      if (cancelled) return;
      if (missionResult.error || !missionResult.data) {
        setError(missionResult.error?.message ?? "Mission not found");
        setLoading(false);
        return;
      }
      setMission(missionResult.data);
      setTasks(tasksResult.data ?? []);
      setError(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [missionId, reloadKey]);

  const style = mission ? MISSION_STATUS_STYLE[mission.status] : null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const onCancel = useCallback(async () => {
    if (!missionId) return;
    setBusy(true);
    const result = await cancelMission(missionId);
    setBusy(false);
    setNotice(
      result.error
        ? `Could not cancel: ${result.error.message}`
        : `Cancelled ${result.data?.cancelledTasks ?? 0} task(s)`,
    );
    reload();
  }, [missionId, reload]);

  const onRun = useCallback(async () => {
    setBusy(true);
    const result = await runQueuedTasks({ limit: 3 });
    setBusy(false);
    setNotice(
      result.error
        ? `Could not run: ${result.error.message}`
        : `Executor claimed ${result.data?.claimed ?? 0} task(s)`,
    );
    reload();
  }, [reload]);

  if (!missionId) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Spinner label="Loading mission…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <AsyncBoundary
        loading={false}
        error={error}
        onRetry={reload}
        isEmpty={!mission}
        empty={<p className="text-white/50">Mission not found.</p>}
      >
        {mission ? (
          <>
            <Helmet>
              <title>{mission.title} — Mission</title>
            </Helmet>

            <PageHeader
              breadcrumbs={[
                { label: "AgentOS", to: "/agentos" },
                { label: "Missions", to: "/agentos/missions" },
                { label: mission.title },
              ]}
              title={mission.title}
              description={mission.goal || mission.description || "No goal set"}
              actions={
                <>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => void onRun()}>
                    <Play className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Run queue
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                    disabled={busy}
                    onClick={() => void onCancel()}
                  >
                    <Ban className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Cancel mission
                  </Button>
                </>
              }
            />

            <div className="mb-6 flex flex-wrap items-center gap-2">
              {style ? <Pill tone={style.pill}>{style.label}</Pill> : null}
              <Pill tone="slate">priority {mission.priority}</Pill>
              <Pill tone="slate">{tasks.length} tasks</Pill>
              <Pill tone="slate">
                created by {mission.created_by} on {new Date(mission.created_at).toLocaleDateString()}
              </Pill>
            </div>

            {notice ? (
              <p className="mb-4 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/70">
                {notice}
              </p>
            ) : null}

            <Section title="Tasks" description="Real queue state for every task in this mission.">
              {tasks.length === 0 ? (
                <p className="text-sm text-white/45">This mission has no tasks yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-white/5 bg-black/30 p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-sm font-medium text-white hover:text-violet-200">
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-1 line-clamp-1 text-xs text-white/45">
                              {task.description}
                            </p>
                          ) : null}
                          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                            <span>attempt {task.attempt}/{task.max_attempts}</span>
                            <span aria-hidden="true">·</span>
                            <span>trigger {task.trigger}</span>
                            {task.worker_id ? null : (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-300">no worker assigned</span>
                              </>
                            )}
                            {task.lease_expires_at ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>lease expires {new Date(task.lease_expires_at).toLocaleTimeString()}</span>
                              </>
                            ) : null}
                          </p>
                          {task.error ? (
                            <p className="mt-1.5 text-[11px] text-rose-300">{task.error}</p>
                          ) : null}
                        </button>

                        <div className="flex items-center gap-2">
                          <ExecutionStatusBadge status={task.status} />
                          {task.status !== "completed" && task.status !== "cancelled" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true);
                                  await retryTask(task.id);
                                  setBusy(false);
                                  reload();
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                Retry
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true);
                                  await cancelTask(task.id);
                                  setBusy(false);
                                  reload();
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section
              title="Execution transcript"
              description={
                selectedTask
                  ? `Events for "${selectedTask.title}". Stored by the runtime; never rewritten.`
                  : "Select a task above to see its execution events."
              }
              className="mt-6"
            >
              {selectedTask ? (
                <ExecutionActivityPanel taskId={selectedTask.id} />
              ) : (
                <p className="text-sm text-white/45">No task selected.</p>
              )}
            </Section>

            <div className="mt-6">
              <Button variant="outline" onClick={() => navigate("/agentos/missions")}>
                Back to missions
              </Button>
            </div>
          </>
        ) : null}
      </AsyncBoundary>
    </div>
  );
};

export default MissionDetailPage;
