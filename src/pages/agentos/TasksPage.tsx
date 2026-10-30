// src/pages/agentos/TasksPage.tsx
//
// Route: /dashboard/tasks — every task on the queue, across missions and
// conversations, after upstream's tasks view. A task opens on its mission, or
// on the agent it was assigned to when it belongs to no mission (a task sent
// from the command bar or a conversation).

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import {
  EmptyState,
  FilterGroup,
  PageHeader,
  Pill,
  SearchInput,
  Spinner,
  TASK_STATUS_STYLE,
} from "../../components/agentos/ui";
import { relativeTime } from "../../components/agentos/format";
import { listTasks } from "../../services/agentos/missions";
import { listWorkers } from "../../services/agentos/workers";
import type { Task, TaskStatus, Worker } from "../../types/agentos";

type TaskFilter = "all" | "live" | "waiting" | "failed" | "done";

const FILTERS: Array<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "live", label: "Running" },
  { value: "waiting", label: "Waiting" },
  { value: "failed", label: "Failed" },
  { value: "done", label: "Done" },
];

const FILTER_STATUSES: Record<Exclude<TaskFilter, "all">, TaskStatus[]> = {
  live: ["running", "queued"],
  waiting: ["waiting_approval", "blocked", "pending"],
  failed: ["failed"],
  done: ["completed", "cancelled"],
};

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [taskResult, workerResult] = await Promise.all([
        listTasks({ limit: 500 }),
        listWorkers({ includeArchived: true }),
      ]);
      if (cancelled) return;
      setError(taskResult.error?.message ?? workerResult.error?.message ?? null);
      setTasks(taskResult.data ?? []);
      setWorkers(workerResult.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const workerById = useMemo(() => new Map(workers.map((worker) => [worker.id, worker])), [workers]);

  const visible = useMemo(() => {
    if (!tasks) return [];
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filter !== "all" && !FILTER_STATUSES[filter].includes(task.status)) return false;
      if (!needle) return true;
      const worker = task.assigned_worker_id ? workerById.get(task.assigned_worker_id) : undefined;
      return [task.title, worker?.name].filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [tasks, filter, query, workerById]);

  return (
    <>
      <Helmet>
        <title>Tasks — SapienX AgentOS</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Tasks"
          description="Every piece of work on the queue, from missions, schedules and conversations."
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterGroup label="Filter tasks by status" options={FILTERS} value={filter} onChange={setFilter} />
          <SearchInput
            id="tasks-search"
            label="Search tasks"
            value={query}
            onChange={setQuery}
            placeholder="Search tasks or agents…"
            className="sm:w-72"
          />
        </div>

        {error ? (
          <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {!tasks ? (
          <Spinner label="Loading tasks…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tasks.length === 0 ? "No tasks yet" : "No tasks match"}
            description={
              tasks.length === 0
                ? "Instruct an agent with ⌘K, or start a mission, and its tasks appear here."
                : "Try another filter or search."
            }
          />
        ) : (
          <div className="agentos-card overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Tasks</caption>
              <thead className="border-b border-white/[0.06] text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Task</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Agent</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {visible.map((task) => {
                  const worker = task.assigned_worker_id ? workerById.get(task.assigned_worker_id) : undefined;
                  const href = task.mission_id
                    ? `/dashboard/missions/${task.mission_id}`
                    : worker
                      ? `/dashboard/workforce/${worker.id}`
                      : null;
                  const style = TASK_STATUS_STYLE[task.status];
                  return (
                    <tr key={task.id} className="hover:bg-white/[0.02]">
                      <td className="max-w-0 px-4 py-3">
                        {href ? (
                          <Link to={href} className="block truncate text-white hover:text-agentos-brand-soft">
                            {task.title}
                          </Link>
                        ) : (
                          <span className="block truncate text-white">{task.title}</span>
                        )}
                        {task.error ? (
                          <span className="block truncate text-xs text-rose-300">{task.error}</span>
                        ) : null}
                      </td>
                      <td className="hidden px-4 py-3 text-white/60 sm:table-cell">{worker?.name ?? "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <Pill tone={style.pill}>{task.status.replace("_", " ")}</Pill>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-white/40 md:table-cell">
                        {relativeTime(task.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default TasksPage;
