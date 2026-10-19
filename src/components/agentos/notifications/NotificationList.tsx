// src/components/agentos/notifications/NotificationList.tsx
//
// The list behind the notification bell.
//
// WHY THE LIST FETCHES FOR ITSELF
//   The bell and the list are used together (a popover on desktop, a modal on
//   a phone) and the list is the only thing that needs the rows, so it owns
//   the read. That keeps the bell a thin badge + container, and lets the
//   list be rendered on its own later.

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "../../ui/button";
import { AsyncBoundary } from "../shared";
import { EmptyState, Pill } from "../ui";
import { machineTime, relativeTime } from "../format";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../../services/agentos/notifications";
import type { AgentNotification } from "../../../types/agentos";

export interface NotificationListProps {
  /** The Clerk user id that owns the notifications. */
  ownerId: string;
  /**
   * Accepted for call-site symmetry. The notifications table has no
   * workspace_id column, so it is not applied.
   */
  workspaceId?: string;
  /** Show only unread notifications. */
  unreadOnly?: boolean;
  /** Called with the unread count whenever it changes. */
  onUnreadChange?: (count: number) => void;
  /** Called after a notification is marked read. */
  onRead?: (notification: AgentNotification) => void;
  /** How many notifications to load. */
  limit?: number;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  ownerId,
  workspaceId,
  unreadOnly = false,
  onUnreadChange,
  onRead,
  limit = 50,
}) => {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await listNotifications({
        ownerId,
        workspaceId,
        unreadOnly,
        limit,
      });
      if (cancelled) return;
      setNotifications(result.data ?? []);
      setError(result.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, workspaceId, unreadOnly, limit, reloadKey]);

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  const handleRead = useCallback(
    async (notification: AgentNotification) => {
      if (notification.read_at) {
        onRead?.(notification);
        return;
      }

      const result = await markNotificationRead(notification.id);
      if (result.error) {
        setError(result.error.message);
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: result.data?.read_at ?? new Date().toISOString() }
            : item,
        ),
      );
      onUnreadChange?.(Math.max(unreadCount - 1, 0));
      onRead?.(notification);
    },
    [onRead, onUnreadChange, unreadCount],
  );

  const handleMarkAll = useCallback(async () => {
    const result = await markAllNotificationsRead({ ownerId });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onUnreadChange?.(0);
    setReloadKey((key) => key + 1);
  }, [ownerId, onUnreadChange]);

  return (
    <div className="flex max-h-[26rem] min-h-[8rem] flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-white/45">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        {unreadCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => void handleMarkAll()}>
            <CheckCheck className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </Button>
        ) : null}
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((key) => key + 1)}
        isEmpty={notifications.length === 0}
        loadingRows={3}
        empty={
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You are notified here when a run finishes, an approval is needed, or a worker hands work over."
            className="border-none bg-transparent px-2 py-6"
          />
        }
      >
        <ul className="space-y-2 overflow-y-auto">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => void handleRead(notification)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  notification.read_at
                    ? "border-white/5 bg-black/20 hover:border-white/10"
                    : "border-violet-400/20 bg-violet-500/10 hover:border-violet-400/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${
                      notification.read_at ? "text-white/65" : "font-medium text-white"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {notification.read_at ? null : (
                    <Pill tone="violet">new</Pill>
                  )}
                </div>
                {notification.body ? (
                  <p className="mt-1 line-clamp-2 text-xs text-white/50">{notification.body}</p>
                ) : null}
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/30">
                  <Pill tone="slate">{notification.kind}</Pill>
                  <time dateTime={machineTime(notification.created_at)}>
                    {relativeTime(notification.created_at)}
                  </time>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </AsyncBoundary>
    </div>
  );
};

export default NotificationList;
