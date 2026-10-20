// src/services/agentos/conversations.ts
//
// Direct worker chat: the threads between a person and a worker.
//
// WHY THIS FILE EXISTS
//   agentos.conversations and agentos.messages have been in the schema since
//   the first AgentOS migration, with a message-count trigger and a
//   bump_conversation_count() to keep the counter honest. Nothing in the port
//   read or wrote them, so the tables were permanently empty and the product
//   had no way to talk to a worker at all.
//
// HOW A MESSAGE BECOMES AN ANSWER
//   Sending a message does NOT call a model. It appends the user's turn to
//   the thread and creates a TASK — the queue's unit of work — whose input
//   carries the prompt and the conversation it belongs to. The queue runs the
//   task later, and the runtime writes the worker's answer back into the same
//   thread (see supabase/functions/agentos-execute/index.ts).
//
//   That is why the UI never pretends the answer is instant: the round trip
//   goes through the same queue every other piece of work goes through.
//
// WHO OWNS WHAT
//   The thread belongs to the person who opened it: agentos.messages may only
//   be inserted into a conversation the caller owns or one in a workspace they
//   belong to. The service therefore reports an RLS refusal as a clear
//   "forbidden" instead of letting it look like an empty thread.

import { agentosDb, agentosErrorMessage } from "./client";
import { createTask } from "./missions";
import {
  err,
  ok,
  type AgentOSResult,
  type Conversation,
  type Message,
  type MessageRole,
  type Task,
} from "../../types/agentos";

/** How long a conversation title may be. A title is a label, not a transcript. */
const TITLE_MAX_LENGTH = 80;

/**
 * The title of a thread, derived from the first message.
 *
 * WHY A TITLE AT ALL
 *   agentos.conversations.title is NOT NULL and defaults to 'New
 *   conversation', which tells the operator nothing when a worker has a dozen
 *   threads. The first message is the best available label for it.
 */
