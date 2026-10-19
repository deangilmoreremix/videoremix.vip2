// src/pages/agentos/ApprovalsPage.tsx
//
// Human control: the approval queue and its history.
//
// A task parked on the approval gate stays parked until a decision here —
// rejecting cancels it, approving releases it back to the queue. A rejection
// is irreversible, so it is confirmed before it is sent.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Check, ShieldAlert, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  APPROVAL_STATUS_STYLE,
  EmptyState,
  FilterGroup,
  PageHeader,
  Pill,
  Section,
  Spinner,
} from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import { absoluteTime, relativeTime } from "../../components/agentos/format";
import {
  DECIDED_APPROVAL_STATUSES,
  decideApproval,
  listApprovals,
} from "../../services/agentos/approvals";
import { listTasks } from "../../services/agentos/missions";
import { listWorkers } from "../../services/agentos/workers";
import type { Approval, Task, Worker } from "../../types/agentos";

type ApprovalFilter = "pending" | "decided" | "all";

const FILTERS: Array<{ value: ApprovalFilter; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "decided", label: "Decided" },
  { value: "all", label: "All" },
];

const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApprovalFilter>("pending");
  const [status, setStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<Approval | null>(null);
  // One note per approval card: each decision must carry the note typed on
  // its own card, not a single value shared across every row.
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [approvalsResult, tasksResult, workersResult] = await Promise.all([
        listApprovals(
          filter === "pending"
            ? { status: "pending" }
            : filter === "decided"
              ? { status: [...DECIDED_APPROVAL_STATUSES] }
              : {},
        ),
        listTasks({ limit: 300 }),
        listWorkers({ includeArchived: true }),
      ]);
      if (cancelled) return;
      if (approvalsResult.error) {
        setError(approvalsResult.error.message);
        setApprovals([]);
      } else {
        setError(null);
        setApprovals(approvalsResult.data ?? []);
      }
      setTasks(tasksResult.data ?? []);
      setWorkers(workersResult.data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, reloadKey]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const workerById = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker])),
    [workers],
  );

  const decide = useCallback(
    async (approval: Approval, decision: "approved" | "rejected") => {
      setBusyId(approval.id);
      setActionError(null);
      const result = await decideApproval({
        approvalId: approval.id,
        decision,
        note: notes[approval.id] ?? "",
      });
      setBusyId(null);
      if (result.error) {
        setActionError(`Could not record the decision: ${result.error.message}`);
        return;
      }
      setNotes((current) => {
        const next = { ...current };
        delete next[approval.id];
        return next;
      });
      setStatus(
        decision === "approved"
          ? `Approved ${approval.action_type}`
          : `Rejected ${approval.action_type}. The parked task was cancelled.`,
      );
      setConfirmReject(null);
      reload();
    },
    [notes, reload],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Spinner label="Loading approvals…" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Approvals — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Approvals"
          description="Sensitive actions wait here. Nothing runs past a gate until you decide."
        />

        <FilterGroup
          className="mb-5"
          label="Filter approvals by state"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />

        {status ? (
          <p role="status" className="mb-4 text-sm text-white/60">
            {status}
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="mb-4 text-sm text-rose-300">
            {actionError}
          </p>
        ) : null}

        <AsyncBoundary
          loading={false}
          error={error}
          onRetry={reload}
          isEmpty={approvals.length === 0}
          empty={
            <EmptyState
              icon={ShieldAlert}
              title={
                filter === "decided" ? "No decisions yet" : "Nothing waiting"
              }
              description={
                filter === "decided"
                  ? "Decided approvals are listed here once a human has approved or rejected them."
                  : "When a worker requests a sensitive action, it parks here until you approve or reject it."
              }
            />
          }
        >
          <div className="space-y-4">
            {approvals.map((approval) => {
              const task = approval.task_id ? taskById.get(approval.task_id) : undefined;
              const worker = approval.worker_id ? workerById.get(approval.worker_id) : undefined;
              const decided = approval.status !== "pending";

              return (
                <Section
                  key={approval.id}
                  className={decided ? "" : "border-amber-400/20"}
                  title={approval.action_type}
                  description={approval.reason || "The worker requested approval before continuing."}
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                      <Pill tone={APPROVAL_STATUS_STYLE[approval.status].pill}>
                        {approval.status}
                      </Pill>
                      {worker ? (
                        <Link
                          to={`/agentos/workforce/${worker.id}`}
                          className="text-violet-300 underline"
                        >
                          {worker.name}
                        </Link>
                      ) : approval.worker_id ? (
                        <span className="text-white/40">worker {approval.worker_id}</span>
                      ) : null}
                      {task ? (
                        <Link
                          to={
                            task.mission_id
                              ? `/agentos/missions/${task.mission_id}`
                              : "/agentos/missions"
                          }
                          className="text-violet-300 underline"
                        >
                          {task.title}
                        </Link>
                      ) : approval.task_id ? (
                        <span className="text-white/40">task {approval.task_id}</span>
                      ) : null}
                      <span>
                        requested {relativeTime(approval.requested_at) || absoluteTime(approval.requested_at)}
                      </span>
                      {approval.expires_at ? (
                        <span>· expires {new Date(approval.expires_at).toLocaleString()}</span>
                      ) : null}
                    </div>

                    {decided ? (
                      <dl className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-white/45">Decision</dt>
                          <dd className="text-white/75">{approval.status}</dd>
                        </div>
                        <div>
                          <dt className="text-white/45">Decided by</dt>
                          <dd className="break-all text-white/75">
                            {approval.decided_by ?? "unknown"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-white/45">Decided</dt>
                          <dd className="text-white/75">
                            {approval.decided_at
                              ? new Date(approval.decided_at).toLocaleString()
                              : "unknown"}
                          </dd>
                        </div>
                        <div className="sm:col-span-3">
                          <dt className="text-white/45">Note</dt>
                          <dd className="whitespace-pre-wrap text-white/75">
                            {approval.decision_note || "No note was recorded."}
                          </dd>
                        </div>
                      </dl>
                    ) : null}

                    {Object.keys(approval.action_payload ?? {}).length > 0 ? (
                      <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 text-[11px] text-white/50">
                        {JSON.stringify(approval.action_payload, null, 2)}
                      </pre>
                    ) : null}

                    {!decided ? (
                      <>
                        <div>
                          <label className="text-xs text-white/50" htmlFor={`note-${approval.id}`}>
                            Decision note (optional)
                          </label>
                          <Textarea
                            id={`note-${approval.id}`}
                            value={notes[approval.id] ?? ""}
                            onChange={(event) =>
                              setNotes((current) => ({ ...current, [approval.id]: event.target.value }))
                            }
                            rows={2}
                            placeholder="Why are you approving or rejecting this?"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500"
                            disabled={busyId === approval.id}
                            onClick={() => void decide(approval, "approved")}
                          >
                            <Check className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                            {busyId === approval.id ? "Recording…" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                            disabled={busyId === approval.id}
                            onClick={() => setConfirmReject(approval)}
                          >
                            <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                            Reject
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Section>
              );
            })}
          </div>
        </AsyncBoundary>
      </div>

      {confirmReject ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setConfirmReject(null);
          }}
          title={`Reject ${confirmReject.action_type}?`}
          description="Rejecting cancels the parked task on the server. There is no undo: the task has to be created again."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmReject(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-700 hover:bg-rose-600"
                disabled={busyId === confirmReject.id}
                onClick={() => void decide(confirmReject, "rejected")}
              >
                {busyId === confirmReject.id ? "Recording…" : "Reject and cancel"}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-white/60">
              The task stays attached to this approval and is marked cancelled.
            </p>
            <div>
              <label className="text-xs text-white/50" htmlFor={`reject-note-${confirmReject.id}`}>
                Decision note
              </label>
              <Textarea
                id={`reject-note-${confirmReject.id}`}
                value={notes[confirmReject.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [confirmReject.id]: event.target.value }))
                }
                rows={2}
                placeholder="Why are you rejecting this?"
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
};

export default ApprovalsPage;
