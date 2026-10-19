// src/components/agentos/notifications/NotificationBell.tsx
//
// The header bell: a badge with the unread count, and the notification list.
//
// WHY A POPOVER ON DESKTOP AND A MODAL ON A PHONE
//   On a wide screen a popover keeps the page behind it visible, so the user
//   does not lose their place. On a narrow screen there is no room beside the
//   bell, so the same list is shown in the shared modal instead. Both render
//   the same NotificationList, so the content never differs by viewport.
//
// WHY THE COUNT IS FETCHED HERE
//   The badge is visible whether or not the list is open, so the count is
//   loaded on mount and whenever the owner changes — not lazily when the
//   panel opens. onUnreadChange lets the host (the layout) mirror the badge.

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Modal } from "../ui";
import { countUnreadNotifications } from "../../../services/agentos/notifications";
import { NotificationList } from "./NotificationList";

export interface NotificationBellProps {
  /** The Clerk user id that owns the notifications. */
  ownerId: string;
  /**
   * Accepted for call-site symmetry. The notifications table has no
   * workspace_id column, so it is not applied.
   */
  workspaceId?: string;
  /** Called with the unread count whenever it changes. */
  onUnreadChange?: (count: number) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  ownerId,
  workspaceId,
  onUnreadChange,
}) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const refreshCount = useCallback(async () => {
    if (!ownerId) return;
    const result = await countUnreadNotifications({ ownerId });
    if (result.error) return;
    setUnread(result.data ?? 0);
    onUnreadChange?.(result.data ?? 0);
  }, [ownerId, onUnreadChange]);

  useEffect(() => {
    if (!ownerId) return;
    void refreshCount();
  }, [ownerId, refreshCount]);

  const handleUnreadChange = useCallback(
    (count: number) => {
      setUnread(count);
      onUnreadChange?.(count);
    },
    [onUnreadChange],
  );

  const list = (
    <NotificationList
      ownerId={ownerId}
      workspaceId={workspaceId}
      onUnreadChange={handleUnreadChange}
    />
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/40 text-white/60 transition hover:border-violet-400/30 hover:text-white"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full border border-[#0d0d0f] bg-violet-500 px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open && isWide ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#0d0d0f] p-3 shadow-2xl">
            {list}
          </div>
        </>
      ) : null}

      {open && !isWide ? (
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Notifications"
          className="max-w-md"
        >
          {list}
        </Modal>
      ) : null}
    </div>
  );
};

export default NotificationBell;
