// src/components/agentos/conversations/ConversationComposer.tsx
//
// The message box.
//
// WHY SENDING IS NOT ANSWERING
//   A message does not produce an answer here: it is appended to the thread
//   and queued as a task, and the worker replies when the queue runs it. The
//   composer says so after every send, because a box that accepts a message
//   and shows nothing in reply would look broken.
//
// WHY THE COMPOSER IS DISABLED WHILE A SEND IS IN FLIGHT
//   Two sends in flight would queue the same message twice. The button is
//   disabled for the whole round trip, and a failure is reported on the line
//   below rather than swallowed.

import { useCallback, useState } from "react";
import { SendHorizontal } from "lucide-react";
import {
  sendWorkerMessage,
  type SendWorkerMessageResult,
} from "../../../services/agentos/conversations";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";

export interface ConversationComposerProps {
  workerId: string;
  /** The thread to write into. A new one is opened when it is empty. */
  conversationId: string | null;
  workspaceId?: string | null;
  /** Called after a message was queued, with the thread it landed in. */
  onSent: (result: SendWorkerMessageResult) => void;
}

export const ConversationComposer: React.FC<ConversationComposerProps> = ({
  workerId,
  conversationId,
  workspaceId,
  onSent,
}) => {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setNote(null);

    const result = await sendWorkerMessage({
      workerId,
      conversationId,
      workspaceId: workspaceId ?? null,
      message: text,
    });

    setSending(false);

    if (result.error || !result.data) {
      setError(result.error?.message ?? "The message could not be sent");
      return;
    }

    setDraft("");
    setNote("Queued. The worker answers when the queue runs the task.");
    onSent(result.data);
  }, [draft, sending, workerId, conversationId, workspaceId, onSent]);

  return (
    <div className="space-y-2">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter is a newline.
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void send();
          }
        }}
        rows={3}
        disabled={sending}
        placeholder={
          conversationId
            ? "Ask the worker something…"
            : "Ask the worker something to start a conversation…"
        }
        aria-label="Message the worker"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={sending || draft.trim().length === 0} onClick={() => void send()}>
          <SendHorizontal className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {sending ? "Sending…" : "Send"}
        </Button>
        <span className="text-[11px] text-white/35">
          Enter sends · Shift + Enter adds a line
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {note ? (
        <p role="status" className="text-xs text-white/45">
          {note}
        </p>
      ) : null}
    </div>
  );
};

export default ConversationComposer;
