// src/components/agentos/conversations/ConversationList.tsx
//
// The threads of one worker.
//
// WHY THE LIST IS OWNED BY THE COMPONENT
//   The panel is the only place a list of conversations appears, and it is
//   the only place that needs to refresh it: a new thread appears when the
//   operator sends the first message. Keeping the load here means the page
//   only has to say "something changed" (the refreshKey) instead of holding
//   the list state and the selection state apart.

import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { listConversations } from "../../../services/agentos/conversations";
import type { Conversation } from "../../../types/agentos";
import { AsyncBoundary } from "../shared";
import { EmptyState } from "../ui";
import { Button } from "../../ui/button";
import { relativeTime } from "../format";

export interface ConversationListProps {
  workerId: string;
  /** The thread that is open, if any. */
  selectedConversationId?: string | null;
  /** Open a thread. `null` starts a new one on the next message. */
  onSelect: (conversation: Conversation | null) => void;
  /** Bumped when something outside the list changed it (a message was sent). */
  refreshKey?: number;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  workerId,
  selectedConversationId,
  onSelect,
  refreshKey = 0,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!workerId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const result = await listConversations({ workerId });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    setConversations(result.data ?? []);
    setError(null);
    setLoading(false);
  }, [workerId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, reloadKey, refreshKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">Threads</p>
        {selectedConversationId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(null)}
            title="Start a new thread. The next message opens one."
          >
            <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New
          </Button>
        ) : null}
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((key) => key + 1)}
        isEmpty={conversations.length === 0}
        empty={
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Ask the worker something and the thread appears here."
          />
        }
      >
        <ul className="space-y-2" aria-label="Conversations">
          {conversations.map((conversation) => {
            const selected = conversation.id === selectedConversationId;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation)}
                  aria-current={selected ? "true" : undefined}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                    selected
                      ? "border-violet-400/40 bg-violet-500/10"
                      : "border-white/5 bg-black/30 hover:border-white/15"
                  }`}
                >
                  <p
                    className={`truncate text-sm ${selected ? "text-white/90" : "text-white/70"}`}
                  >
                    {conversation.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {conversation.message_count} message
                    {conversation.message_count === 1 ? "" : "s"} ·{" "}
                    {relativeTime(conversation.updated_at) || "just now"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </AsyncBoundary>
    </div>
  );
};

export default ConversationList;
