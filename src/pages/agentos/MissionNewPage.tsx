// src/pages/agentos/MissionNewPage.tsx
//
// Mission creation: title/goal/description, then one or more tasks, each with a
// worker and optional dependencies.
//
// Submitting creates the mission, then its tasks through the agentos-tasks edge
// function (which applies the enqueue / dependency logic server-side), and
// finally links the tasks to the mission.

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { PageHeader, Section } from "../../components/agentos/ui";
import { AsyncBoundary } from "../../components/agentos/shared";
import { listWorkers } from "../../services/agentos/workers";
import { addTaskEdge, createMission, createTask } from "../../services/agentos/missions";
import type { Worker } from "../../types/agentos";

interface DraftTask {
  id: string;
  title: string;
  description: string;
  workerId: string;
  dependsOn: string[];
}

let draftCounter = 0;
const nextDraftId = () => `draft-${draftCounter++}`;

const MissionNewPage: React.FC = () => {
  const navigate = useNavigate();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<DraftTask[]>(() => [
    { id: nextDraftId(), title: "", description: "", workerId: "", dependsOn: [] },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await listWorkers();
      setWorkers(result.data ?? []);
      setLoadingWorkers(false);
    })();
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<DraftTask>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }, []);

  const addTask = useCallback(() => {
    setTasks((current) => [
      ...current,
      { id: nextDraftId(), title: "", description: "", workerId: "", dependsOn: [] },
    ]);
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((current) =>
      current.length <= 1 ? current : current.filter((task) => task.id !== id),
    );
    // Drop any dependency edges pointing at the removed draft.
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        dependsOn: task.dependsOn.filter((dependency) => dependency !== id),
      })),
    );
  }, []);

  const submit = useCallback(async () => {
    if (!title.trim()) {
      setError("Give the mission a title");
      return;
    }

    const named = tasks.filter((task) => task.title.trim().length > 0);
    if (named.length === 0) {
      setError("Add at least one task with a title");
      return;
    }

    setSubmitting(true);
    setError(null);

    const mission = await createMission({ title, goal, description });
    if (mission.error || !mission.data) {
      setSubmitting(false);
      setError(mission.error?.message ?? "Could not create the mission");
      return;
    }

    // Map draft ids to real task ids so dependencies can be resolved after the
    // tasks exist.
    const idMap = new Map<string, string>();
    const order: string[] = [];

    for (const task of named) {
      const created = await createTask({
        title: task.title.trim(),
        description: task.description,
        assigned_worker_id: task.workerId || null,
        trigger: "mission",
        input: {},
      });
      if (created.error || !created.data) {
        setSubmitting(false);
        setError(created.error?.message ?? `Could not create task "${task.title}"`);
        return;
      }
      idMap.set(task.id, created.data.id);
      order.push(task.id);
    }

    // Attach the tasks to the mission, then persist the dependency edges the
    // user drew between them (draft id -> real id). The mission and its tasks
    // are the primary artifact, so a failed edge does not abort creation.
    const { supabase } = await import("../../utils/supabase");
    for (const draftId of order) {
      const taskId = idMap.get(draftId);
      if (!taskId) continue;
      await supabase.from("tasks").update({ mission_id: mission.data.id }).eq("id", taskId);
    }

    for (const task of named) {
      const taskId = idMap.get(task.id);
      if (!taskId) continue;
      for (const depDraftId of task.dependsOn) {
        const depTaskId = idMap.get(depDraftId);
        if (!depTaskId || depTaskId === taskId) continue;
        const edge = await addTaskEdge({ taskId, waitsFor: depTaskId, kind: "depends_on" });
        if (edge.error) break;
      }
    }

    setSubmitting(false);
    navigate(`/agentos/missions/${mission.data.id}`);
  }, [title, goal, description, tasks, navigate]);

  return (
    <>
      <Helmet>
        <title>New mission — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <PageHeader
          breadcrumbs={[
            { label: "AgentOS", to: "/agentos" },
            { label: "Missions", to: "/agentos/missions" },
            { label: "New" },
          ]}
          title="New mission"
          description="Define the goal, then the tasks that get there. Each task is assigned to a worker and runs through the real queue."
        />

        <div className="space-y-5">
          <Section title="Mission">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50" htmlFor="mission-title">
                  Title
                </label>
                <Input
                  id="mission-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Weekly competitor brief"
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="mission-goal">
                  Goal
                </label>
                <Textarea
                  id="mission-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={2}
                  placeholder="One page summary of three competitors' positioning."
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="mission-description">
                  Description
                </label>
                <Textarea
                  id="mission-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Tasks"
            description="Each task runs as a queued unit. Add dependencies to sequence them, or a handoff target to chain them."
            actions={
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Add task
              </Button>
            }
          >
            <AsyncBoundary
              loading={loadingWorkers}
              error={null}
              loadingRows={2}
              isEmpty={false}
            >
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="rounded-xl border border-white/5 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white/50">Task {index + 1}</p>
                      {tasks.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="text-white/35 hover:text-rose-300"
                          aria-label={`Remove task ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <label
                          className="text-xs text-white/50"
                          htmlFor={`task-title-${task.id}`}
                        >
                          Title
                        </label>
                        <Input
                          id={`task-title-${task.id}`}
                          value={task.title}
                          onChange={(event) => patchTask(task.id, { title: event.target.value })}
                          placeholder="Research competitor pricing"
                        />
                      </div>
                      <div>
                        <label
                          className="text-xs text-white/50"
                          htmlFor={`task-description-${task.id}`}
                        >
                          Description
                        </label>
                        <Textarea
                          id={`task-description-${task.id}`}
                          value={task.description}
                          onChange={(event) =>
                            patchTask(task.id, { description: event.target.value })
                          }
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50" htmlFor={`task-worker-${task.id}`}>
                          Assign to
                        </label>
                        <select
                          id={`task-worker-${task.id}`}
                          value={task.workerId}
                          onChange={(event) => patchTask(task.id, { workerId: event.target.value })}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          <option value="">Unassigned</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name} ({worker.model_id})
                            </option>
                          ))}
                        </select>
                      </div>
                      {index > 0 ? (
                        <div>
                          <label className="text-xs text-white/50">
                            Depends on earlier tasks
                          </label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {tasks.slice(0, index).map((candidate) => (
                              <label
                                key={candidate.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/60"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.dependsOn.includes(candidate.id)}
                                  onChange={(event) =>
                                    patchTask(task.id, {
                                      dependsOn: event.target.checked
                                        ? [...task.dependsOn, candidate.id]
                                        : task.dependsOn.filter((id) => id !== candidate.id),
                                    })
                                  }
                                />
                                Task {tasks.indexOf(candidate) + 1}
                                {candidate.title ? `: ${candidate.title}` : ""}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </AsyncBoundary>
          </Section>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/agentos/missions")}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={() => void submit()}>
              {submitting ? "Creating…" : "Create mission"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MissionNewPage;