export function conversationTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= TITLE_MAX_LENGTH) return clean;
  return `${clean.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * The conversations visible to the caller, newest first.
 *
 * WHY A WORKER FILTER
 *   The panel lives on the worker detail page, so the list is scoped to that
 *   worker. The RLS still applies underneath: a caller only ever sees a
 *   conversation they own or one in a workspace they belong to.
 */
export async function listConversations(options: {
  workerId?: string;
  limit?: number;
} = {}): Promise<AgentOSResult<Conversation[]>> {
  let query = agentosDb
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.workerId) query = query.eq("worker_id", options.workerId);

  const { data, error } = await query;
  if (error) return err("database", "Could not load conversations", agentosErrorMessage(error));
  return ok((data ?? []) as Conversation[]);
}

export async function getConversation(
  conversationId: string,
): Promise<AgentOSResult<Conversation>> {
  if (!conversationId) return err("validation", "conversationId is required");

  const { data, error } = await agentosDb
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) return err("database", "Could not load the conversation", agentosErrorMessage(error));
  if (!data) return err("not_found", "That conversation is no longer available");
  return ok(data as Conversation);
}

export interface CreateConversationInput {
  workerId?: string | null;
  workspaceId?: string | null;
  title: string;
}

/**
 * Open a thread.
 *
 * WHY owner_clerk_id IS NOT SENT
 *   The column is NOT NULL, but the database stamps it from the verified JWT
 *   (agentos.stamp_owner) on every insert, and the RLS policy checks that
 *   same value. Sending a client-supplied owner would be ignored by the
 *   trigger anyway, and a caller must not be able to forge one.
 */
export async function createConversation(
  input: CreateConversationInput,
): Promise<AgentOSResult<Conversation>> {
  const title = input.title.trim();
  if (!title) return err("validation", "Give the conversation a title");

  const insert = async (workspaceId: string | null) =>
    agentosDb
      .from("conversations")
      .insert({
        worker_id: input.workerId ?? null,
        workspace_id: workspaceId,
        title,
        channel: "ui",
      })
      .select("*")
      .single();

  const { data, error } = await insert(input.workspaceId ?? null);

  // WHY THE RETRY WITHOUT THE WORKSPACE
  //   A thread that names a workspace belongs to that workspace, and the
  //   policy refuses the insert when the caller is not one of its members. A
  //   worker can outlive a membership, and a personal chat with your own
  //   worker must not be blocked by that: the thread is then opened without
  //   the workspace, which makes it yours alone.
  if (error && isRefusedWrite(error) && input.workspaceId) {
    const retry = await insert(null);
    if (!retry.error && retry.data) return ok(retry.data as Conversation);
  }

  if (error) return err("database", "Could not open the conversation", agentosErrorMessage(error));
  return ok(data as Conversation);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** The turns of one thread, oldest first. */
export async function listMessages(
  conversationId: string,
): Promise<AgentOSResult<Message[]>> {
  if (!conversationId) return err("validation", "conversationId is required");

  const { data, error } = await agentosDb
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return err("database", "Could not load the conversation", agentosErrorMessage(error));
  return ok((data ?? []) as Message[]);
}

export interface AppendMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  runId?: string | null;
  tokens?: number;
}

/**
 * Append one turn to a thread.
 *
 * WHY A ROW-LEVEL-SECURITY REFUSAL IS ITS OWN ERROR
 *   agentos.messages may only be written into a conversation the caller owns
 *   or one in a workspace they belong to. A caller who is not allowed to write
 *   must be told so — a silent no-op would look exactly like a thread that
 *   simply never got its message.
 */
export async function appendMessage(
  input: AppendMessageInput,
): Promise<AgentOSResult<Message>> {
  if (!input.conversationId) return err("validation", "conversationId is required");
  if (!input.content.trim()) return err("validation", "The message is empty");

  const { data, error } = await agentosDb
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content.trim(),
      run_id: input.runId ?? null,
      tokens: input.tokens ?? 0,
      tool_calls: [],
    })
    .select("*")
    .single();

  if (error) {
    if (isRefusedWrite(error)) {
      return err(
        "forbidden",
        "This conversation does not accept your messages. Ask the owner of the workspace to add you to it.",
        agentosErrorMessage(error),
      );
    }
    return err("database", "Could not add the message", agentosErrorMessage(error));
  }

  // A write that affected no row is a refused write, not a successful one.
  // Postgres raises on a policy violation, but a statement that simply
  // matched nothing returns no row and no error — and a message that was
  // never written must never look like one that was.
  if (!data) {
    return err(
      "forbidden",
      "This conversation does not accept your messages. Ask the owner of the workspace to add you to it.",
    );
  }

  return ok(data as Message);
}

// ---------------------------------------------------------------------------
// Sending a message
// ---------------------------------------------------------------------------

export interface SendWorkerMessageInput {
  workerId: string;
  /** The thread to write into. A new one is opened when it is empty. */
  conversationId?: string | null;
  workspaceId?: string | null;
  message: string;
}

export interface SendWorkerMessageResult {
  conversation: Conversation;
  message: Message;
  task: Task;
}

/**
 * Send a message to a worker.
 *
 * THE THREE STEPS, IN THIS ORDER
 *   1. The thread. An existing one is reused; otherwise a new one is opened
 *      and titled after the message.
 *   2. The user's turn, appended to the thread.
 *   3. The task that carries the message to the worker.
 *
 * WHY THE MESSAGE GOES IN BEFORE THE TASK
 *   The task is what the worker answers; the message is what it answers. If
 *   the thread refuses the message (row-level security), the task must not
 *   exist yet — a queued task with no message in the thread would make the
 *   worker answer something the operator never wrote. The reverse order is
 *   safe: if the task cannot be created, the message is already in the
 *   thread and the error says so.
 *
 * WHY THE TASK CARRIES THE CONVERSATION
 *   The runtime needs to know which thread a run belongs to, and a title is
 *   not a reliable key (two messages can share one). The id travels in the
 *   task input; the runtime falls back to the title only for tasks that were
 *   not started from a chat.
 */
export async function sendWorkerMessage(
  input: SendWorkerMessageInput,
): Promise<AgentOSResult<SendWorkerMessageResult>> {
  if (!input.workerId) return err("validation", "workerId is required");

  const text = input.message.trim();
  if (!text) return err("validation", "Type a message first");

  let conversation: Conversation | null = null;

  if (input.conversationId) {
    const existing = await getConversation(input.conversationId);
    if (existing.error || !existing.data) {
      return err(
        existing.error?.code ?? "not_found",
        existing.error?.message ?? "That conversation is no longer available",
        existing.error?.detail,
      );
    }
    conversation = existing.data;
  } else {
    const created = await createConversation({
      workerId: input.workerId,
      workspaceId: input.workspaceId ?? null,
      title: conversationTitle(text),
    });
    if (created.error || !created.data) {
      return err(
        created.error?.code ?? "database",
        created.error?.message ?? "Could not open a conversation",
        created.error?.detail,
      );
    }
    conversation = created.data;
  }

  const message = await appendMessage({
    conversationId: conversation.id,
    role: "user",
    content: text,
  });
  if (message.error || !message.data) {
    return err(
      message.error?.code ?? "database",
      message.error?.message ?? "Your message could not be added to the conversation",
      message.error?.detail,
    );
  }

  const task = await createTask({
    title: conversationTitle(text),
    description: text,
    assigned_worker_id: input.workerId,
    workspace_id: input.workspaceId ?? null,
    trigger: "manual",
    input: { prompt: text, conversation_id: conversation.id },
  });
  if (task.error || !task.data) {
    return err(
      task.error?.code ?? "unknown",
      `Your message is in the thread, but the worker could not be queued: ${
        task.error?.message ?? "unknown error"
      }`,
      task.error?.detail,
    );
  }

  return ok({ conversation, message: message.data, task: task.data });
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Is this a row-level-security refusal?
 *
 * Postgres answers a policy violation with SQLSTATE 42501. The message is
 * checked as well, because a PostgREST error may only carry the text.
 */
function isRowSecurityError(error: unknown): boolean {
  const code = readErrorCode(error);
  if (code === "42501") return true;
  const message = readErrorMessage(error).toLowerCase();
  return message.includes("row-level security") || message.includes("row level security");
}

/**
 * Was this write refused rather than broken?
 *
 * A refusal has two shapes: Postgres raises "new row violates row-level
 * security policy" (42501), and PostgREST reports a statement that matched no
 * row. Both mean the same thing to the caller — the message was not written
 * — and both have to be reported as a refusal rather than as a database
 * failure, because a refusal is the caller's to fix.
 */
function isRefusedWrite(error: unknown): boolean {
  if (isRowSecurityError(error)) return true;
  const message = readErrorMessage(error).toLowerCase();
  return message.includes("no rows") || message.includes("not accepted");
}

// deno-lint-ignore no-explicit-any
function readErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function readErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.length > 0 ? message : "Unknown error";
}
