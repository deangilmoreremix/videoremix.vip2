// src/components/agentos/conversations/ConversationThread.tsx
//
// One thread: the turns of a conversation, in order.
//
// WHY THE THREAD IS POLLED
//   The worker answers through the queue, not through this browser: the
//   message became a task, and the runtime writes the answer back when the
//   task runs. There is no push channel for that, so the thread polls while
//   an answer is outstanding and stops as soon as it arrives — the same
//   pattern the execution transcript uses.
//
// WHY THE POLL STOPS
//   A thread that is answered is finished: nothing else will be written to it
//   until the next message. Polling forever would keep a request per two
//   seconds open for a tab that is only being read.

import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, PlayCircle } from "lucide-react";
import { listMessages } from "../../../services/agentos/conversations";
import { runQueuedTasks } from "../../../services/agentos/missions";
import type { Message } from "../../../types/agentos";
import { Button } from "../../ui/button";
import { EmptyState, Pill, Spinner } from "../ui";
import { absoluteTime, machineTime, relativeTime } from "../format";

/** The poll interval of the execution transcript, reused for the same reason. */
const POLL_MS = 2_000;

export interface ConversationThreadProps {
  /** The thread to read. `null` when no thread is open. */
  conversationId: string | null;
  /** Bumped when something outside the thread changed it (a message was sent). */
  refreshKey?: number;
  /** Called when the thread gained turns, so the list can catch up. */
  onChanged?: () => void;
}

/** How one turn is rendered. */
const ROLE_STYLE: Record<string, { label: string; bubble: string; align: string }> = {
  user: {
    label: "You",
    bubble: "border-violet-400/30 bg-violet-500/10 text-white/85",
    align: "ml-auto",
  },
  assistant: {
    label: "Worker",
    bubble: "border-white/10 bg-black/40 text-white/80",
    align: "",
  },
  system: {
    label: "System",
    bubble: "border-white/10 bg-white/[0.03] text-white/55",
    align: "",
  },
  tool: {
    label: "Tool",
    bubble: "border-sky-400/25 bg-sky-500/10 text-sky-100/80",
    align: "",
  },
};

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  conversationId,
  refreshKey = 0,
  onChanged,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [running, setRunning] = useState(false);
  const [runNote, setRunNote] = useState<string | null>(null);

  // The number of turns the thread had the last time it was read. A change
  // means the worker answered (or a turn was added), and the list of threads
  // has to catch up with it.
  const turnCountRef = useRef<number | null>(null);

  // WHY THE CALLBACK IS HELD IN A REF
  //   The parent passes a fresh arrow on every render. Depending on it would
  //   rebuild the loader on every render, and the loader is what the effect
  //   that reads the thread runs on — a render loop.
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const result = await listMessages(conversationId);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    const rows = result.data ?? [];
    setMessages(rows);

    const previous = turnCountRef.current;
    turnCountRef.current = rows.length;
    if (previous !== null && rows.length !== previous) {
      onChangedRef.current?.();
    }

    setError(null);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    // A new thread starts with an unknown turn count: the turns of the
    // previous one are not a change of this one.
    turnCountRef.current = null;
    setLoading(true);
    void load();
  }, [load, reloadKey, refreshKey]);

  // An answer is outstanding while the last turn is the operator's.
  const awaitingReply =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  useEffect(() => {
    if (!conversationId || !awaitingReply) return;
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [conversationId, awaitingReply, load]);

  /**
   * Ask the queue to run the pending work now.
   *
   * WHY THIS EXISTS
   *   The queue is normally driven by the scheduler (a cron job on the project).
   *   Without one, a message would sit in the queue until the operator waited
   *   for the next sweep. This runs the oldest due task of the caller — the
   *   edge function refuses to run anybody else's work.
   */
  const runQueue = useCallback(async () => {
    setRunning(true);
    setRunNote(null);
    const result = await runQueuedTasks({ limit: 1 });
    setRunning(false);
    if (result.error) {
      setRunNote(`Could not run the queue: ${result.error.message}`);
      return;
    }
    setRunNote(
      result.data?.claimed
        ? "The queue ran the oldest due task. The answer appears here when the run finishes."
        : "Nothing was due in the queue.",
    );
  }, []);

  if (!conversationId) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No thread open"
        description="Choose a conversation on the left, or send a message to start a new one."
      />
    );
  }

  if (loading) {
    return <Spinner label="Loading the conversation…" />;
  }

  if (error) {
    return (
      <div role="alert" className="space-y-2">
        <p className="text-sm text-rose-300">Could not load the conversation ({error}).</p>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="This thread is empty"
          description="The first message starts it. The worker answers when the queue runs the task."
        />
      ) : (
        <ol className="space-y-2" aria-label="Conversation">
          {messages.map((message) => {
            const style = ROLE_STYLE[message.role] ?? ROLE_STYLE.system;
            return (
              <li key={message.id} className={style.align}>
                <div
                  className={`max-w-[85%] rounded-xl border px-3 py-2.5 ${style.bubble}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={message.role === "user" ? "violet" : "slate"}>
                      {style.label}
                    </Pill>
                    <time
                      dateTime={machineTime(message.created_at)}
                      className="text-[11px] text-white/35"
                      title={absoluteTime(message.created_at)}
                    >
                      {relativeTime(message.created_at) || "just now"}
                    </time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {awaitingReply ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2.5">
          <p className="text-xs text-amber-100/80">
            Waiting for the worker&apos;s answer. The queue runs the task automatically; the
            answer appears here when it does.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300/30 bg-transparent text-amber-100 hover:bg-amber-500/10"
            disabled={running}
            onClick={() => void runQueue()}
          >
            <PlayCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {running ? "Running…" : "Run the queue now"}
          </Button>
        </div>
      ) : null}

      {runNote ? (
        <p role="status" className="text-xs text-white/45">
          {runNote}
        </p>
      ) : null}
    </div>
  );
};

export default ConversationThread;
