// src/pages/agentos/SchedulesPage.tsx
//
// Recurring automation.
//
// The page states the operational requirement honestly: a schedule row only
// records intent. Something must call agentos-sweep on a timer for a due
// schedule to become a task.

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import { ConfirmDialog, EmptyState, Modal, PageHeader, Pill, Section } from "../../components/agentos/ui";
import { absoluteTime, machineTime } from "../../components/agentos/format";
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  previewSchedule,
  setScheduleEnabled,
  updateSchedule,
} from "../../services/agentos/schedules";
import { isValidCron } from "../../services/agentos/cron";
import { listWorkers } from "../../services/agentos/workers";
import type { Schedule, Worker } from "../../types/agentos";

interface Draft {
  id: string | null;
  title: string;
  prompt: string;
  cron: string;
  timezone: string;
  workerId: string;
  enabled: boolean;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  prompt: "",
  cron: "0 9 * * 1",
  timezone: "UTC",
  workerId: "",
  enabled: true,
};

const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [schedulesResult, workersResult] = await Promise.all([
        listSchedules(),
        listWorkers(),
      ]);
      if (cancelled) return;
      setSchedules(schedulesResult.data ?? []);
      setWorkers(workersResult.data ?? []);
      setError(schedulesResult.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const workerNameById = new Map(workers.map((worker) => [worker.id, worker.name]));

  const save = useCallback(async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setDraftError("Give the schedule a title");
      return;
    }
    if (!draft.prompt.trim()) {
      setDraftError("Add the prompt this schedule will run");
      return;
    }
    if (!isValidCron(draft.cron)) {
      setDraftError("That cron expression is not valid");
      return;
    }

    setSaving(true);
    setDraftError(null);

    const payload = {
      title: draft.title,
      prompt: draft.prompt,
      cron: draft.cron,
      timezone: draft.timezone,
      worker_id: draft.workerId || null,
      enabled: draft.enabled,
    };

    const result = draft.id
      ? await updateSchedule(draft.id, payload)
      : await createSchedule(payload);

    setSaving(false);

    if (result.error) {
      setDraftError(result.error.message);
      return;
    }
    setDraft(null);
    reload();
  }, [draft, reload]);

  const toggle = useCallback(
    async (schedule: Schedule) => {
      setActionError(null);
      const result = await setScheduleEnabled(schedule.id, !schedule.enabled);
      if (result.error) {
        setActionError(`Could not change "${schedule.title}": ${result.error.message}`);
        return;
      }
      reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (schedule: Schedule) => {
      setDeleting(true);
      setDeleteError(null);
      const result = await deleteSchedule(schedule.id);
      setDeleting(false);
      if (result.error) {
        setDeleteError(result.error.message);
        return;
      }
      setPendingDelete(null);
      reload();
    },
    [reload],
  );

  const preview = draft ? previewSchedule(draft.cron, draft.timezone) : [];

  return (
    <>
      <Helmet>
        <title>Schedules — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <PageHeader
          title="Schedules"
          description="Recurring tasks. A schedule records intent and its next run; the executor must be driven for it to fire."
          actions={
            <Button size="sm" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
              <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              New schedule
            </Button>
          }
        />

        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200/80">
            Schedules fire only when something calls the scheduler sweep. Deploy pg_cron (or a
            provisioned worker) pointed at <code className="text-amber-100">agentos-sweep</code>, then
            the executor at <code className="text-amber-100">agentos-execute</code>.
          </p>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={schedules.length === 0}
          loadingRows={3}
          empty={
            <EmptyState
              icon={CalendarClock}
              title="No schedules yet"
              description="Create a recurring task and it will be dispatched to a worker on its cron schedule."
              action={
                <Button size="sm" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
                  <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  New schedule
                </Button>
              }
            />
          }
        >
          <div className="space-y-3">
            {actionError ? (
              <p role="alert" className="text-sm text-rose-300">
                {actionError}
              </p>
            ) : null}
            {schedules.map((schedule) => (
              <Section key={schedule.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{schedule.title}</p>
                      <Pill tone={schedule.enabled ? "emerald" : "slate"}>
                        {schedule.enabled ? "enabled" : "disabled"}
                      </Pill>
                      <Pill tone="sky">{schedule.cron}</Pill>
                      <Pill tone="slate">{schedule.timezone}</Pill>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-white/50">{schedule.prompt}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/35">
                      <span>
                        worker: {schedule.worker_id ? workerNameById.get(schedule.worker_id) ?? "unknown" : "unassigned"}
                      </span>
                      <span>
                        next:{" "}
                        {schedule.next_run_at ? (
                          <time dateTime={machineTime(schedule.next_run_at)} title={absoluteTime(schedule.next_run_at)}>
                            {absoluteTime(schedule.next_run_at)}
                          </time>
                        ) : (
                          "none"
                        )}
                      </span>
                      <span>
                        last:{" "}
                        {schedule.last_run_at
                          ? `${absoluteTime(schedule.last_run_at)} (${schedule.last_status ?? "unknown"})`
                          : "never"}
                      </span>
                      {schedule.last_error ? (
                        <span className="text-rose-300">{schedule.last_error}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          id: schedule.id,
                          title: schedule.title,
                          prompt: schedule.prompt,
                          cron: schedule.cron,
                          timezone: schedule.timezone,
                          workerId: schedule.worker_id ?? "",
                          enabled: schedule.enabled,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void toggle(schedule)}>
                      {schedule.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(schedule);
                      }}
                      aria-label={`Delete ${schedule.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </AsyncBoundary>
      </div>

      {draft ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
          title={draft.id ? "Edit schedule" : "New schedule"}
          description="Five-field cron: minute hour day-of-month month day-of-week."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : draft.id ? "Save changes" : "Create schedule"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50" htmlFor="sched-title">
                Title
              </label>
              <Input
                id="sched-title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-white/50" htmlFor="sched-prompt">
                Prompt
              </label>
              <Textarea
                id="sched-prompt"
                value={draft.prompt}
                onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
                rows={3}
                placeholder="Check overnight mentions and summarise the top three."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/50" htmlFor="sched-cron">
                  Cron
                </label>
                <Input
                  id="sched-cron"
                  value={draft.cron}
                  onChange={(event) => setDraft({ ...draft, cron: event.target.value })}
                  className={isValidCron(draft.cron) ? "" : "border-rose-400/50"}
                />
                {!isValidCron(draft.cron) ? (
                  <p className="mt-1 text-[11px] text-rose-300">Not a valid cron expression.</p>
                ) : null}
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="sched-tz">
                  Timezone
                </label>
                <Input
                  id="sched-tz"
                  value={draft.timezone}
                  onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50" htmlFor="sched-worker">
                Assign to
              </label>
              <select
                id="sched-worker"
                value={draft.workerId}
                onChange={(event) => setDraft({ ...draft, workerId: event.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
              >
                <option value="">Unassigned</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>

            {isValidCron(draft.cron) ? (
              <div>
                <p className="text-xs text-white/50">Next runs</p>
                <ul className="mt-1 space-y-0.5 text-xs text-white/60">
                  {preview.map((run, index) => (
                    <li key={run.toISOString()}>
                      {index + 1}. {run.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
              />
              Enabled
            </label>

            {draftError ? (
              <p role="alert" className="text-sm text-rose-300">
                {draftError}
              </p>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete this schedule?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will stop being dispatched to ${pendingDelete.worker_id ? workerNameById.get(pendingDelete.worker_id) ?? "its worker" : "a worker"}. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete schedule"
        busy={deleting}
        error={deleteError}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
      />
    </>
  );
};

export default SchedulesPage;
