// src/pages/agentos/OperationsPage.tsx
//
// Operations: task health, model usage, credit usage, failures, and live
// activity — all aggregated from the agentos tables, nothing simulated.
//
// "Run queue" is the honest on-demand execution trigger for deployments
// without a scheduler. It calls the executor, which claims and runs real work.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Activity, Play } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  FilterGroup,
  PageHeader,
  Pill,
  Section,
  Stat,
  TASK_STATUS_STYLE,
} from "../../components/agentos/ui";
import { absoluteTime, machineTime } from "../../components/agentos/format";
import { ExecutionActivityPanel } from "../../components/agentos/runtime";
import { listTasks, runQueuedTasks } from "../../services/agentos/missions";
import { listRuns, listRecentEvents } from "../../services/agentos/runtime";
import { listWorkers } from "../../services/agentos/workers";
import type { ExecutionEvent, ExecutionRun, Task, Worker } from "../../types/agentos";

const RANGE_HOURS: Array<{ value: string; label: string }> = [
  { value: "1", label: "1h" },
  { value: "24", label: "24h" },
  { value: "168", label: "7d" },
  { value: "720", label: "30d" },
];

interface ModelUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  credits: number;
  runs: number;
}

const OperationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [runs, setRuns] = useState<ExecutionRun[]>([]);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rangeHours, setRangeHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [runNotice, setRunNotice] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const since = new Date(Date.now() - rangeHours * 3_600_000).toISOString();
      const [tasksResult, runsResult, eventsResult, workersResult] = await Promise.all([
        listTasks({ limit: 300 }),
        listRuns({ limit: 300 }),
        listRecentEvents({ limit: 100, since }),
        listWorkers({ includeArchived: true }),
      ]);
      if (cancelled) return;

      setTasks(tasksResult.data ?? []);
      setRuns(runsResult.data ?? []);
      setEvents(eventsResult.data ?? []);
      setWorkers(workersResult.data ?? []);

      const firstError = [tasksResult, runsResult, eventsResult, workersResult].find(
        (result) => result.error,
      );
      setError(firstError?.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [rangeHours, reloadKey]);

  const workerNameById = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) counts[task.status] = (counts[task.status] ?? 0) + 1;
    return counts;
  }, [tasks]);

  const modelUsage = useMemo<ModelUsage[]>(() => {
    const acc = new Map<string, ModelUsage>();
    for (const run of runs) {
      const model = run.model_id ?? "unknown";
      const entry = acc.get(model) ?? {
        model,
        promptTokens: 0,
        completionTokens: 0,
        credits: 0,
        runs: 0,
      };
      entry.promptTokens += Number(run.prompt_tokens ?? 0);
      entry.completionTokens += Number(run.completion_tokens ?? 0);
      entry.credits += Number(run.credits ?? 0);
      entry.runs += 1;
      acc.set(model, entry);
    }
    return [...acc.values()].sort((a, b) => b.credits - a.credits);
  }, [runs]);

  const creditTotals = useMemo(() => {
    let spent = 0;
    let tokenTotal = 0;
    for (const run of runs) {
      spent += Number(run.credits ?? 0);
      tokenTotal += Number(run.prompt_tokens ?? 0) + Number(run.completion_tokens ?? 0);
    }
    return { spent: Math.round(spent * 100) / 100, tokenTotal };
  }, [runs]);

  const failureBreakdown = useMemo(() => {
    const acc = new Map<string, number>();
    for (const task of tasks) {
      if (task.status !== "failed") continue;
      const key = (task.error ?? "unknown error").slice(0, 120);
      acc.set(key, (acc.get(key) ?? 0) + 1);
    }
    return [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [tasks]);

  const workerUsage = useMemo(() => {
    const acc = new Map<string, { runs: number; credits: number; failures: number }>();
    for (const run of runs) {
      if (!run.worker_id) continue;
      const entry = acc.get(run.worker_id) ?? { runs: 0, credits: 0, failures: 0 };
      entry.runs += 1;
      entry.credits += Number(run.credits ?? 0);
      if (run.status === "failed" || run.status === "timeout") entry.failures += 1;
      acc.set(run.worker_id, entry);
    }
    return [...acc.entries()]
      .map(([workerId, value]) => ({ workerId, name: workerNameById.get(workerId) ?? workerId, ...value }))
      .sort((a, b) => b.credits - a.credits);
  }, [runs, workerNameById]);

  const onRunQueue = useCallback(async () => {
    setBusy(true);
    setRunNotice(null);
    const result = await runQueuedTasks({ limit: 3 });
    setBusy(false);
    setRunNotice(
      result.error
        ? `Could not run: ${result.error.message}`
        : `Executor claimed ${result.data?.claimed ?? 0} task(s)`,
    );
    reload();
  }, [reload]);

  return (
    <>
      <Helmet>
        <title>Operations — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Operations"
          description="Task health, model usage, credits, and failures — aggregated from the execution tables."
          actions={
            <Button size="sm" disabled={busy} onClick={() => void onRunQueue()}>
              <Play className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Run queue
            </Button>
          }
        >
        </PageHeader>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <FilterGroup
            label="Time range"
            options={RANGE_HOURS}
            value={String(rangeHours)}
            onChange={(value) => setRangeHours(Number(value))}
          />
          {runNotice ? (
            <p role="status" className="text-xs text-white/50">
              {runNotice}
            </p>
          ) : null}
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={false}
          loadingRows={4}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Tasks total" value={tasks.length} />
              <Stat
                label="Running"
                value={taskCounts.running ?? 0}
                tone="sky"
                hint={`${taskCounts.waiting_approval ?? 0} awaiting approval`}
              />
              <Stat
                label="Completed"
                value={taskCounts.completed ?? 0}
                tone="emerald"
              />
              <Stat
                label="Failed"
                value={taskCounts.failed ?? 0}
                tone={(taskCounts.failed ?? 0) > 0 ? "rose" : "neutral"}
                hint={`${failureBreakdown.length} distinct error(s)`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Stat
                label="Credits recorded"
                value={creditTotals.spent.toLocaleString()}
                tone="violet"
                hint="sum of execution run credits"
              />
              <Stat
                label="Tokens processed"
                value={creditTotals.tokenTotal.toLocaleString()}
                hint="prompt + completion across runs"
              />
            </div>

            <Section
              title="Model usage"
              description="Recorded per run, priced from the model catalog."
            >
              {modelUsage.length === 0 ? (
                <p className="text-sm text-white/45">No executions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      Model usage: runs, prompt tokens, completion tokens and credits per model.
                    </caption>
                    <thead>
                      <tr className="text-left text-xs text-white/40">
                        <th scope="col" className="pb-2 pr-4 font-medium">Model</th>
                        <th scope="col" className="pb-2 pr-4 font-medium">Runs</th>
                        <th scope="col" className="pb-2 pr-4 text-right font-medium">Prompt</th>
                        <th scope="col" className="pb-2 pr-4 text-right font-medium">Completion</th>
                        <th scope="col" className="pb-2 text-right font-medium">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelUsage.map((row) => (
                        <tr key={row.model} className="border-t border-white/5">
                          <td className="py-2 pr-4 text-white/80">{row.model}</td>
                          <td className="py-2 pr-4 tabular-nums text-white/60">{row.runs}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-white/60">
                            {row.promptTokens.toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-white/60">
                            {row.completionTokens.toLocaleString()}
                          </td>
                          <td className="py-2 text-right tabular-nums text-violet-300">
                            {Math.round(row.credits).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Failure breakdown" description="Failed tasks grouped by error.">
                {failureBreakdown.length === 0 ? (
                  <p className="text-sm text-white/45">No failures recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {failureBreakdown.map(([message, count]) => (
                      <li
                        key={message}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 break-words text-xs text-rose-200/80">
                          {message}
                        </span>
                        <Pill tone="rose">{count}</Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Usage by worker" description="Credits and failures per worker.">
                {workerUsage.length === 0 ? (
                  <p className="text-sm text-white/45">No worker executions recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {workerUsage.map((row) => (
                      <li
                        key={row.workerId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/agentos/workforce/${row.workerId}`)}
                          className="truncate text-sm text-white/80 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                        >
                          {row.name}
                        </button>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-white/45">
                          <span>{row.runs} runs</span>
                          {row.failures > 0 ? <Pill tone="rose">{row.failures} failed</Pill> : null}
                          <span className="tabular-nums text-violet-300">
                            {Math.round(row.credits).toLocaleString()} cr
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <Section
              title="Task status"
              description="Task counts straight from the queue."
            >
              <div className="flex flex-wrap gap-2">
                {Object.entries(taskCounts).map(([status, count]) => {
                  const style = TASK_STATUS_STYLE[status as keyof typeof TASK_STATUS_STYLE];
                  return (
                    <Pill key={status} tone={style?.pill ?? "slate"}>
                      {style?.label ?? status}: {count}
                    </Pill>
                  );
                })}
                {Object.keys(taskCounts).length === 0 ? (
                  <p className="text-sm text-white/45">No tasks in the queue.</p>
                ) : null}
              </div>
            </Section>

            <Section
              title="Live activity"
              description="Last 100 execution events, newest first. Refreshes when the range changes or the queue runs."
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                {events.length} event{events.length === 1 ? "" : "s"} in the last {rangeHours}h
              </div>
              {events.length === 0 ? (
                <p className="text-sm text-white/45">
                  No activity in this window. Run the queue to generate real events.
                </p>
              ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={event.level === "error" ? "rose" : event.level === "success" ? "emerald" : "sky"}>
                          {event.kind}
                        </Pill>
                        <time
                          dateTime={machineTime(event.created_at)}
                          className="text-[11px] text-white/30"
                          title={absoluteTime(event.created_at)}
                        >
                          {absoluteTime(event.created_at)}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-white/65">{event.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </AsyncBoundary>

        <div className="mt-6">
          <ExecutionActivityPanel />
        </div>
      </div>
    </>
  );
};

export default OperationsPage;
