// src/services/agentos/notifications.ts
//
// The notification inbox behind the header bell.
//
// SCOPE
//   agentos.notifications is owned by a single Clerk user: the table has an
//   `owner_clerk_id` and nothing else that narrows it.
//
// WHY THERE IS NO WORKSPACE FILTER
//   Verified against the migration
//   (supabase/migrations/20261012120200_agentos_knowledge_connections.sql):
//   agentos.notifications has NO workspace_id column. Filtering on one would
//   fail at runtime with PGRST100, so the option is accepted for call-site
//   symmetry and deliberately NOT applied — a notification is addressed to a
//   person, not to a workspace.
//
// WRITES
//   Marking a notification read is a client write, which the notifications_all
//   RLS policy allows for the row's owner. Read state is the only writable
//   thing about a notification, so nothing else is exposed here.

import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type AgentNotification,
} from "../../types/agentos";

const DEFAULT_LIMIT = 50;

/**
 * How many unread rows are read when the database cannot report a count.
 * The bell only needs a number, so this stays small.
 */
const UNREAD_PROBE_LIMIT = 200;

export interface NotificationListOptions {
  /** The Clerk user id that owns the notifications. */
  ownerId: string;
  /**
   * Accepted for call-site symmetry. NOT applied: the notifications table has
   * no workspace_id column.
   */
  workspaceId?: string;
  /** Only notifications that have not been read yet. */
  unreadOnly?: boolean;
  limit?: number;
}

/**
 * Notifications for an owner, newest first.
 */
export async function listNotifications(
  options: NotificationListOptions,
): Promise<AgentOSResult<AgentNotification[]>> {
  if (!options?.ownerId) return err("validation", "ownerId is required");

  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 200);

  let query = agentosDb
    .from("notifications")
    .select("*")
    .eq("owner_clerk_id", options.ownerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.unreadOnly) query = query.is("read_at", null);

  const { data, error } = await query;
  if (error) {
    return err("database", "Could not load notifications", agentosErrorMessage(error));
  }
  return ok((data ?? []) as AgentNotification[]);
}

/**
 * How many notifications the owner has not read.
 *
 * The exact count is requested from the database; when the count is not
 * reported the rows themselves are counted, so the badge is never a silent
 * zero.
 */
export async function countUnreadNotifications(options: {
  ownerId: string;
}): Promise<AgentOSResult<number>> {
  if (!options?.ownerId) return err("validation", "ownerId is required");

  const { data, error } = await agentosDb
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("owner_clerk_id", options.ownerId)
    .is("read_at", null)
    .limit(UNREAD_PROBE_LIMIT);

  if (error) {
    return err("database", "Could not count notifications", agentosErrorMessage(error));
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  const reported = typeof data?.count === "number" ? data.count : null;
  return ok(reported ?? rows.length);
}

/**
 * Mark one notification read. Idempotent: re-marking an already-read
 * notification just moves the timestamp forward.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<AgentOSResult<AgentNotification | null>> {
  if (!notificationId) return err("validation", "notificationId is required");

  const { data, error } = await agentosDb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("*")
    .maybeSingle();

  if (error) {
    return err("database", "Could not mark the notification read", agentosErrorMessage(error));
  }
  return ok((data ?? null) as AgentNotification | null);
}

/**
 * Mark every unread notification of an owner read. Returns how many rows
 * were updated so the bell badge can be zeroed without a second query.
 */
export async function markAllNotificationsRead(options: {
  ownerId: string;
}): Promise<AgentOSResult<number>> {
  if (!options?.ownerId) return err("validation", "ownerId is required");

  const { data, error } = await agentosDb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("owner_clerk_id", options.ownerId)
    .is("read_at", null)
    .select("id");

  if (error) {
    return err("database", "Could not mark notifications read", agentosErrorMessage(error));
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  return ok(rows.length);
}
