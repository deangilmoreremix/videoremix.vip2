// src/pages/agentos/MissionDetailPage.tsx
//
// One mission: its tasks with real queue state, the dependency graph between
// those tasks, and the live execution transcript for whichever task is
// selected.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Ban, Link2, Pencil, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  ExecutionStatusBadge,
  ExecutionActivityPanel,
} from "../../components/agentos/runtime";
import { MISSION_STATUS_STYLE, ConfirmDialog, PageHeader, Pill, Section, Spinner } from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import {
  addTaskEdge,
  cancelMission,
  cancelTask,
  getMission,
  listTaskEdges,
  listTasks,
  removeTaskEdge,
  retryTask,
  runQueuedTasks,
  updateTask,
} from "../../services/agentos/missions";
import { listWorkers } from "../../services/agentos/workers";
import type { Mission, Task, TaskEdge, Worker } from "../../types/agentos";

interface TaskDraft {
  id: string;
  title: string;
  description: string;
  priority: number;
}

const PRIORITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Would the edge "taskId waits for waitsFor" close a loop?
 *
 * WHY THE CHECK IS HERE AND NOT ONLY IN THE SERVICE
 *   The queue treats an unmet dependency as a hard gate, and a cycle makes
 *   every task in it unclaimable — the mission stalls with no error. The
 *   service refuses the edge too (it walks the whole edge table, including
 *   edges that leave this mission), but this check answers immediately so the
 *   operator sees the reason without a round trip.
 */
function createsCycle(edges: TaskEdge[], taskId: string, waitsFor: string): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.task_id) ?? [];
    list.push(edge.waits_for);
    adjacency.set(edge.task_id, list);
  }

  const stack = [waitsFor];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === taskId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }
  return false;
}

const MissionDetailPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [edges, setEdges] = useState<TaskEdge[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Task editing.
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Destructive actions.
  const [confirmCancelMission, setConfirmCancelMission] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmRemoveEdge, setConfirmRemoveEdge] = useState<TaskEdge | null>(null);
  const [edgeError, setEdgeError] = useState<string | null>(null);

  // Adding a dependency.
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgeTaskId, setEdgeTaskId] = useState("");
  const [edgeWaitsFor, setEdgeWaitsFor] = useState("");
  const [edgeSaving, setEdgeSaving] = useState(false);
  const [edgeAddError, setEdgeAddError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!missionId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [missionResult, tasksResult, edgesResult, workersResult] = await Promise.all([
        getMission(missionId),
        listTasks({ missionId }),
        listTaskEdges(missionId),
        listWorkers({ includeArchived: true }),
      ]);

      if (cancelled) return;
      if (missionResult.error || !missionResult.data) {
        setError(missionResult.error?.message ?? "Mission not found");
        setLoading(false);
        return;
      }
      setMission(missionResult.data);
      setTasks(tasksResult.data ?? []);
      setEdges(edgesResult.data ?? []);
      setWorkers(workersResult.data ?? []);
      setError(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [missionId, reloadKey]);

  const style = mission ? MISSION_STATUS_STYLE[mission.status] : null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const workerNameById = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );

  const taskTitleById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task.title])),
    [tasks],
  );

  const onCancel = useCallback(async () => {
    if (!missionId) return;
    setBusy(true);
    setCancelError(null);
    const result = await cancelMission(missionId);
    setBusy(false);
    if (result.error) {
      setCancelError(`Could not cancel: ${result.error.message}`);
      return;
    }
    setConfirmCancelMission(false);
    setNotice(`Cancelled ${result.data?.cancelledTasks ?? 0} task(s)`);
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

  const onRetry = useCallback(
    async (task: Task) => {
      setBusy(true);
      const result = await retryTask(task.id);
      setBusy(false);
      setNotice(
        result.error
          ? `Could not retry "${task.title}": ${result.error.message}`
          : `"${task.title}" is queued again`,
      );
      reload();
    },
    [reload],
  );

  const onCancelTask = useCallback(
    async (task: Task) => {
      setBusy(true);
      const result = await cancelTask(task.id);
      setBusy(false);
      setNotice(
        result.error
          ? `Could not cancel "${task.title}": ${result.error.message}`
          : `"${task.title}" cancelled`,
      );
      reload();
    },
    [reload],
  );

  const openTaskDraft = useCallback((task: Task) => {
    setDraft({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
    });
    setDraftError(null);
  }, []);

  const saveTask = useCallback(async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setDraftError("Give the task a title");
      return;
    }

    setSaving(true);
    setDraftError(null);
    const result = await updateTask(draft.id, {
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
    });
    setSaving(false);

    if (result.error) {
      setDraftError(result.error.message);
      return;
    }
    setDraft(null);
    setNotice("Task updated");
    reload();
  }, [draft, reload]);

  const removeEdge = useCallback(async () => {
    if (!confirmRemoveEdge) return;
    setBusy(true);
    setEdgeError(null);
    const result = await removeTaskEdge({
      taskId: confirmRemoveEdge.task_id,
      waitsFor: confirmRemoveEdge.waits_for,
    });
    setBusy(false);
    if (result.error) {
      setEdgeError(`Could not remove the dependency: ${result.error.message}`);
      return;
    }
    setNotice("Dependency removed");
    setConfirmRemoveEdge(null);
    reload();
  }, [confirmRemoveEdge, reload]);

  const openAddEdge = useCallback(() => {
    setEdgeTaskId("");
    setEdgeWaitsFor("");
    setEdgeAddError(null);
    setEdgeDialogOpen(true);
  }, []);

  /**
   * Add a dependency between two tasks of this mission.
   *
   * WHY EVERY RULE IS CHECKED HERE FIRST
   *   A task that waits for itself, a dependency that already exists, and a
   *   dependency that closes a cycle are all refusals the operator can be
   *   told about immediately. The service enforces the same rules (and knows
   *   about edges outside this mission), so its answer is the final one.
   */
  const addEdge = useCallback(async () => {
    if (!edgeTaskId || !edgeWaitsFor) {
      setEdgeAddError("Choose the task and the task it waits for");
      return;
    }
    if (edgeTaskId === edgeWaitsFor) {
      setEdgeAddError("A task cannot wait for itself");
      return;
    }
    if (
      edges.some((edge) => edge.task_id === edgeTaskId && edge.waits_for === edgeWaitsFor)
    ) {
      setEdgeAddError("That dependency already exists");
      return;
    }
    if (createsCycle(edges, edgeTaskId, edgeWaitsFor)) {
      setEdgeAddError("That dependency would create a cycle");
      return;
    }

    setEdgeSaving(true);
    setEdgeAddError(null);
    const result = await addTaskEdge({ taskId: edgeTaskId, waitsFor: edgeWaitsFor });
    setEdgeSaving(false);

    if (result.error) {
      setEdgeAddError(`Could not add the dependency: ${result.error.message}`);
      return;
    }
    setEdgeDialogOpen(false);
    setNotice("Dependency added");
    reload();
  }, [edgeTaskId, edgeWaitsFor, edges, reload]);

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
                    onClick={() => setConfirmCancelMission(true)}
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
              <p
                role="status"
                className="mb-4 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/70"
              >
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
                            <span>priority {task.priority}</span>
                            <span aria-hidden="true">·</span>
                            <span>attempt {task.attempt}/{task.max_attempts}</span>
                            <span aria-hidden="true">·</span>
                            <span>trigger {task.trigger}</span>
                            {task.assigned_worker_id ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  worker:{" "}
                                  {workerNameById.get(task.assigned_worker_id) ?? "unknown"}
                                </span>
                              </>
                            ) : (
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
                          {task.blocked_reason ? (
                            <p className="mt-1.5 text-[11px] text-amber-300">
                              Parked: {task.blocked_reason}
                            </p>
                          ) : null}
                          {task.error ? (
                            <p className="mt-1.5 text-[11px] text-rose-300">{task.error}</p>
                          ) : null}
                          {task.output ? (
                            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[11px] text-white/45">
                              {JSON.stringify(task.output, null, 2)}
                            </pre>
                          ) : null}
                        </button>

                        <div className="flex items-center gap-2">
                          <ExecutionStatusBadge status={task.status} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTaskDraft(task)}
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          {task.status !== "completed" && task.status !== "cancelled" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => void onRetry(task)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                                Retry
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => void onCancelTask(task)}
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
              title="Dependencies"
              description="What each task waits for. The queue refuses to claim a task whose dependency has not completed."
              className="mt-6"
              actions={
                <Button
                  size="sm"
                  disabled={tasks.length < 2}
                  onClick={openAddEdge}
                  aria-label="Add a dependency"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Add dependency
                </Button>
              }
            >
              {edges.length === 0 ? (
                <p className="text-sm text-white/45">
                  No dependencies. Every task in this mission can be claimed on its own.
                  {tasks.length < 2 ? " Add a second task to give one something to wait for." : ""}
                </p>
              ) : (
                <ul className="space-y-2">
                  {edges.map((edge) => (
                    <li
                      key={`${edge.task_id}-${edge.waits_for}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                          <span className="truncate">
                            {taskTitleById.get(edge.task_id) ?? edge.task_id}
                          </span>
                          <Link2 className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
                          <span className="text-white/45">waits for</span>
                          <span className="truncate">
                            {taskTitleById.get(edge.waits_for) ?? edge.waits_for}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-white/35">
                          {edge.kind} · added {new Date(edge.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                        onClick={() => setConfirmRemoveEdge(edge)}
                        aria-label={`Remove the dependency between ${taskTitleById.get(edge.task_id) ?? edge.task_id} and ${taskTitleById.get(edge.waits_for) ?? edge.waits_for}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </Button>
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

      {draft ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
          title="Edit task"
          description="The queue owns the task's status, attempts and lease. These are the fields the browser may change."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={saving} onClick={() => void saveTask()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50" htmlFor="task-title">
                Title
              </label>
              <Input
                id="task-title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-white/50" htmlFor="task-description">
                Description
              </label>
              <Textarea
                id="task-description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-white/50" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                value={draft.priority}
                onChange={(event) =>
                  setDraft({ ...draft, priority: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {draftError ? (
              <p role="alert" className="text-sm text-rose-300">
                {draftError}
              </p>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <Modal
        open={edgeDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEdgeDialogOpen(false);
        }}
        title="Add dependency"
        description="The chosen task will wait for the other one. The queue refuses to claim a task whose dependency has not completed."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEdgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={edgeSaving} onClick={() => void addEdge()}>
              {edgeSaving ? "Adding…" : "Add dependency"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50" htmlFor="edge-task">
              Task
            </label>
            <select
              id="edge-task"
              value={edgeTaskId}
              onChange={(event) => setEdgeTaskId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Choose a task…</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="edge-waits-for">
              Waits for
            </label>
            <select
              id="edge-waits-for"
              value={edgeWaitsFor}
              onChange={(event) => setEdgeWaitsFor(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Choose a task…</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-white/35">
            A task cannot wait for itself, the same dependency cannot be added twice, and a
            dependency that would close a cycle is refused — a cycle leaves every task in it
            unclaimable.
          </p>

          {edgeAddError ? (
            <p role="alert" className="text-sm text-rose-300">
              {edgeAddError}
            </p>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmCancelMission}
        onOpenChange={setConfirmCancelMission}
        title={`Cancel ${mission?.title ?? "mission"}?`}
        description="Cancelling the mission cancels every task in it that has not finished. Finished tasks are kept, and a cancelled task is never deleted."
        confirmLabel="Cancel mission"
        busy={busy}
        error={cancelError}
        onConfirm={() => void onCancel()}
      />

      <ConfirmDialog
        open={confirmRemoveEdge !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveEdge(null);
        }}
        title="Remove dependency?"
        description="The task will no longer wait for the other one, so the queue may claim it before its dependency has completed."
        confirmLabel="Remove dependency"
        busy={busy}
        error={edgeError}
        onConfirm={() => void removeEdge()}
      />
    </div>
  );
};

export default MissionDetailPage;
