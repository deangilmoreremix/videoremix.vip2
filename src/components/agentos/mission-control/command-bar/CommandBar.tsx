// src/components/agentos/mission-control/command-bar/CommandBar.tsx
//
// Cmd/Ctrl+K command bar, after upstream's command-bar: it searches the
// operator's agents and missions, and it instructs an agent. Choosing an
// agent and typing an instruction sends it through sendWorkerMessage — the
// message lands in a conversation and a task carries it to the worker, so the
// instruction is real work on the queue, not a note.
//
// The bar loads its own index when it opens, so it works on every dashboard
// page, not only on the canvas.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, ListChecks, Send } from "lucide-react";
import { listWorkers } from "../../../../services/agentos/workers";
import { listMissions } from "../../../../services/agentos/missions";
import { sendWorkerMessage } from "../../../../services/agentos/conversations";
import type { Mission, Worker } from "../../../../types/agentos";

export interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Overrides what selecting a worker does (the canvas focuses its node). */
  onSelectWorker?: (workerId: string) => void;
  onSelectMission?: (missionId: string) => void;
}

interface Result {
  id: string;
  kind: "agent" | "mission";
  title: string;
  subtitle: string;
  worker?: Worker;
  missionId?: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  open,
  onOpenChange,
  onSelectWorker,
  onSelectMission,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [target, setTarget] = useState<Worker | null>(null);
  const [instruction, setInstruction] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setTarget(null);
    setInstruction("");
    setSendError(null);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const [workerResult, missionResult] = await Promise.all([
        listWorkers(),
        listMissions({ limit: 50 }),
      ]);
      if (cancelled) return;
      setWorkers(workerResult.data ?? []);
      setMissions(missionResult.data ?? []);
      setLoadError(workerResult.error?.message ?? missionResult.error?.message ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();
    const list: Result[] = [
      ...workers.map((worker) => ({
        id: `worker:${worker.id}`,
        kind: "agent" as const,
        title: worker.name,
        subtitle: `${worker.role || "no role"} · ${worker.model_id}`,
        worker,
      })),
      ...missions.map((mission) => ({
        id: `mission:${mission.id}`,
        kind: "mission" as const,
        title: mission.title,
        subtitle: `mission · ${mission.status}`,
        missionId: mission.id,
      })),
    ];
    if (!needle) return list.slice(0, 20);
    return list
      .filter((entry) => [entry.title, entry.subtitle].join(" ").toLowerCase().includes(needle))
      .slice(0, 20);
  }, [query, workers, missions]);

  const openResult = (result: Result) => {
    if (result.worker) {
      if (onSelectWorker) onSelectWorker(result.worker.id);
      else navigate(`/dashboard/workforce/${result.worker.id}`);
    } else if (result.missionId) {
      if (onSelectMission) onSelectMission(result.missionId);
      else navigate(`/dashboard/missions/${result.missionId}`);
    }
    close();
  };

  const send = async () => {
    if (!target || !instruction.trim()) return;
    setSending(true);
    setSendError(null);
    const result = await sendWorkerMessage({
      workerId: target.id,
      workspaceId: target.workspace_id,
      message: instruction,
    });
    setSending(false);
    if (result.error || !result.data) {
      setSendError(result.error?.message ?? "Could not send the instruction");
      return;
    }
    const conversationId = result.data.conversation.id;
    close();
    navigate(`/dashboard/workforce/${target.id}?conversation=${conversationId}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command bar"
        className="agentos-panel agentos-float-up w-full max-w-xl overflow-hidden rounded-2xl"
      >
        {target ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <button
                type="button"
                onClick={() => setTarget(null)}
                aria-label="Back to search"
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Bot className="h-4 w-4 text-agentos-brand" aria-hidden="true" />
              <span className="text-sm font-medium text-white">Instruct {target.name}</span>
            </div>
            <textarea
              autoFocus
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={4}
              placeholder="What should this agent do?"
              aria-label="Instruction"
              className="block w-full resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
            {sendError ? (
              <p role="alert" className="px-4 pb-2 text-xs text-rose-300">
                {sendError}
              </p>
            ) : null}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2.5">
              <span className="text-[11px] text-white/35">
                Sent as a task on the queue · ⌘↵ to send
              </span>
              <button
                type="submit"
                disabled={sending || !instruction.trim()}
                className="bg-agentos-brand inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="border-b border-white/[0.06] p-3">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents and missions, or pick an agent to instruct…"
                aria-label="Search"
                className="w-full bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            {loadError ? (
              <p role="alert" className="px-4 pt-3 text-xs text-rose-300">
                {loadError}
              </p>
            ) : null}
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-white/35">
                  {query ? `No matches for “${query}”.` : "No agents or missions yet."}
                </li>
              ) : (
                results.map((result) => (
                  <li key={result.id} className="group flex items-center gap-1 rounded-xl hover:bg-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => openResult(result)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
                    >
                      {result.kind === "agent" ? (
                        <Bot className="h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
                      ) : (
                        <ListChecks className="h-4 w-4 shrink-0 text-agentos-accent" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{result.title}</span>
                        <span className="block truncate text-[11px] text-white/35">{result.subtitle}</span>
                      </span>
                    </button>
                    {result.worker ? (
                      <button
                        type="button"
                        onClick={() => setTarget(result.worker ?? null)}
                        className="mr-2 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/60 hover:border-agentos-brand/50 hover:text-white"
                      >
                        Instruct
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default CommandBar;
