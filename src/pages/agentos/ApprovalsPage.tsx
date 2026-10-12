// src/pages/agentos/ApprovalsPage.tsx
//
// Human control: the approval queue.
//
// A task parked on the approval gate stays parked until a decision here —
// rejecting cancels it, approving releases it back to the queue.

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check, ShieldAlert, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, PageHeader, Pill, Section, Spinner } from "../../components/agentos/ui";
import { decideApproval, listApprovals } from "../../services/agentos/approvals";
import type { Approval } from "../../types/agentos";

const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await listApprovals({ status: "pending" });
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        setApprovals([]);
      } else {
        setError(null);
        setApprovals(result.data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const decide = useCallback(
    async (approvalId: string, decision: "approved" | "rejected") => {
      setBusyId(approvalId);
      const result = await decideApproval({ approvalId, decision, note });
      setBusyId(null);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setNote("");
      reload();
    },
    [note, reload],
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

        <AsyncBoundary
          loading={false}
          error={error}
          onRetry={reload}
          isEmpty={approvals.length === 0}
          empty={
            <EmptyState
              icon={ShieldAlert}
              title="Nothing waiting"
              description="When a worker requests a sensitive action, it parks here until you approve or reject it."
            />
          }
        >
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Section
                key={approval.id}
                className="border-amber-400/20"
                title={approval.action_type}
                description={approval.reason || "The worker requested approval before continuing."}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                    <Pill tone="amber">pending</Pill>
                    {approval.worker_id ? <Pill tone="violet">worker</Pill> : null}
                    <span>requested {new Date(approval.requested_at).toLocaleString()}</span>
                    {approval.expires_at ? (
                      <span>· expires {new Date(approval.expires_at).toLocaleString()}</span>
                    ) : null}
                  </div>

                  {Object.keys(approval.action_payload ?? {}).length > 0 ? (
                    <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 text-[11px] text-white/50">
                      {JSON.stringify(approval.action_payload, null, 2)}
                    </pre>
                  ) : null}

                  <div>
                    <label className="text-xs text-white/50" htmlFor={`note-${approval.id}`}>
                      Decision note (optional)
                    </label>
                    <Textarea
                      id={`note-${approval.id}`}
                      value={busyId === approval.id ? note : note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      placeholder="Why are you approving or rejecting this?"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      disabled={busyId === approval.id}
                      onClick={() => void decide(approval.id, "approved")}
                    >
                      <Check className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      {busyId === approval.id ? "Recording…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                      disabled={busyId === approval.id}
                      onClick={() => void decide(approval.id, "rejected")}
                    >
                      <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </AsyncBoundary>
      </div>
    </>
  );
};

export default ApprovalsPage;
